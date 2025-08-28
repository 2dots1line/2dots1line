const { Queue } = require('bullmq');

/**
 * Manual Ingestion Worker Trigger Script
 * 
 * This script allows you to manually trigger the ingestion worker to reprocess
 * a specific conversation that may have failed previously.
 * 
 * Usage:
 *   node scripts/trigger-ingestion.js <conversationId> [userId]
 * 
 * Examples:
 *   node scripts/trigger-ingestion.js "conversation-123"
 *   node scripts/trigger-ingestion.js "conversation-123" "user-456"
 */

async function triggerIngestion() {
  // Get conversation ID from command line arguments
  const conversationId = process.argv[2];
  const userId = process.argv[3] || 'dev-user-123'; // Default user ID if not provided
  
  if (!conversationId) {
    console.error('❌ Error: Conversation ID is required');
    console.log('');
    console.log('Usage: node scripts/trigger-ingestion.js <conversationId> [userId]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/trigger-ingestion.js "conversation-123"');
    console.log('  node scripts/trigger-ingestion.js "conversation-123" "user-456"');
    console.log('');
    console.log('This will add a job to the ingestion queue to reprocess the specified conversation.');
    process.exit(1);
  }

  console.log('🚀 Manual Ingestion Worker Trigger');
  console.log('==================================');
  console.log(`📝 Conversation ID: ${conversationId}`);
  console.log(`👤 User ID: ${userId}`);
  console.log('');

  try {
    // Create connection to the ingestion queue
    const ingestionQueue = new Queue('ingestion-queue', {
      connection: {
        host: 'localhost',
        port: 6379
      }
    });

    // Create the job data
    const jobData = {
      conversationId: conversationId,
      userId: userId,
      timestamp: new Date().toISOString(),
      manualTrigger: true // Flag to indicate this was manually triggered
    };

    console.log('📤 Adding ingestion job to queue...');
    console.log('Job data:', JSON.stringify(jobData, null, 2));

    // Add the job to the queue
    const job = await ingestionQueue.add('process-conversation', jobData, {
      removeOnComplete: 10,
      removeOnFail: 1000, // Keep failed jobs for longer inspection
      jobId: `manual-${conversationId}-${Date.now()}`, // Unique job ID
      attempts: 3, // Allow up to 3 retry attempts
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    console.log('');
    console.log('✅ Ingestion job added successfully!');
    console.log(`🆔 Job ID: ${job.id}`);
    console.log(`📊 Queue: ingestion-queue`);
    console.log('');

    // Close the queue connection
    await ingestionQueue.close();

    console.log('🔍 Next steps:');
    console.log('1. Check if ingestion worker is running:');
    console.log('   pm2 status | grep ingestion-worker');
    console.log('');
    console.log('2. Monitor the job processing:');
    console.log('   pm2 logs ingestion-worker --lines 50');
    console.log('');
    console.log('3. Look for these success messages:');
    console.log('   - [IngestionWorker] Processing job <job-id>: <conversation-id>');
    console.log('   - [IngestionAnalyst] Successfully processed conversation <conversation-id>');
    console.log('   - [IngestionWorker] Job <job-id> completed successfully');
    console.log('');
    console.log('4. If the job fails, check the logs for error details:');
    console.log('   pm2 logs ingestion-worker --lines 100 | grep -A 10 -B 10 "ERROR"');
    console.log('');
    console.log('5. To check job status in Redis:');
    console.log('   docker exec redis-2d1l redis-cli KEYS "bull:ingestion-queue:*"');
    console.log('');

  } catch (error) {
    console.error('❌ Error triggering ingestion job:', error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure Redis is running: docker ps | grep redis');
    console.log('2. Make sure ingestion worker is running: pm2 status | grep ingestion-worker');
    console.log('3. Check Redis connection: docker exec redis-2d1l redis-cli ping');
    process.exit(1);
  }
}

// Run the script
triggerIngestion();
