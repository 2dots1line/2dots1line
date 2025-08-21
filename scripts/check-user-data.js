/**
 * Check what data exists for dev-user-123
 * This will help us design a dashboard based on actual data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserData() {
  const userId = 'dev-user-123';
  
  console.log('🔍 Examining data for user:', userId);
  console.log('=====================================\n');

  try {
    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { user_id: userId }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      name: user.name,
      email: user.email,
      created_at: user.created_at
    });
    console.log('');

    // Check conversations
    const conversations = await prisma.conversations.findMany({
      where: { user_id: userId },
      include: {
        conversation_messages: true,
        memory_units: true
      },
      orderBy: { start_time: 'desc' }
    });
    
    console.log(`💬 Conversations: ${conversations.length}`);
    if (conversations.length > 0) {
      console.log('  Recent conversations:');
      conversations.slice(0, 3).forEach(conv => {
        console.log(`    - ${conv.title || 'Untitled'} (${conv.start_time.toDateString()})`);
        console.log(`      Messages: ${conv.conversation_messages.length}, Memories: ${conv.memory_units.length}`);
      });
    }
    console.log('');

    // Check memory units
    const memoryUnits = await prisma.memory_units.findMany({
      where: { user_id: userId },
      orderBy: { creation_ts: 'desc' }
    });
    
    console.log(`🧠 Memory Units: ${memoryUnits.length}`);
    if (memoryUnits.length > 0) {
      console.log('  Recent memories:');
      memoryUnits.slice(0, 3).forEach(memory => {
        console.log(`    - ${memory.title} (${memory.creation_ts.toDateString()})`);
        console.log(`      Importance: ${memory.importance_score || 'N/A'}, Sentiment: ${memory.sentiment_score || 'N/A'}`);
      });
    }
    console.log('');

    // Check concepts
    const concepts = await prisma.concepts.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`🔗 Concepts: ${concepts.length}`);
    if (concepts.length > 0) {
      console.log('  Recent concepts:');
      concepts.slice(0, 3).forEach(concept => {
        console.log(`    - ${concept.name} (${concept.type}) - ${concept.description || 'No description'}`);
      });
    }
    console.log('');

    // Check cards
    const cards = await prisma.cards.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`🃏 Cards: ${cards.length}`);
    if (cards.length > 0) {
      console.log('  Recent cards:');
      cards.slice(0, 3).forEach(card => {
        console.log(`    - ${card.card_type} (${card.status}) - ${card.source_entity_type}: ${card.source_entity_id}`);
      });
    }
    console.log('');

    // Check derived artifacts
    const artifacts = await prisma.derived_artifacts.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`🎨 Derived Artifacts: ${artifacts.length}`);
    if (artifacts.length > 0) {
      console.log('  Recent artifacts:');
      artifacts.slice(0, 3).forEach(artifact => {
        console.log(`    - ${artifact.title} (${artifact.artifact_type})`);
        console.log(`      Sources: ${artifact.source_memory_unit_ids.length} memories, ${artifact.source_concept_ids.length} concepts`);
      });
    }
    console.log('');

    // Check growth events
    const growthEvents = await prisma.growth_events.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`📈 Growth Events: ${growthEvents.length}`);
    if (growthEvents.length > 0) {
      console.log('  Recent growth events:');
      growthEvents.slice(0, 3).forEach(event => {
        console.log(`    - ${event.source} (${event.created_at.toDateString()})`);
        console.log(`      Dimensions: ${JSON.stringify(event.growth_dimensions).substring(0, 100)}...`);
      });
    }
    console.log('');

    // Check interaction logs
    const interactions = await prisma.interaction_logs.findMany({
      where: { user_id: userId },
      orderBy: { timestamp: 'desc' }
    });
    
    console.log(`📊 Interaction Logs: ${interactions.length}`);
    if (interactions.length > 0) {
      console.log('  Recent interactions:');
      interactions.slice(0, 3).forEach(interaction => {
        console.log(`    - ${interaction.interaction_type} (${interaction.timestamp.toDateString()})`);
        if (interaction.target_entity_type) {
          console.log(`      Target: ${interaction.target_entity_type}: ${interaction.target_entity_id}`);
        }
      });
    }
    console.log('');

    // Check media items
    const mediaItems = await prisma.media_items.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`🖼️ Media Items: ${mediaItems.length}`);
    if (mediaItems.length > 0) {
      console.log('  Recent media:');
      mediaItems.slice(0, 3).forEach(media => {
        console.log(`    - ${media.filename || 'Unnamed'} (${media.type}) - ${media.processing_status}`);
      });
    }
    console.log('');

    // Check communities
    const communities = await prisma.communities.findMany({
      where: { user_id: userId },
      include: { concepts: true }
    });
    
    console.log(`🏘️ Communities: ${communities.length}`);
    if (communities.length > 0) {
      communities.forEach(community => {
        console.log(`    - ${community.name}: ${community.concepts.length} concepts`);
      });
    }
    console.log('');

    // Check user challenges
    const challenges = await prisma.user_challenges.findMany({
      where: { user_id: userId }
    });
    
    console.log(`🎯 User Challenges: ${challenges.length}`);
    if (challenges.length > 0) {
      challenges.forEach(challenge => {
        console.log(`    - ${challenge.status} (started: ${challenge.start_time.toDateString()})`);
      });
    }
    console.log('');

    // Check proactive prompts
    const prompts = await prisma.proactive_prompts.findMany({
      where: { user_id: userId }
    });
    
    console.log(`💭 Proactive Prompts: ${prompts.length}`);
    if (prompts.length > 0) {
      prompts.slice(0, 3).forEach(prompt => {
        console.log(`    - ${prompt.source_agent}: ${prompt.status}`);
        console.log(`      Text: ${prompt.prompt_text.substring(0, 100)}...`);
      });
    }
    console.log('');

    // Check graph projections
    const projections = await prisma.user_graph_projections.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`🕸️ Graph Projections: ${projections.length}`);
    if (projections.length > 0) {
      projections.slice(0, 3).forEach(projection => {
        console.log(`    - ${projection.status} (${projection.created_at.toDateString()})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking user data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();
