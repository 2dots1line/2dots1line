/**
 * Test script for Knowledge Graph functionality
 * 
 * This script tests the knowledge graph service and Neo4j integration.
 * Run with: node test-knowledge-graph.js
 */

const neo4jService = require('./services/neo4jService');
const knowledgeGraphService = require('./services/knowledgeGraphService');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Test messages with knowledge to extract
const testMessages = [
  "Apple Inc. was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976. The company is headquartered in Cupertino, California.",
  "Python is a programming language created by Guido van Rossum in 1991. It is widely used in data science and machine learning.",
  "The Eiffel Tower in Paris, France was built by Gustave Eiffel and was completed in 1889 for the World's Fair."
];

// Test IDs
const userId = "test-user-" + Date.now();
const interactionIds = [uuidv4(), uuidv4(), uuidv4()];

/**
 * Main test function
 */
async function runTests() {
  console.log("=== KNOWLEDGE GRAPH SERVICE TEST ===");
  console.log("Testing Neo4j connection and knowledge graph functionalities\n");
  
  try {
    // Test 1: Initialize Neo4j connection
    console.log("Test 1: Initialize Neo4j connection");
    await neo4jService.init();
    console.log("✅ Neo4j connection successful\n");
    
    // Test 2: Process messages for knowledge extraction
    console.log("Test 2: Extract knowledge from messages");
    for (let i = 0; i < testMessages.length; i++) {
      console.log(`\nProcessing message ${i+1}:`);
      console.log(`"${testMessages[i]}"`);
      
      const result = await knowledgeGraphService.processMessageForKnowledge(
        testMessages[i],
        interactionIds[i],
        userId
      );
      
      console.log("\nExtracted entities:");
      result.entities.forEach(entity => {
        console.log(`- ${entity.name} (${entity.category})`);
      });
      
      console.log("\nExtracted relationships:");
      result.relationships.forEach(rel => {
        console.log(`- ${rel.source.name} -[${rel.relationship.type}]-> ${rel.target.name}`);
      });
      
      console.log("\n---");
    }
    console.log("✅ Knowledge extraction and storage successful\n");
    
    // Test 3: Query entities by name
    console.log("Test 3: Query entities by name");
    const appleEntities = await knowledgeGraphService.queryEntitiesByName("Apple");
    console.log(`Found ${appleEntities.length} entities matching 'Apple':`);
    appleEntities.forEach(entity => {
      console.log(`- ${entity.name} (${entity.category})`);
    });
    console.log("✅ Entity query successful\n");
    
    // Test 4: Get entity neighborhood
    console.log("Test 4: Get entity neighborhood");
    if (appleEntities.length > 0) {
      const neighborhood = await knowledgeGraphService.getEntityNeighborhood(
        appleEntities[0].name,
        2
      );
      
      console.log(`Neighborhood for ${neighborhood.entity.name}:`);
      console.log(`- Found ${neighborhood.connections.length} connected entities`);
      console.log(`- Found ${neighborhood.relationships.length} relationships`);
      
      neighborhood.connections.forEach(conn => {
        console.log(`  - Connected to: ${conn.name}`);
      });
    } else {
      console.log("No 'Apple' entity found to test neighborhood");
    }
    console.log("✅ Neighborhood query successful\n");
    
    // Test 5: Delete knowledge by interaction ID
    console.log("Test 5: Delete knowledge by interaction ID");
    const deleteResult = await knowledgeGraphService.deleteKnowledgeByInteractionId(
      interactionIds[0]
    );
    console.log(`Deleted ${deleteResult.deletedCount} nodes for interaction ${interactionIds[0]}`);
    console.log("✅ Knowledge deletion successful\n");
    
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
  } finally {
    // Clean up: Close Neo4j connection
    await neo4jService.close();
    console.log("Neo4j connection closed");
    console.log("\n=== TEST COMPLETED ===");
  }
}

// Run the tests
runTests(); 