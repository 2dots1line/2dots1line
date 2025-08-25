/**
 * Test script to manually trigger maintenance worker tasks
 * This script tests each of the four main maintenance tasks
 */

const { MaintenanceWorker } = require('./workers/maintenance-worker/dist/index.js');

async function testMaintenanceWorker() {
  console.log('🧪 Testing Maintenance Worker Tasks...\n');
  
  try {
    // Create maintenance worker instance
    const worker = new MaintenanceWorker();
    
    // Wait for initialization
    console.log('⏳ Initializing maintenance worker...');
    await worker.initialize();
    console.log('✅ Maintenance worker initialized\n');
    
    // Test 1: Redis Cleanup Task
    console.log('🔧 TEST 1: Redis Cleanup Task');
    console.log('Expected: Scan for stale Redis keys and clean them up');
    await worker.triggerRedisCleanup();
    console.log('✅ Redis cleanup task completed\n');
    
    // Test 2: Data Integrity Check Task
    console.log('🔧 TEST 2: Data Integrity Check Task');
    console.log('Expected: Cross-check PostgreSQL, Neo4j, and Weaviate consistency');
    await worker.triggerDataIntegrityCheck();
    console.log('✅ Data integrity check task completed\n');
    
    // Test 3: Database Optimization Task
    console.log('🔧 TEST 3: Database Optimization Task');
    console.log('Expected: Run VACUUM ANALYZE on high-traffic tables');
    await worker.triggerDatabaseOptimization();
    console.log('✅ Database optimization task completed\n');
    
    // Test 4: Data Archiving Task
    console.log('🔧 TEST 4: Data Archiving Task');
    console.log('Expected: Archive old conversations older than 730 days');
    await worker.triggerDataArchiving();
    console.log('✅ Data archiving task completed\n');
    
    // Test 5: Expired Session Cleanup
    console.log('🔧 TEST 5: Expired Session Cleanup');
    console.log('Expected: Delete expired user sessions');
    await worker.triggerExpiredSessionCleanup();
    console.log('✅ Expired session cleanup task completed\n');
    
    console.log('🎉 All maintenance worker tasks tested successfully!');
    
    // Gracefully shutdown
    await worker.stop();
    
  } catch (error) {
    console.error('❌ Error testing maintenance worker:', error);
    process.exit(1);
  }
}

// Run the test
testMaintenanceWorker();

