/**
 * Scheduler for 2dots1line V4
 * Handles scheduling and execution of periodic tasks
 */

import * as cron from 'node-cron';
import { Queue } from 'bullmq';

// Queue configuration
const CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Create queues
const insightQueue = new Queue('insight', { connection: CONNECTION });
const embeddingQueue = new Queue('embedding', { connection: CONNECTION });

// Schedule regular insight generation (e.g., daily at 2 AM)
cron.schedule('0 2 * * *', async () => {
  console.log('Scheduling daily insight generation jobs');
  
  // This is a placeholder for actual implementation
  // Will query database for users who need insights and schedule jobs
  
  await insightQueue.add('daily-insights', {
    type: 'daily-insights',
    timestamp: new Date().toISOString()
  });
});

// Schedule embedding model update check (e.g., weekly on Sunday at 3 AM)
cron.schedule('0 3 * * 0', async () => {
  console.log('Checking for embedding model updates');
  
  // This is a placeholder for actual implementation
  // Will check if embedding models need to be updated and schedule re-embedding
  
  await embeddingQueue.add('model-update-check', {
    type: 'model-update-check',
    timestamp: new Date().toISOString()
  });
});

// For graceful shutdown
process.on('SIGTERM', async () => {
  await Promise.all([
    insightQueue.close(),
    embeddingQueue.close()
  ]);
  process.exit(0);
});

console.log('Scheduler started, setting up cron jobs');

export { insightQueue, embeddingQueue }; 