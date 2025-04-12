const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/users';
let createdUserId = null;

async function testCreateUser() {
  console.log('\n--- Testing Create User ---');
  
  const userData = {
    first_name: 'John',
    last_name: 'Doe',
    email: `john.doe.${Date.now()}@example.com`,
    phone: '123-456-7890',
    password: 'password123',
    gender: 'male',
    age: 30,
    city: 'New York'
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    if (response.ok) {
      createdUserId = data.user_id;
      console.log(`User created with ID: ${createdUserId}`);
      return data;
    } else {
      console.error('Failed to create user');
    }
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

async function testGetAllUsers() {
  console.log('\n--- Testing Get All Users ---');
  
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Found ${data.length} users`);
    
    return data;
  } catch (error) {
    console.error('Error getting users:', error);
  }
}

async function testGetUserById(userId) {
  console.log(`\n--- Testing Get User by ID: ${userId} ---`);
  
  try {
    const response = await fetch(`${API_URL}/${userId}`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('User:', data);
    
    return data;
  } catch (error) {
    console.error('Error getting user by ID:', error);
  }
}

async function testUpdateUser(userId) {
  console.log(`\n--- Testing Update User: ${userId} ---`);
  
  const updateData = {
    first_name: 'John Updated',
    city: 'San Francisco'
  };
  
  try {
    const response = await fetch(`${API_URL}/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Updated user:', data);
    
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

async function testDeleteUser(userId) {
  console.log(`\n--- Testing Delete User: ${userId} ---`);
  
  try {
    const response = await fetch(`${API_URL}/${userId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

async function runTests() {
  // Create a user
  const newUser = await testCreateUser();
  
  if (newUser && newUser.user_id) {
    // Get all users
    await testGetAllUsers();
    
    // Get user by ID
    await testGetUserById(newUser.user_id);
    
    // Update user
    await testUpdateUser(newUser.user_id);
    
    // Delete user
    await testDeleteUser(newUser.user_id);
    
    // Verify deletion
    await testGetUserById(newUser.user_id);
  }
}

// Run all tests
runTests(); 