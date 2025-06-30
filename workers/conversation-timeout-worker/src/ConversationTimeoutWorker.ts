/**
 * ConversationTimeoutWorker.ts
 * V9.7 Production-Grade Worker for handling conversation timeouts via Redis key expiration
 * 
 * This worker listens for Redis keyspace notifications when conversation timeout keys expire.
 * When a conversation times out, it:
 * 1. Updates the conversation status to 'ended' in PostgreSQL
 * 2. Adds a job to the BullMQ ingestion queue for background processing
 * 
 * ARCHITECTURE: Uses dependency injection for testability and follows Single Responsibility Principle
 */

import Redis from 'ioredis';
import Bull from 'bullmq';
import { ConversationRepository } from '@2dots1line/database';
import { REDIS_CONVERSATION_HEARTBEAT_PREFIX } from '@2dots1line/core-utils';

export interface ConversationTimeoutConfig {
  timeoutDurationMinutes?: number;
  checkIntervalSeconds?: number;
  enableIngestionQueue?: boolean;
}

export interface ConversationTimeoutWorkerDependencies {
  redis: Redis;
  subscriberRedis: Redis;
  conversationRepo: ConversationRepository;
  ingestionQueue: Bull.Queue;
}

export class ConversationTimeoutWorker {
  private redis: Redis;
  private subscriberRedis: Redis;
  private conversationRepo: ConversationRepository;
  private ingestionQueue: Bull.Queue;
  private config: Required<ConversationTimeoutConfig>;
  private isRunning: boolean = false;
  private startTime?: Date;

  constructor(
    dependencies: ConversationTimeoutWorkerDependencies,
    config: ConversationTimeoutConfig = {}
  ) {
    // Set configuration with defaults
    this.config = {
      timeoutDurationMinutes: config.timeoutDurationMinutes || 5,
      checkIntervalSeconds: config.checkIntervalSeconds || 30,
      enableIngestionQueue: config.enableIngestionQueue ?? true
    };

    // Inject dependencies
    this.redis = dependencies.redis;
    this.subscriberRedis = dependencies.subscriberRedis;
    this.conversationRepo = dependencies.conversationRepo;
    this.ingestionQueue = dependencies.ingestionQueue;

    // Set up error handlers
    this.redis.on('error', (err) => {
      console.error('ConversationTimeoutWorker Redis error:', err);
    });

    this.subscriberRedis.on('error', (err) => {
      console.error('ConversationTimeoutWorker Subscriber Redis error:', err);
    });
  }

  /**
   * Start the worker and begin listening for timeout events
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('ConversationTimeoutWorker is already running');
      return;
    }

    try {
      // Note: Redis keyspace notifications should be configured in docker-compose.yml
      // We don't configure them here as it's an infrastructure concern

      // Subscribe to key expiration events
      await this.subscriberRedis.subscribe('__keyevent@0__:expired');
      
      this.subscriberRedis.on('message', (channel, message) => {
        // The message IS the expired key
        this.handleKeyExpiration(message);
      });

      this.isRunning = true;
      this.startTime = new Date();
      console.log(`✅ ConversationTimeoutWorker started successfully`);
      console.log(`🕐 Timeout duration: ${this.config.timeoutDurationMinutes} minutes`);
      console.log(`🔄 Check interval: ${this.config.checkIntervalSeconds} seconds`);
      console.log(`📥 Ingestion queue: ${this.config.enableIngestionQueue ? 'enabled' : 'disabled'}`);

    } catch (error) {
      console.error('❌ Failed to start ConversationTimeoutWorker:', error);
      throw error;
    }
  }

  /**
   * Stop the worker and cleanup connections
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    try {
      await this.subscriberRedis.unsubscribe('__keyevent@0__:expired');
      console.log('✅ ConversationTimeoutWorker stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping ConversationTimeoutWorker:', error);
    }
  }

  /**
   * Handle Redis key expiration events
   */
  private async handleKeyExpiration(expiredKey: string): Promise<void> {
    // Check if this is a conversation heartbeat key
    if (!expiredKey.startsWith(REDIS_CONVERSATION_HEARTBEAT_PREFIX)) {
      return; // Not a conversation heartbeat key
    }

    const conversationId = expiredKey.replace(REDIS_CONVERSATION_HEARTBEAT_PREFIX, '');
    console.log(`⏰ Conversation timeout detected for: ${conversationId}`);

    try {
      await this.processConversationTimeout(conversationId);
    } catch (error) {
      console.error(`❌ Failed to process timeout for conversation ${conversationId}:`, error);
    }
  }

  /**
   * Process a conversation timeout
   */
  private async processConversationTimeout(conversationId: string): Promise<void> {
    try {
      // 1. Check if conversation exists and is still active
      const conversation = await this.conversationRepo.findById(conversationId);
      
      if (!conversation) {
        console.log(`⚠️ Conversation ${conversationId} not found, skipping timeout processing`);
        return;
      }

      if (conversation.status !== 'active') {
        console.log(`⚠️ Conversation ${conversationId} is not active (status: ${conversation.status}), skipping timeout processing`);
        return;
      }

      // 2. Update conversation status to 'ended'
      await this.conversationRepo.update(conversationId, {
        status: 'ended',
        ended_at: new Date()
      });

      console.log(`✅ Marked conversation ${conversationId} as ended`);

      // 3. Add job to ingestion queue (if enabled)
      if (this.config.enableIngestionQueue) {
        await this.addIngestionJob(conversationId, conversation.user_id);
      }

      // 4. Log timeout processing completion
      console.log(`🎯 Timeout processing completed for conversation ${conversationId}`);

    } catch (error) {
      console.error(`❌ Error processing timeout for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Add a job to the BullMQ ingestion queue for background processing
   */
  private async addIngestionJob(conversationId: string, userId: string): Promise<void> {
    try {
      const jobName = `process-conversation:${conversationId}`;
      const jobData = { conversationId, userId };

      await this.ingestionQueue.add(jobName, jobData, {
        removeOnComplete: true, // Keep the queue clean
        removeOnFail: 1000,     // Keep failed jobs for inspection
        jobId: conversationId   // Use convo ID as job ID to prevent duplicates
      });
      console.log(`📥 Added BullMQ job for conversation ${conversationId} to 'ingestion-queue'`);

    } catch (error) {
      console.error(`❌ Failed to add BullMQ job for conversation ${conversationId}:`, error);
    }
  }

  /**
   * Get worker status and statistics
   */
  public getStatus(): {
    isRunning: boolean;
    config: Required<ConversationTimeoutConfig>;
    uptime?: number;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : undefined
    };
  }

  /**
   * Get active conversation heartbeats
   */
  public async getActiveHeartbeats(): Promise<string[]> {
    try {
      const keys = await this.redis.keys(`${REDIS_CONVERSATION_HEARTBEAT_PREFIX}*`);
      return keys.map(key => key.replace(REDIS_CONVERSATION_HEARTBEAT_PREFIX, ''));
    } catch (error) {
      console.error('❌ Failed to get active heartbeats:', error);
      return [];
    }
  }

  /**
   * Health check method for monitoring
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: {
      redis: boolean;
      subscriberRedis: boolean;
      database: boolean;
      queue: boolean;
    };
  }> {
    const checks = {
      redis: false,
      subscriberRedis: false,
      database: false,
      queue: false
    };

    try {
      // Check Redis connections
      await this.redis.ping();
      checks.redis = true;
      
      await this.subscriberRedis.ping();
      checks.subscriberRedis = true;

      // Check database connection with a simple query
      await this.conversationRepo.findById('health-check-test');
      checks.database = true;

      // Check queue connection
      await this.ingestionQueue.getWaiting();
      checks.queue = true;

    } catch (error) {
      console.error('Health check failed:', error);
    }

    const allHealthy = Object.values(checks).every(check => check);
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks
    };
  }
}
