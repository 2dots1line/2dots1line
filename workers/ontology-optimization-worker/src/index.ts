import { ConfigService } from '@2dots1line/config-service';
import { DatabaseService, ConceptRepository } from '@2dots1line/database/dist';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Redis } from 'ioredis';
import { SemanticSimilarityTool } from '@2dots1line/tools/dist';
import { Worker, Queue } from 'bullmq';

import { OntologyOptimizer, OntologyJobData } from './OntologyOptimizer';
import { LLMBasedOptimizer } from './strategies/LLMBasedOptimizer';

async function main() {
  console.log('[OntologyOptimizationWorker] Starting ontology optimization worker...');

  try {
    // Load environment variables
    console.log('[OntologyOptimizationWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[OntologyOptimizationWorker] Environment variables loaded successfully');

    // Initialize all dependencies
    const configService = new ConfigService();
    await configService.initialize();
    console.log('[OntologyOptimizationWorker] ConfigService initialized');

    const dbService = DatabaseService.getInstance();
    console.log('[OntologyOptimizationWorker] DatabaseService initialized');

    // Initialize Weaviate client for semantic similarity
    const weaviate = require('weaviate-ts-client').default;
    const weaviateClient = weaviate.client({
      scheme: 'http',
      host: environmentLoader.get('WEAVIATE_HOST') || 'localhost:8080',
    });
    
    // Create a dummy TextEmbeddingTool for now - this would be properly initialized in a real implementation
    const dummyEmbeddingTool = {
      execute: async () => ({ embeddings: [] }),
      getManifest: () => ({ name: 'dummy', description: 'dummy' })
    } as any;
    
    const semanticSimilarityTool = new SemanticSimilarityTool(weaviateClient, configService, dummyEmbeddingTool, dbService);
    console.log('[OntologyOptimizationWorker] SemanticSimilarityTool initialized');

    // Create dedicated Redis connection for BullMQ
    const redisUrl = environmentLoader.get('REDIS_URL');
    let redisConnection: Redis;
    
    if (redisUrl) {
      redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
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
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        family: 4,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 10000,
        enableOfflineQueue: true
      });
    }

    console.log(`[OntologyOptimizationWorker] Using dedicated Redis connection for BullMQ`);

    // Initialize optimization strategy
    const llmOptimizer = new LLMBasedOptimizer(dbService, new ConceptRepository(dbService));

    // Create the ontology optimizer
    const ontologyOptimizer = new OntologyOptimizer(
      semanticSimilarityTool,
      dbService,
      weaviateClient,
      llmOptimizer
    );

    console.log('[OntologyOptimizationWorker] OntologyOptimizer initialized');

    // Create and start the BullMQ worker
    const worker = new Worker<OntologyJobData>(
      'ontology-optimization-queue',
      async (job) => {
        console.log(`[OntologyOptimizationWorker] Processing job ${job.id}: ${job.data.optimizationType} for user ${job.data.userId}`);
        await ontologyOptimizer.processOptimization(job);
        console.log(`[OntologyOptimizationWorker] Completed job ${job.id}`);
      },
      {
        connection: redisConnection,
        concurrency: 2, // Process up to 2 jobs concurrently
      }
    );

    // Configure queue-level retry settings
    const ontologyQueue = new Queue('ontology-optimization-queue', { 
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      }
    });

    // Handle worker events
    worker.on('completed', (job) => {
      console.log(`[OntologyOptimizationWorker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[OntologyOptimizationWorker] Job ${job?.id} FAILED`);
      console.error(`[OntologyOptimizationWorker] Error type: ${err.name || 'Unknown'}`);
      console.error(`[OntologyOptimizationWorker] Error message: ${err.message}`);
    });

    worker.on('error', (err) => {
      console.error('[OntologyOptimizationWorker] Worker error:', err);
    });

    console.log('[OntologyOptimizationWorker] Worker is running and listening for jobs on ontology-optimization-queue');

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`[OntologyOptimizationWorker] Received ${signal}, shutting down gracefully...`);
      try {
        await worker.close();
        await ontologyQueue.close();
        await redisConnection.quit();
        console.log('[OntologyOptimizationWorker] Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('[OntologyOptimizationWorker] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('[OntologyOptimizationWorker] Failed to start:', error);
    process.exit(1);
  }
}

// Start the worker
main().catch((error) => {
  console.error('[OntologyOptimizationWorker] Unhandled error:', error);
  process.exit(1);
});
