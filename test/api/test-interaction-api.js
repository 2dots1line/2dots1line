/**
 * Test script for the Interaction Management APIs
 * 
 * This script tests:
 * 1. Creating a new interaction
 * 2. Retrieving interactions
 * 3. Getting a specific interaction
 * 4. Updating interaction processing status
 * 5. Processing an interaction
 * 6. Deleting an interaction
 * 7. Testing AI response generation (for chat/onboarding)
 */

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const FormData = require('form-data');
const BASE_URL = 'http://localhost:3001/api';

// For storing authentication token and created interaction IDs
let authToken = null;
let testInteractionId = null;
let testSessionId = uuidv4();
let testUserId = null; // Store user ID for file paths
let testChatInteractionId = null;
let testImageInteractionId = null;
let testDocInteractionId = null;

const MOCK_IMAGE_FILENAME = 'real_sample.jpeg';
const MOCK_IMAGE_DIR = 'test_files';
const MOCK_IMAGE_PATH_RELATIVE = path.join(MOCK_IMAGE_DIR, MOCK_IMAGE_FILENAME);
const MOCK_IMAGE_MIMETYPE = 'image/jpeg';

// Test user credentials (should exist in the database)
const testUser = {
  email: 'testuser.' + Date.now() + '@example.com',
  password: 'Password123!',
  first_name: 'Test',
  last_name: 'User'
};

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null, token = null, isFormData = false) {
  let headers = {};
  let requestBody = body;

  if (isFormData) {
      // headers are set automatically by node-fetch when using FormData body
      requestBody = body;
  } else {
      headers['Content-Type'] = 'application/json';
      requestBody = body ? JSON.stringify(body) : null;
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
    body: requestBody
  };
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    // Handle potential non-JSON responses gracefully
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return { status: response.status, data };
    } else {
        const text = await response.text();
        console.warn(`[WARN] Received non-JSON response (${response.status}) from ${endpoint}: ${text.substring(0,100)}...`);
        // Return structure consistent with JSON response for simpler handling downstream
        return { status: response.status, data: { error: `Non-JSON response: ${text}` } }; 
    }
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
    testUserId = result.data.user.user_id; // Assuming user object is returned
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
    testUserId = result.data.user.id; // Assuming user object is returned
    return true;
  } else {
    console.log('❌ Login failed:', result.data);
    return false;
  }
}

// Helper to ensure the REAL test file exists in the correct upload location for the test
async function ensureTestFileExists() {
    if (!testUserId) {
        console.error('[SETUP] Cannot ensure test file without testUserId.');
        return false;
    }
    const userUploadDir = path.join(__dirname, '../uploads', testUserId);
    const targetFilePath = path.join(userUploadDir, MOCK_IMAGE_FILENAME);
    const sourceFilePath = path.join(__dirname, MOCK_IMAGE_DIR, MOCK_IMAGE_FILENAME);
    const relativePathForLog = path.join('uploads', testUserId, MOCK_IMAGE_FILENAME);
    try {
        await fs.ensureDir(userUploadDir); // Ensure user-specific upload directory exists
        
        // Check if source file exists
        if (!await fs.pathExists(sourceFilePath)) {
             console.error(`[SETUP] Source test file not found at ${sourceFilePath}`);
             return false;
        }

        // Check if target file exists, if not, copy it from source
        if (!await fs.pathExists(targetFilePath)) {
            await fs.copyFile(sourceFilePath, targetFilePath);
            console.log(`[SETUP] Copied ${MOCK_IMAGE_FILENAME} to ${relativePathForLog} for test.`);
        } else {
             console.log(`[SETUP] Test file already exists at: ${relativePathForLog}`);
        }
        return true;
    } catch(err) {
        console.error(`[SETUP] Error ensuring test file exists at ${relativePathForLog}: ${err}`);
        return false;
    }
}

// Create a new text interaction (modified to save ID)
async function testCreateTextInteraction() {
  console.log('\n--- Creating a text interaction ---');
  const interactionData = {
    session_id: testSessionId,
    interaction_type: 'text_message',
    raw_data: { text: 'This is a standard text message.', source: 'test_script' },
    metadata: { test: true }
  };
  const result = await apiRequest('/interactions', 'POST', interactionData, authToken);
  if (result.status === 201) {
    console.log('✅ Text interaction created successfully');
    testInteractionId = result.data.interaction.interaction_id;
    console.log(`Interaction ID: ${testInteractionId}`);
    return true;
  } else {
    console.log('❌ Failed to create text interaction:', result.data);
    return false;
  }
}

// Test AI response and check if AI response interaction is saved
async function testAiChatResponseSaving() {
  console.log('\n--- Testing AI chat interaction and response saving ---');
  const userMessage = 'Hello Dot, how are you today?';
  const chatData = {
    session_id: testSessionId,
    interaction_type: 'chat',
    raw_data: { message: userMessage, source: 'test_script' },
    metadata: { test: true }
  };
  
  const result = await apiRequest('/interactions', 'POST', chatData, authToken);
  
  if (result.status === 201 && result.data.aiResponse && result.data.interaction) {
    console.log('✅ AI chat interaction created successfully');
    console.log('User Message Interaction ID:', result.data.interaction.interaction_id);
    console.log('AI Response Text:', result.data.aiResponse.text.substring(0, 100) + '...');
    testChatInteractionId = result.data.interaction.interaction_id; // Save user message ID

    // Wait a moment for the AI response to be saved asynchronously
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    // Verify AI response was saved
    const getResult = await apiRequest(`/interactions?session_id=${testSessionId}`, 'GET', null, authToken);
    if (getResult.status === 200) {
        const aiResponses = getResult.data.interactions.filter(i => i.interaction_type === 'ai_response');
        const userMessages = getResult.data.interactions.filter(i => i.interaction_type === 'chat');
        console.log(`Found ${userMessages.length} user chat messages and ${aiResponses.length} AI responses in session.`);
        if (aiResponses.length > 0) {
            console.log('✅ AI response interaction found in database.');
            return true;
        } else {
            console.log('❌ AI response interaction NOT found in database.');
            return false;
        }
    } else {
        console.log('❌ Failed to fetch interactions to verify AI response saving:', getResult.data);
        return false;
    }
  } else {
    console.log('❌ Failed to create AI chat interaction:', result.data);
    return false;
  }
}

// Test uploading and processing an image via the upload endpoint
async function testUploadAndProcessImage() {
    console.log('\n--- Testing Image Upload & Process via /upload/file ---');
    if (!testUserId) {
        console.log('❌ Skipping image upload test: testUserId not set.');
        return false;
    }

    // Ensure dummy file exists
    const userUploadDir = path.join(__dirname, '../uploads', testUserId);
    const absFilePath = path.join(userUploadDir, MOCK_IMAGE_FILENAME);
    if (!await ensureTestFileExists()) { // ensureTestFileExists creates it here
        console.log('❌ Skipping image upload test: Could not ensure test file exists.');
        return false;
    }

    // Read the dummy file into a buffer
    let fileBuffer;
    try {
        fileBuffer = await fs.readFile(absFilePath);
        console.log(`[DEBUG] Read test file into buffer (size: ${fileBuffer.length})`);
    } catch (readError) {
        console.error(`[ERROR] Failed to read test file ${absFilePath}:`, readError);
        return false;
    }

    // Create FormData
    const form = new FormData();
    form.append('file', fileBuffer, { 
        filename: MOCK_IMAGE_FILENAME,
        contentType: MOCK_IMAGE_MIMETYPE
    });
    // Optionally add other form fields like session_id or a message
    form.append('session_id', testSessionId);
    form.append('message', 'What does the dummy image show?'); 

    // Make the request
    const result = await apiRequest('/upload/file', 'POST', form, authToken, true); // Pass isFormData=true

    // Check response
    if (result.status === 200 && result.data.analysis) {
        console.log('✅ Image uploaded and processed successfully via /upload/file.');
        console.log('Analysis Received:', result.data.analysis.substring(0, 150) + '...');
        // Further checks: Verify interactions were created in DB? 
        // (Requires fetching interactions for the session)
        return true;
    } else {
        console.log('❌ Failed to upload/process image via /upload/file:', result);
        return false;
    }
}

// Get all interactions
async function testGetInteractions() {
  console.log('\n--- Getting all interactions ---');
  
  const result = await apiRequest('/interactions', 'GET', null, authToken);
  
  if (result.status === 200) {
    console.log(`✅ Retrieved ${result.data.interactions.length} interactions`);
    console.log(`Total available: ${result.data.meta.total}`);
    return true;
  } else {
    console.log('❌ Failed to get interactions:', result.data);
    return false;
  }
}

// Get a specific interaction
async function testGetSingleInteraction() {
  console.log('\n--- Getting a single interaction ---');
  
  const result = await apiRequest(`/interactions/${testInteractionId}`, 'GET', null, authToken);
  
  if (result.status === 200) {
    console.log('✅ Retrieved interaction successfully');
    console.log(`Type: ${result.data.interaction_type}`);
    return true;
  } else {
    console.log('❌ Failed to get interaction:', result.data);
    return false;
  }
}

// Update interaction processing status
async function testUpdateProcessingStatus() {
  console.log('\n--- Updating interaction processing status ---');
  
  const updateData = {
    processed_flag: true,
    processing_notes: 'Processed by test script'
  };
  
  const result = await apiRequest(`/interactions/${testInteractionId}/processing`, 'PATCH', updateData, authToken);
  
  if (result.status === 200) {
    console.log('✅ Updated processing status successfully');
    console.log(`Processed: ${result.data.interaction.processed_flag}`);
    console.log(`Notes: ${result.data.interaction.processing_notes}`);
    return true;
  } else {
    console.log('❌ Failed to update processing status:', result.data);
    return false;
  }
}

// Process an interaction
async function testProcessInteraction() {
  console.log('\n--- Processing an interaction ---');
  
  const result = await apiRequest(`/interactions/${testInteractionId}/process`, 'POST', {}, authToken);
  
  if (result.status === 200) {
    console.log('✅ Processed interaction successfully');
    console.log(`Notes: ${result.data.interaction.processing_notes}`);
    return true;
  } else {
    console.log('❌ Failed to process interaction:', result.data);
    return false;
  }
}

// Delete an interaction
async function testDeleteInteraction() {
  console.log('\n--- Deleting an interaction ---');
  
  const result = await apiRequest(`/interactions/${testInteractionId}`, 'DELETE', null, authToken);
  
  if (result.status === 200) {
    console.log('✅ Deleted interaction successfully');
    return true;
  } else {
    console.log('❌ Failed to delete interaction:', result.data);
    return false;
  }
}

// Run all tests (updated sequence)
async function runAllTests() {
  console.log('\n=== INTERACTION API TEST SUITE (V4 - Memory Upload) ===\n');
  
  if (!(await registerTestUser()) && !(await loginTestUser())) {
    console.log('❌ Authentication failed, aborting tests');
    return;
  }
  if (!testUserId) {
      console.log('\n--- Fetching user profile to get ID ---');
      const profileRes = await apiRequest('/auth/profile', 'GET', null, authToken);
      if (profileRes.status === 200 && profileRes.data.user_id) {
          testUserId = profileRes.data.user_id;
          console.log(`✅ Got user ID: ${testUserId}`);
      } else {
          console.log('❌ Failed to get user ID from profile, cannot run upload tests.', profileRes.data);
          return; // Stop if user ID is needed and not found
      }
  }
  
  // Run other tests if needed (text, chat saving)
  await testCreateTextInteraction();
  await testAiChatResponseSaving();

  // Test the new upload flow
  await testUploadAndProcessImage();
  
  // Optionally add a final check to see all interactions created
  console.log('\n--- Final check: Getting all interactions for session ---');
  await apiRequest(`/interactions?session_id=${testSessionId}`, 'GET', null, authToken).then(res => {
      if(res.status === 200) {
          console.log(`✅ Successfully fetched ${res.data.interactions?.length || 0} interactions for session ${testSessionId}`);
          // You could add more detailed checks here if needed
      } else {
          console.log(`❌ Failed to fetch final interactions for session ${testSessionId}:`, res.data);
      }
  });

  console.log('\n=== TEST SUITE COMPLETED ===\n');
}

runAllTests(); 