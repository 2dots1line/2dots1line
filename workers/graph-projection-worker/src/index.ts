/**
 * Graph Projection Worker Entry Point
 * V9.5 Production-Grade Worker for 3D Knowledge Cosmos
 */

import { DatabaseService } from '@2dots1line/database';

import { GraphProjectionWorker } from './GraphProjectionWorker';

async function main() {
  console.log('[GraphProjectionWorker] Starting graph projection worker...');

  try {
    // Initialize dependencies
    const databaseService = DatabaseService.getInstance();
    console.log('[GraphProjectionWorker] DatabaseService initialized');

    // Verify required environment variables
    if (!process.env.NEO4J_URI) {
      throw new Error('NEO4J_URI environment variable is required');
    }

    if (!process.env.WEAVIATE_URL) {
      console.warn('[GraphProjectionWorker] WEAVIATE_URL not set, using default: http://localhost:8080');
    }

    const dimensionReducerUrl = process.env.DIMENSION_REDUCER_URL || 'http://localhost:8000';
    console.log(`[GraphProjectionWorker] Using dimension reducer at: ${dimensionReducerUrl}`);

    // Create and start the worker
    const graphProjectionWorker = new GraphProjectionWorker(databaseService);
    console.log('[GraphProjectionWorker] GraphProjectionWorker instance created and listening for jobs');

    // Test dimension reducer service on startup
    const dimensionReducerTest = await graphProjectionWorker.testDimensionReducer();
    if (dimensionReducerTest) {
      console.log('[GraphProjectionWorker] ✅ Dimension reducer service test passed');
    } else {
      console.warn('[GraphProjectionWorker] ⚠️  Dimension reducer service test failed - worker will still start but projections may use fallback coordinates');
    }

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`[GraphProjectionWorker] Received ${signal}, initiating graceful shutdown...`);
      try {
        await graphProjectionWorker.shutdown();
        console.log('[GraphProjectionWorker] Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('[GraphProjectionWorker] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Keep the process alive
    console.log('[GraphProjectionWorker] Worker is running. Press Ctrl+C to stop.');

    // Log stats periodically
    setInterval(() => {
      const stats = graphProjectionWorker.getStats();
      console.log(`[GraphProjectionWorker] Stats - Running: ${stats.isRunning}, Processed: ${stats.processed}, Failed: ${stats.failed}`);
    }, 300000); // Every 5 minutes (projections are expensive)

  } catch (error) {
    console.error('[GraphProjectionWorker] Failed to start worker:', error);
    process.exit(1);
  }
}

// Export for testing
export { GraphProjectionWorker };

// Start the worker if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('[GraphProjectionWorker] Unhandled error:', error);
    process.exit(1);
  });
}
