/**
 * Video Generation Worker Entry Point
 * V11.0 Worker for asynchronous video generation
 */

import { VideoGenerationWorker, VideoJobData } from './VideoGenerationWorker';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';

// Export types for use by other services
export type { VideoJobData } from './VideoGenerationWorker';

async function main() {
  console.log('[VideoGenerationWorker] Starting video generation worker...');

  // Load environment and print REDIS_URL
  environmentLoader.load();
  console.log('[VideoGenerationWorker] Effective REDIS_URL:', process.env.REDIS_URL);

  try {
    // Create and start the worker
    const worker = new VideoGenerationWorker();
    console.log('[VideoGenerationWorker] Worker instance created and listening for jobs');

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`[VideoGenerationWorker] Received ${signal}, initiating graceful shutdown...`);
      try {
        await worker.shutdown();
        console.log('[VideoGenerationWorker] Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('[VideoGenerationWorker] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Keep the process alive
    console.log('[VideoGenerationWorker] Worker is running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('[VideoGenerationWorker] Failed to start worker:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[VideoGenerationWorker] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[VideoGenerationWorker] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('[VideoGenerationWorker] Failed to start:', error);
  process.exit(1);
});

