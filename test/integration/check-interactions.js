const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUserInteractions() {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'dnwang1011@gmail.com' },
      select: { user_id: true, first_name: true, last_name: true }
    });
    
    if (!user) {
      console.log('No user found with email: dnwang1011@gmail.com');
      return;
    }
    
    console.log(`Found user: ${user.first_name} ${user.last_name} (${user.user_id})`);
    
    // Get all interactions for this user
    const interactions = await prisma.interaction.findMany({
      where: { user_id: user.user_id },
      orderBy: { timestamp: 'desc' },
      take: 10  // Limit to the most recent 10 interactions
    });
    
    if (interactions.length === 0) {
      console.log('No interactions found for this user.');
      return;
    }
    
    console.log(`Found ${interactions.length} interactions:`);
    interactions.forEach((interaction, index) => {
      console.log(`\n--- Interaction ${index + 1} ---`);
      console.log(`ID: ${interaction.interaction_id}`);
      console.log(`Type: ${interaction.interaction_type}`);
      console.log(`Timestamp: ${interaction.timestamp}`);
      console.log(`Raw Data: ${JSON.stringify(interaction.raw_data, null, 2)}`);
      if (interaction.processing_notes) {
        console.log(`Processing Notes: ${JSON.stringify(interaction.processing_notes, null, 2)}`);
      }
    });
    
  } catch (error) {
    console.error('Error querying the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findUserInteractions(); 