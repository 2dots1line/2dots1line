import { ConfigService } from '@2dots1line/config-service';
import { DatabaseService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';

import { HolisticAnalysisTool } from '@2dots1line/tools';
import { Worker, Queue } from 'bullmq';

import { IngestionAnalyst, IngestionJobData } from './IngestionAnalyst';

async function main() {
  console.log('[IngestionWorker] Starting ingestion worker...');

  try {
    // CRITICAL: Load environment variables first using EnvironmentLoader
    console.log('[IngestionWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[IngestionWorker] Environment variables loaded successfully');

    // 1. Initialize all dependencies
    const configService = new ConfigService();
    await configService.initialize();
    console.log('[IngestionWorker] ConfigService initialized');

    const dbService = DatabaseService.getInstance();
    console.log('[IngestionWorker] DatabaseService initialized');



    // 2. Directly instantiate the HolisticAnalysisTool (avoiding circular dependency)
    const holisticAnalysisTool = new HolisticAnalysisTool(configService);
    console.log('[IngestionWorker] HolisticAnalysisTool instantiated');

    // 3. Initialize BullMQ queues with EnvironmentLoader
    const redisConnection = {
      host: environmentLoader.get('REDIS_HOST') || 'localhost',
      port: parseInt(environmentLoader.get('REDIS_PORT') || '6379'),
      password: environmentLoader.get('REDIS_PASSWORD'),
    };

    console.log(`[IngestionWorker] Redis connection configured: ${redisConnection.host}:${redisConnection.port}`);

    const embeddingQueue = new Queue('embedding-queue', { connection: redisConnection });
    const cardQueue = new Queue('card-queue', { connection: redisConnection });
    const graphQueue = new Queue('graph-queue', { connection: redisConnection });

    console.log('[IngestionWorker] BullMQ queues initialized');

    // 4. Instantiate the IngestionAnalyst with its dependencies
    const analyst = new IngestionAnalyst(
      holisticAnalysisTool,
      dbService,
      embeddingQueue,
      cardQueue,
      graphQueue
    );

    console.log('[IngestionWorker] IngestionAnalyst instantiated');

    // 5. Create and start the BullMQ worker
    const worker = new Worker<IngestionJobData>(
      'ingestion-queue',
      async (job) => {
        console.log(`[IngestionWorker] Processing job ${job.id}: ${job.data.conversationId}`);
        await analyst.processConversation(job);
        console.log(`[IngestionWorker] Completed job ${job.id}`);
      },
      {
        connection: redisConnection,
        concurrency: 2, // Process up to 2 jobs concurrently
        // Note: BullMQ v4+ handles retries differently - retry logic is configured at the queue level
        // or through job options when adding jobs to the queue
      }
    );

    // Handle worker events
    worker.on('completed', (job) => {
      console.log(`[IngestionWorker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[IngestionWorker] Job ${job?.id} failed:`, err);
      if (job) {
        console.error(`[IngestionWorker] Job data:`, job.data);
        console.error(`[IngestionWorker] Attempt ${job.attemptsMade} of ${job.opts.attempts || 'unknown'}`);
      }
    });

    worker.on('error', (err) => {
      console.error('[IngestionWorker] Worker error:', err);
    });

    console.log('[IngestionWorker] Worker is running and listening for jobs on ingestion-queue');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('[IngestionWorker] Received SIGINT, shutting down gracefully...');
      await worker.close();
      await embeddingQueue.close();
      await cardQueue.close();
      await graphQueue.close();
      console.log('[IngestionWorker] Shutdown complete');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('[IngestionWorker] Received SIGTERM, shutting down gracefully...');
      await worker.close();
      await embeddingQueue.close();
      await cardQueue.close();
      await graphQueue.close();
      console.log('[IngestionWorker] Shutdown complete');
      process.exit(0);
    });

  } catch (error) {
    console.error('[IngestionWorker] Failed to start:', error);
    process.exit(1);
  }
}

// Start the worker
main().catch((error) => {
  console.error('[IngestionWorker] Unhandled error:', error);
  process.exit(1);
});
