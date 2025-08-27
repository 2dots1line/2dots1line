/**
 * Embedding Worker Entry Point
 * V9.7 Production-Grade Worker for semantic indexing
 */

import { DatabaseService } from '@2dots1line/database';

import { EmbeddingWorker } from './EmbeddingWorker';

async function main() {
  console.log('[EmbeddingWorker] Starting embedding worker...');

  try {
    // Initialize dependencies
    const databaseService = DatabaseService.getInstance();
    console.log('[EmbeddingWorker] DatabaseService initialized');

    // Verify required environment variables
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable is required for embedding generation');
    }

    if (!process.env.WEAVIATE_URL) {
      console.warn('[EmbeddingWorker] WEAVIATE_URL not set, using default: http://localhost:8080');
    }

    // Create and start the worker
    const embeddingWorker = new EmbeddingWorker(databaseService);
    console.log('[EmbeddingWorker] EmbeddingWorker instance created and listening for jobs');

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`[EmbeddingWorker] Received ${signal}, initiating graceful shutdown...`);
      try {
        await embeddingWorker.shutdown();
        console.log('[EmbeddingWorker] Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('[EmbeddingWorker] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Keep the process alive
    console.log('[EmbeddingWorker] Worker is running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('[EmbeddingWorker] Failed to start worker:', error);
    process.exit(1);
  }
}

// Export for testing
export { EmbeddingWorker };

// Start the worker if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('[EmbeddingWorker] Unhandled error:', error);
    process.exit(1);
  });
} 