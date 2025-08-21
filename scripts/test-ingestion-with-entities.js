const { Queue } = require('bullmq');

async function testIngestionWithExistingConversation() {
  console.log('🧪 Testing Ingestion Worker with existing conversation that should have entities...');
  
  try {
    // Use an existing conversation that has rich content
    const conversationId = 'debug-neo4j-test'; // This conversation has AI/quantum computing content
    
    const ingestionQueue = new Queue('ingestion-queue', {
      connection: {
        host: 'localhost',
        port: 6379
      }
    });

    const testJob = {
      conversationId: conversationId,
      userId: 'dev-user-123',
      timestamp: new Date().toISOString()
    };

    console.log('📤 Adding ingestion job for existing conversation with entities...');
    console.log('Conversation ID:', conversationId);
    console.log('Job data:', testJob);

    const job = await ingestionQueue.add('process-conversation', testJob, {
      removeOnComplete: 10,
      removeOnFail: 5
    });

    console.log('✅ Ingestion job added successfully!');
    console.log('Job ID:', job.id);
    console.log('');
    console.log('🔍 Now check the ingestion-worker logs for Neo4j creation:');
    console.log('pm2 logs ingestion-worker --lines 100');
    console.log('');
    console.log('Look for these Neo4j-related messages:');
    console.log('- 🔍 [IngestionAnalyst] DEBUG: Creating memory unit in Neo4j');
    console.log('- 🔍 [IngestionAnalyst] DEBUG: Creating concept in Neo4j');
    console.log('- 🔍 [IngestionAnalyst] DEBUG: Creating relationship in Neo4j');
    console.log('- 🔍 [IngestionAnalyst] DEBUG: Neo4j creation completed');

    await ingestionQueue.close();
    
  } catch (error) {
    console.error('❌ Error testing ingestion worker:', error);
  }
}

testIngestionWithExistingConversation();
