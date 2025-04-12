require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { extractEntitiesAndRelations } = require('../services/aiService');
const { createGraphFromThoughts } = require('../services/graphMappingService');
const { initializeNeo4jDriver, closeNeo4jDriver, saveUserKnowledgeGraph } = require('../services/neo4jService');

const prisma = new PrismaClient();

// Test user message
const TEST_MESSAGE = "I feel inspired by the new project 2dots1line. We have a strong team with a group of high school friends. Learning AI through AI is a lot of fun. I am full of hope and energy.";
const TEST_USER_ID = 'test-user-123';

/**
 * Creates a mock user interaction in the database
 */
async function createMockInteraction() {
  try {
    const user = await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    console.log('Created test user:', user.id);

    const interaction = await prisma.interaction.create({
      data: {
        type: 'USER_MESSAGE',
        content: TEST_MESSAGE,
        userId: TEST_USER_ID,
      },
    });

    console.log('Created test interaction:', interaction.id);
    return interaction;
  } catch (error) {
    console.error('Error creating mock interaction:', error);
    throw error;
  }
}

/**
 * Extracts thoughts from the user message
 */
async function extractThoughts(message) {
  console.log('\n==== EXTRACTING THOUGHTS ====');
  console.log('Input message:', message);
  
  try {
    const result = await extractEntitiesAndRelations(message);
    console.log('\nExtracted entities and relations:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error extracting thoughts:', error);
    throw error;
  }
}

/**
 * Maps thoughts to Neo4j graph
 */
async function mapToGraph(userId, thoughts) {
  console.log('\n==== MAPPING TO KNOWLEDGE GRAPH ====');
  
  try {
    await initializeNeo4jDriver();
    
    // Create graph from thoughts
    const graphData = await createGraphFromThoughts(thoughts);
    console.log('\nGraph mapping data:');
    console.log(JSON.stringify(graphData, null, 2));
    
    // Save to Neo4j
    await saveUserKnowledgeGraph(userId, graphData);
    console.log('\nSuccessfully saved to Neo4j database');
    
    await closeNeo4jDriver();
    return graphData;
  } catch (error) {
    console.error('Error mapping to graph:', error);
    await closeNeo4jDriver();
    throw error;
  }
}

/**
 * Run the complete test
 */
async function runTest() {
  console.log('===========================================');
  console.log('KNOWLEDGE GRAPH EXTRACTION TEST');
  console.log('===========================================\n');
  
  try {
    // Step 1: Create mock interaction
    const interaction = await createMockInteraction();
    
    // Step 2: Extract thoughts using AI
    const thoughts = await extractThoughts(TEST_MESSAGE);
    
    // Step 3: Save extracted thoughts
    await prisma.thought.createMany({
      data: thoughts.map(thought => ({
        content: thought.content,
        type: thought.type,
        userId: TEST_USER_ID,
        interactionId: interaction.id,
      }))
    });
    console.log('\nSaved', thoughts.length, 'thoughts to database');
    
    // Step 4: Map to knowledge graph
    const graphData = await mapToGraph(TEST_USER_ID, thoughts);
    
    console.log('\n===========================================');
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('===========================================');
    
    return { success: true, thoughts, graphData };
  } catch (error) {
    console.error('\nTest failed:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Execute test if this file is run directly
if (require.main === module) {
  runTest()
    .then(result => {
      if (result.success) {
        console.log('Knowledge graph extraction test completed successfully.');
      } else {
        console.error('Knowledge graph extraction test failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error during test:', error);
      process.exit(1);
    });
}

module.exports = { runTest }; 