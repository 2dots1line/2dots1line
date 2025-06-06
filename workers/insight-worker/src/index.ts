/**
 * Insight Worker for 2dots1line V4
 * Processes the insight generation queue
 */

import { Worker, Job } from 'bullmq';
import { InsightJob } from '@2dots1line/shared-types';
import { InsightEngine } from '@2dots1line/cognitive-hub';

// Worker configuration
const QUEUE_NAME = 'insight';
const CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Create worker
const worker: Worker<InsightJob, { status: string }, string> = new Worker(QUEUE_NAME, async (job: Job<InsightJob>) => {
  console.log(`Processing insight job ${job.id}`, job.data);
  
  // This is a placeholder for actual implementation
  // Will use the insight engine to generate insights
  return { status: 'processed' };
}, { connection: CONNECTION });

// Event handlers
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

// For graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});

console.log(`Insight worker started, connected to ${QUEUE_NAME} queue`);

export default worker; 