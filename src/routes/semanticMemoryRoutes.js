/**
 * Semantic Memory Routes
 * Endpoints for managing and querying semantic memory
 */

const express = require('express');
const router = express.Router();
const semanticMemoryService = require('../services/semanticMemoryService');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * @route POST /api/semantic-memory/process
 * @desc Process raw data into semantic memory
 * @access Private
 */
router.post('/process', async (req, res) => {
  try {
    const { content, source, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const userId = req.user.user_id;
    const result = await semanticMemoryService.processRawData(
      userId, 
      content, 
      source || 'api', 
      metadata || {}
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error processing data for semantic memory:', error);
    res.status(500).json({ error: 'Failed to process data' });
  }
});

/**
 * @route POST /api/semantic-memory/thought
 * @desc Create a new thought
 * @access Private
 */
router.post('/thought', async (req, res) => {
  try {
    const { content, relatedChunkIds, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const userId = req.user.user_id;
    const result = await semanticMemoryService.createThought(
      userId, 
      content, 
      relatedChunkIds || [], 
      metadata || {}
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating thought:', error);
    res.status(500).json({ error: 'Failed to create thought' });
  }
});

/**
 * @route GET /api/semantic-memory/search
 * @desc Search semantic memory
 * @access Private
 */
router.get('/search', async (req, res) => {
  try {
    const { query, limit, threshold, type } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const userId = req.user.user_id;
    const results = await semanticMemoryService.semanticSearch(
      userId, 
      query, 
      {
        limit: limit ? parseInt(limit) : 10,
        threshold: threshold ? parseFloat(threshold) : 0.7,
        searchType: type
      }
    );
    
    res.json(results);
  } catch (error) {
    console.error('Error searching semantic memory:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * @route GET /api/semantic-memory/summary
 * @desc Generate a summary about a topic from semantic memory
 * @access Private
 */
router.get('/summary', async (req, res) => {
  try {
    const { topic } = req.query;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const userId = req.user.user_id;
    const summary = await semanticMemoryService.generateMemorySummary(userId, topic);
    
    res.json(summary);
  } catch (error) {
    console.error('Error generating memory summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

/**
 * @route GET /api/semantic-memory/stats
 * @desc Get statistics about a user's semantic memory
 * @access Private
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const stats = await semanticMemoryService.getUserMemoryStats(userId);
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting semantic memory stats:', error);
    res.status(500).json({ error: 'Failed to retrieve memory statistics' });
  }
});

module.exports = router; 