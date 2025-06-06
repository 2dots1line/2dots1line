import request from 'supertest';
import app from '../app';
import { DatabaseService } from '@2dots1line/database';

describe('Auth API Integration Tests', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    // Initialize database service for cleanup
    databaseService = new DatabaseService();
  });

  afterAll(async () => {
    await databaseService.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'apitest@2dots1line.com',
        password: 'SecurePassword123!',
        username: 'apitestuser',
        display_name: 'API Test User',
        region: 'US-WEST'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('message');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.region).toBe(userData.region);
      expect(response.body.user).not.toHaveProperty('password_hash');

      console.log(`✅ Created API test user: ${response.body.user.name} (ID: ${response.body.user.user_id})`);
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'apitest@2dots1line.com', // Same email as above
        password: 'AnotherPassword123!',
        username: 'duplicateuser',
        display_name: 'Duplicate User',
        region: 'EU-CENTRAL'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('message');
      console.log('✅ Correctly prevented duplicate email registration');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'incomplete@example.com',
        // Missing password, username, region
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      console.log('✅ Correctly validated required fields');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUserToken: string;

    beforeAll(async () => {
      // Create a test user for login tests
      const userData = {
        email: 'logintest@2dots1line.com',
        password: 'LoginPassword123!',
        username: 'logintestuser',
        display_name: 'Login Test User',
        region: 'ASIA-PACIFIC'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      console.log(`🔧 Setup: Created login test user: ${response.body.user.email}`);
    });

    it('should login with correct credentials', async () => {
      const loginData = {
        email: 'logintest@2dots1line.com',
        password: 'LoginPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);

      console.log(`✅ Successful login for: ${response.body.user.email}`);
      console.log(`🔑 Login token: ${response.body.token.substring(0, 20)}...`);
    });

    it('should reject incorrect password', async () => {
      const loginData = {
        email: 'logintest@2dots1line.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      console.log('✅ Correctly rejected incorrect password');
    });

    it('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'AnyPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      console.log('✅ Correctly rejected non-existent user');
    });
  });

  describe('GET /api/me', () => {
    let userToken: string;
    let userId: string;

    beforeAll(async () => {
      // Create a test user for /me endpoint tests
      const userData = {
        email: 'metest@2dots1line.com',
        password: 'MeTestPassword123!',
        username: 'metestuser',
        display_name: 'Me Endpoint Test User',
        region: 'EU-WEST'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      userId = registerResponse.body.user.user_id;
      
      // Now login to get the token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password })
        .expect(200);

      userToken = loginResponse.body.token;
      console.log(`🔧 Setup: Created /me test user: ${registerResponse.body.user.email}`);
    });

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user_id).toBe(userId);
      expect(response.body.email).toBe('metest@2dots1line.com');
      expect(response.body).not.toHaveProperty('password_hash');

      console.log(`✅ Successfully retrieved user data: ${response.body.name}`);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      console.log('✅ Correctly rejected request without token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      console.log('✅ Correctly rejected invalid token');
    });
  });

  describe('API Health Check', () => {
    it('should respond to health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'API is running');
      console.log('✅ API health check passed');
    });
  });

  afterAll(() => {
    console.log('🎉 All API integration tests completed!');
    console.log('📊 View created test users in Prisma Studio: http://localhost:5556');
    console.log('📝 Check the "users" table for all test data created during these tests');
  });
}); 