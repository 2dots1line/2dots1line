/**
 * CardWorker.ts
 * V9.5 Production-Grade Worker for creating UI cards from knowledge entities
 * 
 * This worker subscribes to the card-and-graph-queue and processes events published
 * by IngestionAnalyst and InsightEngine. For each entity in an event, it uses the
 * CardFactory to determine eligibility and create Card records.
 * 
 * ARCHITECTURE: Follows V9.5 presentation layer separation - knowledge generation
 * is completely decoupled from UI presentation.
 */

import { Worker, Job } from 'bullmq';
import { DatabaseService } from '@2dots1line/database';
import {
  CardRepository,
  MemoryRepository,
  ConceptRepository,
  DerivedArtifactRepository,
  ProactivePromptRepository
} from '@2dots1line/database';
import { CardFactory } from '@2dots1line/card-service';
import { ConfigService } from '@2dots1line/config-service';

// Event types from V9.5 Event Queue Contracts
export interface NewEntitiesCreatedEvent {
  type: "new_entities_created";
  userId: string;
  source: "IngestionAnalyst";
  timestamp: string;
  entities: Array<{ id: string; type: string }>;
}

export interface CycleArtifactsCreatedEvent {
  type: "cycle_artifacts_created";
  userId: string;
  source: "InsightEngine";
  timestamp: string;
  entities: Array<{ id: string; type: string }>;
}

export type CardWorkerEvent = NewEntitiesCreatedEvent | CycleArtifactsCreatedEvent;

export interface CardWorkerConfig {
  queueName?: string;
  concurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class CardWorker {
  private worker: Worker;
  private config: CardWorkerConfig;
  private cardFactory: CardFactory;
  
  // Repository instances
  private cardRepository: CardRepository;
  private memoryRepository: MemoryRepository;
  private conceptRepository: ConceptRepository;
  private derivedArtifactRepository: DerivedArtifactRepository;
  private proactivePromptRepository: ProactivePromptRepository;

  constructor(
    private databaseService: DatabaseService,
    private configService: ConfigService,
    config: CardWorkerConfig = {}
  ) {
    this.config = {
      queueName: 'card-and-graph-queue',
      concurrency: 5,
      retryAttempts: 3,
      retryDelay: 2000,
      ...config
    };

    // Initialize repositories following IngestionAnalyst pattern
    this.cardRepository = new CardRepository(databaseService);
    this.memoryRepository = new MemoryRepository(databaseService);
    this.conceptRepository = new ConceptRepository(databaseService);
    this.derivedArtifactRepository = new DerivedArtifactRepository(databaseService);
    this.proactivePromptRepository = new ProactivePromptRepository(databaseService);

    // Initialize CardFactory with all required dependencies
    this.cardFactory = new CardFactory(
      configService,
      this.cardRepository,
      this.memoryRepository,
      this.conceptRepository,
      this.derivedArtifactRepository,
      this.proactivePromptRepository
    );

    // Initialize BullMQ worker
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    };

    this.worker = new Worker(
      this.config.queueName!,
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: this.config.concurrency,
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Process card creation jobs from the queue
   */
  private async processJob(job: Job<CardWorkerEvent>): Promise<void> {
    const event = job.data;
    
    console.log(`[CardWorker] Processing ${event.type} event from ${event.source} for user ${event.userId}`);
    console.log(`[CardWorker] Event contains ${event.entities.length} entities to process`);

    try {
      const results = [];
      
      // Process each entity in the event
      for (const entity of event.entities) {
        const result = await this.processEntity(entity, event.userId);
        results.push(result);
        
        if (result.created) {
          console.log(`[CardWorker] ✅ Created card ${result.cardId} for ${entity.type} ${entity.id}`);
        } else {
          console.log(`[CardWorker] ⏭️  Skipped ${entity.type} ${entity.id}: ${result.reason}`);
        }
      }

      const createdCount = results.filter(r => r.created).length;
      console.log(`[CardWorker] Event processing completed: ${createdCount}/${event.entities.length} cards created`);
      
    } catch (error) {
      console.error(`[CardWorker] Error processing ${event.type} event:`, error);
      throw error;
    }
  }

  /**
   * Process a single entity using CardFactory
   */
  private async processEntity(
    entity: { id: string; type: string }, 
    userId: string
  ): Promise<{ created: boolean; cardId?: string; reason?: string }> {
    try {
      // Map entity type to CardFactory expected format
      const entityType = this.mapEntityType(entity.type);
      if (!entityType) {
        return { 
          created: false, 
          reason: `Unsupported entity type: ${entity.type}` 
        };
      }

      // Use CardFactory to determine eligibility and create card
      const result = await this.cardFactory.createCardForEntity(
        { id: entity.id, type: entityType },
        userId
      );

      return result;
      
    } catch (error) {
      console.error(`[CardWorker] Error processing entity ${entity.type} ${entity.id}:`, error);
      return { 
        created: false, 
        reason: `Processing error: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Map event entity types to CardFactory entity types
   */
  private mapEntityType(eventType: string): 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'ProactivePrompt' | null {
    switch (eventType) {
      case 'MemoryUnit':
        return 'MemoryUnit';
      case 'Concept':
        return 'Concept';
      case 'DerivedArtifact':
        return 'DerivedArtifact';
      case 'ProactivePrompt':
        return 'ProactivePrompt';
      default:
        return null;
    }
  }

  /**
   * Setup event handlers for the worker
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`[CardWorker] Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[CardWorker] Job ${job?.id} failed:`, error);
    });

    this.worker.on('error', (error) => {
      console.error('[CardWorker] Worker error:', error);
    });

    console.log(`[CardWorker] Worker initialized and listening on queue: ${this.config.queueName}`);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[CardWorker] Shutting down...');
    await this.worker.close();
    console.log('[CardWorker] Shutdown complete');
  }
}
