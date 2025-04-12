/**
 * Test Script: Thought Extraction and Knowledge Graph Mapping
 * 
 * This script simulates sending a message to Dot (the AI chatbot)
 * and demonstrates how the Knowledge Graph Agent processes it.
 */

const dotenv = require('dotenv');
dotenv.config(); // Load .env file

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import required services
const aiService = require('./src/ai/ai.service');
const analysisService = require('./src/ai/analysis.service');
const neo4jService = require('./src/graph/neo4j.service');
const graphMappingService = require('./src/graph/graph-mapping.service');

// Test message from a user to Dot
const userMessage = `I feel inspired by the new project 2dots1line. We have a strong team with a group of high school friends. Learning AI through AI is a lot of fun. I am full of hope and energy`;

// Mock user ID for testing
const TEST_USER_ID = 'test-user-123';

/**
 * Simulates storing a user message as an interaction
 */
async function createMockInteraction(userId, message) {
  console.log('\n1️⃣ Creating mock user interaction in database...');
  
  // Create a mock interaction record
  const interaction = await prisma.interaction.create({
    data: {
      user_id: userId,
      session_id: 'test-session-' + Date.now(),
      interaction_type: 'user_message',
      raw_data: JSON.stringify({ message }),
      processed_flag: false,
      processing_notes: 'Created by test script'
    }
  });
  
  console.log(`✅ Created interaction with ID: ${interaction.interaction_id}`);
  return interaction;
}

/**
 * Run the complete test flow
 */
async function runTest() {
  try {
    console.log('\n🔬 TESTING KNOWLEDGE GRAPH AGENT 🔬');
    console.log('=====================================');
    console.log('Sample user message:');
    console.log(`"${userMessage}"`);
    console.log('=====================================\n');
    
    // Initialize Neo4j connection
    neo4jService.initDriver();
    
    // Step 1: Create a mock interaction
    const interaction = await createMockInteraction(TEST_USER_ID, userMessage);
    
    // Step 2: Directly analyze the message using AI service
    console.log('\n2️⃣ Extracting thoughts directly using AI service...');
    const thoughtAnalysis = await aiService.extractThoughts(userMessage);
    
    console.log(`✅ Extracted ${thoughtAnalysis.length} potential thoughts:`);
    thoughtAnalysis.forEach((thought, i) => {
      console.log(`\nThought ${i+1}: "${thought.thoughtContent}"`);
      if (!thought.isSubstantive) {
        console.log('(Not substantive enough for knowledge graph)');
        return;
      }
      
      console.log(`Subject: ${thought.subjectType} (${thought.subjectName || 'unnamed'})`);
      console.log(`Entities: ${thought.nodes.map(n => `${n.label}:${n.properties.name}`).join(', ')}`);
      console.log(`Relationships: ${thought.relationships.map(r => 
        `${r.source.properties.name} -[${r.type}]-> ${r.target.properties.name}`).join(', ')}`);
    });
    
    // Step 3: Process the interaction through the analysis service
    console.log('\n3️⃣ Running full analysis service pipeline...');
    const analysisResult = await analysisService.analyzeInteraction(interaction.interaction_id);
    
    console.log('✅ Analysis service results:');
    console.log(`- Success: ${analysisResult.success}`);
    
    if (analysisResult.needsClarification) {
      console.log('⚠️ Analysis requires clarification from user:');
      analysisResult.clarificationItems.forEach((item, i) => {
        console.log(`Question ${i+1}: ${item.clarificationQuestion}`);
      });
    } else {
      console.log(`- Created ${analysisResult.thoughts?.length || 0} thoughts in database`);
      console.log(`- Updated knowledge graph with ${analysisResult.graphResults.successful} entities/relationships`);
    }
    
    // Step 4: Retrieve the user's knowledge graph
    console.log('\n4️⃣ Retrieving knowledge graph data...');
    const userGraph = await graphMappingService.getUserKnowledgeGraph(TEST_USER_ID);
    
    console.log(`✅ Retrieved graph with ${userGraph.nodes.length} nodes and ${userGraph.relationships.length} relationships`);
    
    // Display nodes by type
    const nodesByType = {};
    userGraph.nodes.forEach(node => {
      const type = node.labels[0];
      nodesByType[type] = nodesByType[type] || [];
      nodesByType[type].push(node.properties.name);
    });
    
    console.log('\nGraph Contents:');
    Object.entries(nodesByType).forEach(([type, names]) => {
      console.log(`${type} nodes (${names.length}): ${names.join(', ')}`);
    });
    
    // Display relationships
    console.log('\nRelationships:');
    userGraph.relationships.forEach(rel => {
      const sourceNode = userGraph.nodes.find(n => n.id === rel.source);
      const targetNode = userGraph.nodes.find(n => n.id === rel.target);
      if (sourceNode && targetNode) {
        console.log(`- ${sourceNode.properties.name} -[${rel.type}]-> ${targetNode.properties.name}`);
      }
    });
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY ✅');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
  } finally {
    // Clean up
    await neo4jService.closeDriver();
    await prisma.$disconnect();
    console.log('\nTest resources cleaned up');
  }
}

// Run the test
runTest()
  .then(() => {
    console.log('\nTest script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test script failed:', err);
    process.exit(1);
  }); 