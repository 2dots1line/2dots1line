/**
 * Script to add a job to the insight queue for InsightEngine testing
 */

import { Queue } from 'bullmq';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addInsightJob() {
  console.log('[AddInsightJob] Adding job to insight queue...');
  
  try {
    // Initialize BullMQ queue for insight
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    };

    const insightQueue = new Queue('insight', { connection: redisConnection });
    
    // Add a job to trigger insight cycle
    const jobData = {
      userId: 'dev-user-123'
    };
    
    const job = await insightQueue.add('user_cycle', jobData, {
      attempts: 1,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    
    console.log(`[AddInsightJob] ✅ Insight job added successfully with ID: ${job.id}`);
    console.log(`[AddInsightJob] Job data:`, JSON.stringify(jobData, null, 2));
    
    // Close the queue
    await insightQueue.close();
    
  } catch (error) {
    console.error('[AddInsightJob] ❌ Error adding insight job:', error);
    throw error;
  }
}

// Run the script
addInsightJob().catch(console.error);

