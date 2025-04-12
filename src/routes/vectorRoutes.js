const express = require('express');
const router = express.Router();
const vectorUtils = require('../models/vectorUtils');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// All vector routes are protected by authentication
router.use(authMiddleware.verifyToken);

/**
 * Search for similar memories based on text query
 * POST /api/vector/search
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 5, minScore = 0.7 } = req.body;
    const user_id = req.user.user_id;
    
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return res.status(400).json({ error: 'Search query must be at least 3 characters' });
    }
    
    // Generate embeddings for the query
    const embeddings = await vectorUtils.generateEmbeddings(query);
    
    // Search for similar vectors
    const results = await vectorUtils.searchSimilarVectors(
      user_id, 
      embeddings.vector,
      limit,
      minScore
    );
    
    // Fetch the full interaction data for each result
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        const interaction = await prisma.interaction.findUnique({
          where: { interaction_id: result.metadata.interaction_id }
        });
        
        return {
          ...result,
          interaction: interaction || { note: 'Interaction not found' }
        };
      })
    );
    
    res.status(200).json({
      query,
      results: enrichedResults,
      total: enrichedResults.length
    });
    
  } catch (error) {
    console.error('Error searching vector database:', error);
    res.status(500).json({ error: 'Failed to search for memories' });
  }
});

/**
 * Get vector statistics for a user
 * GET /api/vector/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    // Count processed interactions
    const processedCount = await prisma.interaction.count({
      where: { 
        user_id,
        processed_flag: true
      }
    });
    
    // Count unprocessed interactions
    const unprocessedCount = await prisma.interaction.count({
      where: { 
        user_id,
        processed_flag: false
      }
    });
    
    // Get breakdown by interaction type
    const interactionTypes = await prisma.interaction.groupBy({
      by: ['interaction_type'],
      where: { user_id },
      _count: true
    });
    
    // Format the type breakdown
    const typeBreakdown = interactionTypes.map(item => ({
      type: item.interaction_type,
      count: item._count
    }));
    
    res.status(200).json({
      total: processedCount + unprocessedCount,
      processed: processedCount,
      unprocessed: unprocessedCount,
      typeBreakdown
    });
    
  } catch (error) {
    console.error('Error getting vector stats:', error);
    res.status(500).json({ error: 'Failed to retrieve vector statistics' });
  }
});

/**
 * Process all unprocessed interactions for a user
 * POST /api/vector/process-all
 */
router.post('/process-all', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    // Find all unprocessed interactions
    const unprocessedInteractions = await prisma.interaction.findMany({
      where: { 
        user_id,
        processed_flag: false
      },
      orderBy: { timestamp: 'asc' }
    });
    
    if (unprocessedInteractions.length === 0) {
      return res.status(200).json({ 
        message: 'No unprocessed interactions found',
        processed: 0
      });
    }
    
    // Process each interaction (not waiting for all to complete)
    const processingPromise = Promise.all(
      unprocessedInteractions.map(async (interaction) => {
        try {
          // Process vector embedding
          const vectorResult = await vectorUtils.processInteractionVector(interaction);
          
          // Update the interaction
          await prisma.interaction.update({
            where: { interaction_id: interaction.interaction_id },
            data: {
              processed_flag: true,
              processing_notes: JSON.stringify({
                vector_processing: vectorResult,
                graph_processing: { status: 'not_implemented' }
              })
            }
          });
          
          return { success: true, interaction_id: interaction.interaction_id };
        } catch (error) {
          console.error(`Error processing interaction ${interaction.interaction_id}:`, error);
          return { success: false, interaction_id: interaction.interaction_id, error: error.message };
        }
      })
    );
    
    // Return immediately with status that processing has begun
    res.status(202).json({ 
      message: 'Processing started',
      total: unprocessedInteractions.length,
      estimated_time_seconds: unprocessedInteractions.length * 2 // Rough estimate
    });
    
    // Continue processing in the background
    processingPromise.then(results => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`Batch processing completed: ${successful} succeeded, ${failed} failed`);
    }).catch(error => {
      console.error('Error in batch processing:', error);
    });
    
  } catch (error) {
    console.error('Error initiating batch processing:', error);
    res.status(500).json({ error: 'Failed to initiate batch processing' });
  }
});

module.exports = router; 