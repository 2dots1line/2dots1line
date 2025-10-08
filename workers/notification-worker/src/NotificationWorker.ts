// workers/notification-worker/src/NotificationWorker.ts
// CORRECT V11.0 IMPLEMENTATION - Completely overhauled per tech lead directives

import { 
  NewCardAvailablePayload, 
  GraphProjectionUpdatedPayload, 
  SSEMessage,
  NotificationJobPayload
} from '@2dots1line/shared-types';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { DatabaseService } from '@2dots1line/database';
import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';


const NOTIFICATION_QUEUE_NAME = 'notification-queue';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  isAuthenticated?: boolean;
}

interface PendingNotification {
  userId: string;
  type: string;
  data: any;
  timestamp: number;
}

interface ConsolidatedNotification {
  userId: string;
  newCards: number;
  graphUpdates: number;
  insights: number;
  timestamp: string;
  message: string;
}

export class NotificationWorker {
  private worker: Worker;
  private redis: Redis;
  private isShuttingDown: boolean = false;
  private io?: SocketIOServer;
  private connectedClients: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private maxConnectionsPerUser: number = 5;
  
  // Notification consolidation
  private pendingNotifications: Map<string, PendingNotification[]> = new Map(); // userId -> events
  private consolidationTimers: Map<string, NodeJS.Timeout> = new Map(); // userId -> timer
  private readonly COLLECTION_WINDOW_MS = 10000; // 10 seconds

  constructor(redisConnection: Redis, databaseService: DatabaseService, httpServer?: HTTPServer) {
    // CRITICAL: Load environment variables first
    console.log('[NotificationWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[NotificationWorker] Environment variables loaded successfully');

    // Store Redis connection
    this.redis = redisConnection;

    // Initialize Socket.IO server if HTTP server is provided
    if (httpServer) {
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: environmentLoader.get('FRONTEND_URL') || 'http://localhost:3000',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket', 'polling'],
      });
      this.setupSocketHandlers();
      console.log('[NotificationWorker] Socket.IO server initialized');
    }

    this.worker = new Worker<NotificationJobPayload>(
      NOTIFICATION_QUEUE_NAME,
      this.processJob.bind(this),
      { 
        connection: redisConnection,
        concurrency: 1, // Very low concurrency to prevent Redis connection exhaustion
        limiter: {
          max: 5, // Maximum 5 jobs per interval
          duration: 1000, // Per 1 second
        }
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Set up Socket.IO handlers for client connections
   */
  private setupSocketHandlers(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next: (err?: Error) => void) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      const userId = socket.handshake.auth.userId || socket.handshake.query.userId;

      if (!token || !userId) {
        console.warn(`[NotificationWorker] Authentication failed - missing token or userId`);
        return next(new Error('Authentication failed'));
      }

      // For now, accept any token (in production, validate JWT)
      socket.userId = userId as string;
      socket.isAuthenticated = true;
      next();
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.isAuthenticated || !socket.userId) {
        console.warn('[NotificationWorker] Unauthenticated connection attempt');
        socket.disconnect();
        return;
      }

      const userId = socket.userId;
      console.log(`[NotificationWorker] Client connected: ${socket.id} for user: ${userId}`);

      // Check connection limits
      const userConnections = this.connectedClients.get(userId) || new Set();
      if (userConnections.size >= this.maxConnectionsPerUser) {
        console.warn(`[NotificationWorker] Connection limit reached for user ${userId}, disconnecting oldest connection`);
        const oldestSocketId = userConnections.values().next().value;
        if (oldestSocketId && this.io) {
          this.io.to(oldestSocketId).disconnectSockets();
        }
      }

      // Add to user's connection set
      userConnections.add(socket.id);
      this.connectedClients.set(userId, userConnections);

      // Join user-specific room
      socket.join(`user:${userId}`);
      console.log(`[NotificationWorker] Socket ${socket.id} joined room user:${userId} (total connections: ${userConnections.size})`);

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to notification worker',
        userId: userId,
        timestamp: new Date().toISOString()
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        console.log(`[NotificationWorker] Client disconnected: ${socket.id} (reason: ${reason})`);
        
        // Remove from user's connection set
        const userConnections = this.connectedClients.get(userId);
        if (userConnections) {
          userConnections.delete(socket.id);
          if (userConnections.size === 0) {
            this.connectedClients.delete(userId);
          } else {
            this.connectedClients.set(userId, userConnections);
          }
        }

        console.log(`[NotificationWorker] User ${userId} now has ${userConnections?.size || 0} connections`);
      });

      // Handle acknowledgment of notifications
      socket.on('notification_acknowledged', (data: any) => {
        console.log(`[NotificationWorker] Notification acknowledged by ${userId}:`, data);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // Quest: join/leave specific execution room
      socket.on('quest:join', (data: { executionId: string }) => {
        if (!data?.executionId) return;
        const room = `quest:${data.executionId}`;
        socket.join(room);
        console.log(`[NotificationWorker] User ${userId} joined ${room}`);
      });

      socket.on('quest:leave', (data: { executionId: string }) => {
        if (!data?.executionId) return;
        const room = `quest:${data.executionId}`;
        socket.leave(room);
        console.log(`[NotificationWorker] User ${userId} left ${room}`);
      });
    });
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
   * Send quest update to an execution-specific room
   */
  public sendQuestUpdate(executionId: string, data: any): void {
    console.log(`[NotificationWorker] sendQuestUpdate called for executionId: ${executionId}, data:`, JSON.stringify(data, null, 2));
    if (!this.io) {
      console.log('[NotificationWorker] Socket.IO not available, cannot send quest update');
      return;
    }
    const room = `quest:${executionId}`;
    console.log(`[NotificationWorker] Emitting quest:update to room: ${room}`);
    this.io.to(room).emit('quest:update', {
      execution_id: executionId,
      ...data,
      created_at: new Date().toISOString(),
    });
    console.log(`[NotificationWorker] Quest update emitted successfully to room: ${room}`);
  }

  /**
   * Main job processing function with 10-second consolidation window.
   * Collects events for 10 seconds, then sends 1 consolidated notification.
   */
  private async processJob(job: Job<NotificationJobPayload>): Promise<void> {
    if (this.isShuttingDown) {
      console.log(`[NotificationWorker] Skipping job ${job.id} due to shutdown`);
      return;
    }

    const { type, userId } = job.data;
    console.log(`[NotificationWorker] Collecting ${type} event for user ${userId}`);

    try {
      // Check if user has active connections
      const userConnections = this.connectedClients.get(userId);
      if (!userConnections || userConnections.size === 0) {
        console.log(`[NotificationWorker] No active connections for user ${userId}, skipping notification`);
        return;
      }

      // Add event to pending notifications
      this.addPendingNotification(userId, type, job.data);

      // Set or reset consolidation timer
      this.scheduleConsolidation(userId);

    } catch (error) {
      console.error(`[NotificationWorker] Error processing job ${job.id}:`, error);
      throw error; // Let BullMQ handle retry logic
    }
  }

  /**
   * Add notification to pending queue for consolidation
   */
  private addPendingNotification(userId: string, type: string, data: any): void {
    const pending = this.pendingNotifications.get(userId) || [];
    pending.push({
      userId,
      type,
      data,
      timestamp: Date.now()
    });
    this.pendingNotifications.set(userId, pending);
    console.log(`[NotificationWorker] Added ${type} to pending queue for user ${userId} (${pending.length} events)`);
  }

  /**
   * Schedule consolidation timer for user
   */
  private scheduleConsolidation(userId: string): void {
    // Clear existing timer if any
    const existingTimer = this.consolidationTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.sendConsolidatedNotification(userId);
    }, this.COLLECTION_WINDOW_MS);

    this.consolidationTimers.set(userId, timer);
    console.log(`[NotificationWorker] Scheduled consolidation for user ${userId} in ${this.COLLECTION_WINDOW_MS}ms`);
  }

  /**
   * Send consolidated notification to user
   */
  private async sendConsolidatedNotification(userId: string): Promise<void> {
    const pending = this.pendingNotifications.get(userId) || [];
    if (pending.length === 0) {
      console.log(`[NotificationWorker] No pending notifications for user ${userId}`);
      return;
    }

    // Clear pending notifications and timer
    this.pendingNotifications.delete(userId);
    this.consolidationTimers.delete(userId);

    // Consolidate events
    const consolidated = this.consolidateEvents(userId, pending);
    
    // Send consolidated notification
    if (this.io) {
      this.io.to(`user:${userId}`).emit('consolidated_update', consolidated);
      console.log(`[NotificationWorker] Sent consolidated notification to user ${userId}: ${consolidated.message}`);
    } else {
      console.warn(`[NotificationWorker] Socket.IO not initialized, cannot send notification to user ${userId}`);
    }

    // Small delay to prevent overwhelming Redis
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Consolidate multiple events into single notification
   */
  private consolidateEvents(userId: string, events: PendingNotification[]): ConsolidatedNotification {
    let newCards = 0;
    let graphUpdates = 0;
    let insights = 0;

    // Count events by type
    events.forEach(event => {
      switch (event.type) {
        case 'new_card_available':
          newCards++;
          break;
        case 'graph_projection_updated':
          graphUpdates++;
          break;
        case 'proactive_insights':
          insights++;
          break;
      }
    });

    // Create consolidated message
    const parts = [];
    if (newCards > 0) parts.push(`${newCards} new card${newCards > 1 ? 's' : ''}`);
    if (graphUpdates > 0) parts.push(`${graphUpdates} graph update${graphUpdates > 1 ? 's' : ''}`);
    if (insights > 0) parts.push(`${insights} new insight${insights > 1 ? 's' : ''}`);

    const message = parts.length > 0 
      ? `${parts.join(', ')} available`
      : 'Updates available';

    return {
      userId,
      newCards,
      graphUpdates,
      insights,
      timestamp: new Date().toISOString(),
      message
    };
  }


  /**
   * Get connection statistics for monitoring
   */
  public getConnectionStats(): { totalUsers: number; totalConnections: number } {
    let totalConnections = 0;
    for (const connections of this.connectedClients.values()) {
      totalConnections += connections.size;
    }
    
    return {
      totalUsers: this.connectedClients.size,
      totalConnections
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
      // Send any pending consolidated notifications before shutdown
      for (const [userId, timer] of this.consolidationTimers) {
        clearTimeout(timer);
        await this.sendConsolidatedNotification(userId);
      }

      // Close Socket.IO server if it exists
      if (this.io) {
        this.io.close();
        console.log('[NotificationWorker] Socket.IO server closed');
      }

      // Close BullMQ worker
      await this.worker.close();
      console.log('[NotificationWorker] BullMQ worker closed');

      // Close Redis connection
      await this.redis.quit();
      console.log('[NotificationWorker] Redis connection closed');

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