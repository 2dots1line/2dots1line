const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api';
let authToken = null;
let testUser = {
  email: `testuser.${Date.now()}@example.com`,
  password: 'password123',
  first_name: 'Test',
  last_name: 'User'
};

async function testSignup() {
  console.log('\n--- Testing User Signup ---');
  
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    if (response.ok && data.token) {
      authToken = data.token;
      console.log('Signup successful. Received token:', authToken.substring(0, 15) + '...');
      return data;
    } else {
      console.error('Failed to signup');
    }
  } catch (error) {
    console.error('Error during signup:', error);
  }
}

async function testLogin() {
  console.log('\n--- Testing User Login ---');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    if (response.ok && data.token) {
      authToken = data.token;
      console.log('Login successful. Received token:', authToken.substring(0, 15) + '...');
      return data;
    } else {
      console.error('Failed to login');
    }
  } catch (error) {
    console.error('Error during login:', error);
  }
}

async function testProtectedRoute() {
  console.log('\n--- Testing Protected Route ---');
  
  if (!authToken) {
    console.error('No auth token available. Please log in first.');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/protected`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error accessing protected route:', error);
  }
}

async function testLogout() {
  console.log('\n--- Testing User Logout ---');
  
  if (!authToken) {
    console.error('No auth token available. Please log in first.');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    // In a real application, you would clear the token here
    authToken = null;
    console.log('Cleared auth token');
    
    return data;
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

async function testProtectedRouteAfterLogout() {
  console.log('\n--- Testing Protected Route After Logout ---');
  
  try {
    // Should fail as we've logged out (token cleared)
    const response = await fetch(`${API_URL}/auth/protected`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken || 'invalid-token'}`
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error accessing protected route:', error);
  }
}

async function runTests() {
  // Test signup
  await testSignup();
  
  // Test login
  await testLogin();
  
  // Test accessing a protected route (should succeed)
  await testProtectedRoute();
  
  // Test logout
  await testLogout();
  
  // Test accessing a protected route after logout (should fail)
  await testProtectedRouteAfterLogout();
}

// Run all tests
runTests();

 