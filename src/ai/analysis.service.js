/**
 * Analysis Service
 * Orchestrates the analysis of user interactions to extract thoughts,
 * identify entities and relationships, and build the knowledge graph.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiService = require('../ai/ai.service');
const thoughtService = require('../thoughts/thought.service');
const graphMappingService = require('../graph/graph-mapping.service');

/**
 * Process an interaction to extract thoughts and build graph
 * @param {string} interactionId - The ID of the interaction to analyze
 * @returns {Promise<object>} - Results of the analysis process
 */
async function analyzeInteraction(interactionId) {
  try {
    console.log(`[INFO] Starting analysis for interaction ${interactionId}`);
    
    // Step 1: Retrieve the interaction
    const interaction = await prisma.interaction.findUnique({
      where: { interaction_id: interactionId },
      include: { user: true }
    });
    
    if (!interaction) {
      throw new Error(`Interaction ${interactionId} not found`);
    }
    
    // Step 2: Extract text content from the interaction
    let textToAnalyze;
    try {
      // Handle different interaction types
      if (typeof interaction.raw_data === 'string') {
        textToAnalyze = interaction.raw_data;
      } else {
        // Assuming raw_data is a JSON object
        const rawData = typeof interaction.raw_data === 'object' 
          ? interaction.raw_data 
          : JSON.parse(interaction.raw_data);
          
        // Extract message from different interaction types
        if (interaction.interaction_type === 'user_message' && rawData.message) {
          textToAnalyze = rawData.message;
        } else if (interaction.interaction_type === 'document_upload' && rawData.extractedText) {
          textToAnalyze = rawData.extractedText;
        } else if (interaction.interaction_type === 'image_upload' && rawData.analysis) {
          textToAnalyze = rawData.analysis;
        } else if (rawData.message) {
          textToAnalyze = rawData.message;
        } else {
          // Fallback to stringifying the object if no clear text field
          textToAnalyze = JSON.stringify(rawData);
        }
      }
    } catch (parseError) {
      console.error('[ERROR] Failed to parse interaction content:', parseError);
      throw new Error(`Failed to extract analyzable text: ${parseError.message}`);
    }
    
    if (!textToAnalyze || textToAnalyze.trim() === '') {
      throw new Error('No text content to analyze in interaction');
    }
    
    // Step 3: Call the AI service to extract thoughts
    console.log(`[INFO] Extracting thoughts from text (${textToAnalyze.length} chars)`);
    const thoughtAnalysis = await aiService.extractThoughts(textToAnalyze);
    
    // Step 4: Check if any segments need clarification
    const needsClarification = thoughtAnalysis.some(t => t.needsClarification);
    
    if (needsClarification) {
      // Store the analysis temporarily and flag for clarification
      // This is a placeholder - in the real system, we'd need to:
      // 1. Store the pending analysis
      // 2. Generate a clarification question for the user
      // 3. Wait for the user's response
      // 4. Resume processing with the clarification
      
      console.log('[INFO] Clarification needed for some extracted thoughts');
      
      // Update the interaction with a note
      await prisma.interaction.update({
        where: { interaction_id: interactionId },
        data: {
          processed_flag: true,
          processing_notes: 'Clarification needed for some extracted thoughts'
        }
      });
      
      return {
        success: false,
        needsClarification: true,
        clarificationItems: thoughtAnalysis.filter(t => t.needsClarification)
      };
    }
    
    // Step 5: Create thoughts from the analysis
    const createdThoughts = await thoughtService.createThoughtsFromAnalysis(
      thoughtAnalysis,
      interactionId,
      interaction.user_id
    );
    
    // Step 6: Map the thoughts to the knowledge graph
    const graphResults = await graphMappingService.mapThoughtsToGraph(createdThoughts);
    
    // Step 7: Mark the interaction as processed
    await prisma.interaction.update({
      where: { interaction_id: interactionId },
      data: {
        processed_flag: true,
        processing_notes: `Processed successfully. Created ${createdThoughts.length} thoughts and updated graph.`
      }
    });
    
    console.log(`[INFO] Completed analysis for interaction ${interactionId}`);
    
    return {
      success: true,
      interactionId,
      thoughts: createdThoughts.map(t => t.thought),
      graphResults
    };
  } catch (error) {
    console.error(`[ERROR] Analysis failed for interaction ${interactionId}:`, error);
    
    // Update the interaction with the error
    try {
      await prisma.interaction.update({
        where: { interaction_id: interactionId },
        data: {
          processed_flag: true, // Mark as processed even though it failed
          processing_notes: `Analysis failed: ${error.message}`
        }
      });
    } catch (updateError) {
      console.error('[ERROR] Failed to update interaction with error:', updateError);
    }
    
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

/**
 * Process a clarification response to continue analysis
 * @param {string} interactionId - The original interaction being clarified
 * @param {string} clarificationId - The ID of the clarification interaction
 * @param {object} originalAnalysis - The original, incomplete analysis
 * @returns {Promise<object>} - Results after incorporating clarification
 */
async function processClarification(interactionId, clarificationId, originalAnalysis) {
  try {
    // This is a placeholder for the clarification flow
    // In a complete implementation, we would:
    // 1. Retrieve the clarification interaction
    // 2. Update the original analysis with the clarified information
    // 3. Continue with thought creation and graph mapping
    
    console.log(`[INFO] Processing clarification ${clarificationId} for interaction ${interactionId}`);
    
    // Just return a success message for now
    return {
      success: true,
      message: 'Clarification flow not yet implemented'
    };
  } catch (error) {
    console.error('[ERROR] Failed to process clarification:', error);
    throw new Error(`Failed to process clarification: ${error.message}`);
  }
}

/**
 * Process unprocessed interactions for a user
 * @param {string} userId - The user's ID
 * @param {number} limit - Maximum number of interactions to process
 * @returns {Promise<object>} - Summary of processing results
 */
async function processUnprocessedInteractions(userId, limit = 10) {
  try {
    console.log(`[INFO] Processing unprocessed interactions for user ${userId}`);
    
    // Find unprocessed interactions
    const interactions = await prisma.interaction.findMany({
      where: {
        user_id: userId,
        processed_flag: false,
        // Only analyze user-originated content, not AI responses
        interaction_type: {
          not: 'ai_response'
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: limit
    });
    
    console.log(`[INFO] Found ${interactions.length} unprocessed interactions`);
    
    if (interactions.length === 0) {
      return {
        success: true,
        processed: 0,
        message: 'No unprocessed interactions found'
      };
    }
    
    // Process each interaction
    const results = [];
    for (const interaction of interactions) {
      try {
        const result = await analyzeInteraction(interaction.interaction_id);
        results.push({
          interactionId: interaction.interaction_id,
          success: true,
          ...result
        });
      } catch (analysisError) {
        console.error(`[ERROR] Failed to analyze interaction ${interaction.interaction_id}:`, analysisError);
        results.push({
          interactionId: interaction.interaction_id,
          success: false,
          error: analysisError.message
        });
      }
    }
    
    // Generate a summary
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    return {
      success: failed === 0,
      total: results.length,
      successful,
      failed,
      details: results
    };
  } catch (error) {
    console.error('[ERROR] Failed to process unprocessed interactions:', error);
    throw new Error(`Failed to process unprocessed interactions: ${error.message}`);
  }
}

module.exports = {
  analyzeInteraction,
  processClarification,
  processUnprocessedInteractions
}; 