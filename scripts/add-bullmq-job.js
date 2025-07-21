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

    const queue = new Queue('card-and-graph-queue', { connection: redisConnection });
    
    // Add a job to trigger projection generation
    const job = await queue.add('new_entities_created', {
      type: 'new_entities_created',
      userId: 'dev-user-123',
      source: 'InsightEngine',
      timestamp: new Date().toISOString(),
      entities: [
        { id: 'da-001', type: 'DerivedArtifact' },
        { id: 'com-001', type: 'Community' }
      ]
    }, {
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