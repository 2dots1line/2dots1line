/**
 * Vector Utilities
 * 
 * Utilities for generating and working with vector embeddings
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini for embedding generation (default model)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

/**
 * Generate embedding vector for text using Gemini
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateGeminiEmbeddings(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }
    
    // Truncate text if too long (embedding model has context limits)
    const truncatedText = text.length > 20000 ? text.substring(0, 20000) : text;
    
    const result = await embeddingModel.embedContent(truncatedText);
    return result.embedding.values;
    
  } catch (error) {
    console.error('Error generating Gemini embedding:', error);
    throw new Error(`Gemini embedding generation failed: ${error.message}`);
  }
}

/**
 * Generate embedding vector using the configured model
 * Default implementation uses Gemini, but can be swapped for other models
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateEmbeddings(text) {
  // Currently using Gemini as the default embedding model
  // This function can be modified to use different models based on configuration
  return await generateGeminiEmbeddings(text);
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vectorA - First vector
 * @param {number[]} vectorB - Second vector
 * @returns {number} - Similarity score (0-1)
 */
function calculateCosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || !vectorA.length || !vectorB.length) {
    throw new Error('Invalid vectors for similarity calculation');
  }
  
  if (vectorA.length !== vectorB.length) {
    throw new Error(`Vector dimensions don't match: ${vectorA.length} vs ${vectorB.length}`);
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Calculate Euclidean distance between two vectors
 * @param {number[]} vectorA - First vector
 * @param {number[]} vectorB - Second vector
 * @returns {number} - Distance
 */
function calculateEuclideanDistance(vectorA, vectorB) {
  if (!vectorA || !vectorB || !vectorA.length || !vectorB.length) {
    throw new Error('Invalid vectors for distance calculation');
  }
  
  if (vectorA.length !== vectorB.length) {
    throw new Error(`Vector dimensions don't match: ${vectorA.length} vs ${vectorB.length}`);
  }
  
  let sum = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    const diff = vectorA[i] - vectorB[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

/**
 * Parse a vector stored as JSON string
 * @param {string} vectorString - Vector stored as JSON string
 * @returns {number[]} - Vector as array of numbers
 */
function parseVectorString(vectorString) {
  try {
    if (!vectorString) {
      throw new Error('Null or undefined vector string');
    }
    
    return JSON.parse(vectorString);
  } catch (error) {
    console.error('Error parsing vector string:', error);
    throw new Error(`Vector parsing failed: ${error.message}`);
  }
}

/**
 * Process text for vector embedding and storage
 * @param {string} interactionId - ID of the interaction
 * @param {string} userId - ID of the user
 * @param {string} text - Text to process
 * @param {Date} timestamp - Timestamp of the interaction
 * @param {string} interactionType - Type of interaction
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Processing result
 */
async function processTextForVector(interactionId, userId, text, timestamp, interactionType, metadata = {}) {
  try {
    console.log(`[DEBUG] Processing text for vector embedding: "${text.substring(0, 50)}..."`);
    
    if (!text || typeof text !== 'string' || text.length < 3) {
      return { 
        status: 'skipped', 
        message: 'Text too short or invalid for embedding' 
      };
    }
    
    // Generate embedding vector
    const embedding = await generateEmbeddings(text);
    
    console.log(`[DEBUG] Generated embedding vector with ${embedding.length} dimensions`);
    
    // For now, we're just returning the embedding - in a real implementation,
    // this would store the vector in a vector database like Weaviate
    return {
      status: 'success',
      message: `Generated embedding vector with ${embedding.length} dimensions`,
      dimensions: embedding.length,
      // Include sample data for verification
      sample: embedding.slice(0, 5)
    };
  } catch (error) {
    console.error('Error processing text for vector:', error);
    return {
      status: 'error',
      message: `Failed to process text for vector: ${error.message}`,
      error: error.message
    };
  }
}

module.exports = {
  generateEmbeddings,
  generateGeminiEmbeddings,
  calculateCosineSimilarity,
  calculateEuclideanDistance,
  parseVectorString,
  processTextForVector
}; 