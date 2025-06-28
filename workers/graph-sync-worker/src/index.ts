/**
 * index.ts
 * Entry point for the graph-sync-worker
 */

import { GraphSyncWorker } from './GraphSyncWorker';

// Export the main worker class
export { GraphSyncWorker };

// Worker initialization placeholder
if (require.main === module) {
  console.log('Graph Sync Worker starting...');
  // Worker startup logic to be implemented
} 