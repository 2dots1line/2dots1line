const path = require('path');
const { DatabaseService } = require(path.join(__dirname, '..', 'packages', 'database', 'dist'));
const { Neo4jService } = require(path.join(__dirname, '..', 'packages', 'database', 'dist'));

async function testNeo4jService() {
  try {
    console.log('Testing Neo4jService...');
    
    const databaseService = DatabaseService.getInstance();
    const neo4jService = new Neo4jService(databaseService);
    
    console.log('✅ Neo4jService created');
    
    // Test fetching graph structure
    console.log('Testing fetchFullGraphStructure...');
    const graphStructure = await neo4jService.fetchFullGraphStructure('dev-user-123');
    
    console.log('✅ Graph structure fetched:', {
      nodeCount: graphStructure.nodes.length,
      edgeCount: graphStructure.edges.length
    });
    
    if (graphStructure.nodes.length > 0) {
      console.log('Sample node:', graphStructure.nodes[0]);
    }
    
    if (graphStructure.edges.length > 0) {
      console.log('Sample edge:', graphStructure.edges[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testNeo4jService(); 