import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import express from 'express';
import request from 'supertest';
import app from '../app';

async function testAPI() {
  console.log('🚀 Testing API end-to-end flow...');
  
  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing health check...');
    const healthResponse = await request(app)
      .get('/api/health')
      .expect(200);
    
    console.log('✅ Health check passed:', healthResponse.body);

    // Test 2: Register a new user
    console.log('\n2️⃣ Testing user registration...');
    const newUser = {
      email: `apitest-${Date.now()}@2dots1line.com`,
      password: 'TestPassword123!',
      username: `apitest${Date.now()}`,
      display_name: 'API End-to-End Test User',
      region: 'US-WEST'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(newUser)
      .expect(201);

    console.log('✅ User registration passed:', {
      message: registerResponse.body.message,
      userId: registerResponse.body.user?.user_id,
      email: registerResponse.body.user?.email
    });

    // Test 3: Login with the new user
    console.log('\n3️⃣ Testing user login...');
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: newUser.email,
        password: newUser.password
      })
      .expect(200);

    console.log('✅ User login passed:', {
      message: loginResponse.body.message,
      hasToken: !!loginResponse.body.token,
      userId: loginResponse.body.user?.user_id
    });

    // Test 4: Access protected endpoint
    console.log('\n4️⃣ Testing protected endpoint (/api/me)...');
    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(200);

    console.log('✅ Protected endpoint passed:', {
      userId: meResponse.body.user_id,
      email: meResponse.body.email,
      username: meResponse.body.username
    });

    console.log('\n🎉 All API tests passed! User created and accessible via Prisma Studio at http://localhost:5556');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
  
  process.exit(0);
}

testAPI(); 