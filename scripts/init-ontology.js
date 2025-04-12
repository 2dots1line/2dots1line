/**
 * Initialize Ontology
 * 
 * This script creates the core ontology structure for the 2dots1line knowledge graph,
 * including core node types and edge types required by the system.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeOntology() {
  try {
    console.log('Starting ontology initialization...');
    
    // Check if ontology already exists
    const existingOntology = await prisma.ontologyVersion.findFirst({
      where: { isCurrent: true }
    });
    
    if (existingOntology) {
      console.log(`Found existing ontology: ${existingOntology.name}`);
      console.log('To reset the ontology, use --force flag');
      return;
    }
    
    // Create ontology version
    const ontology = await prisma.ontologyVersion.create({
      data: {
        name: 'Core Ontology v1',
        description: 'Initial ontology for 2dots1line',
        isCurrent: true
      }
    });
    
    console.log(`Created ontology version: ${ontology.name}`);
    
    // Create core node types
    const nodeTypes = [
      { name: 'Person', description: 'A person', isCore: true },
      { name: 'Location', description: 'A physical location', isCore: true },
      { name: 'Event', description: 'An event or occurrence', isCore: true },
      { name: 'Concept', description: 'An abstract concept or idea', isCore: true },
      { name: 'Interest', description: 'A topic of interest', isCore: true },
      { name: 'Emotion', description: 'A feeling or emotional state', isCore: true },
      { name: 'Object', description: 'A physical object or item', isCore: true },
      { name: 'Trait', description: 'A characteristic or attribute', isCore: true },
      { name: 'Goal', description: 'An objective or aim', isCore: true },
      { name: 'Challenge', description: 'A problem or obstacle', isCore: true }
    ];
    
    for (const nodeType of nodeTypes) {
      await prisma.nodeType.create({
        data: {
          name: nodeType.name,
          description: nodeType.description,
          isCore: nodeType.isCore,
          ontologyVersionId: ontology.id,
          properties: {}
        }
      });
      console.log(`Created node type: ${nodeType.name}`);
    }
    
    // Create core edge types
    const edgeTypes = [
      { 
        name: 'KNOWS', 
        description: 'Indicates a person knows another person',
        sourceNodeTypes: ['Person'], 
        targetNodeTypes: ['Person'], 
        isCore: true 
      },
      { 
        name: 'VISITED', 
        description: 'Indicates a person visited a location',
        sourceNodeTypes: ['Person'], 
        targetNodeTypes: ['Location'], 
        isCore: true 
      },
      { 
        name: 'INTERESTED_IN', 
        description: 'Indicates a person is interested in a topic',
        sourceNodeTypes: ['Person'], 
        targetNodeTypes: ['Interest', 'Concept'], 
        isCore: true 
      },
      { 
        name: 'PARTICIPATED_IN', 
        description: 'Indicates a person participated in an event',
        sourceNodeTypes: ['Person'], 
        targetNodeTypes: ['Event'], 
        isCore: true 
      },
      { 
        name: 'LOCATED_IN', 
        description: 'Indicates something is located within a location',
        sourceNodeTypes: ['Event', 'Object', 'Person'], 
        targetNodeTypes: ['Location'], 
        isCore: true 
      },
      { 
        name: 'HAS_TRAIT', 
        description: 'Indicates an entity has a specific trait',
        sourceNodeTypes: ['Person', 'Object', 'Location'], 
        targetNodeTypes: ['Trait'], 
        isCore: true 
      },
      { 
        name: 'FELT_DURING', 
        description: 'Indicates an emotion was felt during an event',
        sourceNodeTypes: ['Person'], 
        targetNodeTypes: ['Emotion'], 
        isCore: true 
      },
      { 
        name: 'PURSUES_GOAL', 
        description: 'Indicates a person is pursuing a goal',
        sourceNodeTypes: ['Person'], 
        targetNodeTypes: ['Goal'], 
        isCore: true 
      },
      { 
        name: 'FACES_CHALLENGE', 
        description: 'Indicates a person faces a challenge',
        sourceNodeTypes: ['Person'], 
        targetNodeTypes: ['Challenge'], 
        isCore: true 
      },
      { 
        name: 'USES_OBJECT', 
        description: 'Indicates a person uses an object',
        sourceNodeTypes: ['Person'], 
        targetNodeTypes: ['Object'], 
        isCore: true 
      }
    ];
    
    for (const edgeType of edgeTypes) {
      await prisma.edgeType.create({
        data: {
          name: edgeType.name,
          description: edgeType.description,
          sourceNodeTypes: edgeType.sourceNodeTypes,
          targetNodeTypes: edgeType.targetNodeTypes,
          isCore: edgeType.isCore,
          ontologyVersionId: ontology.id,
          properties: {}
        }
      });
      console.log(`Created edge type: ${edgeType.name}`);
    }
    
    // Create default perspective for system
    try {
      // Find any user to associate with the default perspective
      const anyUser = await prisma.user.findFirst({
        select: { user_id: true }
      });
      
      if (!anyUser) {
        console.log('No users found in the system. Creating a test user first...');
        // Create a test user if none exists
        const testUser = await prisma.user.create({
          data: {
            user_id: '00000000-0000-0000-0000-000000000000',
            email: 'system@2dots1line.com',
            password_hash: 'system-password-hash',
            first_name: 'System',
            last_name: 'User',
            signup_timestamp: new Date()
          }
        });
        console.log(`Created system user with ID: ${testUser.user_id}`);
        
        // Create the perspective with the new user
        await prisma.perspective.create({
          data: {
            name: 'Default',
            description: 'Default system perspective',
            userId: testUser.user_id
          }
        });
      } else {
        // Create the perspective with an existing user
        await prisma.perspective.create({
          data: {
            name: 'Default',
            description: 'Default system perspective',
            userId: anyUser.user_id
          }
        });
      }
      
      console.log('Default perspective created successfully');
    } catch (perspectiveError) {
      console.error('Error creating default perspective:', perspectiveError);
      console.log('Continuing ontology initialization without perspective...');
    }
    
    console.log('Ontology initialization complete!');
  } catch (error) {
    console.error('Error initializing ontology:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check for --force flag
const forceReset = process.argv.includes('--force');

if (forceReset) {
  // Delete existing ontology if force flag is provided
  console.log('Force reset requested. Deleting existing ontology...');
  
  Promise.resolve()
    .then(() => prisma.edgeType.deleteMany({}))
    .then(() => prisma.nodeType.deleteMany({}))
    .then(() => prisma.ontologyVersion.deleteMany({}))
    .then(() => prisma.perspective.deleteMany({ where: { name: 'Default' } }))
    .then(() => initializeOntology())
    .catch(error => console.error('Error during force reset:', error))
    .finally(() => prisma.$disconnect());
} else {
  // Just initialize
  initializeOntology();
} 