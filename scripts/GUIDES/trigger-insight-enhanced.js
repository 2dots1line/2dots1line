#!/usr/bin/env node
/**
 * Enhanced Insight Worker Job Trigger Script
 * 
 * This script manually triggers insight worker jobs with enhanced monitoring,
 * status checking, and comprehensive error handling.
 * 
 * Compatible with V11.0 Field Naming Standardization Migration Plan:
 * - Uses standardized field names (entity_id, title, content, created_at, etc.)
 * - Compatible with updated database schema
 * - Works with new repository interfaces
 * 
 * Usage:
 *   node scripts/GUIDES/trigger-insight-enhanced.js [userId] [options]
 * 
 * Examples:
 *   node scripts/GUIDES/trigger-insight-enhanced.js                    # Uses default user
 *   node scripts/GUIDES/trigger-insight-enhanced.js dev-user-123       # Uses specified user
 *   node scripts/GUIDES/trigger-insight-enhanced.js --monitor          # Monitor job processing
 *   node scripts/GUIDES/trigger-insight-enhanced.js --status           # Check worker status
 *   node scripts/GUIDES/trigger-insight-enhanced.js --help             # Shows help
 * 
 * @author 2D1L Development Team
 * @version 2.1.0 - V11.0 Schema Compatible
 */

const { Queue } = require('bullmq');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const DEFAULT_USER_ID = 'dev-user-123';
const QUEUE_NAME = 'insight';
const REDIS_CONFIG = {
  host: 'localhost',
  port: 6379
};

// Help text
const HELP_TEXT = `
Enhanced Insight Worker Job Trigger Script

Usage:
  node scripts/GUIDES/trigger-insight-enhanced.js [userId] [options]

Arguments:
  userId    User ID for the insight job (default: ${DEFAULT_USER_ID})

Options:
  --monitor, -m    Monitor job processing in real-time
  --status, -s     Check worker and queue status
  --verbose, -v    Enable verbose logging
  --help, -h       Show this help message

Examples:
  node scripts/GUIDES/trigger-insight-enhanced.js
  node scripts/GUIDES/trigger-insight-enhanced.js dev-user-123
  node scripts/GUIDES/trigger-insight-enhanced.js --monitor
  node scripts/GUIDES/trigger-insight-enhanced.js --status
  node scripts/GUIDES/trigger-insight-enhanced.js dev-user-123 --monitor --verbose

Description:
  This enhanced script creates a new insight worker job in the Redis queue
  with additional monitoring and status checking capabilities.

  Features:
  - Job creation with retry logic
  - Real-time job monitoring
  - Worker status verification
  - Queue health checking
  - Comprehensive error handling
  - LLM interaction verification

  Expected output on success:
  ✅ Insight job added successfully!
  Job ID: [number]
  Job data: { userId: '[userId]' }
  Queue length: 0
`;

/**
 * Check if PM2 is available and insight worker is running
 */
async function checkWorkerStatus() {
  try {
    console.log(`🔍 Checking insight worker status...`);
    
    // Check if PM2 is available
    const { stdout: pm2Check } = await execAsync('which pm2');
    if (!pm2Check.trim()) {
      throw new Error('PM2 is not installed or not in PATH');
    }
    
    // Check insight worker status
    const { stdout: workerStatus } = await execAsync('pm2 jlist | jq -r \'.[] | select(.name=="insight-worker") | .pm2_env.status\'');
    const status = workerStatus.trim();
    
    if (!status) {
      throw new Error('Insight worker not found in PM2 processes');
    }
    
    console.log(`✅ Insight worker status: ${status}`);
    return status === 'online';
    
  } catch (error) {
    console.error(`❌ Worker status check failed:`, error.message);
    return false;
  }
}

/**
 * Check Redis queue status
 */
async function checkQueueStatus() {
  try {
    console.log(`🔍 Checking Redis queue status...`);
    
    const { stdout: queueLength } = await execAsync(`redis-cli -h ${REDIS_CONFIG.host} -p ${REDIS_CONFIG.port} LLEN bull:${QUEUE_NAME}`);
    const { stdout: waitingLength } = await execAsync(`redis-cli -h ${REDIS_CONFIG.host} -p ${REDIS_CONFIG.port} LLEN bull:${QUEUE_NAME}:wait`);
    const { stdout: activeLength } = await execAsync(`redis-cli -h ${REDIS_CONFIG.host} -p ${REDIS_CONFIG.port} LLEN bull:${QUEUE_NAME}:active`);
    const { stdout: completedLength } = await execAsync(`redis-cli -h ${REDIS_CONFIG.host} -p ${REDIS_CONFIG.port} LLEN bull:${QUEUE_NAME}:completed`);
    const { stdout: failedLength } = await execAsync(`redis-cli -h ${REDIS_CONFIG.host} -p ${REDIS_CONFIG.port} LLEN bull:${QUEUE_NAME}:failed`);
    
    console.log(`📊 Queue Status:`);
    console.log(`   Main queue: ${queueLength.trim()}`);
    console.log(`   Waiting: ${waitingLength.trim()}`);
    console.log(`   Active: ${activeLength.trim()}`);
    console.log(`   Completed: ${completedLength.trim()}`);
    console.log(`   Failed: ${failedLength.trim()}`);
    
    return {
      main: parseInt(queueLength.trim()),
      waiting: parseInt(waitingLength.trim()),
      active: parseInt(activeLength.trim()),
      completed: parseInt(completedLength.trim()),
      failed: parseInt(failedLength.trim())
    };
    
  } catch (error) {
    console.error(`❌ Queue status check failed:`, error.message);
    return null;
  }
}

/**
 * Monitor job processing in real-time
 */
async function monitorJobProcessing(jobId, verbose = false) {
  console.log(`\n📺 Monitoring job ${jobId} processing...`);
  console.log(`Press Ctrl+C to stop monitoring\n`);
  
  let lastStatus = null;
  let checkCount = 0;
  
  const monitorInterval = setInterval(async () => {
    try {
      checkCount++;
      
      // Check job status
      const { stdout: jobStatus } = await execAsync(`redis-cli -h ${REDIS_CONFIG.host} -p ${REDIS_CONFIG.port} HGET bull:${QUEUE_NAME}:${jobId} state`);
      const status = jobStatus.trim();
      
      if (status !== lastStatus) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] Job ${jobId} status: ${status}`);
        lastStatus = status;
        
        if (status === 'completed') {
          console.log(`✅ Job ${jobId} completed successfully!`);
          clearInterval(monitorInterval);
          return;
        } else if (status === 'failed') {
          console.log(`❌ Job ${jobId} failed!`);
          clearInterval(monitorInterval);
          return;
        }
      }
      
      // Check worker logs if verbose
      if (verbose && checkCount % 5 === 0) {
        try {
          const { stdout: recentLogs } = await execAsync('pm2 logs insight-worker --lines 3 --nostream');
          const lines = recentLogs.trim().split('\n').filter(line => line.includes('InsightWorker') || line.includes('InsightEngine'));
          if (lines.length > 0) {
            console.log(`📝 Recent worker logs:`);
            lines.forEach(line => console.log(`   ${line}`));
          }
        } catch (logError) {
          // Ignore log errors
        }
      }
      
      // Stop monitoring after 5 minutes
      if (checkCount > 300) {
        console.log(`⏰ Monitoring timeout reached. Job may still be processing.`);
        clearInterval(monitorInterval);
      }
      
    } catch (error) {
      console.error(`❌ Monitoring error:`, error.message);
      clearInterval(monitorInterval);
    }
  }, 2000); // Check every 2 seconds
}

/**
 * Verify LLM interactions were logged
 */
async function verifyLLMInteractions(userId, jobId) {
  try {
    console.log(`\n🔍 Verifying LLM interactions...`);
    
    // Wait a moment for database writes
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { stdout: interactionCount } = await execAsync(
      `docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT COUNT(*) FROM llm_interactions WHERE worker_type = 'insight-worker' AND worker_job_id = '${jobId}';" -t`
    );
    
    const count = parseInt(interactionCount.trim());
    
    if (count > 0) {
      console.log(`✅ Found ${count} LLM interactions for job ${jobId}`);
      
      // Show recent interactions
      const { stdout: recentInteractions } = await execAsync(
        `docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT interaction_id, LEFT(full_prompt, 50) as prompt_preview, created_at FROM llm_interactions WHERE worker_type = 'insight-worker' AND worker_job_id = '${jobId}' ORDER BY created_at DESC LIMIT 3;" -t`
      );
      
      console.log(`📝 Recent interactions:`);
      console.log(recentInteractions.trim());
      
    } else {
      console.log(`⚠️  No LLM interactions found for job ${jobId}`);
      console.log(`💡 This might indicate the job is still processing or encountered an issue`);
    }
    
  } catch (error) {
    console.error(`❌ LLM verification failed:`, error.message);
  }
}

/**
 * Main function to trigger insight worker job
 */
async function triggerInsightJob(userId = DEFAULT_USER_ID, options = {}) {
  let queue = null;
  
  try {
    console.log(`🚀 Enhanced Insight Worker Job Trigger`);
    console.log(`=====================================`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`📡 Connecting to Redis at ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}...`);
    
    // Pre-flight checks
    if (options.status) {
      await checkWorkerStatus();
      await checkQueueStatus();
      return;
    }
    
    // Check worker status before proceeding
    const workerOnline = await checkWorkerStatus();
    if (!workerOnline) {
      console.error(`❌ Insight worker is not running. Please start it first:`);
      console.error(`   pm2 start ecosystem.config.js`);
      process.exit(1);
    }
    
    // Create connection to Redis
    queue = new Queue(QUEUE_NAME, { connection: REDIS_CONFIG });
    
    // Wait a moment for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`✅ Connected to Redis successfully`);
    
    // Add a job to the insight queue
    const job = await queue.add('user-cycle', {
      userId: userId,
      source: 'manual-trigger-enhanced',
      timestamp: new Date().toISOString()
    }, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 1,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    console.log(`\n🎯 Insight job added successfully!`);
    console.log(`📋 Job ID: ${job.id}`);
    console.log(`👤 Job data:`, job.data);
    console.log(`📊 Queue length: ${await queue.count()}`);
    
    // Check job status
    const jobStatus = await job.getState();
    console.log(`🔄 Job status: ${jobStatus}`);
    
    if (jobStatus === 'waiting') {
      console.log(`⏳ Job is waiting to be processed by insight worker`);
    } else if (jobStatus === 'active') {
      console.log(`⚡ Job is currently being processed`);
    } else if (jobStatus === 'completed') {
      console.log(`✅ Job completed successfully`);
    }
    
    // Monitor job if requested
    if (options.monitor) {
      await monitorJobProcessing(job.id, options.verbose);
    }
    
    // Verify LLM interactions
    if (!options.monitor) {
      await verifyLLMInteractions(userId, job.id);
    }
    
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Monitor worker logs: pm2 logs insight-worker --lines 20`);
    console.log(`   2. Check queue status: redis-cli -h localhost -p 6379 LLEN bull:insight`);
    console.log(`   3. Verify LLM interactions in database`);
    console.log(`   4. Use --monitor flag for real-time job tracking`);
    
  } catch (error) {
    console.error(`\n❌ Error adding insight job:`, error.message);
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      console.error(`💡 Solution: Make sure Redis is running:`);
      console.error(`   docker-compose -f docker-compose.dev.yml up -d redis`);
    } else if (error.message.includes('BullMQ')) {
      console.error(`💡 Solution: Check if insight worker is running:`);
      console.error(`   pm2 status | grep insight-worker`);
    } else if (error.message.includes('Queue')) {
      console.error(`💡 Solution: Verify queue configuration and Redis connection`);
    }
    
    process.exit(1);
  } finally {
    // Close the queue connection
    if (queue) {
      try {
        await queue.close();
        console.log(`🔌 Queue connection closed`);
      } catch (closeError) {
        console.warn(`⚠️  Warning: Could not close queue connection:`, closeError.message);
      }
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    process.exit(0);
  }
  
  // Parse options
  const options = {
    monitor: args.includes('--monitor') || args.includes('-m'),
    status: args.includes('--status') || args.includes('-s'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
  
  // Get user ID from first non-option argument
  const userId = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-')) || DEFAULT_USER_ID;
  
  // Validate user ID format
  if (typeof userId !== 'string' || userId.trim() === '') {
    console.error(`❌ Error: Invalid user ID: "${userId}"`);
    console.error(`💡 Use --help for usage information`);
    process.exit(1);
  }
  
  return { userId: userId.trim(), options };
}

/**
 * Main execution
 */
async function main() {
  try {
    const { userId, options } = parseArguments();
    await triggerInsightJob(userId, options);
    console.log(`\n🎉 Enhanced insight job trigger completed successfully!`);
  } catch (error) {
    console.error(`\n💥 Unexpected error:`, error.message);
    console.error(`💡 Check the troubleshooting section in the guide for help`);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { triggerInsightJob, checkWorkerStatus, checkQueueStatus };
