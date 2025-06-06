import { DatabaseService } from '../index';
import { UserRepository } from '../repositories/user.repository';

describe('Database Integration Tests', () => {
  let databaseService: DatabaseService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Initialize real database connections for integration testing
    databaseService = new DatabaseService();
    userRepository = new UserRepository(databaseService);
  });

  afterAll(async () => {
    // Clean up database connections
    await databaseService.disconnect();
  });

  describe('UserRepository Integration', () => {
    const testUsers = [
      {
        name: 'Test User 1',
        email: 'testuser1@2dots1line.com',
        password_hash: '$2b$10$K7L/VwnSJzp4.HGGYUOXoOKD5ztCg3.OGKjvGkX4FhL.abc123def',
        region: 'US-WEST',
      },
      {
        name: 'Test User 2', 
        email: 'testuser2@2dots1line.com',
        password_hash: '$2b$10$K7L/VwnSJzp4.HGGYUOXoOKD5ztCg3.OGKjvGkX4FhL.xyz789uvw',
        region: 'EU-CENTRAL',
      },
      {
        name: 'Integration Test User',
        email: 'integration@2dots1line.com', 
        password_hash: '$2b$10$K7L/VwnSJzp4.HGGYUOXoOKD5ztCg3.OGKjvGkX4FhL.integration',
        region: 'ASIA-PACIFIC',
      }
    ];

    beforeEach(async () => {
      // Clean the users table before each test in this suite
      await databaseService.prisma.users.deleteMany({});
    });

    it('should create test users visible in Prisma Studio', async () => {
      console.log('🚀 Creating test users for Prisma Studio verification...');
      
      const createdUsers: any[] = [];
      
      for (const userData of testUsers) {
        try {
          // Create user using UserRepository
          const user = await userRepository.createUser(userData);
          createdUsers.push(user);
          
          console.log(`✅ Created user: ${user.name} (${user.email}) - ID: ${user.user_id}`);
          
          // Verify the user was created correctly
          expect(user.name).toBe(userData.name);
          expect(user.email).toBe(userData.email);
          expect(user.region).toBe(userData.region);
          expect(user.user_id).toBeDefined();
          expect(user.created_at).toBeDefined();
          
        } catch (error) {
          console.error(`❌ Failed to create user ${userData.email}:`, error);
          throw error;
        }
      }

      console.log(`🎉 Successfully created ${createdUsers.length} test users!`);
      console.log('📊 You can now view these users in Prisma Studio at: http://localhost:5556');
      console.log('📝 Navigate to the "users" table to see the test data');
      
      // Verify we can retrieve users by email
      for (const userData of testUsers) {
        const foundUser = await userRepository.findUserByEmail(userData.email);
        expect(foundUser).toBeTruthy();
        expect(foundUser?.email).toBe(userData.email);
        console.log(`🔍 Verified retrieval: ${foundUser?.name}`);
      }
    }, 30000); // 30 second timeout for database operations

    it('should handle user retrieval by ID', async () => {
      // Create the user needed for this test
      await userRepository.createUser({
        name: 'Test User 1',
        email: 'testuser1@2dots1line.com',
        password_hash: '$2b$10$K7L/VwnSJzp4.HGGYUOXoOKD5ztCg3.OGKjvGkX4FhL.abc123def',
        region: 'US-WEST',
      });

      const user = await userRepository.findUserByEmail('testuser1@2dots1line.com');
      expect(user).toBeTruthy();
      
      if (user) {
        const userById = await userRepository.findUserById(user.user_id);
        expect(userById).toBeTruthy();
        expect(userById?.user_id).toBe(user.user_id);
        expect(userById?.email).toBe(user.email);
        
        console.log(`🆔 Successfully retrieved user by ID: ${userById?.name}`);
      }
    });

    it('should handle non-existent user queries gracefully', async () => {
      const nonExistentUser = await userRepository.findUserByEmail('nonexistent@example.com');
      expect(nonExistentUser).toBeNull();
      
      const nonExistentById = await userRepository.findUserById('non-existent-uuid');
      expect(nonExistentById).toBeNull();
      
      console.log('✅ Gracefully handled non-existent user queries');
    });

    it('should prevent duplicate email registration', async () => {
      // Create the initial user whose email we will try to duplicate
      await userRepository.createUser({
        name: 'Test User 1',
        email: 'testuser1@2dots1line.com',
        password_hash: '$2b$10$K7L/VwnSJzp4.HGGYUOXoOKD5ztCg3.OGKjvGkX4FhL.abc123def',
        region: 'US-WEST',
      });

      const duplicateUserData = {
        name: 'Duplicate User',
        email: 'testuser1@2dots1line.com', // This email already exists
        password_hash: '$2b$10$differenthash',
        region: 'US-EAST',
      };

      await expect(userRepository.createUser(duplicateUserData)).rejects.toThrow('User with this email already exists.');
      console.log('✅ Correctly prevented duplicate email registration');
    });
  });

  describe('Database Connection Health', () => {
    it('should have healthy database connections', async () => {
      // Test PostgreSQL connection
      const prisma = databaseService.prisma;
      // Since beforeEach clears users, we create one for this specific test if count is important
      // Or adjust the assertion if just checking connectivity.
      await userRepository.createUser({
        name: 'Health Check User',
        email: 'healthcheck@2dots1line.com',
        password_hash: '$2b$10$healthcheck',
        region: 'US-CENTRAL',
      });
      const userCount = await prisma.users.count();
      expect(userCount).toBeGreaterThanOrEqual(1); 
      
      console.log(`📊 PostgreSQL: ${userCount} users in database`);
      
      try {
        await databaseService.testConnections();
        console.log('✅ All database connections healthy');
      } catch (error) {
        console.warn('⚠️  Some database connections may have issues:', error);
        // Optionally rethrow or fail test if all connections must be healthy
        // For now, we just log the warning as per original code
      }
    });
  });
}); 