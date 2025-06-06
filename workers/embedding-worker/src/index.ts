/**
 * Embedding Worker for 2dots1line V4
 * Processes the embedding generation queue
 */

import { Worker, Job } from 'bullmq';
import { EmbeddingJob } from '@2dots1line/shared-types';
// import { embeddingTools } from '@2dots1line/embedding-tools'; // Commented out

// Worker configuration
const QUEUE_NAME = 'embedding';
const CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Create worker
const worker = new Worker(QUEUE_NAME, async (job: Job<EmbeddingJob>) => {
  console.log(`Processing embedding job ${job.id}`, job.data);
  
  // This is a placeholder for actual implementation
  // Will use the embedding tools to generate and store embeddings // Logic using embeddingTools would be here
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

console.log(`Embedding worker started, connected to ${QUEUE_NAME} queue`);

export default worker; 