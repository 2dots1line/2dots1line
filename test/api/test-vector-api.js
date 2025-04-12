/**
 * Test script for the Vector API
 * 
 * This script tests:
 * 1. Generating embeddings for text
 * 2. Storing embeddings
 * 3. Searching for similar vectors
 * 4. Processing interactions for vector storage
 */

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const BASE_URL = 'http://localhost:3001/api';

// For storing authentication token and test interaction ID
let authToken = null;
let testInteractionId = null;

// Test user credentials (should exist in the database)
const testUser = {
  email: 'testuser.' + Date.now() + '@example.com',
  password: 'Password123!',
  first_name: 'Test',
  last_name: 'User'
};

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

// Create a test interaction for vector processing
async function createTestInteraction() {
  console.log('\n--- Creating a test interaction ---');
  
  const interactionData = {
    session_id: uuidv4(),
    interaction_type: 'text_message',
    raw_data: {
      text: 'This is a test message for vector embedding. It contains some specific keywords to test semantic search like artificial intelligence, machine learning, and vector embeddings.',
      source: 'test_script'
    },
    metadata: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };
  
  const result = await apiRequest('/interactions', 'POST', interactionData, authToken);
  
  if (result.status === 201) {
    console.log('✅ Interaction created successfully');
    testInteractionId = result.data.interaction.interaction_id;
    console.log(`Interaction ID: ${testInteractionId}`);
    return true;
  } else {
    console.log('❌ Failed to create interaction:', result.data);
    return false;
  }
}

// Process an interaction for vector storage
async function testProcessInteraction() {
  console.log('\n--- Processing interaction vector ---');
  
  const result = await apiRequest(`/interactions/${testInteractionId}/process`, 'POST', {}, authToken);
  
  if (result.status === 200) {
    console.log('✅ Processed interaction successfully');
    console.log('Vector processing status:', result.data.processing_results.vector.status);
    if (result.data.processing_results.vector.vector_id) {
      console.log('Vector ID:', result.data.processing_results.vector.vector_id);
    }
    return true;
  } else {
    console.log('❌ Failed to process interaction:', result.data);
    return false;
  }
}

// Test semantic search
async function testSemanticSearch() {
  console.log('\n--- Testing semantic search ---');
  
  const searchQuery = {
    query: 'Tell me about artificial intelligence',
    limit: 3,
    minScore: 0.5
  };
  
  const result = await apiRequest('/vector/search', 'POST', searchQuery, authToken);
  
  if (result.status === 200) {
    console.log('✅ Semantic search executed successfully');
    console.log(`Found ${result.data.total} results for query: "${result.data.query}"`);
    if (result.data.results.length > 0) {
      console.log('Top result score:', result.data.results[0].score);
    }
    return true;
  } else {
    console.log('❌ Failed to execute semantic search:', result.data);
    return false;
  }
}

// Get vector statistics
async function testGetVectorStats() {
  console.log('\n--- Getting vector statistics ---');
  
  const result = await apiRequest('/vector/stats', 'GET', null, authToken);
  
  if (result.status === 200) {
    console.log('✅ Retrieved vector stats successfully');
    console.log(`Total interactions: ${result.data.total}`);
    console.log(`Processed: ${result.data.processed}, Unprocessed: ${result.data.unprocessed}`);
    if (result.data.typeBreakdown.length > 0) {
      console.log('Breakdown by type:');
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

// Test processing all unprocessed interactions
async function testProcessAllInteractions() {
  console.log('\n--- Processing all unprocessed interactions ---');
  
  const result = await apiRequest('/vector/process-all', 'POST', {}, authToken);
  
  if (result.status === 202 || result.status === 200) {
    console.log('✅ Batch processing initiated successfully');
    if (result.data.total) {
      console.log(`Processing ${result.data.total} interactions`);
      console.log(`Estimated time: ${result.data.estimated_time_seconds} seconds`);
    } else {
      console.log(result.data.message);
    }
    return true;
  } else {
    console.log('❌ Failed to initiate batch processing:', result.data);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n=== VECTOR API TEST SUITE ===\n');
  
  // Authentication
  if (!(await registerTestUser())) {
    console.log('❌ Authentication failed, aborting tests');
    return;
  }
  
  // Create and process an interaction
  if (!(await createTestInteraction())) {
    console.log('❌ Failed to create test interaction, skipping vector tests');
    return;
  }
  
  // Process the interaction
  await testProcessInteraction();
  
  // Get vector statistics
  await testGetVectorStats();
  
  // Test semantic search
  await testSemanticSearch();
  
  // Test bulk processing
  await testProcessAllInteractions();
  
  console.log('\n=== TEST SUITE COMPLETED ===\n');
}

// Run the tests
runAllTests(); 