const { DatabaseService } = require('@2dots1line/database');

async function testNeo4j() {
  try {
    const databaseService = DatabaseService.getInstance();
    const neo4jService = new (require('@2dots1line/database').Neo4jService)(databaseService);
    
    console.log('Testing Neo4jService...');
    
    const graphStructure = await neo4jService.fetchFullGraphStructure('dev-user-123');
    
    console.log(`Nodes: ${graphStructure.nodes.length}`);
    console.log(`Edges: ${graphStructure.edges.length}`);
    
    if (graphStructure.edges.length > 0) {
      console.log('First edge:', graphStructure.edges[0]);
    }
    
    if (graphStructure.nodes.length > 0) {
      console.log('First node:', graphStructure.nodes[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testNeo4j(); 