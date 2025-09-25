/**
 * CardWorker.ts
 * V11.0 Production-Grade Worker for creating UI cards from knowledge entities
 * 
 * This worker subscribes to the card-queue and processes events published
 * by IngestionAnalyst and InsightEngine. For each entity in an event, it directly
 * creates Card records for eligible entities.
 * 
 * ARCHITECTURE: Follows V11.0 presentation layer separation - knowledge generation
 * is completely decoupled from UI presentation.
 */

import { ConfigService } from '@2dots1line/config-service';
import { DatabaseService, CardRepository, MemoryRepository, ConceptRepository, DerivedArtifactRepository, ProactivePromptRepository, CommunityRepository, GrowthEventRepository, UserRepository } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Worker, Job, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { 
  TCard
} from '@2dots1line/shared-types';
import { writeFileSync } from 'fs';

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
  private notificationQueue: Queue;
  private redisConnection: Redis;
  
  // Repository instances
  private cardRepository: CardRepository;
  private memoryRepository: MemoryRepository;
  private conceptRepository: ConceptRepository;
  private derivedArtifactRepository: DerivedArtifactRepository;
  private proactivePromptRepository: ProactivePromptRepository;
  private communityRepository: CommunityRepository;
  private growthEventRepository: GrowthEventRepository;
  private userRepository: UserRepository;

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
      queueName: 'card-queue',
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
    this.communityRepository = new CommunityRepository(databaseService);
    this.growthEventRepository = new GrowthEventRepository(databaseService);
    this.userRepository = new UserRepository(databaseService);

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

    console.log(`[CardWorker] Using dedicated Redis connection for BullMQ`);

    console.log(`[CardWorker] Redis connection configured:`, this.redisConnection);

    this.worker = new Worker(
      this.config.queueName!,
      this.processJob.bind(this),
      {
        connection: this.redisConnection,
        concurrency: this.config.concurrency,
      }
    );

    // Initialize notification queue (same Redis connection)
    this.notificationQueue = new Queue('notification-queue', { connection: this.redisConnection });

    this.setupEventHandlers();
  }

  /**
   * Process card creation jobs from the queue
   */
  private async processJob(job: Job<CardWorkerEvent>): Promise<void> {
    writeFileSync('/tmp/cardworker-job-called.txt', new Date().toISOString() + '\n', { flag: 'a' });
    // Remove test error and file write
    const event = job.data;
    console.log('[CardWorker] Received job:', job);
    console.log(`[CardWorker] Processing ${event.type} event from ${event.source} for user ${event.userId}`);
    console.log(`[CardWorker] Event contains ${event.entities.length} entities to process`);
    try {
      const results = [];
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
      console.log(`[CardWorker] processEntity: entity.id=${entity.id}, entity.type=${entity.type}, mappedType=${entityType}`);
      if (!entityType) {
        return { 
          created: false, 
          reason: `Unsupported entity type: ${entity.type}` 
        };
      }
      // Fetch full entity data using generic method
      const entityData = await this.fetchEntityByType(entityType, entity.id);
      if (!entityData) {
        console.log(`[CardWorker] Entity not found in DB: ${entityType} ${entity.id}`);
        return { created: false, reason: `Entity not found in DB: ${entityType} ${entity.id}` };
      }
      // Load eligibility rules
      const eligibilityRules = this.configService.getCardEligibilityRules();
      let eligible = true;
      let skipReason = '';
      if (entityType === 'Concept') {
        const rules = eligibilityRules.Concept;
        if (rules) {
          if (typeof entityData.importance_score === 'number' && entityData.importance_score < rules.min_importance_score) {
            eligible = false;
            skipReason = `Concept importance_score ${entityData.importance_score} < min_importance_score ${rules.min_importance_score}`;
          }
          if (rules.eligible_types && !rules.eligible_types.includes(entityData.type)) {
            eligible = false;
            skipReason = `Concept type ${entityData.type} not in eligible_types`;
          }
        }
      } else if (entityType === 'MemoryUnit') {
        const rules = eligibilityRules.MemoryUnit;
        if (rules) {
          if (typeof entityData.importance_score === 'number' && entityData.importance_score < rules.min_importance_score) {
            eligible = false;
            skipReason = `MemoryUnit importance_score ${entityData.importance_score} < min_importance_score ${rules.min_importance_score}`;
          }
          if (rules.required_source_types && !rules.required_source_types.includes(entityData.source_type)) {
            eligible = false;
            skipReason = `MemoryUnit source_type ${entityData.source_type} not in required_source_types`;
          }
        }
      } else if (entityType === 'DerivedArtifact') {
        const rules = eligibilityRules.DerivedArtifact;
        if (rules && rules.eligible_types && !rules.eligible_types.includes(entityData.type)) {
          eligible = false;
          skipReason = `DerivedArtifact type ${entityData.type} not in eligible_types`;
        }
      } else if (entityType === 'ProactivePrompt') {
        const rules = eligibilityRules.ProactivePrompt;
        if (rules && rules.always_eligible !== true) {
          eligible = false;
          skipReason = `ProactivePrompt not always eligible`;
        }
      } else if (entityType === 'Community') {
        const rules = eligibilityRules.Community;
        if (rules && rules.always_eligible !== true) {
          eligible = false;
          skipReason = `Community not always eligible`;
        }
      } else if (entityType === 'GrowthEvent') {
        const rules = eligibilityRules.GrowthEvent;
        if (rules && rules.always_eligible !== true) {
          eligible = false;
          skipReason = `GrowthEvent not always eligible`;
        }
      } else if (entityType === 'User') {
        const rules = eligibilityRules.User;
        if (rules && rules.always_eligible !== true) {
          eligible = false;
          skipReason = `User not always eligible`;
        }
      } else if (entityType === 'MergedConcept') {
        // MergedConcepts should be eligible for card creation as they represent important merged knowledge
        // But only if they have status 'merged' (not 'archived')
        if (entityData.status === 'archived') {
          eligible = false;
          skipReason = `MergedConcept is archived and should not be displayed`;
        } else {
          const rules = eligibilityRules.Concept; // Use Concept rules since MergedConcepts are concepts
          if (rules) {
            if (typeof entityData.importance_score === 'number' && entityData.importance_score < rules.min_importance_score) {
              eligible = false;
              skipReason = `MergedConcept importance_score ${entityData.importance_score} < min_importance_score ${rules.min_importance_score}`;
            }
            if (rules.eligible_types && !rules.eligible_types.includes(entityData.type)) {
              eligible = false;
              skipReason = `MergedConcept type ${entityData.type} not in eligible_types`;
            }
          }
        }
      }
      if (!eligible) {
        console.log(`[CardWorker] Entity not eligible: ${entityType} ${entity.id} - ${skipReason}`);
        return { created: false, reason: `Not eligible: ${skipReason}` };
      }
      // Check if card already exists
      const existingCard = await this.cardRepository.findBySourceEntity(entity.id, entityType);
      console.log('[CardWorker] existingCard:', existingCard);
      // if (existingCard.length > 0) {
      //   console.log(`[CardWorker] Card already exists for ${entityType} ${entity.id}`);
      //   return { 
      //     created: false, 
      //     reason: `Card already exists for ${entityType} ${entity.id}` 
      //   };
      // }
      // Create new card
      const cardData = {
        user_id: userId,
        type: entityType.toLowerCase(),
        source_entity_id: entity.id,
        source_entity_type: entityType,
        display_data: entityData // Optionally, filter/transform for display
      };
      console.log(`[CardWorker] Creating card with data:`, cardData);
      const newCard = await this.cardRepository.create(cardData);
      console.log(`[CardWorker] Card created:`, newCard);

      // Enqueue notification for "new_card_available"
      try {
        const title =
          (newCard as any)?.display_data?.title ??
          (entityData as any)?.title ??
          (entityData as any)?.title ??
          `${entityType} ${entity.id}`;

        const payload = {
          type: 'new_card_available' as const,
          userId,
          card: {
            card_id: (newCard as any).card_id,
            type: (newCard as any).type ?? entityType.toLowerCase(),
            display_data: { title },
          },
        };

        await this.notificationQueue.add('new_card_available', payload, {
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        });

        console.log(
          `[CardWorker] 📣 Enqueued notification 'new_card_available' for user ${userId} (card_id=${(newCard as any).card_id})`
        );
      } catch (notifyErr) {
        console.error('[CardWorker] Failed to enqueue new_card_available notification:', notifyErr);
        // Do not fail the card job if notification enqueue fails
      }

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
  private mapEntityType(eventType: string): 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'ProactivePrompt' | 'Community' | 'GrowthEvent' | 'User' | 'MergedConcept' | null {
    switch (eventType) {
      case 'MemoryUnit':
        return 'MemoryUnit';
      case 'Concept':
        return 'Concept';
      case 'DerivedArtifact':
        return 'DerivedArtifact';
      case 'ProactivePrompt':
        return 'ProactivePrompt';
      case 'Community':
        return 'Community';
      case 'GrowthEvent':
        return 'GrowthEvent';
      case 'User':
        return 'User';
      case 'MergedConcept':
        return 'MergedConcept';
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
    // Close dedicated Redis connection
    await this.redisConnection.quit();
    console.log('[CardWorker] Shutdown complete');
  }

  /**
   * Generic method to fetch entity by type using standardized field names
   * This replaces the need for separate if/else chains since all entities now use:
   * - entity_id (primary key)
   * - user_id (for filtering)
   * - title, content, created_at, updated_at (standardized fields)
   */
  private async fetchEntityByType(entityType: string, entityId: string): Promise<any> {
    try {
      switch (entityType) {
        case 'Concept':
          return await this.conceptRepository.findById(entityId);
        case 'MemoryUnit':
          return await this.memoryRepository.findById(entityId);
        case 'DerivedArtifact':
          return await this.derivedArtifactRepository.findById(entityId);
        case 'ProactivePrompt':
          return await this.proactivePromptRepository.findById(entityId);
        case 'Community':
          // Note: CommunityRepository doesn't have findById, so we'll use a direct Prisma query
          return await this.databaseService.prisma.communities.findUnique({
            where: { entity_id: entityId }
          });
        case 'GrowthEvent':
          return await this.growthEventRepository.findById(entityId);
        case 'User':
          return await this.userRepository.findById(entityId);
        case 'MergedConcept':
          // MergedConcepts are stored in the concepts table, use unfiltered method to allow merged status
          return await this.conceptRepository.findByIdUnfiltered(entityId);
        default:
          console.warn(`[CardWorker] Unknown entity type: ${entityType}`);
          return null;
      }
    } catch (error) {
      console.error(`[CardWorker] Error fetching ${entityType} ${entityId}:`, error);
      return null;
    }
  }
}
