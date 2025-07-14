/**
 * CardWorker.ts
 * V11.0 Production-Grade Worker for creating UI cards from knowledge entities
 * 
 * This worker subscribes to the card-and-graph-queue and processes events published
 * by IngestionAnalyst and InsightEngine. For each entity in an event, it directly
 * creates Card records for eligible entities.
 * 
 * ARCHITECTURE: Follows V11.0 presentation layer separation - knowledge generation
 * is completely decoupled from UI presentation.
 */

import { ConfigService } from '@2dots1line/config-service';
import { DatabaseService, CardRepository, MemoryRepository, ConceptRepository, DerivedArtifactRepository, ProactivePromptRepository } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Worker, Job } from 'bullmq';
import { 
  TCard
} from '@2dots1line/shared-types';

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

/**
 * CardWorker class for processing card generation events
 * V11.0 Production-Grade Implementation
 */
export class CardWorker {
  private worker: Worker;
  private config: CardWorkerConfig;
  
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
    // CRITICAL: Load environment variables first
    console.log('[CardWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[CardWorker] Environment variables loaded successfully');

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

    // Initialize BullMQ worker with EnvironmentLoader
    const redisConnection = {
      host: environmentLoader.get('REDIS_HOST') || 'localhost',
      port: parseInt(environmentLoader.get('REDIS_PORT') || '6379'),
      password: environmentLoader.get('REDIS_PASSWORD'),
    };

    console.log(`[CardWorker] Redis connection configured: ${redisConnection.host}:${redisConnection.port}`);

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
   * Process a single entity by creating a card directly
   */
  private async processEntity(
    entity: { id: string; type: string }, 
    userId: string
  ): Promise<{ created: boolean; cardId?: string; reason?: string }> {
    try {
      // Map entity type to card format
      const entityType = this.mapEntityType(entity.type);
      if (!entityType) {
        return { 
          created: false, 
          reason: `Unsupported entity type: ${entity.type}` 
        };
      }

      // Check if card already exists
      const existingCard = await this.cardRepository.findBySourceEntity(entity.id, entityType);
      if (existingCard) {
        return { 
          created: false, 
          reason: `Card already exists for ${entityType} ${entity.id}` 
        };
      }

      // Create new card
      const cardData = {
        user_id: userId,
        card_type: entityType.toLowerCase(),
        source_entity_id: entity.id,
        source_entity_type: entityType,
        display_data: {}
      };

      const newCard = await this.cardRepository.create(cardData);
      return { 
        created: true, 
        cardId: newCard.card_id 
      };
      
    } catch (error) {
      console.error(`[CardWorker] Error processing entity ${entity.type} ${entity.id}:`, error);
      return { 
        created: false, 
        reason: `Processing error: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Map event entity types to card entity types
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
