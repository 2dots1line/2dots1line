/**
 * EmbeddingWorker.ts
 * V9.5 Background Worker for Processing Text Embeddings
 * 
 * This worker is triggered by IngestionAnalyst after entities (MemoryUnit, Concept) 
 * are created/updated. It generates embeddings via TextEmbeddingTool and stores them 
 * in Weaviate for semantic retrieval.
 * 
 * ARCHITECTURE: Decoupled resilience - if embedding service is down, knowledge is still 
 * persisted and can be indexed later. Performance specialization allows independent scaling.
 */

import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { DatabaseService } from '@2dots1line/database';
import { TTextEmbeddingInputPayload, TTextEmbeddingResult, IExecutableTool } from '@2dots1line/shared-types';
import { TextEmbeddingTool } from '@2dots1line/tools';
import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

export interface EmbeddingJob {
  entityId: string;           // UUID of the entity
  entityType: 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'Community' | 'ProactivePrompt' | 'GrowthEvent' | 'User' | 'MergedConcept';
  textContent: string;        // The text to be embedded
  userId: string;             // For multi-tenant indexing
}

export interface EmbeddingWorkerConfig {
  queueName?: string;
  concurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
  embeddingModelVersion?: string;
}

/**
 * EmbeddingWorker - Processes embedding generation jobs
 * V11.0 Production Implementation with EnvironmentLoader integration
 */
export class EmbeddingWorker {
  private worker: Worker;
  private textEmbeddingTool: IExecutableTool<TTextEmbeddingInputPayload, TTextEmbeddingResult>;
  private config: EmbeddingWorkerConfig;
  private redisConnection: Redis;

  constructor(
    private databaseService: DatabaseService,
    config: EmbeddingWorkerConfig = {}
  ) {
    // CRITICAL: Load environment variables first
    console.log('[EmbeddingWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[EmbeddingWorker] Environment variables loaded successfully');

    this.config = {
      queueName: 'embedding-queue',
      concurrency: 3,
      retryAttempts: 3,
      retryDelay: 2000,
      embeddingModelVersion: 'text-embedding-3-small',
      ...config
    };

    // Use TextEmbeddingTool as singleton instance
    this.textEmbeddingTool = TextEmbeddingTool;

    // Create dedicated Redis connection for BullMQ to prevent connection pool exhaustion
    const redisUrl = environmentLoader.get('REDIS_URL');
    
    if (redisUrl) {
      this.redisConnection = new Redis(redisUrl, {
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
      
      this.redisConnection = new Redis({
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

    console.log(`[EmbeddingWorker] Using dedicated Redis connection for BullMQ`);

    this.worker = new Worker(
      this.config.queueName!,
      this.processJob.bind(this),
      {
        connection: this.redisConnection,
        concurrency: this.config.concurrency,
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`[EmbeddingWorker] Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, error) => {
      if (job) {
        console.error(`[EmbeddingWorker] Job ${job.id} failed:`, error);
        
        // Check if job has exhausted all retries
        if (job.attemptsMade >= this.config.retryAttempts!) {
          console.error(`[EmbeddingWorker] Job ${job.id} exhausted all retry attempts, moving to DLQ`);
        }
      }
    });

    this.worker.on('error', (error) => {
      console.error('[EmbeddingWorker] Worker error:', error);
    });

    console.log(`[EmbeddingWorker] Worker initialized and listening on queue: ${this.config.queueName}`);
  }

  /**
   * Process embedding generation jobs
   */
  private async processJob(job: Job<EmbeddingJob>): Promise<void> {
    const { entityId, entityType, textContent, userId } = job.data;
    
    console.log(`[EmbeddingWorker] Processing embedding for ${entityType} ${entityId}`);

    try {
      // Generate embedding using TextEmbeddingTool with correct input format
      const embedding = await this.textEmbeddingTool.execute({
        payload: {
          text_to_embed: textContent,
          model_id: this.config.embeddingModelVersion!
        },
        user_id: userId
      });

      if (embedding.status === 'success' && embedding.result) {
        console.log(`[EmbeddingWorker] Generated embedding vector of length ${embedding.result.vector.length}`);

        // IMPLEMENTED: Store embedding in Weaviate
        const weaviateId = await this.storeEmbeddingInWeaviate({
          entityId,
          entityType,
          textContent,
          userId,
          vector: embedding.result.vector
        });
        
        console.log(`[EmbeddingWorker] ✅ Successfully stored embedding in Weaviate with ID: ${weaviateId}`);
        console.log(`[EmbeddingWorker] Embedding dimensions: ${embedding.result.vector.length}`);
        console.log(`[EmbeddingWorker] Preview: [${embedding.result.vector.slice(0, 5).map((v: number) => v.toFixed(4)).join(', ')}...]`);
      } else {
        throw new Error(`Embedding generation failed: ${embedding.error?.message || 'Unknown error'}`);
      }

    } catch (error) {
      console.error(`[EmbeddingWorker] Error generating embedding for ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Store embedding in Weaviate with proper error handling
   */
  private async storeEmbeddingInWeaviate(data: {
    entityId: string;
    entityType: string;
    textContent: string;
    userId: string;
    vector: number[];
  }): Promise<string> {
    try {
      // Use DatabaseService's Weaviate client if available
      if (!this.databaseService.weaviate) {
        console.warn(`[EmbeddingWorker] Weaviate client not available, skipping storage`);
        return 'weaviate-client-unavailable';
      }

      // CRITICAL FIX: Validate that entityId is a proper UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data.entityId)) {
        console.error(`[EmbeddingWorker] ❌ Invalid entityId format: ${data.entityId}. Expected UUID format.`);
        return 'invalid-entity-id-format';
      }

      // Use unified UserKnowledgeItem class for all entity types
      const result = await this.databaseService.weaviate
        .data
        .creator()
        .withClassName('UserKnowledgeItem')
        .withProperties({
          externalId: data.entityId, // This should now be a valid UUID
          userId: data.userId,
          title: data.textContent, // Use the full textContent as title (what gets vectorized)
          textContent: data.textContent,
          sourceEntityType: data.entityType,
          sourceEntityId: data.entityId, // This should now be a valid UUID
          createdAt: new Date().toISOString(),
          modelVersion: this.config.embeddingModelVersion!
        })
        .withVector(data.vector)
        .do();
      
      console.log(`✅ [EmbeddingWorker] Stored ${data.entityType} embedding in Weaviate: ${result.id}`);
      return result.id || 'weaviate-id-undefined';
    } catch (error) {
      console.error(`❌ [EmbeddingWorker] Failed to store embedding in Weaviate:`, error);
      // Don't throw - allow job to complete even if Weaviate storage fails
      return 'weaviate-storage-failed';
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[EmbeddingWorker] Shutting down...');
    await this.worker.close();
    // Close dedicated Redis connection
    await this.redisConnection.quit();
    console.log('[EmbeddingWorker] Shutdown complete');
  }
}

