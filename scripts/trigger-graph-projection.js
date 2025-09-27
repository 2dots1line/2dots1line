// scripts/trigger-graph-projection.js
const { Queue } = require('bullmq');

const queue = new Queue('graph-queue', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

async function main() {
  const jobData = {
    type: "new_entities_created",
    userId: "dev-user-123",
    source: "IngestionAnalyst",
    entities: [
      { id: "ad4565b6-bbfa-460a-b302-23e6d7228281", type: "Concept" }
    ]
  };

  const job = await queue.add('graph-projection', jobData);
  console.log('Enqueued graph projection job:', job.id);
  await queue.close();
}

main().catch(err => {
  console.error('Error enqueuing job:', err);
  process.exit(1);
});