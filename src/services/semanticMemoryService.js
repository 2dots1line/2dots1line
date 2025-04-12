/**
 * Semantic Memory Service
 * 
 * Handles semantic chunking, embedding generation, and retrieval of information
 * from the user's semantic memory.
 */

const { PrismaClient } = require('@prisma/client');
const { generateEmbeddings } = require('../models/vectorUtils');
const weaviateService = require('./weaviateService');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const memoryBroker = require('../memory/memoryBroker');
require('dotenv').config();

const prisma = new PrismaClient();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

/**
 * Process raw data into the semantic memory system
 * @param {string} userId - User ID
 * @param {string} content - Content to process
 * @param {string} contentType - Type of content
 * @param {object} metadata - Metadata about the content
 * @returns {Promise<object>} - Created raw data and chunks
 */
async function processRawData(userId, content, contentType = 'user_chat', metadata = {}) {
  try {
    // Skip empty or very short content
    if (!content || content.length < 5) {
      console.log('[INFO] Content too short for semantic memory processing, skipping');
      return null;
    }

    // Calculate importance score based on content
    const importanceScore = calculateImportanceScore(content, contentType);
    
    // Store the raw data
    const rawData = await prisma.rawData.create({
      data: {
        content,
        contentType,
        importanceScore,
        sessionId: metadata.sessionId || 'unknown',
        perspectiveOwnerId: metadata.perspectiveOwnerId || userId,
        subjectId: metadata.subjectId || null,
        processedFlag: true,
        user: { connect: { user_id: userId } }
      }
    });
    
    // Notify the memory broker about raw data processing
    await memoryBroker.notifyRawDataProcessing({
      rawDataId: rawData.id,
      userId,
      contentType,
      importanceScore,
      contentLength: content.length
    });

    // For longer content, create semantic chunks
    const chunks = [];
    if (content.length > 150) {
      const chunkedContent = createSemanticChunks(content);
      
      // Store each chunk
      for (const [index, chunkContent] of chunkedContent.entries()) {
        const chunk = await prisma.semanticChunk.create({
          data: {
            rawDataId: rawData.id,
            content: chunkContent,
            summary: generateChunkSummary(chunkContent),
            chunkIndex: index,
            importanceScore,
            perspectiveOwnerId: metadata.perspectiveOwnerId || userId,
            subjectId: metadata.subjectId || null
          }
        });
        
        chunks.push(chunk);
        
        // Notify the memory broker about semantic chunk creation
        await memoryBroker.notifySemanticChunkCreation({
          chunkId: chunk.id,
          rawDataId: rawData.id,
          userId,
          chunkIndex: index,
          importanceScore
        });
      }
    }

    // Update memory metrics
    await memoryBroker.updateMemoryProcessingMetrics(userId, {
      rawDataProcessed: 1,
      chunksCreated: chunks.length
    });

    return {
      rawData,
      chunks
    };
  } catch (error) {
    console.error('[ERROR] Failed to process raw data:', error);
    throw error;
  }
}

/**
 * Break content into semantic chunks based on natural boundaries
 * @param {string} content - Content to chunk
 * @returns {Array<string>} - Array of content chunks
 */
function createSemanticChunks(content) {
  // Define maximum chunk size and overlap
  const MAX_CHUNK_SIZE = 500;
  const OVERLAP_SIZE = 50;
  
  // For very short content, don't chunk
  if (content.length <= MAX_CHUNK_SIZE) {
    return [content];
  }
  
  // Split content into sentences
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
  
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    // If adding this sentence would exceed the chunk size, create a new chunk
    if (currentChunk.length + sentence.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk);
      
      // Start a new chunk with overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(Math.max(0, words.length - OVERLAP_SIZE));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      // Add sentence to current chunk
      currentChunk += (currentChunk.length > 0 ? ' ' : '') + sentence;
    }
  }
  
  // Add the final chunk if not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Generate a summary for a chunk
 * @param {string} chunkContent - Content to summarize
 * @returns {string} - Brief summary
 */
function generateChunkSummary(chunkContent) {
  // Simple summary: first N characters or first sentence
  const firstSentence = chunkContent.match(/^[^.!?]+[.!?]/) || [chunkContent.substring(0, 100)];
  return firstSentence[0].trim();
}

/**
 * Calculate importance score for content
 * @param {string} content - Content to score
 * @param {string} contentType - Type of content
 * @returns {number} - Importance score (0-1)
 */
function calculateImportanceScore(content, contentType) {
  // Base importance by content type
  const baseScore = contentType === 'ai_response' ? 0.4 : 0.6;
  
  // Adjust based on content length (longer = potentially more important)
  const lengthFactor = Math.min(0.2, content.length / 1000);
  
  // Look for important keywords
  const importantKeywords = [
    'remember', 'important', 'goal', 'plan', 'dream', 'feel', 'think',
    'because', 'therefore', 'consequently', 'family', 'friend', 'love',
    'hate', 'decision', 'choose', 'need', 'want', 'must', 'value'
  ];
  
  // Count matches
  let keywordMatches = 0;
  for (const keyword of importantKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(content)) {
      keywordMatches++;
    }
  }
  
  const keywordFactor = Math.min(0.3, keywordMatches * 0.03);
  
  // Calculate final score (0-1 range)
  return Math.min(1.0, baseScore + lengthFactor + keywordFactor);
}

/**
 * Generate semantic chunks from content using LLM
 * @param {string} content - Content to chunk
 * @returns {Promise<Array>} Array of chunks
 */
async function generateSemanticChunks(content) {
  try {
    // If content is short, just return it as one chunk
    if (content.length < 500) {
      return [{
        content,
        summary: content.substring(0, 100),
        importance: 0.7,
        topics: ['general']
      }];
    }

    // Prompt the LLM to divide content into semantic chunks
    const prompt = `
    Divide the following text into meaningful semantic chunks. Each chunk should:
    1. Contain a coherent idea or related set of ideas
    2. Be between 100-500 tokens in length (shorter for more focused ideas)
    3. Include a brief 1-2 sentence summary
    4. Have an importance score (0.0-1.0) based on how crucial this information is
    5. Have 1-3 topic tags

    Text to chunk:
    """
    ${content}
    """

    Format each chunk as a JSON object with:
    - content: The full text of the chunk
    - summary: Brief summary of the chunk
    - importance: Importance score from 0.0 to 1.0
    - topics: Array of topic tags

    Output the chunks as a JSON array.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/{[\s\S]*}/) ||
                      text.match(/\[[\s\S]*\]/);
                      
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }
    
    // Parse the extracted JSON
    let jsonStr = jsonMatch[0];
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonMatch[1];
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating semantic chunks:', error);
    // Return content as single chunk on error
    return [{
      content,
      summary: content.substring(0, 100),
      importance: 0.7,
      topics: ['general']
    }];
  }
}

/**
 * Create a thought based on semantic chunks
 * @param {string} userId - User ID
 * @param {string} content - Thought content
 * @param {Array<string>} relatedChunkIds - IDs of related semantic chunks
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Created thought
 */
async function createThought(userId, content, relatedChunkIds = [], metadata = {}) {
  try {
    const title = metadata.title || content.substring(0, 50) + (content.length > 50 ? '...' : '');
    const vector = metadata.vector || await generateEmbeddings(content);
    
    const thoughtData = {
      content,
      title,
      subjectType: metadata.subjectType || 'general',
      subjectName: metadata.subjectName || 'general',
      confidence: metadata.confidence || 1.0,
      linkedNodeIds: metadata.linkedNodeIds || [],
      perspectiveOwnerId: metadata.perspectiveOwnerId || userId,
      subjectId: metadata.subjectId,
      user: { connect: { user_id: userId } }
    };
    
    // Add relationships only if IDs are provided
    if (metadata.rawDataId) {
      thoughtData.rawData = { connect: { id: metadata.rawDataId } };
    }
    
    if (relatedChunkIds.length > 0) {
      thoughtData.chunk = { connect: { id: relatedChunkIds[0] } };
    }
    
    if (metadata.interactionId) {
      thoughtData.interaction = { connect: { interaction_id: metadata.interactionId } };
    }
    
    if (metadata.embeddingId) {
      thoughtData.embedding = { connect: { id: metadata.embeddingId } };
    }
    
    const thought = await prisma.thought.create({
      data: thoughtData
    });

    // Store the thought embedding in Weaviate
    await weaviateService.storeThoughtEmbedding(
      userId,
      thought.id,
      vector,
      content,
      {
        title: title,
        confidence: metadata.confidence || 1.0,
        subjectType: metadata.subjectType || 'general',
        subjectName: metadata.subjectName || 'general',
        relatedChunkIds: relatedChunkIds,
        rawDataId: metadata.rawDataId
      }
    );

    return thought;
  } catch (error) {
    console.error('Error creating thought:', error);
    throw error;
  }
}

// Need to define this constant to match weaviateService
const SCHEMA_CLASSES = {
  RAW_DATA: 'RawData',
  SEMANTIC_CHUNK: 'SemanticChunk',
  THOUGHT: 'Thought'
};

/**
 * Semantic search for memory content
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Search results
 */
async function semanticSearch(userId, query, options = {}) {
  try {
    // Generate embedding for the query
    const queryVector = await generateEmbeddings(query);
    
    // Search in Weaviate
    const results = await weaviateService.semanticSearch(
      userId,
      queryVector,
      {
        ...options,
        includeRawData: true,
        includeChunks: true,
        includeThoughts: true
      }
    );
    
    return results;
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw error;
  }
}

/**
 * Generate a summary of the user's memory about a topic
 * @param {string} userId - User ID
 * @param {string} topic - Topic to summarize
 * @returns {Promise<Object>} Generated summary
 */
async function generateMemorySummary(userId, topic) {
  try {
    // First, get relevant semantic chunks and thoughts using semantic search
    const searchResults = await semanticSearch(
      userId,
      topic,
      { limit: 10 }
    );
    
    if (searchResults.length === 0) {
      return {
        summary: `I don't have any information about ${topic} yet.`,
        sources: []
      };
    }
    
    // Prepare context for summary generation
    const context = searchResults.map(r => r.content).join('\n\n');
    
    // Prompt the LLM to generate a summary
    const prompt = `
    Based on the following information from the user's memory, generate a comprehensive
    summary about "${topic}". Focus on creating a coherent narrative that combines
    all relevant details, facts, opinions, and experiences.
    
    User's memory context:
    """
    ${context}
    """
    
    Generate a detailed summary about "${topic}" based solely on the information above.
    Don't make up additional facts, but feel free to make reasonable connections
    between the existing pieces of information. Write in first person as if the AI
    is recalling the user's memories.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    return {
      summary,
      sources: searchResults.map(r => ({
        id: r.id,
        type: r.type,
        content: r.content.substring(0, 100) + '...',
        score: r.score
      }))
    };
  } catch (error) {
    console.error('Error generating memory summary:', error);
    return {
      summary: `Sorry, I couldn't generate a summary about ${topic} due to an error.`,
      sources: []
    };
  }
}

/**
 * Get statistics about the user's memory
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Memory statistics
 */
async function getUserMemoryStats(userId) {
  try {
    // Get counts from PostgreSQL
    const rawDataCount = await prisma.rawData.count({
      where: { userId }
    });
    
    const chunkCount = await prisma.semanticChunk.count({
      where: { perspectiveOwnerId: userId }
    });
    
    const thoughtCount = await prisma.thought.count({
      where: { userId }
    });
    
    // Get vector stats from Weaviate
    const vectorStats = await weaviateService.getUserVectorStats(userId);
    
    return {
      rawDataCount,
      chunkCount,
      thoughtCount,
      vectorStats
    };
  } catch (error) {
    console.error('Error getting user memory stats:', error);
    throw error;
  }
}

module.exports = {
  processRawData,
  createSemanticChunks,
  generateSemanticChunks,
  createThought,
  semanticSearch,
  generateMemorySummary,
  getUserMemoryStats,
  calculateImportanceScore
}; 