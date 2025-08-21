const { Queue } = require('bullmq');

async function testIngestionWorker() {
  console.log('🧪 Testing Ingestion Worker with updated logging...');
  
  try {
    // Create a test job for the ingestion queue
    const ingestionQueue = new Queue('ingestion-queue', {
      connection: {
        host: 'localhost',
        port: 6379
      }
    });

    // Create a test conversation job
    const testJob = {
      conversationId: 'test-conversation-' + Date.now(),
      userId: 'dev-user-123',
      timestamp: new Date().toISOString()
    };

    console.log('📤 Adding test job to ingestion queue...');
    console.log('Job data:', testJob);

    const job = await ingestionQueue.add('process-conversation', testJob, {
      removeOnComplete: 10,
      removeOnFail: 5
    });

    console.log('✅ Test job added successfully!');
    console.log('Job ID:', job.id);
    console.log('');
    console.log('🔍 Now check the ingestion-worker logs to see if the updated code is loaded:');
    console.log('pm2 logs ingestion-worker --lines 50');
    console.log('');
    console.log('Look for these debug messages:');
    console.log('- 🔍 [IngestionAnalyst] DEBUG: Starting persistence for conversation');
    console.log('- 🔍 [IngestionAnalyst] DEBUG: Importance score:');
    console.log('- 🔍 [IngestionAnalyst] DEBUG: Memory units to create:');
    console.log('- 🔍 [IngestionAnalyst] DEBUG: Concepts to create:');

    // Close the queue connection
    await ingestionQueue.close();
    
  } catch (error) {
    console.error('❌ Error testing ingestion worker:', error);
  }
}

testIngestionWorker();
