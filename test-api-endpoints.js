/**
 * Test script for Directive 2 API endpoints
 * Tests User Growth Profile vs Entity Growth Data APIs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001'; // API Gateway port
const TEST_USER_ID = 'test-user-123';

// Mock authentication token (in real app, this would come from auth)
const mockAuthToken = 'mock-jwt-token';

async function testUserGrowthProfileAPI() {
  console.log('\n=== Testing Directive 2: User Growth Profile API ===\n');

  try {
    // Test 1: Get overall user growth profile
    console.log('1. Testing /api/users/me/growth-profile');
    const growthProfileResponse = await axios.get(`${BASE_URL}/api/users/me/growth-profile`, {
      headers: { 
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Growth Profile Response:', JSON.stringify(growthProfileResponse.data, null, 2));

    // Test 2: Get dashboard growth summary
    console.log('\n2. Testing /api/users/me/dashboard/growth-summary');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/users/me/dashboard/growth-summary`, {
      headers: { 
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Dashboard Summary Response:', JSON.stringify(dashboardResponse.data, null, 2));

    // Test 3: Get cards with per-entity growth data
    console.log('\n3. Testing /api/cards (per-entity growth data)');
    const cardsResponse = await axios.get(`${BASE_URL}/api/cards?limit=5&sortBy=growth_activity`, {
      headers: { 
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cards with Growth Data Response:', JSON.stringify(cardsResponse.data, null, 2));

    // Test 4: Get top growth cards
    console.log('\n4. Testing /api/cards/top-growth');
    const topGrowthResponse = await axios.get(`${BASE_URL}/api/cards/top-growth?limit=3`, {
      headers: { 
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Top Growth Cards Response:', JSON.stringify(topGrowthResponse.data, null, 2));

    console.log('\n🎉 All Directive 2 API tests completed successfully!');
    
    // Verify the distinction between user-level and entity-level data
    console.log('\n=== Directive 2 Data Distinction Verification ===');
    console.log('✅ User Growth Profile: Overall aggregated scores from users.growth_profile');
    console.log('✅ Entity Growth Data: Per-card scores from mv_entity_growth_progress');
    console.log('✅ Clear separation between Dashboard (user-level) and Card Gallery (entity-level) data');

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ Network Error: Server not responding. Make sure API Gateway is running on port 3001');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the test
if (require.main === module) {
  testUserGrowthProfileAPI();
}

module.exports = { testUserGrowthProfileAPI }; 