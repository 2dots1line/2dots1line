const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const vectorUtils = require('../models/vectorUtils');
const fileProcessor = require('../utils/fileProcessor');
const path = require('path');
const prisma = new PrismaClient();
const fs = require('fs-extra');
// Import thought service
const thoughtService = require('../services/thoughtService');
const knowledgeGraphService = require('../services/knowledgeGraphService');
const semanticMemoryService = require('../services/semanticMemoryService');

/**
 * Create a new interaction
 */
exports.createInteraction = async (req, res) => {
  console.log('⭐ Interaction controller received request:', JSON.stringify(req.body, null, 2));
  
  try {
    const userId = req.user.user_id;
    const { 
      session_id, 
      interaction_type, 
      raw_data, 
      metadata 
    } = req.body;

    if (!session_id || !interaction_type || !raw_data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Processing interaction from user ${userId}, session ${session_id}`);

    // Create the interaction in the database
    const interaction = await prisma.interaction.create({
      data: {
        interaction_id: uuidv4(),
        interaction_type: interaction_type,
        raw_data: typeof raw_data === 'object' ? raw_data : JSON.parse(raw_data),
        metadata: metadata ? (typeof metadata === 'object' ? metadata : JSON.parse(metadata)) : null,
        user: { connect: { user_id: userId } },
        session_id: session_id
      }
    });
    
    console.log(`Interaction created with ID: ${interaction.interaction_id}`);
    
    // Handle the message - get AI response
    let aiResponse;
    if (interaction_type === 'chat') {
      // Log the chat message
      const message = raw_data.message;
      console.log(`Processing chat message: "${message?.substring(0, 50)}..."`);
      
      // Process message for semantic memory
      if (message && message.length >= 5) {
        try {
          console.log(`💾 Processing message for semantic memory, userId=${userId}`);
          const memoryResult = await semanticMemoryService.processRawData(
            userId,
            message,
            'chat_message',
            { timestamp: new Date().toISOString(), sessionId: session_id }
          );
          console.log(`✅ Semantic memory processing complete:`, JSON.stringify(memoryResult || {}, null, 2));
          
          // Calculate importance score for automatic thought extraction
          const thoughtService = require('../services/thoughtService');
          const importanceScore = await thoughtService.calculateImportanceScore(message, 'chat_message');
          
          // If message is important enough, automatically process for thoughts
          if (importanceScore >= 0.6) {
            console.log(`🔍 Message importance score ${importanceScore.toFixed(2)} meets threshold, processing for thoughts`);
            thoughtService.processInteractionForThoughts(interaction.interaction_id)
              .then(thoughts => {
                console.log(`✅ Automatic thought extraction complete, created ${thoughts.length} thoughts`);
              })
              .catch(error => {
                console.error(`❌ Error in automatic thought extraction:`, error);
              });
          } else {
            console.log(`ℹ️ Message importance score ${importanceScore.toFixed(2)} below threshold, skipping automatic thought extraction`);
          }
        } catch (memoryError) {
          console.error('❌ Error processing message for semantic memory:', memoryError);
        }
      }
      
      // Generate AI response
      const messageContent = raw_data.message;
      
      try {
        aiResponse = await generateAiResponse(userId, messageContent, session_id);
        console.log(`✅ Generated AI response using Gemini: "${aiResponse.text?.substring(0, 50)}..."`);
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
        aiResponse = { 
          text: "I'm having trouble processing that right now. Can you try again?",
          type: "text"
        };
      }
      
      // Process AI response for semantic memory as well
      if (aiResponse.text && aiResponse.text.length >= 5) {
        try {
          console.log(`💾 Processing AI response for semantic memory`);
          const responseMemoryResult = await semanticMemoryService.processRawData(
            userId,
            aiResponse.text,
            'ai_response',
            { timestamp: new Date().toISOString(), sessionId: session_id }
          );
          console.log(`✅ AI response semantic memory processing complete:`, JSON.stringify(responseMemoryResult || {}, null, 2));
          
          // For AI responses, only process truly insightful ones for thoughts
          const importanceScore = await thoughtService.calculateImportanceScore(aiResponse.text, 'ai_response');
          if (importanceScore >= 0.7) { // Higher threshold for AI responses
            thoughtService.processInteractionForThoughts(interaction.interaction_id)
              .then(thoughts => {
                console.log(`✅ Automatic thought extraction from AI response complete, created ${thoughts.length} thoughts`);
              })
              .catch(error => {
                console.error(`❌ Error in automatic thought extraction from AI response:`, error);
              });
          }
        } catch (memoryError) {
          console.error('❌ Error processing AI response for semantic memory:', memoryError);
        }
      }
    }
    
    // Return the result
    return res.status(201).json({
      success: true,
      interactionId: interaction.interaction_id,
      aiResponse
    });
    
  } catch (error) {
    console.error('Error in createInteraction:', error);
    return res.status(500).json({ 
      error: 'Failed to process interaction',
      details: error.message 
    });
  }
};

/**
 * Get user interactions
 */
exports.getUserInteractions = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { limit = 20, offset = 0, session_id } = req.query;
    
    // Build the query
    const query = {
      where: { user_id },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    };
    
    // Add session filter if provided
    if (session_id) {
      query.where.session_id = session_id;
    }
    
    const interactions = await prisma.interaction.findMany(query);
    const total = await prisma.interaction.count({ where: query.where });
    
    res.status(200).json({
      interactions,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
};

/**
 * Get a specific interaction
 */
exports.getInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    
    const interaction = await prisma.interaction.findUnique({
      where: { interaction_id: id }
    });
    
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    // Security check: ensure the interaction belongs to the requesting user
    if (interaction.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized access to this interaction' });
    }
    
    res.status(200).json(interaction);
  } catch (error) {
    console.error('Error fetching interaction:', error);
    res.status(500).json({ error: 'Failed to fetch interaction' });
  }
};

/**
 * Update interaction processing status
 */
exports.updateProcessingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { processed_flag, processing_notes } = req.body;
    const user_id = req.user.user_id;
    
    // Find the interaction first
    const interaction = await prisma.interaction.findUnique({
      where: { interaction_id: id }
    });
    
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    // Security check: ensure the interaction belongs to the requesting user
    if (interaction.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized access to this interaction' });
    }
    
    // Update the interaction
    const updatedInteraction = await prisma.interaction.update({
      where: { interaction_id: id },
      data: {
        processed_flag: processed_flag !== undefined ? processed_flag : interaction.processed_flag,
        processing_notes: processing_notes !== undefined ? processing_notes : interaction.processing_notes
      }
    });
    
    res.status(200).json({
      message: 'Interaction processing status updated successfully',
      interaction: updatedInteraction
    });
  } catch (error) {
    console.error('Error updating interaction:', error);
    res.status(500).json({ error: 'Failed to update interaction' });
  }
};

/**
 * Delete an interaction
 */
exports.deleteInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    
    // Find the interaction first
    const interaction = await prisma.interaction.findUnique({
      where: { interaction_id: id }
    });
    
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    // Security check: ensure the interaction belongs to the requesting user
    if (interaction.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized access to this interaction' });
    }
    
    // Delete the interaction
    await prisma.interaction.delete({
      where: { interaction_id: id }
    });
    
    res.status(200).json({ message: 'Interaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting interaction:', error);
    res.status(500).json({ error: 'Failed to delete interaction' });
  }
};

/**
 * AI Response Generation via Google Gemini API
 */
async function generateAiResponse(userId, message, additionalContext = '') {
  console.log(`[DEBUG] generateAiResponse called for user: ${userId}, message: "${message.substring(0,50)}..."`);
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[ERROR] GEMINI_API_KEY is not defined');
      return { text: "I'm sorry, my configuration is incomplete. Please contact support." }; // More specific error
    }
    
    // Load prompt configuration
    const fs = require('fs');
    const path = require('path');
    let promptConfig;
    
    try {
      const promptConfigPath = path.join(__dirname, '../../prompts/dot-prompts.json');
      promptConfig = JSON.parse(fs.readFileSync(promptConfigPath, 'utf8'));
    } catch (error) {
      console.error('Error loading prompt configuration:', error);
      promptConfig = {
        system_prompt: {
          base: "You are Dot, the AI assistant for 2Dots1Line, a platform that helps users capture and connect their thoughts."
        }
      };
    }
    
    // Get user info for personalization
    console.log(`[DEBUG] Fetching user info for ${userId}`);
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { first_name: true, email: true }
    });
    console.log(`[DEBUG] User info fetched: ${user ? user.first_name : 'Not found'}`);
    
    // Fetch recent interactions for context
    console.log(`[DEBUG] Fetching interaction history for ${userId}`);
    const recentInteractions = await prisma.interaction.findMany({
      where: { 
        user_id: userId,
        interaction_type: { in: ['chat', 'ai_response'] }
      },
      orderBy: { timestamp: 'asc' },
      take: 10,
      select: { interaction_type: true, raw_data: true }
    });
    console.log(`[DEBUG] Interaction history fetched: ${recentInteractions.length} items`);
    
    // Build conversation history from recent interactions
    const conversationHistory = [];
    recentInteractions.forEach(interaction => {
      const message = interaction.raw_data?.message || "";
      if (message) {
        if (interaction.interaction_type === 'chat') {
          conversationHistory.push({ role: 'user', text: message });
        } else if (interaction.interaction_type === 'ai_response') {
          conversationHistory.push({ role: 'assistant', text: message });
        }
      }
    });
    
    // Build the context/prompt
    let systemPrompt = promptConfig.system_prompt.base;
    
    // Add capabilities and personality traits
    if (promptConfig.system_prompt.capabilities) {
      systemPrompt += "\n\nCapabilities:\n" + promptConfig.system_prompt.capabilities.map(cap => `- ${cap}`).join("\n");
    }
    
    if (promptConfig.system_prompt.personality_traits) {
      systemPrompt += "\n\nPersonality:\n" + promptConfig.system_prompt.personality_traits.map(trait => `- ${trait}`).join("\n");
    }
    
    // Add dos and don'ts
    if (promptConfig.dos_and_donts) {
      if (promptConfig.dos_and_donts.dos) {
        systemPrompt += "\n\nDos:\n" + promptConfig.dos_and_donts.dos.map(item => `- ${item}`).join("\n");
      }
      if (promptConfig.dos_and_donts.donts) {
        systemPrompt += "\n\nDon'ts:\n" + promptConfig.dos_and_donts.donts.map(item => `- ${item}`).join("\n");
      }
    }
    
    // Add few-shot examples if available
    let fewShotExamples = "";
    if (promptConfig.few_shot_examples && promptConfig.few_shot_examples.length > 0) {
      fewShotExamples = "\n\nHere are some examples of good responses:\n\n";
      promptConfig.few_shot_examples.forEach(example => {
        fewShotExamples += `User: ${example.user}\nAssistant: ${example.assistant}\n\n`;
      });
    }
    
    // Add user-specific context
    let userContext = "";
    if (user && user.first_name) {
      userContext = `\n\nYou're speaking with ${user.first_name}. Address them by name naturally but not in every response.`;
    }
    
    // Add conversation history context if available
    let historyContext = "";
    if (conversationHistory.length > 0) {
      historyContext = "\n\nRecent conversation history (oldest first):\n";
      conversationHistory.forEach((turn) => {
        historyContext += `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.text}\n`;
      });
    }
    
    // Combine all context
    const fullPrompt = systemPrompt + fewShotExamples + userContext + historyContext;
    
    // For debugging only
    // console.log('Full prompt:', fullPrompt);
    
    // Call Gemini API
    console.log(`[DEBUG] Calling Gemini API...`);
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: fullPrompt },
              { text: message }
            ]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log(`[DEBUG] Gemini API response status: ${response.status}`);
    
    // Extract and return the response text
    if (response.data && 
        response.data.candidates && 
        response.data.candidates[0] && 
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0]) {
      return { text: response.data.candidates[0].content.parts[0].text };
    } else {
      console.error('Unexpected Gemini API response structure', response.data);
      return { text: "I'm sorry, I couldn't process your request. Please try again." };
    }
  } catch (error) {
    // --- DEBUG LOGGING START ---
    console.error('[ERROR] Error caught in generateAiResponse:', error);
    if (error.response) {
        // Axios error
        console.error('[ERROR] Gemini API Error Status:', error.response.status);
        console.error('[ERROR] Gemini API Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
        // Request made but no response received
        console.error('[ERROR] Gemini API No Response Received:', error.request);
    } else {
        // Other errors (setup, prisma, etc.)
        console.error('[ERROR] Non-API Error Message:', error.message);
    }
    // --- DEBUG LOGGING END ---
    return { text: "I'm sorry, I encountered an error processing your request." }; // Original fallback
  }
}

/**
 * Process interaction for vector and graph DB
 */
exports.processInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    
    const interaction = await prisma.interaction.findUnique({
      where: { interaction_id: id }
    });
    
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    if (interaction.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    if (interaction.processed_flag) {
       console.log(`[DEBUG] Interaction ${id} already processed.`);
       return res.status(200).json({ message: 'Interaction already processed', interaction });
    }

    let vectorResult = { status: 'skipped', message: 'No vector processing performed.' };
    let graphResult = { status: 'skipped', message: 'No graph processing performed.' };
    let thoughtsResult = { status: 'skipped', message: 'No thoughts extraction performed.' };
    let processingNotes = interaction.processing_notes ? JSON.parse(interaction.processing_notes) : {}; 

    // --- SIMPLIFIED LOGIC: Only process text interactions ---
    if (['text_message', 'chat', 'ai_response'].includes(interaction.interaction_type)) {
        // Parse the raw_data to get the message
        const rawData = typeof interaction.raw_data === 'string' 
          ? JSON.parse(interaction.raw_data) 
          : interaction.raw_data;
        
        const textToEmbed = rawData.message || '';
        
        if (textToEmbed.length >= 3) { 
            // Process for vector database
            vectorResult = await vectorUtils.processTextForVector(interaction.interaction_id, user_id, textToEmbed, interaction.timestamp, interaction.interaction_type);
            processingNotes.vector_processing = vectorResult;
            console.log(`[DEBUG] Text vector processing completed for ${id}:`, vectorResult);
            
            // Process for knowledge graph database
            try {
                const knowledgeGraphService = require('../services/knowledgeGraphService');
                graphResult = await knowledgeGraphService.processMessageForKnowledge(
                    textToEmbed,
                    interaction.interaction_id,
                    user_id
                );
                processingNotes.graph_processing = graphResult;
                console.log(`[DEBUG] Knowledge graph processing completed for ${id}:`, 
                    { entities: graphResult.entities?.length || 0, relationships: graphResult.relationships?.length || 0 });
            } catch (graphError) {
                console.error(`[ERROR] Failed to process interaction ${id} for knowledge graph:`, graphError);
                graphResult = { 
                    status: 'error', 
                    message: `Knowledge graph processing failed: ${graphError.message}`,
                    error: graphError.message
                };
                processingNotes.graph_processing = graphResult;
            }
            
            // Process for thoughts extraction
            try {
                const thoughtService = require('../services/thoughtService');
                const extractedThoughts = await thoughtService.processInteractionForThoughts(interaction.interaction_id);
                thoughtsResult = {
                    status: 'success',
                    message: `Extracted ${extractedThoughts.length} thoughts`,
                    count: extractedThoughts.length,
                    thoughts: extractedThoughts.map(t => ({ id: t.id, title: t.title }))
                };
                processingNotes.thoughts_processing = thoughtsResult;
                console.log(`[DEBUG] Thoughts extraction completed for ${id}:`, { thoughts: extractedThoughts.length });
            } catch (thoughtsError) {
                console.error(`[ERROR] Failed to process interaction ${id} for thoughts extraction:`, thoughtsError);
                thoughtsResult = {
                    status: 'error',
                    message: `Thoughts extraction failed: ${thoughtsError.message}`,
                    error: thoughtsError.message
                };
                processingNotes.thoughts_processing = thoughtsResult;
            }
        } else {
            vectorResult = { status: 'skipped', message: 'Text too short for embedding.' };
            graphResult = { status: 'skipped', message: 'Text too short for knowledge extraction.' };
            thoughtsResult = { status: 'skipped', message: 'Text too short for thoughts extraction.' };
            processingNotes.vector_processing = vectorResult;
            processingNotes.graph_processing = graphResult;
            processingNotes.thoughts_processing = thoughtsResult;
        }
    } else {
        console.log(`[DEBUG] Skipping vector/graph/thoughts processing for non-text interaction type: ${interaction.interaction_type}`);
        // Keep any existing processing notes if reprocessing
        vectorResult = processingNotes.vector_processing || vectorResult;
        graphResult = processingNotes.graph_processing || graphResult;
        thoughtsResult = processingNotes.thoughts_processing || thoughtsResult;
    }
    // --- END SIMPLIFIED LOGIC ---

    // Update the interaction record
    const updatedInteraction = await prisma.interaction.update({
      where: { interaction_id: id },
      data: {
        processed_flag: true, // Mark as processed
        // Ensure we don't overwrite existing notes if reprocessing
        processing_notes: JSON.stringify({ 
            ...processingNotes, // Keep existing notes
            vector_processing: vectorResult, // Update vector status
            graph_processing: graphResult, // Update graph status
            thoughts_processing: thoughtsResult // Update thoughts status
        }) 
      }
    });
    
    res.status(200).json({
      message: 'Interaction processed successfully',
      interaction: updatedInteraction,
      processing_results: { 
            ...processingNotes, 
            vector_processing: vectorResult, 
            graph_processing: graphResult,
            thoughts_processing: thoughtsResult
      } 
    });
  } catch (error) {
    console.error('[ERROR] Error in processInteraction:', error);
    // Try to update interaction with error note
    try {
        await prisma.interaction.update({
            where: { interaction_id: req.params.id },
            data: { processing_notes: JSON.stringify({ error: error.message }) }
        });
    } catch (updateError) {
        console.error('Failed to update interaction with error note:', updateError);
    }
    res.status(500).json({ error: 'Failed to process interaction' });
  }
};

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return 'unknown size';
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Reprocess all or selected interactions for knowledge graph extraction
 * This allows populating the knowledge graph with historical data
 */
exports.reprocessInteractionsForKnowledge = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { session_id, limit = 100, skip_processed = true } = req.query;
    
    // Build the query to find interactions
    const query = {
      where: { 
        user_id,
        interaction_type: { in: ['text_message', 'chat', 'ai_response'] },
      },
      orderBy: { timestamp: 'asc' },
      take: parseInt(limit)
    };
    
    // Add optional filters
    if (session_id) {
      query.where.session_id = session_id;
    }
    
    // Skip already processed interactions if requested
    if (skip_processed === 'true') {
      query.where.processed_flag = false;
    }
    
    // Get the interactions
    const interactions = await prisma.interaction.findMany(query);
    console.log(`[INFO] Found ${interactions.length} interactions to process for knowledge graph`);
    
    // Process each interaction sequentially to avoid overloading
    const results = [];
    for (const interaction of interactions) {
      try {
        const textToProcess = interaction.raw_data.message || interaction.raw_data.text || '';
        
        if (textToProcess.length < 3) {
          results.push({
            interaction_id: interaction.interaction_id,
            status: 'skipped',
            message: 'Text too short for knowledge extraction'
          });
          continue;
        }
        
        // Process the message for knowledge
        const graphResult = await knowledgeGraphService.processMessageForKnowledge(
          textToProcess,
          interaction.interaction_id,
          user_id
        );
        
        // Update the interaction with the processing result
        let processingNotes = interaction.processing_notes ? JSON.parse(interaction.processing_notes) : {};
        processingNotes.graph_processing = graphResult;
        
        await prisma.interaction.update({
          where: { interaction_id: interaction.interaction_id },
          data: {
            processed_flag: true,
            processing_notes: JSON.stringify(processingNotes)
          }
        });
        
        results.push({
          interaction_id: interaction.interaction_id,
          status: 'success',
          entities: graphResult.entities?.length || 0,
          relationships: graphResult.relationships?.length || 0
        });
        
      } catch (error) {
        console.error(`[ERROR] Failed to process interaction ${interaction.interaction_id} for knowledge:`, error);
        results.push({
          interaction_id: interaction.interaction_id,
          status: 'error',
          message: error.message
        });
      }
    }
    
    res.status(200).json({
      message: `Processed ${results.length} interactions for knowledge graph`,
      results: results,
      summary: {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        error: results.filter(r => r.status === 'error').length
      }
    });
    
  } catch (error) {
    console.error('[ERROR] Error in reprocessInteractionsForKnowledge:', error);
    res.status(500).json({ error: 'Failed to reprocess interactions for knowledge graph' });
  }
};

/**
 * Reprocess all or selected interactions for thought extraction
 */
exports.reprocessInteractionsForThoughts = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { session_id, limit = 20, skip_processed = true } = req.query;
    
    const options = {
      limit: parseInt(limit),
      skipProcessed: skip_processed === 'true',
      sessionId: session_id
    };
    
    const results = await thoughtService.batchProcessInteractionsForThoughts(user_id, options);
    
    res.status(200).json({
      message: `Processed ${results.processed} interactions for thoughts extraction`,
      resultsOverview: {
        total: results.total,
        processed: results.processed,
        thoughtsCreated: results.thoughtsCreated,
        errors: results.errors
      },
      details: results.details
    });
    
  } catch (error) {
    console.error('[ERROR] Error in reprocessInteractionsForThoughts:', error);
    res.status(500).json({ error: 'Failed to reprocess interactions for thoughts extraction' });
  }
};

// Get interactions for a session
exports.getSessionInteractions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { session_id, limit = 10, offset = 0 } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const interactions = await prisma.interaction.findMany({
      where: {
        userId: userId,
        session_id: session_id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    return res.status(200).json({
      success: true,
      interactions: interactions.map(interaction => ({
        id: interaction.interaction_id,
        type: interaction.interaction_type,
        content: JSON.parse(interaction.raw_data),
        metadata: interaction.metadata ? JSON.parse(interaction.metadata) : null,
        createdAt: interaction.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error in getSessionInteractions:', error);
    return res.status(500).json({ error: 'Failed to retrieve interactions' });
  }
}; 