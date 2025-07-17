// scripts/trigger-graph-projection.js
const { Queue } = require('bullmq');

const queue = new Queue('card-and-graph-queue', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

async function main() {
  const jobData = {
    type: "graph_ontology_updated",
    userId: "dev-user-123",
    source: "manual",
    timestamp: new Date().toISOString(),
    summary: {
      concepts_merged: 0,
      concepts_archived: 0,
      new_communities: 0,
      strategic_relationships_added: 0
    },
    affectedNodeIds: []
  };

  const job = await queue.add('graph-projection', jobData);
  console.log('Enqueued graph projection job:', job.id);
  await queue.close();
}

main().catch(err => {
  console.error('Error enqueuing job:', err);
  process.exit(1);
});