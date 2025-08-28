/**
 * Insight Worker for 2dots1line V4
 * Processes the insight generation queue
 */

import { ConfigService } from '@2dots1line/config-service';
import { DatabaseService } from '@2dots1line/database';
import { StrategicSynthesisTool } from '@2dots1line/tools';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Worker, Queue } from 'bullmq';

import { InsightEngine, InsightJobData } from './InsightEngine';

async function main() {
  console.log('[InsightWorker] Starting V11.0 insight worker...');

  try {
    // CRITICAL: Load environment variables first using EnvironmentLoader
    console.log('[InsightWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[InsightWorker] Environment variables loaded successfully');

    // 1. Initialize all dependencies
    const configService = new ConfigService();
    await configService.initialize();
    console.log('[InsightWorker] ConfigService initialized');

    const dbService = DatabaseService.getInstance();
    console.log('[InsightWorker] DatabaseService initialized');

    // 2. Directly instantiate the StrategicSynthesisTool
    const strategicSynthesisTool = new StrategicSynthesisTool(configService);
    console.log('[InsightWorker] StrategicSynthesisTool instantiated');

    // 3. Initialize BullMQ queues with EnvironmentLoader
    const redisConnection = {
      host: environmentLoader.get('REDIS_HOST') || 'localhost',
      port: parseInt(environmentLoader.get('REDIS_PORT') || '6379'),
      password: environmentLoader.get('REDIS_PASSWORD'),
    };

    console.log(`[InsightWorker] Redis connection configured: ${redisConnection.host}:${redisConnection.port}`);

    const cardQueue = new Queue('card-queue', { connection: redisConnection });
    const graphQueue = new Queue('graph-queue', { connection: redisConnection });
    const embeddingQueue = new Queue('embedding-queue', { connection: redisConnection });
    console.log('[InsightWorker] BullMQ queues initialized');

    // 4. Instantiate the InsightEngine with its dependencies
    const insightEngine = new InsightEngine(
      strategicSynthesisTool,
      dbService,
      cardQueue,
      graphQueue,
      embeddingQueue
    );

    console.log('[InsightWorker] InsightEngine instantiated');

    // 5. Create and start the BullMQ worker
    const worker = new Worker<InsightJobData>(
      'insight',
      async (job) => {
        console.log(`[InsightWorker] Processing job ${job.id}: ${job.data.userId}`);
        await insightEngine.processUserCycle(job);
        console.log(`[InsightWorker] Completed job ${job.id}`);
      },
      {
        connection: redisConnection,
        concurrency: 1, // Process one cycle at a time
      }
    );

    // DEBUGGING: Verify worker object state
    console.log(`[InsightWorker] DEBUGGING - Worker created with name: ${worker.name}`);
    console.log(`[InsightWorker] DEBUGGING - Worker opts:`, JSON.stringify(worker.opts, null, 2));
    console.log(`[InsightWorker] DEBUGGING - Worker connection config:`, JSON.stringify(redisConnection, null, 2));
    
    // Test worker connection by trying to get Redis info
    try {
      // Access the internal Redis client to test connection
      const redisClient = (worker as any).blockingConnection;
      if (redisClient) {
        const pingResult = await redisClient.ping();
        console.log(`[InsightWorker] DEBUGGING - Worker Redis connection ping: ${pingResult}`);
      } else {
        console.log(`[InsightWorker] DEBUGGING - No Redis client found on worker`);
      }
    } catch (debugError: any) {
      console.log(`[InsightWorker] DEBUGGING - Error testing worker connection:`, debugError.message);
    }

    // Handle worker events
    worker.on('completed', (job) => {
      console.log(`[InsightWorker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[InsightWorker] Job ${job?.id} failed:`, err);
    });

    worker.on('error', (err) => {
      console.error('[InsightWorker] Worker error:', err);
    });

    // Add event listener for job start
    worker.on('active', (job) => {
      console.log(`[InsightWorker] DEBUGGING - Job ${job.id} became active, processing started`);
    });

    console.log('[InsightWorker] Worker is running and listening for jobs on insight queue');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('[InsightWorker] Received SIGINT, shutting down gracefully...');
      await worker.close();
      await cardQueue.close();
      await graphQueue.close();
      await embeddingQueue.close();
      console.log('[InsightWorker] Shutdown complete');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('[InsightWorker] Received SIGTERM, shutting down gracefully...');
      await worker.close();
      await cardQueue.close();
      await graphQueue.close();
      await embeddingQueue.close();
      console.log('[InsightWorker] Shutdown complete');
      process.exit(0);
    });

  } catch (error) {
    console.error('[InsightWorker] Failed to start:', error);
    process.exit(1);
  }
}

main().catch(console.error); 