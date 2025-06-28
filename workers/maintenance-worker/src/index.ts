/**
 * index.ts
 * Entry point for the maintenance-worker
 */

import { MaintenanceWorker } from './MaintenanceWorker';

// Export the main worker class
export { MaintenanceWorker };

// Worker initialization placeholder
if (require.main === module) {
  console.log('Maintenance Worker starting...');
  // Worker startup logic to be implemented
} 