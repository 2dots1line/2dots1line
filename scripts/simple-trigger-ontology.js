#!/usr/bin/env node

const { Queue } = require('bullmq');
const Redis = require('ioredis');

async function main() {
  const userId = process.argv[2] || 'dev-user-123';
  
  console.log(`🚀 Triggering ontology optimization for user: ${userId}`);
  
  // Create Redis connection
  const redisConnection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true
  });
  
  // Create queue
  const ontologyQueue = new Queue('ontology-optimization-queue', { 
    connection: redisConnection 
  });
  
  // Add job
  const job = await ontologyQueue.add('ontology-optimization', {
    userId: userId,
    optimizationType: 'full',
    triggeredBy: 'manual-script',
    timestamp: new Date().toISOString()
  });
  
  console.log(`✅ Job added with ID: ${job.id}`);
  console.log(`📊 Job data:`, JSON.stringify(job.data, null, 2));
  
  // Close connections
  await ontologyQueue.close();
  await redisConnection.quit();
  
  console.log(`🎯 Check PM2 logs: pm2 logs ontology-optimization-worker`);
}

main().catch(console.error);
