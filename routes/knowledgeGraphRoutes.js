/**
 * Knowledge Graph API Routes
 * Handles all knowledge graph related endpoints
 */

const express = require('express');
const router = express.Router();
const knowledgeGraphService = require('../services/knowledgeGraphService');
const { authenticateJWT } = require('../middleware/auth');
const authMiddleware = require('../middleware/authMiddleware');
const neo4jService = require('../services/neo4jService');

// All routes require authentication
router.use(authMiddleware.verifyToken);

/**
 * @route POST /api/knowledge/extract
 * @desc Extract knowledge from a message and store in graph
 * @access Private
 */
router.post('/extract', authenticateJWT, async (req, res) => {
  try {
    const { message, interactionId } = req.body;
    
    if (!message || !interactionId) {
      return res.status(400).json({ error: 'Message and interactionId are required' });
    }
    
    const userId = req.user.id;
    const result = await knowledgeGraphService.processMessageForKnowledge(
      message,
      interactionId,
      userId
    );
    
    res.json(result);
  } catch (error) {
    console.error('Knowledge extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route DELETE /api/knowledge/interaction/:interactionId
 * @desc Delete all knowledge extracted from a specific interaction
 * @access Private
 */
router.delete('/interaction/:interactionId', authenticateJWT, async (req, res) => {
  try {
    const { interactionId } = req.params;
    
    if (!interactionId) {
      return res.status(400).json({ error: 'InteractionId is required' });
    }
    
    const result = await knowledgeGraphService.deleteKnowledgeByInteractionId(interactionId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Delete knowledge error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/knowledge/entities
 * @desc Search for entities by name pattern
 * @access Private
 */
router.get('/entities', authenticateJWT, async (req, res) => {
  try {
    const { query, limit } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const entities = await knowledgeGraphService.queryEntitiesByName(
      query,
      limit ? parseInt(limit) : 10
    );
    
    res.json({ entities });
  } catch (error) {
    console.error('Entity search error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/knowledge/entity/:name/neighborhood
 * @desc Get an entity and its neighborhood
 * @access Private
 */
router.get('/entity/:name/neighborhood', authenticateJWT, async (req, res) => {
  try {
    const { name } = req.params;
    const { depth } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Entity name is required' });
    }
    
    const neighborhood = await knowledgeGraphService.getEntityNeighborhood(
      name,
      depth ? parseInt(depth) : 1
    );
    
    res.json(neighborhood);
  } catch (error) {
    console.error('Neighborhood query error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process a message for knowledge extraction
 * POST /api/knowledge/process
 */
router.post('/process', async (req, res) => {
  try {
    const { message, interactionId } = req.body;
    const userId = req.user.user_id;
    
    if (!message || !interactionId) {
      return res.status(400).json({ error: 'Message and interactionId are required' });
    }
    
    const result = await knowledgeGraphService.processMessageForKnowledge(
      message,
      interactionId,
      userId
    );
    
    res.status(200).json({
      message: 'Knowledge extraction completed successfully',
      result
    });
  } catch (error) {
    console.error('Error processing knowledge:', error);
    res.status(500).json({ error: 'Failed to process knowledge' });
  }
});

/**
 * Delete knowledge associated with an interaction
 * DELETE /api/knowledge/interaction/:id
 */
router.delete('/interaction/:id', async (req, res) => {
  try {
    const interactionId = req.params.id;
    
    const result = await knowledgeGraphService.deleteKnowledgeByInteractionId(interactionId);
    
    if (result.success) {
      res.status(200).json({
        message: `Successfully deleted ${result.deletedCount} knowledge items`,
        result
      });
    } else {
      res.status(500).json({
        message: 'Failed to delete knowledge',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    res.status(500).json({ error: 'Failed to delete knowledge' });
  }
});

/**
 * Search for entities by name
 * GET /api/knowledge/entities
 */
router.get('/entities', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const entities = await knowledgeGraphService.queryEntitiesByName(
      query,
      parseInt(limit)
    );
    
    res.status(200).json({
      count: entities.length,
      entities
    });
  } catch (error) {
    console.error('Error querying entities:', error);
    res.status(500).json({ error: 'Failed to query entities' });
  }
});

/**
 * Get neighborhood of an entity
 * GET /api/knowledge/neighborhood/:name
 */
router.get('/neighborhood/:name', async (req, res) => {
  try {
    const entityName = req.params.name;
    const { depth = 1 } = req.query;
    
    const neighborhood = await knowledgeGraphService.getEntityNeighborhood(
      entityName,
      parseInt(depth)
    );
    
    res.status(200).json(neighborhood);
  } catch (error) {
    console.error('Error getting entity neighborhood:', error);
    res.status(500).json({ error: 'Failed to get entity neighborhood' });
  }
});

/**
 * Create a custom entity
 * POST /api/knowledge/entity
 */
router.post('/entity', async (req, res) => {
  try {
    const { name, type, properties = {} } = req.body;
    const userId = req.user.user_id;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Entity name and type are required' });
    }
    
    // Initialize Neo4j connection
    await neo4jService.init();
    
    // Add user ID and timestamp to properties
    const entityProperties = {
      ...properties,
      sourceUserId: userId,
      manuallyCreated: true,
      createdAt: new Date().toISOString()
    };
    
    // Create the entity
    const entity = await neo4jService.createCustomEntity(type, name, entityProperties);
    
    // Close Neo4j connection
    await neo4jService.close();
    
    res.status(201).json({
      message: 'Entity created successfully',
      entity
    });
  } catch (error) {
    console.error('Error creating entity:', error);
    await neo4jService.close();
    res.status(500).json({ error: 'Failed to create entity' });
  }
});

/**
 * Create a custom relationship
 * POST /api/knowledge/relationship
 */
router.post('/relationship', async (req, res) => {
  try {
    const { sourceName, targetName, type, properties = {} } = req.body;
    const userId = req.user.user_id;
    
    if (!sourceName || !targetName || !type) {
      return res.status(400).json({ error: 'Source entity, target entity, and relationship type are required' });
    }
    
    // Initialize Neo4j connection
    await neo4jService.init();
    
    // Add user ID and timestamp to properties
    const relationshipProperties = {
      ...properties,
      sourceUserId: userId,
      manuallyCreated: true,
      createdAt: new Date().toISOString()
    };
    
    // Create the relationship
    const relationship = await neo4jService.createCustomRelationship(
      sourceName,
      targetName,
      type,
      relationshipProperties
    );
    
    // Close Neo4j connection
    await neo4jService.close();
    
    res.status(201).json({
      message: 'Relationship created successfully',
      relationship
    });
  } catch (error) {
    console.error('Error creating relationship:', error);
    await neo4jService.close();
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

/**
 * Get available node types
 * GET /api/knowledge/types/nodes
 */
router.get('/types/nodes', async (req, res) => {
  // Return the predefined node types
  const nodeTypes = [
    { type: 'Person', description: 'People mentioned by name' },
    { type: 'Trait', description: 'Character traits, personality attributes' },
    { type: 'Interest', description: 'Hobbies, activities, topics of interest' },
    { type: 'Value', description: 'Personal values, principles, beliefs' },
    { type: 'Event', description: 'Specific occurrences, happenings' },
    { type: 'Emotion', description: 'Feelings, emotional states' },
    { type: 'Action', description: 'Things done or to be done' },
    { type: 'Challenge', description: 'Problems, difficulties, obstacles' },
    { type: 'Location', description: 'Places, geographic entities' },
    { type: 'Organization', description: 'Companies, institutions, groups' },
    { type: 'Concept', description: 'Abstract ideas, theories' },
    { type: 'Goal', description: 'Objectives, aspirations' },
    { type: 'System', description: 'Contexts, environments (e.g., family system)' }
  ];
  
  res.status(200).json(nodeTypes);
});

/**
 * Get available relationship types
 * GET /api/knowledge/types/relationships
 */
router.get('/types/relationships', async (req, res) => {
  // Return the predefined relationship types
  const relationshipTypes = [
    { type: 'HAS_TRAIT', description: 'Links Person to Trait' },
    { type: 'PURSUES_INTEREST', description: 'Links Person to Interest' },
    { type: 'MOTIVATED_BY', description: 'Links Person/Action to Value' },
    { type: 'EXPERIENCED_EVENT', description: 'Links Person to Event' },
    { type: 'REACTED_WITH', description: 'Links Event to Emotion' },
    { type: 'TOOK_ACTION', description: 'Links Person to Action' },
    { type: 'GUIDED_BY', description: 'Links Action to Value/Goal' },
    { type: 'FACES_CHALLENGE', description: 'Links Person to Challenge' },
    { type: 'EMBEDS_INTO', description: 'Links Person to System' },
    { type: 'WORKS_AT', description: 'Links Person to Organization' },
    { type: 'LOCATED_IN', description: 'Links Person to Location' },
    { type: 'KNOWS', description: 'Links Person to Person' },
    { type: 'HAS_AFFECTION_FOR', description: 'Links Person to Person/Thing' },
    { type: 'INVOLVED_IN', description: 'Links Person to Event/Action' },
    { type: 'GIVEN_TO', description: 'Links Trait/Emotion to Person' },
    { type: 'OFFERED', description: 'Links Person to Service/Thing' },
    { type: 'HAS_RELATIONSHIP_WITH', description: 'Links Person to Person' },
    { type: 'REQUIRED_FOR', description: 'Links Interest/Skill to Goal' },
    { type: 'HAS_PET', description: 'Links Person to Pet' }
  ];
  
  res.status(200).json(relationshipTypes);
});

module.exports = router; 