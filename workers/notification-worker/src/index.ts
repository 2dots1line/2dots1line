// index.ts - Entry point for the notification-worker

import { Redis } from 'ioredis';

import { NotificationWorker } from './NotificationWorker';

export { NotificationWorker };

if (require.main === module) {
  console.log('Notification Worker starting...');
  
  // Create Redis connection
  const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    lazyConnect: true
  });

  const worker = new NotificationWorker(redisConnection);
  
  // Handle Redis connection errors
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
} 