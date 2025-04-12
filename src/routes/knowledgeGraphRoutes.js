/**
 * Knowledge Graph API Routes
 * Handles all knowledge graph related endpoints
 */

const express = require('express');
const router = express.Router();
const knowledgeGraphService = require('../services/knowledgeGraphService');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @route POST /api/knowledge/extract
 * @desc Extract knowledge from a message and store in graph
 * @access Private
 */
router.post('/extract', verifyToken, async (req, res) => {
  try {
    const { message, interactionId } = req.body;
    
    if (!message || !interactionId) {
      return res.status(400).json({ error: 'Message and interactionId are required' });
    }
    
    const userId = req.user.user_id;
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
router.delete('/interaction/:interactionId', verifyToken, async (req, res) => {
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
router.get('/entities', verifyToken, async (req, res) => {
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
router.get('/entity/:name/neighborhood', verifyToken, async (req, res) => {
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

module.exports = router; 