import { ConfigService } from '@2dots1line/config-service';
import { DatabaseService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Redis } from 'ioredis';

import { HolisticAnalysisTool, SemanticSimilarityTool, TextEmbeddingTool } from '@2dots1line/tools';
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



    // 2. Directly instantiate the tools (avoiding circular dependency)
    const holisticAnalysisTool = new HolisticAnalysisTool(configService);
    console.log('[IngestionWorker] HolisticAnalysisTool instantiated');
    
    // Initialize embedding tool (it's exported as an instance, not a class)
    const embeddingTool = TextEmbeddingTool;
    console.log('[IngestionWorker] TextEmbeddingTool instantiated');
    
    // Initialize Weaviate client for semantic similarity
    const weaviate = require('weaviate-ts-client').default;
    const weaviateClient = weaviate.client({
      scheme: 'http',
      host: environmentLoader.get('WEAVIATE_HOST') || 'localhost:8080',
    });
    
    const semanticSimilarityTool = new SemanticSimilarityTool(weaviateClient, configService, embeddingTool);
    console.log('[IngestionWorker] SemanticSimilarityTool instantiated');

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

    console.log(`[IngestionWorker] Using dedicated Redis connection for BullMQ`);

    const embeddingQueue = new Queue('embedding-queue', { connection: redisConnection });
    const cardQueue = new Queue('card-queue', { connection: redisConnection });
    const graphQueue = new Queue('graph-queue', { connection: redisConnection });

    console.log('[IngestionWorker] BullMQ queues initialized');

    // 4. Instantiate the IngestionAnalyst with its dependencies
    const analyst = new IngestionAnalyst(
      holisticAnalysisTool,
      semanticSimilarityTool,
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
      }
    );

    // Configure queue-level retry settings for BullMQ v4+
    const ingestionQueue = new Queue('ingestion-queue', { 
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 1, // No retries - LLM retries are handled by LLMChatTool internally
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      }
    });

    // Handle worker events
    worker.on('completed', (job) => {
      console.log(`[IngestionWorker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      if (err.message && err.message.includes('NON_RETRYABLE')) {
        console.log(`[IngestionWorker] Job ${job?.id} failed with non-retryable error, not retrying`);
        // Don't retry non-retryable errors
        return;
      }
      console.log(`[IngestionWorker] Job ${job?.id} failed with retryable error: ${err.message}`);
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
    const gracefulShutdown = async (signal: string) => {
      console.log(`[IngestionWorker] Received ${signal}, shutting down gracefully...`);
      try {
        await worker.close();
        await embeddingQueue.close();
        await cardQueue.close();
        await graphQueue.close();
        // Close dedicated Redis connection
        await redisConnection.quit();
        console.log('[IngestionWorker] Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('[IngestionWorker] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

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
