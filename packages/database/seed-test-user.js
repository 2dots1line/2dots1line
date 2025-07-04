// Test user seeding script using the database package's Prisma setup
const { prisma } = require('./dist/prisma-client');

async function createTestUser() {
  try {
    console.log('🔄 Creating test user...');
    
    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: { email: 'test@example.com' }
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.user_id);
      return existingUser.user_id;
    }
    
    // Create test user
    const testUser = await prisma.users.create({
      data: {
        user_id: 'test-user-001',
        email: 'test@example.com',
        name: 'Test User',
        memory_profile: { preferences: 'test user preferences' },
        knowledge_graph_schema: { entities: [], relationships: [] },
        next_conversation_context_package: null
      }
    });
    
    console.log('✅ Test user created successfully!');
    console.log('User ID:', testUser.user_id);
    return testUser.user_id;
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    if (error.code === 'P2002') {
      console.log('User likely already exists');
      // Try to find existing user
      const existingUser = await prisma.users.findFirst({
        where: { user_id: 'test-user-001' }
      });
      if (existingUser) {
        console.log('Found existing user:', existingUser.user_id);
        return existingUser.user_id;
      }
    }
    throw error;
  }
}

createTestUser()
  .then(userId => {
    console.log('🎯 Use this userId for API testing:', userId);
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 