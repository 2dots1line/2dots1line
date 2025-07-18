const { Queue } = require('bullmq');

async function triggerProjection() {
  const queue = new Queue('card-and-graph-queue', {
    connection: {
      host: 'localhost',
      port: 6379
    }
  });

  // Create a new entities event to trigger projection
  const job = await queue.add('new_entities_created', {
    type: 'new_entities_created',
    userId: 'dev-user-123',
    source: 'IngestionAnalyst',
    timestamp: new Date().toISOString(),
    entities: [
      {
        id: 'trigger-entity',
        type: 'MemoryUnit'
      }
    ]
  });

  console.log(`✅ Added projection job ${job.id} to queue`);
  
  await queue.close();
}

triggerProjection().catch(console.error); 