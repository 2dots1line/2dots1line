/**
 * Notification Worker Entry Point
 * V11.0 - EnvironmentLoader Integration
 */

import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Redis } from 'ioredis';
import { NotificationWorker } from './NotificationWorker';

export { NotificationWorker };

if (require.main === module) {
  console.log('Notification Worker starting...');
  
  try {
    // CRITICAL: Load environment variables first using EnvironmentLoader
    console.log('[NotificationWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[NotificationWorker] Environment variables loaded successfully');

    // Create Redis connection with EnvironmentLoader
    const redisConnection = new Redis({
      host: environmentLoader.get('REDIS_HOST') || 'localhost',
      port: parseInt(environmentLoader.get('REDIS_PORT') || '6379'),
      password: environmentLoader.get('REDIS_PASSWORD'),
      db: parseInt(environmentLoader.get('REDIS_DB') || '0'),
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    console.log(`[NotificationWorker] Redis connection configured: ${environmentLoader.get('REDIS_HOST') || 'localhost'}:${environmentLoader.get('REDIS_PORT') || '6379'}`);

    const worker = new NotificationWorker(redisConnection);
    
    // Handle Redis connection events
    redisConnection.on('error', (error) => {
      console.error('[NotificationWorker] Redis connection error:', error);
    });

    redisConnection.on('connect', () => {
      console.log('[NotificationWorker] Connected to Redis');
    });

    redisConnection.on('ready', () => {
      console.log('[NotificationWorker] Redis connection ready');
    });

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      await worker.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      await worker.stop();
      process.exit(0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('[NotificationWorker] Uncaught exception:', error);
      await worker.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('[NotificationWorker] Unhandled rejection at:', promise, 'reason:', reason);
      await worker.stop();
      process.exit(1);
    });

    // Start the worker
    worker.start().catch(error => {
      console.error('Failed to start NotificationWorker:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('[NotificationWorker] Failed to initialize:', error);
    process.exit(1);
  }
} 