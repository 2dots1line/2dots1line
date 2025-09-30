/**
 * V11.0 Spatial Query Worker Entry Point
 * PM2-compatible worker for processing spatial queries
 */

import { DatabaseService } from '@2dots1line/database';
import { SpatialQueryWorker } from './SpatialQueryWorker';

async function main() {
  console.log('[SpatialQueryWorker] Starting spatial query worker...');

  try {
    // Initialize dependencies
    const databaseService = DatabaseService.getInstance();
    console.log('[SpatialQueryWorker] DatabaseService initialized');

    // Verify required environment variables
    if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
      console.warn('[SpatialQueryWorker] REDIS_HOST not set, using default: localhost');
    }

    // Create and start the worker
    const spatialQueryWorker = new SpatialQueryWorker(databaseService);
    console.log('[SpatialQueryWorker] SpatialQueryWorker instance created and listening for jobs');

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`[SpatialQueryWorker] Received ${signal}, initiating graceful shutdown...`);
      try {
        await spatialQueryWorker.shutdown();
        console.log('[SpatialQueryWorker] Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('[SpatialQueryWorker] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Keep the process alive
    console.log('[SpatialQueryWorker] Worker is running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('[SpatialQueryWorker] Failed to start worker:', error);
    process.exit(1);
  }
}

// Export for testing
export { SpatialQueryWorker };

// Start the worker if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('[SpatialQueryWorker] Unhandled error:', error);
    process.exit(1);
  });
}
