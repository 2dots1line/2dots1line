import { Worker, Queue } from 'bullmq';
import { IngestionAnalyst, IngestionJobData } from './IngestionAnalyst';
import { ToolRegistry } from '@2dots1line/tool-registry';
import { ConfigService } from '@2dots1line/config-service';
import { DatabaseService } from '@2dots1line/database';
import { HolisticAnalysisTool } from '@2dots1line/tools';

async function main() {
  console.log('[IngestionWorker] Starting ingestion worker...');

  try {
    // 1. Initialize all dependencies
    const configService = new ConfigService();
    await configService.initialize();
    console.log('[IngestionWorker] ConfigService initialized');

    const dbService = DatabaseService.getInstance();
    console.log('[IngestionWorker] DatabaseService initialized');

    const toolRegistry = new ToolRegistry();
    console.log('[IngestionWorker] ToolRegistry initialized');

    // 2. Build the composite tool for the analyst
    const holisticAnalysisTool = toolRegistry.buildCompositeToolForAgent('ingestionAnalyst') as HolisticAnalysisTool;
    console.log('[IngestionWorker] HolisticAnalysisTool built');

    // 3. Initialize BullMQ queues
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    };

    const embeddingQueue = new Queue('embedding-queue', { connection: redisConnection });
    const cardAndGraphQueue = new Queue('card-and-graph-queue', { connection: redisConnection });

    console.log('[IngestionWorker] BullMQ queues initialized');

    // 4. Instantiate the IngestionAnalyst with its dependencies
    const analyst = new IngestionAnalyst(
      holisticAnalysisTool,
      dbService,
      embeddingQueue,
      cardAndGraphQueue
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

    // Handle worker events
    worker.on('completed', (job) => {
      console.log(`[IngestionWorker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[IngestionWorker] Job ${job?.id} failed:`, err);
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
      await cardAndGraphQueue.close();
      console.log('[IngestionWorker] Shutdown complete');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('[IngestionWorker] Received SIGTERM, shutting down gracefully...');
      await worker.close();
      await embeddingQueue.close();
      await cardAndGraphQueue.close();
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
