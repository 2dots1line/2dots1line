/**
 * Script to add a job to the BullMQ queue for GraphProjectionWorker
 */

import { Queue } from 'bullmq';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addJob() {
  console.log('[AddJob] Adding job to BullMQ queue...');
  
  try {
    // Initialize BullMQ queue
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    };

    const queue = new Queue('graph-queue', { connection: redisConnection });
    
    // Accept job data from command line
    const jobDataArg = process.argv[2];
    if (!jobDataArg) {
      throw new Error('No job data provided. Usage: node add-bullmq-job.js <jobDataJSON>');
    }
    let jobData;
    try {
      jobData = JSON.parse(jobDataArg);
    } catch (e) {
      throw new Error('Invalid JSON for job data: ' + e.message);
    }
    
    // Add a job to trigger projection generation
    const job = await queue.add(jobData.type || 'new_entities_created', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    
    console.log(`[AddJob] ✅ Job added successfully with ID: ${job.id}`);
    
    // Close the queue
    await queue.close();
    
  } catch (error) {
    console.error('[AddJob] ❌ Error adding job:', error);
    throw error;
  }
}

// Run the script
addJob().catch(console.error); 