import { NotificationWorker } from './NotificationWorker';
import { Redis } from 'ioredis';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { DatabaseService } from '@2dots1line/database';

export { NotificationWorker };

if (require.main === module) {
  (async () => {
    try {
      console.log('[NotificationWorker] Starting notification worker...');
      
      // Load environment variables
      environmentLoader.load();
      
      // Create Redis connection for BullMQ
      const redisConnection = new Redis({
        host: environmentLoader.get('REDIS_HOST') || 'localhost',
        port: parseInt(environmentLoader.get('REDIS_PORT') || '6379'),
        enableReadyCheck: false,
        lazyConnect: true,
      });

      console.log(`[NotificationWorker] Redis connection configured: ${environmentLoader.get('REDIS_HOST') || 'localhost'}:${environmentLoader.get('REDIS_PORT') || '6379'}`);

      // Get DatabaseService singleton instance
      const databaseService = DatabaseService.getInstance();

      // Create worker with both required parameters
      const worker = new NotificationWorker(redisConnection, databaseService);
      
      // Handle Redis connection events
      redisConnection.on('error', (error) => {
        console.error('[NotificationWorker] Redis connection error:', error);
      });

      redisConnection.on('connect', () => {
        console.log('[NotificationWorker] Redis connected successfully');
      });

      // Start the worker
      await worker.start();
      console.log('[NotificationWorker] Worker started successfully');

      // Graceful shutdown handling
      const gracefulShutdown = async (signal: string) => {
        console.log(`[NotificationWorker] Received ${signal}, shutting down gracefully...`);
        try {
          await worker.stop();
          await redisConnection.quit();
          console.log('[NotificationWorker] Shutdown complete');
          process.exit(0);
        } catch (error) {
          console.error('[NotificationWorker] Error during shutdown:', error);
          process.exit(1);
        }
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
    } catch (error) {
      console.error('[NotificationWorker] Failed to start worker:', error);
      process.exit(1);
    }
  })();
}