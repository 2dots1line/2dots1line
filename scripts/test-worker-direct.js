const path = require('path');
const { DatabaseService } = require(path.join(__dirname, '..', 'packages', 'database', 'dist'));
const { GraphProjectionWorker } = require(path.join(__dirname, '..', 'workers', 'graph-projection-worker', 'dist'));

async function testWorkerDirect() {
  try {
    console.log('Testing GraphProjectionWorker.generateProjection directly...');
    
    const databaseService = DatabaseService.getInstance();
    const worker = new GraphProjectionWorker(databaseService);
    
    console.log('✅ Worker created');
    
    // Test projection generation directly
    console.log('Testing generateProjection...');
    const projection = await worker.generateProjection('dev-user-123');
    
    console.log('✅ Projection generated:', {
      userId: projection.userId,
      nodeCount: projection.nodes.length,
      edgeCount: projection.edges.length,
      statistics: projection.statistics
    });
    
    if (projection.nodes.length > 0) {
      console.log('Sample node:', projection.nodes[0]);
    }
    
    if (projection.edges.length > 0) {
      console.log('Sample edge:', projection.edges[0]);
    }
    
    // Test storing the projection
    console.log('Testing storeProjection...');
    await worker.storeProjection(projection);
    console.log('✅ Projection stored successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testWorkerDirect(); 