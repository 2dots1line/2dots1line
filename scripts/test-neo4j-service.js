/**
 * Test script to verify Neo4jService is correctly fetching all node types
 */

import { DatabaseService } from '@2dots1line/database';
import { Neo4jService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';

async function testNeo4jService() {
  console.log('[TestScript] Testing Neo4jService...');
  
  try {
    // Load environment
    environmentLoader.load();
    
    // Initialize database service
    const dbService = DatabaseService.getInstance();
    const neo4jService = new Neo4jService(dbService);
    
    const userId = 'dev-user-123';
    
    console.log('[TestScript] Fetching graph structure...');
    const graphStructure = await neo4jService.fetchFullGraphStructure(userId);
    
    console.log(`[TestScript] ✅ Fetched ${graphStructure.nodes.length} nodes and ${graphStructure.edges.length} edges`);
    
    // Group nodes by type
    const nodeTypes = {};
    graphStructure.nodes.forEach(node => {
      const labels = node.labels.join(', ');
      if (!nodeTypes[labels]) {
        nodeTypes[labels] = [];
      }
      nodeTypes[labels].push({
        id: node.id,
        title: node.properties.title || node.properties.name || 'Untitled',
        labels: node.labels
      });
    });
    
    console.log('\n[TestScript] Node types found:');
    Object.entries(nodeTypes).forEach(([labels, nodes]) => {
      console.log(`  ${labels}: ${nodes.length} nodes`);
      nodes.slice(0, 3).forEach(node => {
        console.log(`    - ${node.id}: ${node.title}`);
      });
      if (nodes.length > 3) {
        console.log(`    ... and ${nodes.length - 3} more`);
      }
    });
    
    console.log('\n[TestScript] ✅ Neo4jService test completed successfully!');
    
  } catch (error) {
    console.error('[TestScript] ❌ Error testing Neo4jService:', error);
    throw error;
  }
}

// Run the test
testNeo4jService().catch(console.error); 