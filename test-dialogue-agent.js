const fetch = require('node-fetch');

async function testDialogueAgent() {
  console.log('🧪 Testing DialogueAgent via API Gateway...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing API health...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const health = await healthResponse.json();
    console.log('✅ API Health:', health);
    
    // Test conversation endpoint
    console.log('\n2. Testing conversation endpoint...');
    const messageResponse = await fetch('http://localhost:3001/api/v1/conversations/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock token for testing
      },
      body: JSON.stringify({
        message: 'Hello! Can you help me with my personal goals?',
        context: {
          session_id: 'test-session-123',
          trigger_background_processing: true
        }
      })
    });
    
    const responseText = await messageResponse.text();
    console.log('📤 Request Status:', messageResponse.status);
    console.log('📥 Response:', responseText);
    
    if (messageResponse.status === 401) {
      console.log('ℹ️ This is expected - we need authentication for testing with a real user.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDialogueAgent();
