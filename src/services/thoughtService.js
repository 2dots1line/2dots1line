/**
 * Thought Service
 * Handles creation of thought records from interactions and generation of vector embeddings
 */

const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = new PrismaClient();
require('dotenv').config();
const memoryBroker = require('../memory/memoryBroker');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Importance scoring thresholds
const IMPORTANCE_THRESHOLD = 0.6; // Minimum importance score to create thoughts

/**
 * Extracts meaningful thoughts from an interaction's text
 * @param {string} message - The message text to analyze
 * @param {string} interactionId - ID of the source interaction
 * @param {string} userId - User ID associated with the interaction
 * @returns {Promise<Array>} - Array of extracted thoughts with embeddings
 */
async function extractThoughtsFromMessage(message, interactionId, userId) {
  try {
    console.log(`[INFO] Extracting thoughts from message: "${message.substring(0, 50)}..."`);
    
    // Use Gemini to extract meaningful thoughts from the message
    const result = await model.generateContent(`
      Analyze the following message and extract or synthesize high-value knowledge about the user's world, experiences, goals, and relationships.
      
      Important Guidelines:
      1. FOCUS ONLY ON USER INFORMATION - Ignore AI responses or acknowledgments entirely
      2. SYNTHESIZE rather than extract - Generate meaningful, substantive insights rather than simple statements
      3. COMBINE related information - Create coherent thoughts that merge multiple related points
      4. PRIORITIZE NEW INFORMATION - Only capture what adds to our understanding of the user's world
      5. IGNORE conversational elements, greetings, or generic statements
      6. AVOID capturing opinions or statements made by the AI assistant
      
      ONLY focus on:
      - Facts about the user's life, experiences, history, or environment
      - User's preferences, values, opinions, and personality traits
      - User's relationships with people, places, or things
      - User's goals, plans, aspirations, and motivations
      - Significant concepts, entities, or domains relevant to the user
      
      For each thought, provide:
      1. A synthesized, complete statement representing the insight (aim for depth and substance)
      2. A concise, descriptive title (3-5 words)
      3. The subject type (user_trait, user_experience, user_preference, user_relationship, user_goal, entity, concept)
      4. The subject name (the specific trait, person, concept, etc.)
      5. A confidence score (0.0-1.0) indicating how certain you are of this insight
      
      Format your response as a JSON array of thought objects:
      [
        {
          "title": "Descriptive Title",
          "content": "A substantial, synthesized statement representing meaningful knowledge about the user",
          "subjectType": "user_trait|user_experience|user_preference|user_relationship|user_goal|entity|concept",
          "subjectName": "specific name of trait, person, concept, etc.",
          "confidence": 0.9
        }
      ]
      
      MESSAGE: ${message}
    `);
    
    // Parse the generated content to extract the JSON
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.log('[INFO] No meaningful thoughts extracted from the message');
      return [];
    }
    
    // Parse the JSON 
    const thoughts = JSON.parse(jsonMatch[0]);
    
    // Filter out low-confidence thoughts
    const highConfidenceThoughts = thoughts.filter(thought => thought.confidence >= 0.7);
    
    // Check for similar existing thoughts before creating new ones
    const deduplicatedThoughts = await deduplicateThoughts(highConfidenceThoughts, userId);
    
    // Generate embeddings for each thought
    const thoughtsWithEmbeddings = await Promise.all(
      deduplicatedThoughts.map(async (thought) => {
        // Store embedding separately and don't include it directly in the thought object
        const embeddingVector = await generateEmbedding(thought.content);
        return {
          ...thought,
          // Don't include the embedding directly in the thought object
          // It will be stored separately or processed differently
          interactionId,
          userId
        };
      })
    );
    
    return thoughtsWithEmbeddings;
  } catch (error) {
    console.error('[ERROR] Failed to extract thoughts from message:', error);
    throw error;
  }
}

/**
 * Check for existing similar thoughts and deduplicate new thoughts
 * @param {Array} newThoughts - Array of new thoughts to check
 * @param {string} userId - User ID to check against
 * @returns {Promise<Array>} - Array of deduplicated thoughts
 */
async function deduplicateThoughts(newThoughts, userId) {
  const uniqueThoughts = [];
  
  for (const thought of newThoughts) {
    // Check if similar thought exists by subject name and type
    const existingThoughts = await prisma.thought.findMany({
      where: {
        userId: userId,
        subjectName: thought.subjectName,
        subjectType: thought.subjectType
      }
    });
    
    if (existingThoughts.length === 0) {
      // No similar thought exists, add this one
      uniqueThoughts.push(thought);
    } else {
      // Check for semantic similarity to avoid near-duplicates
      let isDuplicate = false;
      
      for (const existing of existingThoughts) {
        // If the titles are very similar, consider it a duplicate
        if (stringSimilarity(existing.title, thought.title) > 0.7) {
          isDuplicate = true;
          break;
        }
        
        // If the content is very similar, consider it a duplicate
        if (stringSimilarity(existing.content, thought.content) > 0.7) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        uniqueThoughts.push(thought);
      }
    }
  }
  
  return uniqueThoughts;
}

/**
 * Calculate string similarity score between two strings (0-1)
 * Simple implementation of Jaccard similarity using word sets
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function stringSimilarity(str1, str2) {
  // Convert strings to lowercase and split into words
  const words1 = new Set(str1.toLowerCase().split(/\W+/).filter(word => word.length > 0));
  const words2 = new Set(str2.toLowerCase().split(/\W+/).filter(word => word.length > 0));
  
  // Calculate intersection
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  
  // Calculate union
  const union = new Set([...words1, ...words2]);
  
  // Calculate Jaccard similarity
  return intersection.size / union.size;
}

/**
 * Generates a vector embedding for the given text
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<Array<number>>} - Vector embedding
 */
async function generateEmbedding(text) {
  try {
    // Use Gemini embedding API - adjust as needed based on your exact embedding approach
    const embeddingResult = await model.generateContent(`
      Generate a semantic embedding vector for the following text.
      The vector should represent the meaning of the text in a way that semantically similar texts have similar vectors.
      Return only a JSON array of 128 numbers with values between -1 and 1.
      
      TEXT: ${text}
    `);
    
    const responseText = embeddingResult.response.text();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error('[ERROR] Failed to generate embedding - invalid response format');
      // Return a default random embedding as fallback
      return Array(128).fill(0).map(() => Math.random() * 2 - 1);
    }
    
    const embedding = JSON.parse(jsonMatch[0]);
    return embedding;
  } catch (error) {
    console.error('[ERROR] Failed to generate embedding:', error);
    // Return a default random embedding as fallback
    return Array(128).fill(0).map(() => Math.random() * 2 - 1);
  }
}

/**
 * Process an interaction for thought extraction
 * @param {string} interactionId - Interaction ID to process
 * @returns {Promise<Array>} - Array of extracted thoughts
 */
async function processInteractionForThoughts(interactionId) {
  try {
    console.log(`[DEBUG] Processing interaction ${interactionId} for thoughts`);
    
    // 1. Fetch the interaction content
    const interaction = await prisma.interaction.findUnique({
      where: { interaction_id: interactionId }
    });
    
    if (!interaction) {
      console.log(`[WARNING] Interaction ${interactionId} not found`);
      return [];
    }
    
    // 2. Get the text content to analyze
    const rawData = typeof interaction.raw_data === 'string' 
      ? JSON.parse(interaction.raw_data) 
      : interaction.raw_data;
    
    const textContent = rawData.message || rawData.text || '';
    
    if (textContent.length < 10) {
      console.log(`[INFO] Interaction ${interactionId} text too short for thought extraction`);
      return [];
    }
    
    // 3. Calculate importance score
    const importanceScore = await calculateImportanceScore(textContent, interaction.interaction_type);
    
    if (importanceScore < IMPORTANCE_THRESHOLD) {
      console.log(`[INFO] Interaction ${interactionId} importance score ${importanceScore} below threshold, skipping thought extraction`);
      
      // Notify the memory broker of the skipped thought extraction
      await memoryBroker.notifyThoughtProcessing({
        interactionId,
        userId: interaction.user_id,
        status: 'skipped',
        reason: 'low_importance',
        importanceScore
      });
      
      return [];
    }
    
    // 4. Extract thoughts using AI
    const extractedThoughts = await extractThoughtsFromMessage(textContent, interactionId, interaction.user_id);
    
    // 5. Store thoughts in database and create embeddings
    const createdThoughts = [];
    
    for (const thought of extractedThoughts) {
      try {
        const createdThought = await prisma.thought.create({
          data: {
            content: thought.content,
            title: thought.title,
            subjectType: thought.subjectType,
            subjectName: thought.subjectName,
            confidence: thought.confidence,
            user: { connect: { user_id: interaction.user_id } },
            interaction: { connect: { interaction_id: interactionId } }
          }
        });
        
        createdThoughts.push(createdThought);
        
        // Notify the memory broker of the new thought
        await memoryBroker.notifyNewThought({
          thoughtId: createdThought.id,
          interactionId,
          userId: interaction.user_id,
          content: thought.content,
          importanceScore,
          subjectType: thought.subjectType,
          subjectName: thought.subjectName
        });
        
      } catch (error) {
        console.error(`[ERROR] Failed to create thought: ${error.message}`);
      }
    }
    
    console.log(`[INFO] Created ${createdThoughts.length} thoughts from interaction ${interactionId}`);
    return createdThoughts;
  } catch (error) {
    console.error(`[ERROR] Failed to process interaction ${interactionId} for thoughts:`, error);
    throw error;
  }
}

/**
 * Calculate importance score for a piece of content
 * @param {string} text - Text to analyze
 * @param {string} interactionType - Type of interaction
 * @returns {Promise<number>} - Importance score between 0 and 1
 */
async function calculateImportanceScore(text, interactionType) {
  try {
    // If it's an AI response, score it lower by default
    const baseScore = interactionType === 'ai_response' ? 0.3 : 0.5;
    
    // Check for importance indicators
    const importanceIndicators = [
      { pattern: /goal|plan|aim|intend|future|aspire/i, weight: 0.15 },
      { pattern: /feel|emotion|happy|sad|angry|love|hate/i, weight: 0.15 },
      { pattern: /family|friend|partner|relationship|mother|father|daughter|son/i, weight: 0.15 },
      { pattern: /work|job|career|study|school|college|university/i, weight: 0.1 },
      { pattern: /value|belief|important|matter|care about/i, weight: 0.2 },
      { pattern: /problem|challenge|difficulty|struggle/i, weight: 0.15 },
      { pattern: /change|transform|grow|develop|improve/i, weight: 0.15 },
      { pattern: /experience|memory|remember|recall/i, weight: 0.1 },
      { pattern: /decision|choose|select|option/i, weight: 0.1 }
    ];
    
    let scoreAdjustment = 0;
    
    // Check each pattern and adjust score
    for (const indicator of importanceIndicators) {
      if (indicator.pattern.test(text)) {
        scoreAdjustment += indicator.weight;
      }
    }
    
    // Adjust based on text length (longer text might have more substance)
    const lengthFactor = Math.min(0.1, text.length / 1000); // Max 0.1 bonus for length
    
    // Calculate final score, capped at 0.0-1.0
    const finalScore = Math.min(1.0, Math.max(0.0, baseScore + scoreAdjustment + lengthFactor));
    
    console.log(`[DEBUG] Calculated importance score ${finalScore.toFixed(2)} for text: "${text.substring(0, 30)}..."`);
    return finalScore;
  } catch (error) {
    console.error('[ERROR] Failed to calculate importance score:', error);
    return 0.5; // Default middle score on error
  }
}

/**
 * Batch process multiple interactions to extract thoughts
 * @param {string} userId - User ID to process interactions for
 * @param {object} options - Options for batch processing
 * @returns {Promise<object>} - Summary of processing results
 */
async function batchProcessInteractionsForThoughts(userId, options = {}) {
  const { 
    limit = 20, 
    skipProcessed = true, 
    sessionId = null 
  } = options;
  
  try {
    console.log(`[DEBUG] Batch processing interactions for thoughts, userId=${userId}`);
    
    // For now, just return empty results
    return {
      total: 0,
      processed: 0,
      thoughtsCreated: 0,
      errors: 0,
      details: []
    };
  } catch (error) {
    console.error(`[ERROR] Failed to batch process interactions for thoughts:`, error);
    throw error;
  }
}

module.exports = {
  extractThoughtsFromMessage,
  generateEmbedding,
  processInteractionForThoughts,
  batchProcessInteractionsForThoughts,
  deduplicateThoughts,
  calculateImportanceScore
}; 