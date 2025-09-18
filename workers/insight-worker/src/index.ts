/**
 * Insight Worker for 2dots1line V4
 * Processes the insight generation queue
 */

import { ConfigService } from '@2dots1line/config-service';
import { DatabaseService } from '@2dots1line/database';
import { StrategicSynthesisTool, HybridRetrievalTool } from '@2dots1line/tools';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';

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

    // 2.1. Instantiate the HybridRetrievalTool
    const hybridRetrievalTool = new HybridRetrievalTool(dbService, configService);
    console.log('[InsightWorker] HybridRetrievalTool instantiated');

    // 3. Create dedicated Redis connection for BullMQ to prevent connection pool exhaustion
    const redisUrl = environmentLoader.get('REDIS_URL');
    let redisConnection: Redis;
    
    if (redisUrl) {
      redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: true,
        family: 4,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 10000,
        enableOfflineQueue: true
      });
    } else {
      const redisHost = environmentLoader.get('REDIS_HOST') || environmentLoader.get('REDIS_HOST_DOCKER') || 'localhost';
      const redisPort = parseInt(environmentLoader.get('REDIS_PORT') || environmentLoader.get('REDIS_PORT_DOCKER') || '6379');
      const redisPassword = environmentLoader.get('REDIS_PASSWORD');
      
      redisConnection = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: true,
        family: 4,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 10000,
        enableOfflineQueue: true
      });
    }

    console.log(`[InsightWorker] Using dedicated Redis connection for BullMQ`);

    const cardQueue = new Queue('card-queue', { connection: redisConnection });
    const graphQueue = new Queue('graph-queue', { connection: redisConnection });
    const embeddingQueue = new Queue('embedding-queue', { connection: redisConnection });
    console.log('[InsightWorker] BullMQ queues initialized');

    // 4. Instantiate the InsightEngine with its dependencies
    const insightEngine = new InsightEngine(
      strategicSynthesisTool,
      hybridRetrievalTool,
      configService,
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
        try {
          await insightEngine.processUserCycle(job);
          console.log(`[InsightWorker] Completed job ${job.id}`);
        } catch (error) {
          // Check if this is a non-retryable error
          if (error instanceof Error && error.name === 'NonRetryableError') {
            console.error(`[InsightWorker] Non-retryable error detected for job ${job.id}: ${error.message}`);
            // Mark job as failed without retry
            throw new Error(`NON_RETRYABLE: ${error.message}`);
          }
          // Re-throw other errors for normal retry logic
          throw error;
        }
      },
      {
        connection: redisConnection,
        concurrency: 1, // Process one cycle at a time
      }
    );

    // Configure queue-level retry settings for BullMQ v4+
    // DISABLED: BullMQ retries are disabled - only LLM retries are handled by LLMRetryHandler
    const insightQueue = new Queue('insight', { 
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 1, // NO BULLMQ RETRIES - LLM retries handled by LLMRetryHandler only
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      }
    });

    // Error handler - BullMQ retries are disabled, only LLM retries are handled by LLMRetryHandler
    worker.on('failed', (job, err) => {
      console.error(`[InsightWorker] Job ${job?.id} FAILED - BullMQ retries disabled`);
      console.error(`[InsightWorker] Error type: ${err.name || 'Unknown'}`);
      console.error(`[InsightWorker] Error message: ${err.message}`);
      
      // Log specific error details for debugging
      if (err.message.includes('503') || err.message.includes('server overload')) {
        console.error(`[InsightWorker] LLM service overload detected - this should have been retried by LLMRetryHandler`);
      } else if (err.message.includes('database') || err.message.includes('postgres') || err.message.includes('neo4j')) {
        console.error(`[InsightWorker] Database error detected - this is NOT retryable at BullMQ level`);
      } else if (err.message.includes('validation') || err.message.includes('schema')) {
        console.error(`[InsightWorker] Validation error detected - this is NOT retryable at BullMQ level`);
      } else {
        console.error(`[InsightWorker] Unknown error type - manual investigation required`);
      }
    });

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
    const gracefulShutdown = async (signal: string) => {
      console.log(`[InsightWorker] Received ${signal}, shutting down gracefully...`);
      try {
        await worker.close();
        await cardQueue.close();
        await graphQueue.close();
        await embeddingQueue.close();
        // Close dedicated Redis connection
        await redisConnection.quit();
        console.log('[InsightWorker] Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('[InsightWorker] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('[InsightWorker] Failed to start:', error);
    process.exit(1);
  }
}

main().catch(console.error); 