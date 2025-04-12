/**
 * Thought Service
 * Manages the creation and retrieval of Thoughts in the database.
 * Thoughts are extracted from user interactions and represent
 * discrete, meaningful statements that can be vectorized and connected
 * to the knowledge graph.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiService = require('../ai/ai.service');

/**
 * Create a new Thought record from extracted information
 * @param {string} content - The text content of the thought
 * @param {string} interactionId - ID of the source interaction 
 * @param {string} userId - ID of the user who owns the thought
 * @param {string} subjectType - Type of the subject (user, other_person, concept, etc.)
 * @param {string} subjectName - Name of the subject if not the user
 * @param {string} title - Optional title for the thought
 * @returns {Promise<object>} - The created Thought record
 */
async function createThought(content, interactionId, userId, subjectType, subjectName, title = null) {
  try {
    console.log(`[INFO] Generating embedding for thought: "${content.substring(0, 30)}..."`);
    
    // Generate vector embedding for the thought content
    const embedding = await aiService.generateEmbeddings(content);
    
    // Create the Thought record in the database
    const thought = await prisma.thought.create({
      data: {
        content,
        interactionId,
        userId,
        subjectType,
        subjectName,
        title,
        embedding: embedding.vector
      }
    });
    
    console.log(`[INFO] Created thought ${thought.id} from interaction ${interactionId}`);
    return thought;
  } catch (error) {
    console.error('[ERROR] Failed to create thought:', error);
    throw new Error(`Failed to create thought: ${error.message}`);
  }
}

/**
 * Create multiple Thought records from an analyzed interaction
 * @param {Array} thoughtAnalysis - Array of thought objects from AI analysis
 * @param {string} interactionId - ID of the source interaction
 * @param {string} userId - ID of the user who owns the thoughts
 * @returns {Promise<Array>} - Array of created Thought records
 */
async function createThoughtsFromAnalysis(thoughtAnalysis, interactionId, userId) {
  try {
    const createdThoughts = [];
    
    // Filter out non-substantive thoughts
    const substantiveThoughts = thoughtAnalysis.filter(t => t.isSubstantive === true);
    
    console.log(`[INFO] Creating ${substantiveThoughts.length} thoughts from interaction ${interactionId}`);
    
    // Create each thought in sequence (to avoid overwhelming the embedding API)
    for (const thought of substantiveThoughts) {
      try {
        const newThought = await createThought(
          thought.thoughtContent,
          interactionId,
          userId,
          thought.subjectType || 'unknown',
          thought.subjectName || null,
          null // No title for now
        );
        
        createdThoughts.push({
          thought: newThought,
          analysis: thought // Include the original analysis for graph mapping
        });
      } catch (thoughtError) {
        console.error(`[ERROR] Failed to create individual thought: ${thoughtError.message}`);
        // Continue with other thoughts even if one fails
      }
    }
    
    return createdThoughts;
  } catch (error) {
    console.error('[ERROR] Failed to create thoughts from analysis:', error);
    throw new Error(`Failed to create thoughts from analysis: ${error.message}`);
  }
}

/**
 * Get thoughts for a specific user
 * @param {string} userId - ID of the user
 * @param {object} options - Query options (limit, offset, etc.)
 * @returns {Promise<Array>} - Array of Thought records
 */
async function getThoughtsByUser(userId, options = { limit: 100, offset: 0 }) {
  try {
    const thoughts = await prisma.thought.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: options.offset,
      take: options.limit
    });
    
    return thoughts;
  } catch (error) {
    console.error('[ERROR] Failed to get thoughts by user:', error);
    throw new Error(`Failed to get thoughts by user: ${error.message}`);
  }
}

/**
 * Get thoughts from a specific interaction
 * @param {string} interactionId - ID of the interaction
 * @returns {Promise<Array>} - Array of Thought records
 */
async function getThoughtsByInteraction(interactionId) {
  try {
    const thoughts = await prisma.thought.findMany({
      where: {
        interactionId: interactionId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return thoughts;
  } catch (error) {
    console.error('[ERROR] Failed to get thoughts by interaction:', error);
    throw new Error(`Failed to get thoughts by interaction: ${error.message}`);
  }
}

/**
 * Get a thought by ID
 * @param {string} thoughtId - ID of the thought to retrieve
 * @returns {Promise<object>} - The Thought record
 */
async function getThoughtById(thoughtId) {
  try {
    const thought = await prisma.thought.findUnique({
      where: {
        id: thoughtId
      }
    });
    
    if (!thought) {
      throw new Error(`Thought with ID ${thoughtId} not found`);
    }
    
    return thought;
  } catch (error) {
    console.error('[ERROR] Failed to get thought by ID:', error);
    throw new Error(`Failed to get thought by ID: ${error.message}`);
  }
}

module.exports = {
  createThought,
  createThoughtsFromAnalysis,
  getThoughtsByUser,
  getThoughtsByInteraction,
  getThoughtById
}; 