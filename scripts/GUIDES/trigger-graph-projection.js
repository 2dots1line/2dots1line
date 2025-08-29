#!/usr/bin/env node

/**
 * GraphProjectionWorker Trigger Script
 * Manually triggers graph projection regeneration by adding a cycle_artifacts_created job
 * 
 * This script simulates the InsightEngine completing its job and publishing
 * a cycle_artifacts_created event to the graph queue.
 */

const { Queue } = require('bullmq');

// Configuration
const DEFAULT_USER_ID = 'dev-user-123';
const DEFAULT_QUEUE_NAME = 'graph-queue';
const REDIS_CONFIG = {
  host: 'localhost',
  port: 6379
};

/**
 * Trigger graph projection regeneration
 */
async function triggerGraphProjection(userId = DEFAULT_USER_ID, entities = []) {
  console.log(`🚀 Manual GraphProjectionWorker Trigger`);
  console.log(`=====================================`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`📊 Entities: ${entities.length}`);
  console.log(`🔗 Redis: ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}`);

  const queue = new Queue(DEFAULT_QUEUE_NAME, {
    connection: REDIS_CONFIG
  });

  try {
    // Create cycle_artifacts_created event payload
    const eventPayload = {
      type: 'cycle_artifacts_created',
      userId: userId,
      source: 'InsightEngine',
      timestamp: new Date().toISOString(),
      entities: entities.length > 0 ? entities : [
        {
          id: 'manual-trigger-entity',
          type: 'Concept'
        }
      ]
    };

    console.log(`📤 Adding cycle_artifacts_created job to graph queue...`);
    console.log(`Job data:`, JSON.stringify(eventPayload, null, 2));

    // Add job to queue
    const job = await queue.add('cycle_artifacts_created', eventPayload, {
      removeOnComplete: 10,
      removeOnFail: 1000,
      jobId: `manual-cycle-${userId}-${Date.now()}`
    });

    console.log(`✅ Graph projection job added successfully!`);
    console.log(`🆔 Job ID: ${job.id}`);
    console.log(`📊 Queue: ${DEFAULT_QUEUE_NAME}`);

    // Check queue status
    const waitingCount = await queue.getWaiting();
    const activeCount = await queue.getActive();
    const completedCount = await queue.getCompleted();
    const failedCount = await queue.getFailed();

    console.log(`📈 Queue Status:`);
    console.log(`   Waiting: ${waitingCount.length}`);
    console.log(`   Active: ${activeCount.length}`);
    console.log(`   Completed: ${completedCount.length}`);
    console.log(`   Failed: ${failedCount.length}`);

    if (waitingCount.length === 0 && activeCount.length === 0) {
      console.log(`✅ Job was immediately picked up by worker`);
    } else {
      console.log(`⏳ Job is waiting to be processed`);
    }

    return job;

  } catch (error) {
    console.error(`❌ Failed to add graph projection job:`, error);
    throw error;
  } finally {
    await queue.close();
  }
}

/**
 * Check worker status
 */
async function checkWorkerStatus() {
  console.log(`🔍 Checking GraphProjectionWorker status...`);
  
  try {
    // Check if PM2 is available and worker is running
    const { execSync } = require('child_process');
    const pm2Status = execSync('pm2 jlist', { encoding: 'utf8' });
    const pm2Data = JSON.parse(pm2Status);
    
    const graphWorker = pm2Data.find(process => 
      process.name === 'graph-projection-worker'
    );

    if (graphWorker) {
      console.log(`✅ GraphProjectionWorker is running`);
      console.log(`   Status: ${graphWorker.pm2_env.status}`);
      console.log(`   Uptime: ${Math.floor((Date.now() - graphWorker.pm2_env.pm_uptime) / 1000)}s`);
      console.log(`   Restarts: ${graphWorker.pm2_env.restart_time}`);
    } else {
      console.log(`❌ GraphProjectionWorker is not running`);
      console.log(`💡 Start it with: pm2 start ecosystem.config.js`);
    }

    return graphWorker;

  } catch (error) {
    console.log(`⚠️ Could not check PM2 status: ${error.message}`);
    return null;
  }
}

/**
 * Monitor job processing
 */
async function monitorJobProcessing(jobId, duration = 30000) {
  console.log(`\n📊 Monitoring job processing for ${duration/1000}s...`);
  console.log(`Press Ctrl+C to stop monitoring early\n`);

  const startTime = Date.now();
  const checkInterval = 2000; // Check every 2 seconds

  const checkJob = async () => {
    try {
      const { execSync } = require('child_process');
      
      // Check PM2 logs for the job
      const logs = execSync(`pm2 logs graph-projection-worker --lines 10 --nostream`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const lines = logs.split('\n').filter(line => line.trim());
      const recentLogs = lines.slice(-5);

      console.log(`\n[${new Date().toLocaleTimeString()}] Recent logs:`);
      recentLogs.forEach(log => {
        if (log.includes('cycle_artifacts_created') || 
            log.includes('Regenerating') || 
            log.includes('Successfully') ||
            log.includes('Error') ||
            log.includes('Failed')) {
          console.log(`   ${log}`);
        }
      });

    } catch (error) {
      console.log(`   ⚠️ Could not fetch logs: ${error.message}`);
    }
  };

  // Check immediately
  await checkJob();

  // Set up periodic checking
  const interval = setInterval(async () => {
    await checkJob();
    
    if (Date.now() - startTime > duration) {
      clearInterval(interval);
      console.log(`\n⏰ Monitoring period completed`);
      console.log(`💡 Continue monitoring with: pm2 logs graph-projection-worker --lines 0`);
    }
  }, checkInterval);

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log(`\n🛑 Monitoring stopped by user`);
    process.exit(0);
  });
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    userId: DEFAULT_USER_ID,
    entities: [],
    monitor: false,
    duration: 30000,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--user':
      case '-u':
        options.userId = args[++i] || DEFAULT_USER_ID;
        break;
      case '--monitor':
      case '-m':
        options.monitor = true;
        break;
      case '--duration':
      case '-d':
        options.duration = parseInt(args[++i]) * 1000 || 30000;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--entities':
        // Parse entities as JSON array
        try {
          options.entities = JSON.parse(args[++i] || '[]');
        } catch (e) {
          console.error('❌ Invalid entities JSON format');
          process.exit(1);
        }
        break;
      default:
        if (!options.userId || options.userId === DEFAULT_USER_ID) {
          options.userId = arg;
        }
    }
  }

  return options;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🚀 GraphProjectionWorker Trigger Script

USAGE:
  node scripts/GUIDES/trigger-graph-projection.js [options] [userId]

OPTIONS:
  -u, --user <userId>     User ID (default: dev-user-123)
  -m, --monitor          Monitor job processing after triggering
  -d, --duration <sec>   Monitoring duration in seconds (default: 30)
  --entities <json>      JSON array of entities to include
  -h, --help             Show this help message

EXAMPLES:
  # Basic trigger
  node scripts/GUIDES/trigger-graph-projection.js

  # Trigger for specific user
  node scripts/GUIDES/trigger-graph-projection.js user-456

  # Trigger with monitoring
  node scripts/GUIDES/trigger-graph-projection.js --monitor

  # Trigger with custom entities
  node scripts/GUIDES/trigger-graph-projection.js --entities '[{"id":"concept-123","type":"Concept"}]'

  # Trigger with monitoring for 60 seconds
  node scripts/GUIDES/trigger-graph-projection.js --monitor --duration 60

MONITORING:
  After triggering, you can monitor the worker with:
  pm2 logs graph-projection-worker --lines 0

TROUBLESHOOTING:
  If the worker is not running:
  pm2 start ecosystem.config.js

  If you need to restart the worker:
  pm2 restart graph-projection-worker
`);
}

/**
 * Main function
 */
async function main() {
  const options = parseArguments();

  if (options.help) {
    showHelp();
    return;
  }

  try {
    // Check worker status first
    await checkWorkerStatus();

    // Trigger the job
    const job = await triggerGraphProjection(options.userId, options.entities);

    if (options.monitor) {
      await monitorJobProcessing(job.id, options.duration);
    } else {
      console.log(`\n💡 To monitor job processing, run:`);
      console.log(`   pm2 logs graph-projection-worker --lines 0`);
      console.log(`\n💡 Or use the --monitor flag:`);
      console.log(`   node scripts/GUIDES/trigger-graph-projection.js --monitor`);
    }

  } catch (error) {
    console.error(`\n❌ Script failed:`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  triggerGraphProjection,
  checkWorkerStatus,
  monitorJobProcessing
};
