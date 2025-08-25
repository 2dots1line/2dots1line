const { MaintenanceWorker } = require('./workers/maintenance-worker/dist/index.js');

async function testMaintenanceTasks() {
  console.log('🧪 Testing Maintenance Worker Tasks 1 & 2...\n');
  
  try {
    // Create maintenance worker instance
    const maintenanceWorker = new MaintenanceWorker();
    
    console.log('📋 Task 1: Redis Cleanup Test');
    console.log('=' .repeat(50));
    
    // Trigger Redis cleanup task
    const startTime1 = Date.now();
    await maintenanceWorker.triggerRedisCleanup();
    const endTime1 = Date.now();
    const duration1 = endTime1 - startTime1;
    
    console.log(`\n⏱️  Redis Cleanup completed in ${duration1}ms`);
    console.log('=' .repeat(50));
    
    console.log('\n📋 Task 2: Data Integrity Check Test');
    console.log('=' .repeat(50));
    
    // Trigger data integrity check task
    const startTime2 = Date.now();
    await maintenanceWorker.triggerDataIntegrityCheck();
    const endTime2 = Date.now();
    const duration2 = endTime2 - startTime2;
    
    console.log(`\n⏱️  Data Integrity Check completed in ${duration2}ms`);
    console.log('=' .repeat(50));
    
    console.log('\n✅ All maintenance tasks completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during maintenance task testing:', error);
  }
}

// Run the test
testMaintenanceTasks();

