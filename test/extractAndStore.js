require('dotenv').config();
const { extractEntitiesAndRelations } = require('../services/aiService');
const { mapToKnowledgeGraph, closeConnection } = require('../services/neo4jService');
const { v4: uuidv4 } = require('uuid');

/**
 * Test knowledge graph extraction and storage with a sample message
 */
async function testKnowledgeGraph() {
  try {
    // Sample message to process
    const message = "I feel inspired by the new project 2dots1line. We have a strong team with a group of high school friends. Learning AI through AI is a lot of fun. I am full of hope and energy.";
    
    console.log('Processing message:', message);
    
    // Generate a random user ID and interaction ID for testing
    const testUserId = 'test-user-' + uuidv4().substring(0, 8);
    const interactionId = 'interaction-' + uuidv4().substring(0, 8);
    
    console.log(`Test User ID: ${testUserId}`);
    console.log(`Interaction ID: ${interactionId}`);
    
    // Extract entities and relations using AI
    console.log('Extracting entities and relations...');
    const thoughts = await extractEntitiesAndRelations(message);
    
    console.log('\nExtracted thoughts:');
    console.log(JSON.stringify(thoughts, null, 2));
    
    // Map thoughts to knowledge graph
    console.log('\nMapping to knowledge graph...');
    const graphResult = await mapToKnowledgeGraph(testUserId, thoughts, interactionId);
    
    console.log('\nKnowledge graph creation result:');
    console.log(JSON.stringify(graphResult, null, 2));
    
    console.log('\nTest completed successfully!');
    
    // Close Neo4j connection
    await closeConnection();
  } catch (error) {
    console.error('Test failed:', error);
    // Ensure Neo4j connection is closed even if test fails
    await closeConnection();
    process.exit(1);
  }
}

// Run the test
testKnowledgeGraph(); 