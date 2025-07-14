// workers/notification-worker/src/NotificationWorker.ts
// CORRECT V11.0 IMPLEMENTATION - Completely overhauled per tech lead directives

import { 
  NewCardAvailablePayload, 
  GraphProjectionUpdatedPayload, 
  SSEMessage,
  NotificationJobPayload 
} from '@2dots1line/shared-types';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

const NOTIFICATION_QUEUE_NAME = 'notification-queue';

export class NotificationWorker {
  private worker: Worker;
  private publisher: Redis;
  private isShuttingDown: boolean = false;
  private redisPubSubChannel: string;

  constructor(redisConnection: Redis) {
    // CRITICAL: Load environment variables first
    console.log('[NotificationWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[NotificationWorker] Environment variables loaded successfully');

    // Get Redis pub/sub channel from EnvironmentLoader
    this.redisPubSubChannel = environmentLoader.get('NOTIFICATION_REDIS_CHANNEL') || 'sse_notifications_channel';
    console.log(`[NotificationWorker] Using Redis pub/sub channel: ${this.redisPubSubChannel}`);

    // Duplicate connection for non-blocking publishing
    this.publisher = redisConnection.duplicate();

    this.worker = new Worker<NotificationJobPayload>(
      NOTIFICATION_QUEUE_NAME,
      this.processJob.bind(this),
      { 
        connection: redisConnection,
        concurrency: 10 // Process multiple notifications concurrently
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for worker lifecycle
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`[NotificationWorker] ✅ Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[NotificationWorker] ❌ Job ${job?.id} failed:`, err);
    });

    this.worker.on('error', (err) => {
      console.error('[NotificationWorker] Worker error:', err);
    });

    this.worker.on('active', (job) => {
      console.log(`[NotificationWorker] 🔄 Job ${job.id} started processing`);
    });
  }

  /**
   * Main job processing function. This is the heart of the worker.
   * Processes notification jobs and broadcasts SSE messages via Redis Pub/Sub.
   */
  private async processJob(job: Job<NotificationJobPayload>): Promise<void> {
    if (this.isShuttingDown) {
      console.log(`[NotificationWorker] Skipping job ${job.id} due to shutdown`);
      return;
    }

    const { type, userId } = job.data;
    console.log(`[NotificationWorker] Processing job ${job.id} of type ${type} for user ${userId}`);

    let sseMessage: SSEMessage | null = null;

    try {
      switch (type) {
        case 'new_card_available':
          sseMessage = this.formatNewCardMessage(job.data as NewCardAvailablePayload);
          break;
        case 'graph_projection_updated':
          sseMessage = this.formatGraphUpdateMessage(job.data as GraphProjectionUpdatedPayload);
          break;
        default:
          console.warn(`[NotificationWorker] Received unknown job type: ${(job.data as any).type}`);
          return; // Acknowledge and drop unknown jobs
      }

      if (sseMessage) {
        // Publish the formatted message to the Redis Pub/Sub channel.
        // The API Gateway will handle the final delivery to connected clients.
        await this.publisher.publish(this.redisPubSubChannel, JSON.stringify(sseMessage));
        console.log(`[NotificationWorker] Broadcast ${type} notification to Redis channel for user ${userId}`);
      }
    } catch (error) {
      console.error(`[NotificationWorker] Error processing job ${job.id}:`, error);
      throw error; // Let BullMQ handle retry logic
    }
  }

  /**
   * Formats the SSE message for a new card notification.
   */
  private formatNewCardMessage(payload: NewCardAvailablePayload): SSEMessage {
    return {
      userId: payload.userId,
      event: 'new_card', // Event name the frontend listens for
      data: JSON.stringify({
        cardId: payload.card.card_id,
        cardType: payload.card.card_type,
        title: payload.card.display_data.title,
        timestamp: new Date().toISOString()
      }),
    };
  }

  /**
   * Formats the SSE message for a graph projection update notification.
   */
  private formatGraphUpdateMessage(payload: GraphProjectionUpdatedPayload): SSEMessage {
    return {
      userId: payload.userId,
      event: 'graph_updated', // Event name the frontend listens for
      data: JSON.stringify({
        version: payload.projection.version,
        nodeCount: payload.projection.nodeCount,
        edgeCount: payload.projection.edgeCount,
        timestamp: new Date().toISOString()
      }),
    };
  }

  /**
   * Starts the worker and begins processing jobs.
   */
  public async start(): Promise<void> {
    console.log('[NotificationWorker] Started successfully and ready to process notifications');
  }

  /**
   * Gracefully shuts down the worker.
   */
  private async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log('[NotificationWorker] Initiating graceful shutdown...');

    try {
      await this.worker.close();
      await this.publisher.quit();
      console.log('[NotificationWorker] Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('[NotificationWorker] Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Stops the worker and closes connections.
   */
  public async stop(): Promise<void> {
    await this.gracefulShutdown();
  }
} 