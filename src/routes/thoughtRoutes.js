/**
 * Routes for managing thoughts and knowledge graph operations.
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const analysisService = require('../ai/analysis.service');
const thoughtService = require('../thoughts/thought.service');
const graphMappingService = require('../graph/graph-mapping.service');

/**
 * Process an interaction for thoughts and knowledge graph.
 * POST /api/thoughts/analyze/:interactionId
 */
router.post('/analyze/:interactionId', verifyToken, async (req, res) => {
  try {
    const { interactionId } = req.params;
    const userId = req.user.user_id; // From authentication middleware
    
    // Analyze the interaction
    const result = await analysisService.analyzeInteraction(interactionId);
    
    // If clarification is needed, return the questions
    if (result.needsClarification) {
      return res.status(202).json({
        message: 'Clarification needed',
        needsClarification: true,
        clarificationItems: result.clarificationItems.map(item => ({
          id: item.id,
          question: item.clarificationQuestion,
          context: item.thoughtContent
        }))
      });
    }
    
    // Return success results
    res.status(200).json({
      message: 'Interaction analysis completed successfully',
      success: true,
      thoughts: result.thoughts.map(thought => ({
        id: thought.id,
        content: thought.content,
        subjectType: thought.subjectType,
        subjectName: thought.subjectName
      })),
      graphUpdates: {
        nodesCreated: result.graphResults.successful,
        relationshipsCreated: result.graphResults.successful
      }
    });
  } catch (error) {
    console.error('[ERROR] Failed to analyze interaction:', error);
    res.status(500).json({ 
      message: 'Failed to analyze interaction',
      error: error.message 
    });
  }
});

/**
 * Process a batch of unprocessed interactions for a user.
 * POST /api/thoughts/process-batch
 */
router.post('/process-batch', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id; // From authentication middleware
    const { limit = 5 } = req.body;
    
    // Process unprocessed interactions
    const result = await analysisService.processUnprocessedInteractions(userId, limit);
    
    res.status(200).json({
      message: `Processed ${result.successful} out of ${result.total} interactions`,
      success: result.success,
      total: result.total,
      successful: result.successful,
      failed: result.failed
    });
  } catch (error) {
    console.error('[ERROR] Failed to process interaction batch:', error);
    res.status(500).json({ 
      message: 'Failed to process interaction batch',
      error: error.message 
    });
  }
});

/**
 * Get all thoughts for a user.
 * GET /api/thoughts
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id; // From authentication middleware
    const { limit = 100, offset = 0 } = req.query;
    
    // Get thoughts for the user
    const thoughts = await thoughtService.getThoughtsByUser(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({
      thoughts: thoughts
    });
  } catch (error) {
    console.error('[ERROR] Failed to get thoughts:', error);
    res.status(500).json({ 
      message: 'Failed to get thoughts',
      error: error.message 
    });
  }
});

/**
 * Get thoughts related to a specific interaction.
 * GET /api/thoughts/by-interaction/:interactionId
 */
router.get('/by-interaction/:interactionId', verifyToken, async (req, res) => {
  try {
    const { interactionId } = req.params;
    
    // Get thoughts for the interaction
    const thoughts = await thoughtService.getThoughtsByInteraction(interactionId);
    
    res.status(200).json({
      thoughts: thoughts
    });
  } catch (error) {
    console.error('[ERROR] Failed to get thoughts for interaction:', error);
    res.status(500).json({ 
      message: 'Failed to get thoughts for interaction',
      error: error.message 
    });
  }
});

/**
 * Get the knowledge graph for a user.
 * GET /api/thoughts/graph
 */
router.get('/graph', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id; // From authentication middleware
    
    // Get the knowledge graph
    const graph = await graphMappingService.getUserKnowledgeGraph(userId);
    
    res.status(200).json({
      graph: graph
    });
  } catch (error) {
    console.error('[ERROR] Failed to get knowledge graph:', error);
    res.status(500).json({ 
      message: 'Failed to get knowledge graph',
      error: error.message 
    });
  }
});

/**
 * Get a graph focused on a specific person.
 * GET /api/thoughts/graph/:personName
 */
router.get('/graph/:personName', verifyToken, async (req, res) => {
  try {
    const { personName } = req.params;
    const { depth = 2 } = req.query;
    
    // Get the person-centric graph
    const graph = await graphMappingService.getPersonGraph(personName, parseInt(depth));
    
    res.status(200).json({
      graph: graph
    });
  } catch (error) {
    console.error('[ERROR] Failed to get person graph:', error);
    res.status(500).json({ 
      message: 'Failed to get person graph',
      error: error.message 
    });
  }
});

module.exports = router; 