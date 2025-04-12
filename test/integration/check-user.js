const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUser(email) {
  try {
    // Find a specific user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        interactions: true,
        cards: true,
        decks: true
      }
    });
    
    if (user) {
      console.log('User found:');
      console.log(JSON.stringify(user, null, 2));
      console.log(`Interactions: ${user.interactions.length}`);
      console.log(`Cards created: ${user.cards.length}`);
      console.log(`Decks created: ${user.decks.length}`);
    } else {
      console.log(`No user found with email: ${email}`);
    }
    
    // Count total users
    const count = await prisma.user.count();
    console.log(`Total user count: ${count}`);
    
  } catch (error) {
    console.error('Error querying the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Replace with the email you want to check
const emailToCheck = "user@example.com";
findUser(emailToCheck); 