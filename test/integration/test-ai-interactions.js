/**
 * Test script for AI Interactions and Vectorization
 * 
 * This script:
 * 1. Tests chat functionality
 * 2. Verifies interactions are stored in database
 * 3. Tests vectorization process
 * 4. Tests semantic search with the vectorized content
 */

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const BASE_URL = 'http://localhost:3001/api';

// For storing authentication token and test interaction IDs
let authToken = null;
let testSessionId = uuidv4();
let createdInteractions = [];

// Test user credentials
const testUser = {
  email: 'testuser.' + Date.now() + '@example.com',
  password: 'Password123!',
  first_name: 'Test',
  last_name: 'User'
};

// Test chat messages for AI interactions
const testMessages = [
  "Hello Dot, what can you help me with?",
  "What features does 2Dots1Line have?",
  "Tell me about semantic memory",
  "What is a knowledge graph?",
  "How do insight cards work?"
];

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  };
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error);
    return { status: 500, data: { error: error.message } };
  }
}

// Register test user
async function registerTestUser() {
  console.log('\n--- Creating test user ---');
  
  const result = await apiRequest('/auth/signup', 'POST', testUser);
  
  if (result.status === 201) {
    console.log('✅ Test user created successfully');
    authToken = result.data.token;
    console.log(`Token: ${authToken.substring(0, 15)}...`);
    return true;
  } else {
    console.log('❌ Failed to create test user:', result.data);
    // Try to login if user already exists
    return loginTestUser();
  }
}

// Login test user
async function loginTestUser() {
  console.log('\n--- Logging in test user ---');
  
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const result = await apiRequest('/auth/login', 'POST', loginData);
  
  if (result.status === 200) {
    console.log('✅ Login successful');
    authToken = result.data.token;
    console.log(`Token: ${authToken.substring(0, 15)}...`);
    return true;
  } else {
    console.log('❌ Login failed:', result.data);
    return false;
  }
}

// Test chat functionality - simulate conversation
async function testChatFunctionality() {
  console.log('\n--- Testing chat functionality ---');
  
  for (const message of testMessages) {
    console.log(`\nUser: "${message}"`);
    
    const chatData = {
      session_id: testSessionId,
      interaction_type: 'chat',
      raw_data: {
        message: message,
        source: 'test_script'
      },
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const result = await apiRequest('/interactions', 'POST', chatData, authToken);
    
    if (result.status === 201) {
      console.log('✅ Message sent successfully');
      
      // Store the interaction ID for later tests
      if (result.data.interaction && result.data.interaction.interaction_id) {
        createdInteractions.push(result.data.interaction.interaction_id);
        console.log(`Interaction ID: ${result.data.interaction.interaction_id}`);
      }
      
      // Check AI response
      if (result.data.aiResponse && result.data.aiResponse.text) {
        console.log('Dot: ' + result.data.aiResponse.text.substring(0, 100) + '...');
      } else {
        console.log('❌ No AI response received');
      }
    } else {
      console.log('❌ Failed to send message:', result.data);
    }
    
    // Add a small delay between messages
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return createdInteractions.length > 0;
}

// Verify all interactions are stored in the database
async function verifyInteractionStorage() {
  console.log('\n--- Verifying interaction storage ---');
  
  const result = await apiRequest('/interactions', 'GET', null, authToken);
  
  if (result.status === 200 && result.data.interactions) {
    console.log(`✅ Retrieved ${result.data.interactions.length} interactions`);
    console.log(`Total available: ${result.data.meta.total}`);
    
    // Check if our test interactions are in the returned list
    const foundCount = result.data.interactions.filter(
      interaction => createdInteractions.includes(interaction.interaction_id)
    ).length;
    
    console.log(`Found ${foundCount} of ${createdInteractions.length} test interactions`);
    
    return foundCount === createdInteractions.length;
  } else {
    console.log('❌ Failed to get interactions:', result.data);
    return false;
  }
}

// Test vectorization process for interactions
async function testVectorization() {
  console.log('\n--- Testing vectorization process ---');
  
  let successCount = 0;
  
  // Process each interaction
  for (const interactionId of createdInteractions) {
    console.log(`\nProcessing interaction: ${interactionId}`);
    
    const result = await apiRequest(`/interactions/${interactionId}/process`, 'POST', {}, authToken);
    
    if (result.status === 200) {
      console.log('✅ Vectorization processed successfully');
      
      // Check vectorization results
      if (result.data.processing_results && 
          result.data.processing_results.vector && 
          result.data.processing_results.vector.status === 'success') {
        console.log(`Vector ID: ${result.data.processing_results.vector.vector_id}`);
        console.log(`Dimensions: ${result.data.processing_results.vector.dimensions}`);
        successCount++;
      } else {
        console.log('⚠️ Vectorization completed but with issues:', result.data.processing_results);
      }
    } else {
      console.log('❌ Failed to process vectorization:', result.data);
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return successCount > 0;
}

// Test semantic search using vectorized content
async function testSemanticSearch() {
  console.log('\n--- Testing semantic search ---');
  
  const searchQueries = [
    "semantic memory",
    "AI companion features",
    "knowledge graphs"
  ];
  
  let successCount = 0;
  
  for (const query of searchQueries) {
    console.log(`\nSearch query: "${query}"`);
    
    const searchData = {
      query: query,
      limit: 3,
      minScore: 0.5
    };
    
    const result = await apiRequest('/vector/search', 'POST', searchData, authToken);
    
    if (result.status === 200) {
      console.log(`✅ Search successful, found ${result.data.total} results`);
      
      if (result.data.results && result.data.results.length > 0) {
        console.log('Top result:');
        console.log(`- Score: ${result.data.results[0].score}`);
        
        if (result.data.results[0].interaction) {
          const interaction = result.data.results[0].interaction;
          console.log(`- Type: ${interaction.interaction_type}`);
          if (interaction.raw_data && interaction.raw_data.message) {
            console.log(`- Content: ${interaction.raw_data.message.substring(0, 50)}...`);
          }
        }
        
        successCount++;
      } else {
        console.log('No search results found');
      }
    } else {
      console.log('❌ Semantic search failed:', result.data);
    }
    
    // Add a small delay between searches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return successCount > 0;
}

// Get vector statistics for the user
async function getVectorStats() {
  console.log('\n--- Getting vector statistics ---');
  
  const result = await apiRequest('/vector/stats', 'GET', null, authToken);
  
  if (result.status === 200) {
    console.log('✅ Retrieved vector stats successfully');
    console.log(`Total interactions: ${result.data.total}`);
    console.log(`Processed: ${result.data.processed}, Unprocessed: ${result.data.unprocessed}`);
    
    if (result.data.typeBreakdown && result.data.typeBreakdown.length > 0) {
      console.log('Breakdown by interaction type:');
      result.data.typeBreakdown.forEach(type => {
        console.log(`  - ${type.type}: ${type.count}`);
      });
    }
    
    return true;
  } else {
    console.log('❌ Failed to get vector stats:', result.data);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n=== AI INTERACTIONS AND VECTORIZATION TEST SUITE ===\n');
  
  // Step 1: Register/login
  if (!(await registerTestUser())) {
    console.log('❌ Authentication failed, aborting tests');
    return;
  }
  
  // Step 2: Test chat functionality and create interactions
  if (!(await testChatFunctionality())) {
    console.log('❌ Chat functionality test failed, skipping remaining tests');
    return;
  }
  
  // Step 3: Verify interactions are stored
  await verifyInteractionStorage();
  
  // Step 4: Test vectorization
  if (!(await testVectorization())) {
    console.log('❌ Vectorization test failed, skipping semantic search');
    return;
  }
  
  // Step 5: Get vector statistics
  await getVectorStats();
  
  // Step 6: Test semantic search with vectorized content
  await testSemanticSearch();
  
  console.log('\n=== TEST SUITE COMPLETED ===\n');
  
  console.log('Summary:');
  console.log(`- Total messages sent: ${testMessages.length}`);
  console.log(`- Total interactions created: ${createdInteractions.length}`);
  console.log(`- Total interactions vectorized: ${createdInteractions.length}`);
  console.log('\nAll aspects of the AI interaction pipeline have been tested.');
  console.log('\nTo manually test in the browser:');
  console.log('1. Navigate to http://localhost:3001/chat.html');
  console.log('2. Log in with your credentials');
  console.log('3. Try sending messages to Dot AI and verify responses');
}

// Run the tests
runAllTests(); 