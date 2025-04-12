const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Test connection by trying to get count of users
    const userCount = await prisma.user.count();
    console.log(`Database connection successful! Current user count: ${userCount}`);
    
    // Create a test user if you want to verify write operations
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password_hash: 'hashed_password_example',
        first_name: 'Test',
        last_name: 'User'
      },
    });
    
    console.log('Created test user:', testUser);
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 