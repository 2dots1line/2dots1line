/**
 * Conversation Timeout Worker Entry Point
 * V9.7 - Main entry point for the conversation timeout worker with dependency injection
 */

import { DatabaseService, ConversationRepository } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

import { ConversationTimeoutWorker } from './ConversationTimeoutWorker';

async function main() {
  console.log('🚀 Starting Conversation Timeout Worker...');

  try {
    // CRITICAL: Load environment variables first using EnvironmentLoader
    console.log('[ConversationTimeoutWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[ConversationTimeoutWorker] Environment variables loaded successfully');

    // Initialize dependencies with EnvironmentLoader
    const redisUrl = environmentLoader.get('REDIS_URL') || 'redis://localhost:6379';
    console.log(`🔗 Redis URL: ${redisUrl}`);
    
    const redis = new Redis(redisUrl);
    const subscriberRedis = new Redis(redisUrl);
    
    // Debug Redis connection
    console.log(`📡 Redis connection status: ${redis.status}`);
    console.log(`📡 Subscriber Redis connection status: ${subscriberRedis.status}`);
    
    const databaseService = DatabaseService.getInstance();
    const conversationRepo = new ConversationRepository(databaseService);
    
    const ingestionQueue = new Queue('ingestion-queue', {
      connection: {
        host: environmentLoader.get('REDIS_HOST') || 'localhost',
        port: parseInt(environmentLoader.get('REDIS_PORT') || '6379'),
        password: environmentLoader.get('REDIS_PASSWORD'),
      },
    });

    console.log(`[ConversationTimeoutWorker] Ingestion queue configured with Redis: ${environmentLoader.get('REDIS_HOST') || 'localhost'}:${environmentLoader.get('REDIS_PORT') || '6379'}`);

    // Create worker instance with injected dependencies
    const worker = new ConversationTimeoutWorker(
      {
        redis,
        subscriberRedis,
        conversationRepo,
        ingestionQueue
      },
      {
        timeoutDurationMinutes: parseInt(environmentLoader.get('CONVERSATION_TIMEOUT_MINUTES') || '5'),
        checkIntervalSeconds: parseInt(environmentLoader.get('TIMEOUT_CHECK_INTERVAL_SECONDS') || '30'),
        enableIngestionQueue: environmentLoader.get('ENABLE_INGESTION_QUEUE') !== 'false'
      }
    );

    console.log('[ConversationTimeoutWorker] Worker configured and starting...');

    // Start the worker
    await worker.start();

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

    console.log('✅ Conversation Timeout Worker started successfully');

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
