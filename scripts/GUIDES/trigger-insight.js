#!/usr/bin/env node
/**
 * Insight Worker Job Trigger Script
 * 
 * This script manually triggers insight worker jobs for testing and development.
 * It creates a BullMQ job in the 'insight' queue with the specified user ID.
 * 
 * Usage:
 *   node scripts/GUIDES/trigger-insight.js [userId]
 * 
 * Examples:
 *   node scripts/GUIDES/trigger-insight.js                    # Uses default user
 *   node scripts/GUIDES/trigger-insight.js dev-user-123       # Uses specified user
 *   node scripts/GUIDES/trigger-insight.js --help             # Shows help
 * 
 * @author 2D1L Development Team
 * @version 1.0.0
 */

const { Queue } = require('bullmq');

// Configuration
const DEFAULT_USER_ID = 'dev-user-123';
const QUEUE_NAME = 'insight';
const REDIS_CONFIG = {
  host: 'localhost',
  port: 6379
};

// Help text
const HELP_TEXT = `
Insight Worker Job Trigger Script

Usage:
  node scripts/GUIDES/trigger-insight.js [userId]

Arguments:
  userId    User ID for the insight job (default: ${DEFAULT_USER_ID})

Examples:
  node scripts/GUIDES/trigger-insight.js
  node scripts/GUIDES/trigger-insight.js dev-user-123
  node scripts/GUIDES/trigger-insight.js --help

Description:
  This script creates a new insight worker job in the Redis queue.
  The job will be processed by the insight-worker service to generate
  strategic analysis and insights for the specified user.

  Expected output on success:
  ✅ Insight job added successfully!
  Job ID: [number]
  Job data: { userId: '[userId]' }
  Queue length: 0

  Queue length 0 indicates the job was immediately picked up by the worker.
`;

/**
 * Main function to trigger insight worker job
 */
async function triggerInsightJob(userId = DEFAULT_USER_ID) {
  let queue = null;
  
  try {
    console.log(`🚀 Triggering insight worker job for user: ${userId}`);
    console.log(`📡 Connecting to Redis at ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}...`);
    
    // Create connection to Redis
    queue = new Queue(QUEUE_NAME, { connection: REDIS_CONFIG });
    
    // Wait a moment for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`✅ Connected to Redis successfully`);
    
    // Add a job to the insight queue
    const job = await queue.add('user-cycle', {
      userId: userId,
      source: 'manual-trigger',
      timestamp: new Date().toISOString()
    }, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
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
    
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Monitor worker logs: pm2 logs insight-worker --lines 20`);
    console.log(`   2. Check queue status: redis-cli -h localhost -p 6379 LLEN bull:insight`);
    console.log(`   3. Verify LLM interactions in database`);
    
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
  
  // Get user ID from first argument
  const userId = args[0] || DEFAULT_USER_ID;
  
  // Validate user ID format
  if (typeof userId !== 'string' || userId.trim() === '') {
    console.error(`❌ Error: Invalid user ID: "${userId}"`);
    console.error(`💡 Use --help for usage information`);
    process.exit(1);
  }
  
  return userId.trim();
}

/**
 * Main execution
 */
async function main() {
  try {
    const userId = parseArguments();
    await triggerInsightJob(userId);
    console.log(`\n🎉 Insight job trigger completed successfully!`);
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

module.exports = { triggerInsightJob };
