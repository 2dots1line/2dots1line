/**
 * index.ts
 * Entry point for the maintenance-worker
 */

import { MaintenanceWorker } from './MaintenanceWorker';

// Set process title for proper PM2 identification
process.title = 'maintenance-worker';

// Export the main worker class
export { MaintenanceWorker };

// Worker initialization
if (require.main === module) {
  console.log('Maintenance Worker starting...');
  
  const worker = new MaintenanceWorker();
  
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
  
  // Start the worker
  worker.start().catch(error => {
    console.error('Failed to start MaintenanceWorker:', error);
    process.exit(1);
  });
} 