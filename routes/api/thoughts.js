/**
 * API route for thought extraction and knowledge graph management
 */

const express = require('express');
const router = express.Router();
const { extractEntitiesAndRelations } = require('../../services/aiService');
const { storeKnowledgeGraph, queryKnowledgeGraph } = require('../../services/neo4jService');
const { v4: uuidv4 } = require('uuid');
const auth = require('../../middleware/auth');

/**
 * Extract entities and relations from text and store in knowledge graph
 * @route POST /api/thoughts/extract
 * @access Private
 */
router.post('/extract', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id;
    const interactionId = uuidv4();
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Text input is required' });
    }
    
    console.log(`[INFO] Processing thought extraction for user: ${userId}`);
    
    // Extract entities and relations using AI service
    const extractionResult = await extractEntitiesAndRelations(text);
    
    if (!extractionResult || !Array.isArray(extractionResult)) {
      return res.status(500).json({ error: 'Failed to extract entities and relations' });
    }
    
    // Store the extracted data in Neo4j
    const graphResult = await storeKnowledgeGraph(
      userId,
      interactionId,
      extractionResult
    );
    
    // Return the extraction results and storage summary
    return res.json({
      success: true,
      interactionId,
      extracted: extractionResult,
      graphSummary: graphResult
    });
    
  } catch (error) {
    console.error('[ERROR] Thought extraction failed:', error);
    return res.status(500).json({ 
      error: 'Failed to process and store thought',
      message: error.message
    });
  }
});

/**
 * Get knowledge graph data for visualization
 * @route GET /api/thoughts/graph
 * @access Private
 */
router.get('/graph', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const graphData = await queryKnowledgeGraph(userId);
    
    return res.json({
      success: true,
      graph: graphData
    });
  } catch (error) {
    console.error('[ERROR] Knowledge graph query failed:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve knowledge graph',
      message: error.message
    });
  }
});

module.exports = router; 