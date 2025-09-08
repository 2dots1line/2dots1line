import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { environmentLoader } from '@2dots1line/core-utils';
import Redis from 'ioredis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  isAuthenticated?: boolean;
}

export class NotificationService {
  private io: SocketIOServer;
  private redis: Redis;
  private redisSubscriber: Redis;
  private channelName: string;
  private connectedClients: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private maxConnectionsPerUser: number = 5; // Limit connections per user

  constructor(httpServer: HTTPServer) {
    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: environmentLoader.get('FRONTEND_URL') || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Initialize Redis connections
    this.redis = new Redis(environmentLoader.get('REDIS_URL') || 'redis://localhost:6379');
    this.redisSubscriber = this.redis.duplicate(); // Dedicated connection for subscribing

    // Load environment configuration
    environmentLoader.load();
    this.channelName = environmentLoader.get('NOTIFICATION_REDIS_CHANNEL') || 'socketio_notifications_channel';

    this.setupSocketHandlers();
    this.setupRedisSubscription();
    
    console.log('✅ NotificationService initialized with Socket.IO');
  }

  private setupSocketHandlers(): void {
    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      const userId = socket.handshake.auth.userId || socket.handshake.query.userId;

      if (!token || !userId) {
        console.warn(`[Socket.IO] Authentication failed - missing token or userId`);
        return next(new Error('Authentication failed'));
      }

      // For now, accept any token (in production, validate JWT)
      // TODO: Implement proper JWT validation
      socket.userId = userId as string;
      socket.isAuthenticated = true;
      next();
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.isAuthenticated || !socket.userId) {
        console.warn('[Socket.IO] Unauthenticated connection attempt');
        socket.disconnect();
        return;
      }

      const userId = socket.userId;
      console.log(`[Socket.IO] Client connected: ${socket.id} for user: ${userId}`);

      // Check connection limits
      const userConnections = this.connectedClients.get(userId) || new Set();
      if (userConnections.size >= this.maxConnectionsPerUser) {
        console.warn(`[Socket.IO] Connection limit reached for user ${userId}, disconnecting oldest connection`);
        const oldestSocketId = userConnections.values().next().value;
        if (oldestSocketId) {
          this.io.to(oldestSocketId).disconnectSockets();
        }
      }

      // Add to user's connection set
      userConnections.add(socket.id);
      this.connectedClients.set(userId, userConnections);

      // Join user-specific room
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined room user:${userId} (total connections: ${userConnections.size})`);

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to notification service',
        userId: userId,
        timestamp: new Date().toISOString()
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id} (reason: ${reason})`);
        
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

        console.log(`[Socket.IO] User ${userId} now has ${userConnections?.size || 0} connections`);
      });

      // Handle acknowledgment of notifications
      socket.on('notification_acknowledged', (data) => {
        console.log(`[Socket.IO] Notification acknowledged by ${userId}:`, data);
        // TODO: Update notification status in database
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });
  }

  private async setupRedisSubscription(): Promise<void> {
    try {
      await this.redisSubscriber.subscribe(this.channelName);
      console.log(`[Socket.IO] Subscribed to Redis channel: ${this.channelName}`);

      this.redisSubscriber.on('message', (channel, message) => {
        if (channel === this.channelName) {
          this.handleRedisMessage(message);
        }
      });

      this.redisSubscriber.on('error', (error) => {
        console.error('[Socket.IO] Redis subscription error:', error);
      });

    } catch (error) {
      console.error('[Socket.IO] Failed to setup Redis subscription:', error);
      throw error;
    }
  }

  private handleRedisMessage(message: string): void {
    try {
      const notificationMessage: any = JSON.parse(message);
      const { userId, event, data } = notificationMessage;

      if (!userId || !event) {
        console.warn('[Socket.IO] Invalid message format:', { userId, event });
        return;
      }

      // Emit to user-specific room
      this.io.to(`user:${userId}`).emit(event, JSON.parse(data));
      
      console.log(`[Socket.IO] Forwarded event "${event}" to user ${userId}`);
      
      // Log connection stats
      const userConnections = this.connectedClients.get(userId);
      if (userConnections) {
        console.log(`[Socket.IO] User ${userId} has ${userConnections.size} active connections`);
      }

    } catch (error) {
      console.error('[Socket.IO] Error handling Redis message:', error);
    }
  }

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

  public async shutdown(): Promise<void> {
    console.log('[Socket.IO] Shutting down NotificationService...');
    
    // Close all connections
    this.io.close();
    
    // Close Redis connections
    await this.redisSubscriber.quit();
    
    console.log('[Socket.IO] NotificationService shutdown complete');
  }
}
