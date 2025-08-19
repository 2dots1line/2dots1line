/**
 * Card Worker Entry Point
 * V9.5 Production-Grade Worker for UI card creation
 */

import { ConfigService } from '@2dots1line/config-service';
import { DatabaseService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';

import { CardWorker } from './CardWorker';

async function main() {
  console.log('[CardWorker] Starting card worker...');

  // Load environment and print REDIS_URL
  environmentLoader.load();
  console.log('[CardWorker] Effective REDIS_URL:', process.env.REDIS_URL);

  try {
    // Initialize dependencies
    const configService = new ConfigService();
    await configService.initialize();
    console.log('[CardWorker] ConfigService initialized');

    const databaseService = DatabaseService.getInstance();
    console.log('[CardWorker] DatabaseService initialized');

    // Create and start the worker
    const cardWorker = new CardWorker(databaseService, configService);
    console.log('[CardWorker] CardWorker instance created and listening for jobs');
    console.log('[CardWorker] CardWorker queue name:', cardWorker['config']?.queueName);

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`[CardWorker] Received ${signal}, initiating graceful shutdown...`);
      try {
        await cardWorker.shutdown();
        console.log('[CardWorker] Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('[CardWorker] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Keep the process alive
    console.log('[CardWorker] Worker is running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('[CardWorker] Failed to start worker:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[CardWorker] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CardWorker] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('[CardWorker] Failed to start:', error);
  process.exit(1);
});
