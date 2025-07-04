/**
 * Conversation Timeout Worker Entry Point
 * V9.7 - Main entry point for the conversation timeout worker with dependency injection
 */

import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { DatabaseService, ConversationRepository } from '@2dots1line/database';
import { ConversationTimeoutWorker } from './ConversationTimeoutWorker';

async function main() {
  console.log('🚀 Starting Conversation Timeout Worker...');

  // Initialize dependencies
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl);
  const subscriberRedis = new Redis(redisUrl);
  
  const databaseService = DatabaseService.getInstance();
  const conversationRepo = new ConversationRepository(databaseService);
  
  const ingestionQueue = new Queue('ingestion-queue', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  });

  // Create worker instance with injected dependencies
  const worker = new ConversationTimeoutWorker(
    {
      redis,
      subscriberRedis,
      conversationRepo,
      ingestionQueue
    },
    {
      timeoutDurationMinutes: parseInt(process.env.CONVERSATION_TIMEOUT_MINUTES || '5'),
      checkIntervalSeconds: parseInt(process.env.TIMEOUT_CHECK_INTERVAL_SECONDS || '30'),
      enableIngestionQueue: process.env.ENABLE_INGESTION_QUEUE !== 'false'
    }
  );

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n📛 Received ${signal}, shutting down gracefully...`);
    await worker.stop();
    await redis.quit();
    await subscriberRedis.quit();
    await ingestionQueue.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    // Start the worker
    await worker.start();
    console.log('✅ Conversation Timeout Worker is running');
    console.log('Press Ctrl+C to stop');

    // Keep the process alive
    process.stdin.resume();

  } catch (error) {
    console.error('❌ Failed to start Conversation Timeout Worker:', error);
    process.exit(1);
  }
}

// Start the worker
main().catch((error) => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});

export { ConversationTimeoutWorker };
