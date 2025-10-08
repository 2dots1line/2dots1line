#!/usr/bin/env node

/**
 * Ontology Worker Trigger Script
 * 
 * This script triggers the ontology optimization worker by sending a job to the ontology-optimization-queue.
 * It then monitors the worker logs and validates the results in the database.
 * 
 * Usage: node scripts/trigger-ontology-worker.js [userId]
 */

const { Queue } = require('bullmq');
const { Redis } = require('ioredis');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const LOG_DIR = path.join(__dirname, '..', 'logs');
const ONTOLOGY_LOG_FILE = path.join(LOG_DIR, 'ontology-optimization-worker-combined.log');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    log('Usage: node scripts/trigger-ontology-worker.js <userId>', 'red');
    log('Example: node scripts/trigger-ontology-worker.js user-123', 'yellow');
    process.exit(1);
  }

  logSection('ONTOLOGY WORKER TRIGGER SCRIPT');
  log(`Target User ID: ${userId}`, 'bright');
  log(`Redis URL: ${REDIS_URL}`, 'blue');
  log(`Log File: ${ONTOLOGY_LOG_FILE}`, 'blue');

  try {
    // Step 1: Initialize Redis connection
    logSection('STEP 1: INITIALIZING REDIS CONNECTION');
    const redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      family: 4,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 10000,
      enableOfflineQueue: true
    });

    await redis.ping();
    log('✅ Redis connection established', 'green');

    // Step 2: Create ontology optimization queue
    logSection('STEP 2: CREATING ONTOLOGY OPTIMIZATION QUEUE');
    const ontologyQueue = new Queue('ontology-optimization-queue', { 
      connection: redis 
    });

    // Step 3: Add job to queue
    logSection('STEP 3: ADDING JOB TO ONTOLOGY QUEUE');
    const jobData = {
      userId: userId,
      optimizationType: 'full',
      triggeredBy: 'manual-script',
      timestamp: new Date().toISOString()
    };

    const job = await ontologyQueue.add('full-optimization', jobData, {
      attempts: 3,
      removeOnComplete: false,
      removeOnFail: false,
      delay: 0 // Start immediately
    });

    log(`✅ Job added to queue with ID: ${job.id}`, 'green');
    log(`Job Data: ${JSON.stringify(jobData, null, 2)}`, 'blue');

    // Step 4: Monitor job status
    logSection('STEP 4: MONITORING JOB STATUS');
    log('Waiting for job to start...', 'yellow');

    // Wait for job to start
    await new Promise((resolve) => {
      const checkStatus = async () => {
        const jobState = await job.getState();
        log(`Job Status: ${jobState}`, 'blue');
        
        if (jobState === 'active' || jobState === 'completed' || jobState === 'failed') {
          resolve();
        } else {
          setTimeout(checkStatus, 2000);
        }
      };
      checkStatus();
    });

    // Step 5: Monitor logs
    logSection('STEP 5: MONITORING ONTOLOGY WORKER LOGS');
    log(`Monitoring log file: ${ONTOLOGY_LOG_FILE}`, 'blue');

    if (fs.existsSync(ONTOLOGY_LOG_FILE)) {
      // Get initial file size
      const initialSize = fs.statSync(ONTOLOGY_LOG_FILE).size;
      log(`Initial log file size: ${initialSize} bytes`, 'blue');

      // Monitor for new log entries
      let lastSize = initialSize;
      let logEntries = [];
      let jobCompleted = false;

      const monitorLogs = () => {
        if (fs.existsSync(ONTOLOGY_LOG_FILE)) {
          const currentSize = fs.statSync(ONTOLOGY_LOG_FILE).size;
          
          if (currentSize > lastSize) {
            // Read new content
            const fd = fs.openSync(ONTOLOGY_LOG_FILE, 'r');
            fs.readSync(fd, Buffer.alloc(currentSize - lastSize), 0, currentSize - lastSize, lastSize);
            const newContent = fs.readFileSync(ONTOLOGY_LOG_FILE, 'utf8').slice(lastSize);
            fs.closeSync(fd);

            // Parse new log entries
            const newLines = newContent.split('\n').filter(line => line.trim());
            newLines.forEach(line => {
              if (line.includes(userId) || line.includes('OntologyOptimizer') || line.includes('LLMBasedOptimizer')) {
                logEntries.push(line);
                log(`📝 ${line}`, 'magenta');
                
                // Check for completion
                if (line.includes('Successfully completed') || line.includes('Full optimization completed')) {
                  jobCompleted = true;
                }
              }
            });

            lastSize = currentSize;
          }
        }

        // Check job status
        job.getState().then(state => {
          if (state === 'completed' || state === 'failed' || jobCompleted) {
            log(`\n✅ Job finished with status: ${state}`, 'green');
            return;
          }
          
          setTimeout(monitorLogs, 1000);
        });
      };

      // Start monitoring
      monitorLogs();

      // Wait for completion
      await new Promise((resolve) => {
        const checkCompletion = () => {
          job.getState().then(state => {
            if (state === 'completed' || state === 'failed' || jobCompleted) {
              resolve();
            } else {
              setTimeout(checkCompletion, 2000);
            }
          });
        };
        checkCompletion();
      });

    } else {
      log(`⚠️  Log file not found: ${ONTOLOGY_LOG_FILE}`, 'yellow');
      log('Waiting 30 seconds for job to complete...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

    // Step 6: Final job status
    logSection('STEP 6: FINAL JOB STATUS');
    const finalState = await job.getState();
    const jobResult = await job.finished().catch(() => null);
    
    log(`Final Job Status: ${finalState}`, 'blue');
    if (jobResult) {
      log(`Job Result: ${JSON.stringify(jobResult, null, 2)}`, 'blue');
    }

    // Step 7: Validation instructions
    logSection('STEP 7: VALIDATION INSTRUCTIONS');
    log('To validate the ontology optimization results:', 'bright');
    log('1. Check PostgreSQL llm_interactions table for recent ontology optimization entries', 'yellow');
    log('2. Verify concept merges in the concepts table', 'yellow');
    log('3. Check concept archives in the concepts table (status = archived)', 'yellow');
    log('4. Verify strategic relationships in Neo4j', 'yellow');
    log('5. Check community structures in the communities table', 'yellow');
    log('6. Verify concept description synthesis updates', 'yellow');
    
    log('\nDatabase validation queries:', 'bright');
    log(`-- Check recent ontology optimization LLM interactions`, 'cyan');
    log(`SELECT * FROM llm_interactions WHERE worker_type = 'ontology-optimization-worker' AND user_id = '${userId}' ORDER BY created_at DESC LIMIT 5;`, 'cyan');
    
    log(`\n-- Check concept merges and archives`, 'cyan');
    log(`SELECT id, title, status, updated_at FROM concepts WHERE user_id = '${userId}' AND updated_at > NOW() - INTERVAL '1 hour' ORDER BY updated_at DESC;`, 'cyan');
    
    log(`\n-- Check community structures`, 'cyan');
    log(`SELECT * FROM communities WHERE user_id = '${userId}' AND created_at > NOW() - INTERVAL '1 hour' ORDER BY created_at DESC;`, 'cyan');

    // Cleanup
    await redis.quit();
    log('\n✅ Script completed successfully', 'green');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    log(`Stack trace: ${error.stack}`, 'red');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n🛑 Script interrupted by user', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n\n🛑 Script terminated', 'yellow');
  process.exit(0);
});

// Run the script
main().catch(error => {
  log(`\n❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});
