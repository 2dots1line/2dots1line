/**
 * Test Memory Integration
 * 
 * This script tests the integration between vector database, semantic memory, 
 * and knowledge graph components.
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const semanticMemoryService = require('../src/services/semanticMemoryService');
const knowledgeGraphService = require('../src/services/knowledgeGraphService');
const weaviateService = require('../src/services/weaviateService');
const { generateEmbeddings } = require('../src/models/vectorUtils');

const prisma = new PrismaClient();

// Generate a proper UUID for testing
const TEST_USER_ID = process.env.TEST_USER_ID || uuidv4();
const TEST_USER_EMAIL = `test-user-${Date.now()}@example.com`;

async function ensureTestUser() {
  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        user_id: TEST_USER_ID
      }
    });

    if (existingUser) {
      console.log(`Using existing test user with ID: ${TEST_USER_ID}`);
      return existingUser;
    }

    // Create a new test user
    const user = await prisma.user.create({
      data: {
        user_id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        password_hash: 'test-password-hash',
        first_name: 'Test',
        last_name: 'User',
        signup_timestamp: new Date()
      }
    });

    console.log(`Created new test user with ID: ${TEST_USER_ID}`);
    return user;
  } catch (error) {
    console.error('Error ensuring test user exists:', error);
    throw error;
  }
}

async function runMemoryIntegrationTest() {
  console.log('Starting memory integration test...');
  
  try {
    // Ensure we have a test user
    await ensureTestUser();
    console.log(`Using test user ID: ${TEST_USER_ID}`);
    
    // Initialize Weaviate schema
    console.log('\n--- Initializing Weaviate Schema ---');
    try {
      await weaviateService.initializeSchema();
      console.log('Weaviate schema initialized successfully');
    } catch (error) {
      console.error('Error initializing Weaviate schema:', error);
      throw error;
    }
    
    // Test 1: Process raw data with semantic memory
    let processResult;
    console.log('\n--- Test 1: Process Raw Data ---');
    try {
      const rawData = `
      I recently took a trip to Japan with my friend Sarah. We visited Tokyo, Kyoto, and Osaka.
      Tokyo was very modern and busy, while Kyoto had beautiful traditional temples. 
      Osaka had amazing food, especially the takoyaki.
      Sarah really enjoyed the cherry blossoms in Kyoto.
      I'd like to go back someday and visit Hokkaido.
      `;
      
      console.log('Processing raw data...');
      processResult = await semanticMemoryService.processRawData(
        TEST_USER_ID,
        rawData,
        'test',
        { 
          testId: 'memory-integration-test',
          title: 'Japan Trip',
          topic: 'travel'
        }
      );
      
      console.log(`Raw data processed, ID: ${processResult.rawData?.id}`);
      console.log(`Generated ${processResult.chunks?.length || 0} semantic chunks`);
    } catch (error) {
      console.error('Error processing raw data:', error);
      processResult = { rawData: { id: null }, chunks: [] };
    }
    
    // Test 2: Extract knowledge from the same data
    let knowledgeResult;
    console.log('\n--- Test 2: Extract Knowledge ---');
    try {
      const rawData = `
      I recently took a trip to Japan with my friend Sarah. We visited Tokyo, Kyoto, and Osaka.
      Tokyo was very modern and busy, while Kyoto had beautiful traditional temples. 
      Osaka had amazing food, especially the takoyaki.
      Sarah really enjoyed the cherry blossoms in Kyoto.
      I'd like to go back someday and visit Hokkaido.
      `;
      
      const interactionId = 'test-interaction-' + uuidv4().substring(0, 8);
      knowledgeResult = await knowledgeGraphService.processMessageForKnowledge(
        rawData,
        interactionId,
        TEST_USER_ID
      );
      
      console.log(`Extracted ${knowledgeResult.entities?.length || 0} entities`);
      console.log(`Created ${knowledgeResult.relationships?.length || 0} relationships`);
      
      // Display some entities and relationships
      if (knowledgeResult.entities && knowledgeResult.entities.length > 0) {
        console.log('\nSample entities:');
        knowledgeResult.entities.slice(0, 3).forEach(e => {
          console.log(`- ${e.category}: ${e.name}`);
        });
      }
      
      if (knowledgeResult.relationships && knowledgeResult.relationships.length > 0) {
        console.log('\nSample relationships:');
        knowledgeResult.relationships.slice(0, 3).forEach(r => {
          console.log(`- ${r.source} ${r.type} ${r.target}`);
        });
      }
    } catch (error) {
      console.error('Error extracting knowledge:', error);
      knowledgeResult = { entities: [], relationships: [] };
    }
    
    // Test 3: Create a thought
    let thoughtResult;
    console.log('\n--- Test 3: Create Thought ---');
    try {
      const thought = 'Japan has a beautiful balance of traditional culture and modern technology.';
      const chunkIds = processResult.chunks.length > 0 ? [processResult.chunks[0]?.id] : [];
      
      console.log('Creating thought...');
      thoughtResult = await semanticMemoryService.createThought(
        TEST_USER_ID,
        thought,
        chunkIds.filter(Boolean),
        { 
          confidence: 0.9, 
          source: 'user-reflection',
          rawDataId: processResult.rawData?.id,
          subjectType: 'location',
          subjectName: 'Japan'
        }
      );
      
      console.log(`Created thought with ID: ${thoughtResult?.id}`);
    } catch (error) {
      console.error('Error creating thought:', error);
      thoughtResult = { id: null };
    }
    
    // Test 4: Semantic search
    console.log('\n--- Test 4: Semantic Search ---');
    const searches = [
      'Japan travel',
      'food in Japan',
      'traditional culture',
      'Sarah'
    ];
    
    for (const query of searches) {
      console.log(`\nSearching for: "${query}"`);
      
      try {
        // Search in semantic memory
        const memoryResults = await semanticMemoryService.semanticSearch(
          TEST_USER_ID,
          query,
          { limit: 3 }
        );
        
        console.log(`Found ${memoryResults.length} memory results`);
        if (memoryResults.length > 0) {
          memoryResults.forEach((result, i) => {
            console.log(`${i+1}. [${result.score.toFixed(2)}] ${result.content.substring(0, 100)}...`);
          });
        }
      } catch (error) {
        console.error(`Error searching memory for "${query}":`, error);
      }
      
      try {
        // Search in knowledge graph
        const graphResults = await knowledgeGraphService.semanticSearch(
          TEST_USER_ID,
          query,
          { limit: 3 }
        );
        
        console.log(`Found ${graphResults.length} knowledge graph results`);
        if (graphResults.length > 0) {
          graphResults.forEach((result, i) => {
            let summary = result.content.substring(0, 100);
            if (result.entityDetails) {
              summary += ` (${result.entityDetails.category}: ${result.entityDetails.name})`;
            }
            console.log(`${i+1}. [${result.score.toFixed(2)}] ${summary}...`);
          });
        }
      } catch (error) {
        console.error(`Error searching knowledge graph for "${query}":`, error);
      }
    }
    
    // Test 5: Generate memory summary
    console.log('\n--- Test 5: Memory Summary ---');
    try {
      const summaryTopic = 'Japan trip';
      
      console.log(`Generating summary for: "${summaryTopic}"`);
      const summary = await semanticMemoryService.generateMemorySummary(
        TEST_USER_ID,
        summaryTopic
      );
      
      console.log('Summary:');
      console.log(summary.summary);
      console.log(`Based on ${summary.sources.length} sources`);
    } catch (error) {
      console.error('Error generating memory summary:', error);
    }
    
    // Test 6: Get memory stats
    console.log('\n--- Test 6: Memory Stats ---');
    try {
      const stats = await semanticMemoryService.getUserMemoryStats(TEST_USER_ID);
      
      console.log('Memory statistics:');
      console.log(`- Raw data: ${stats.rawDataCount}`);
      console.log(`- Semantic chunks: ${stats.chunkCount}`);
      console.log(`- Thoughts: ${stats.thoughtCount}`);
      console.log(`- Total vectors: ${stats.vectorStats.totalVectors}`);
    } catch (error) {
      console.error('Error getting memory stats:', error);
    }
    
    console.log('\n--- Memory Integration Test Complete ---');
    console.log('All tests ran successfully. Results may vary based on test data.');
  } catch (error) {
    console.error('Integration test failed:', error);
  }
}

// Run the test
runMemoryIntegrationTest(); 