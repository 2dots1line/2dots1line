import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { DatabaseService } from '@2dots1line/database';
import { NotificationWorker } from './NotificationWorker';
import { Redis } from 'ioredis';

export { NotificationWorker };

if (require.main === module) {
  (async () => {
    try {
      console.log('[NotificationWorker] Starting unified notification worker...');
      
      // Load environment variables
      environmentLoader.load();
      
      // Create Express app
      const app = express();
      app.use(cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true
      }));
      app.use(express.json());

      // Health check endpoint
      app.get('/health', (req: any, res: any) => {
        res.json({
          status: 'healthy',
          service: 'notification-worker',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        });
      });

      // Create HTTP server
      const httpServer = createServer(app);
      
      // Create dedicated Redis connection for BullMQ to prevent connection pool exhaustion
      const redisUrl = process.env.REDIS_URL;
      let redisConnection: Redis;
      
      if (redisUrl) {
        redisConnection = new Redis(redisUrl, {
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
        const redisHost = process.env.REDIS_HOST || process.env.REDIS_HOST_DOCKER || 'localhost';
        const redisPort = parseInt(process.env.REDIS_PORT || process.env.REDIS_PORT_DOCKER || '6379');
        redisConnection = new Redis({
          host: redisHost,
          port: redisPort,
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

      console.log(`[NotificationWorker] Using dedicated Redis connection for BullMQ`);
      
      // Get DatabaseService singleton instance for other database operations
      const databaseService = DatabaseService.getInstance();

      // Create worker with HTTP server for Socket.IO
      const worker = new NotificationWorker(redisConnection, databaseService, httpServer);
      
      // Handle Redis connection events
      redisConnection.on('error', (error) => {
        console.error('[NotificationWorker] Redis connection error:', error);
      });

      redisConnection.on('connect', () => {
        console.log('[NotificationWorker] Redis connected successfully');
      });

      // Get port from environment
      const port = parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3002', 10);

      // Internal API to push quest updates from other services (API Gateway)
      app.post('/internal/quest/update', (req: any, res: any) => {
        try {
          const { executionId, data } = req.body || {};
          if (!executionId || !data) {
            return res.status(400).json({ success: false, error: 'executionId and data are required' });
          }
          worker.sendQuestUpdate(executionId, data);
          return res.json({ success: true });
        } catch (err: any) {
          console.error('[NotificationWorker] Internal quest update error:', err?.message || err);
          return res.status(500).json({ success: false, error: 'internal_error' });
        }
      });

      // Start HTTP server
      httpServer.listen(port, () => {
        console.log(`🚀 Notification Worker running on port ${port}`);
        console.log(`📡 Socket.IO server ready for connections`);
        console.log(`⚡ BullMQ worker ready for notification jobs`);
        console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
      });

      // Start the worker
      await worker.start();
      console.log('[NotificationWorker] Worker started successfully');

      // Graceful shutdown handling
      const gracefulShutdown = async (signal: string) => {
        console.log(`[NotificationWorker] Received ${signal}, shutting down gracefully...`);
        try {
          httpServer.close(async () => {
            await worker.stop();
            // Close dedicated Redis connection
            await redisConnection.quit();
            console.log('[NotificationWorker] Shutdown complete');
            process.exit(0);
          });
        } catch (error) {
          console.error('[NotificationWorker] Error during shutdown:', error);
          process.exit(1);
        }
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
    } catch (error) {
      console.error('[NotificationWorker] Failed to start:', error);
      process.exit(1);
    }
  })();
}