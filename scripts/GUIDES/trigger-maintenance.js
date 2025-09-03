#!/usr/bin/env node

/**
 * Manual Maintenance Worker Trigger Script
 * 
 * This script allows you to manually trigger maintenance tasks without
 * waiting for the scheduled 2 AM run.
 * 
 * Usage:
 *   node workers/maintenance-worker/trigger-maintenance.js [task]
 * 
 * Examples:
 *   node workers/maintenance-worker/trigger-maintenance.js
 *   node workers/maintenance-worker/trigger-maintenance.js integrity-check
 *   node workers/maintenance-worker/trigger-maintenance.js redis-cleanup
 *   node workers/maintenance-worker/trigger-maintenance.js db-optimization
 */

const { DatabaseService } = require('../../packages/database/dist/DatabaseService');

async function triggerMaintenance() {
  // Get task type from command line arguments
  const taskType = process.argv[2] || 'integrity-check';
  
  console.log('🚀 Manual Maintenance Worker Trigger');
  console.log('====================================');
  console.log(`🔧 Task Type: ${taskType}`);
  console.log('');

  // Validate task type
  const validTasks = ['integrity-check', 'redis-cleanup', 'db-optimization', 'full-maintenance', 'auto-fix'];
  if (!validTasks.includes(taskType)) {
    console.error('❌ Error: Invalid task type');
    console.log('');
    console.log('Valid task types:');
    validTasks.forEach(task => console.log(`  - ${task}`));
    console.log('');
    console.log('Usage: node scripts/GUIDES/trigger-maintenance.js [task]');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to databases...');
    
    // Get database service instance (this will load environment variables)
    const dbService = DatabaseService.getInstance();
    
    console.log('✅ Database connections established');
    console.log('');

    // Create a simple maintenance worker instance
                const MaintenanceWorker = require('../../workers/maintenance-worker/dist/MaintenanceWorker').MaintenanceWorker;
    const worker = new MaintenanceWorker();
    
    console.log('🔧 Initializing maintenance worker...');
    await worker.initialize();
    
    console.log('🚀 Executing maintenance task...');
    console.log('');

    // Execute the requested task
    switch (taskType) {
      case 'integrity-check':
        console.log('🔍 Running data integrity check...');
        await worker.triggerDataIntegrityCheck();
        break;
        
      case 'redis-cleanup':
        console.log('🧹 Running Redis cleanup...');
        await worker.triggerRedisCleanup();
        break;
        
      case 'db-optimization':
        console.log('⚡ Running database optimization...');
        await worker.triggerDatabaseOptimization();
        break;
        
                  case 'full-maintenance':
              console.log('🔄 Running full maintenance cycle...');
              await worker.runMaintenanceCycle();
              break;

            case 'auto-fix':
              console.log('🔧 Running auto-fix for data discrepancies...');
              await worker.triggerAutoFix();
              break;
    }

    console.log('');
    console.log('✅ Maintenance task completed successfully!');
    console.log('');

    // Close database connections
    await dbService.closeConnections();
    console.log('🔌 Database connections closed');

  } catch (error) {
    console.error('❌ Error during maintenance task:', error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure all database services are running:');
    console.log('   docker ps | grep -E "(postgres|neo4j|weaviate|redis)"');
    console.log('');
    console.log('2. Check environment variables are set correctly');
    console.log('3. Verify database credentials and network access');
    console.log('');
    console.log('4. Check maintenance worker logs:');
    console.log('   pm2 logs maintenance-worker --lines 50');
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the maintenance task
triggerMaintenance();
