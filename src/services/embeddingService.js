/**
 * Embedding Service
 * 
 * Handles generation and storage of embeddings for the enhanced memory layer
 */

const { PrismaClient } = require('@prisma/client');
const weaviateService = require('./weaviateService');
const { generateEmbeddings } = require('../models/vectorUtils');

const prisma = new PrismaClient();

/**
 * Process raw data and generate embeddings
 * @param {string} rawDataId - ID of the raw data record to process
 * @param {string} userId - User ID
 * @param {string|null} perspectiveOwnerId - Perspective owner ID (defaults to userId if not provided)
 * @returns {Promise<Object>} - Processing result
 */
async function processRawData(rawDataId, userId, perspectiveOwnerId = null) {
  try {
    // Default perspective owner to user ID if not provided
    perspectiveOwnerId = perspectiveOwnerId || userId;
    
    // Fetch raw data
    const rawData = await prisma.rawData.findUnique({
      where: { id: rawDataId },
      include: {
        embeddings: true
      }
    });
    
    if (!rawData) {
      throw new Error(`Raw data with ID ${rawDataId} not found`);
    }
    
    // Check if already processed
    if (rawData.embeddings && rawData.embeddings.length > 0) {
      console.log(`Raw data ${rawDataId} already has embeddings. Skipping.`);
      return {
        success: true,
        message: 'Raw data already has embeddings',
        rawDataId,
        embeddingId: rawData.embeddings[0].id
      };
    }
    
    // Generate embeddings for the content
    const embeddingVector = await generateEmbeddings(rawData.content);
    
    if (!embeddingVector || !embeddingVector.length) {
      throw new Error('Failed to generate embeddings');
    }
    
    // Create embedding record in database
    const embedding = await prisma.embedding.create({
      data: {
        vector: JSON.stringify(embeddingVector),
        rawData: { connect: { id: rawDataId } },
        user: { connect: { id: userId } },
        perspectiveOwner: perspectiveOwnerId ? { connect: { id: perspectiveOwnerId } } : undefined,
        subject: rawData.subjectId ? { connect: { id: rawData.subjectId } } : undefined,
        importanceScore: rawData.importanceScore || 0.5
      }
    });
    
    // Store in vector database (Weaviate)
    await weaviateService.storeRawDataEmbedding({
      vector: embeddingVector,
      content: rawData.content,
      summary: rawData.summary || '',
      rawDataId,
      userId,
      importanceScore: rawData.importanceScore || 0.5,
      perspectiveOwnerId,
      subjectId: rawData.subjectId,
      embedId: embedding.id,
      createdAt: rawData.createdAt
    });
    
    return {
      success: true,
      message: 'Raw data processed successfully',
      rawDataId,
      embeddingId: embedding.id
    };
    
  } catch (error) {
    console.error('Error processing raw data:', error);
    throw error;
  }
}

/**
 * Process a semantic chunk and generate embeddings
 * @param {string} chunkId - ID of the semantic chunk to process
 * @param {string} userId - User ID
 * @param {string|null} perspectiveOwnerId - Perspective owner ID (defaults to userId if not provided)
 * @returns {Promise<Object>} - Processing result
 */
async function processSemanticChunk(chunkId, userId, perspectiveOwnerId = null) {
  try {
    // Default perspective owner to user ID if not provided
    perspectiveOwnerId = perspectiveOwnerId || userId;
    
    // Fetch semantic chunk
    const chunk = await prisma.semanticChunk.findUnique({
      where: { id: chunkId },
      include: {
        embeddings: true,
        rawData: true
      }
    });
    
    if (!chunk) {
      throw new Error(`Semantic chunk with ID ${chunkId} not found`);
    }
    
    // Check if already processed
    if (chunk.embeddings && chunk.embeddings.length > 0) {
      console.log(`Semantic chunk ${chunkId} already has embeddings. Skipping.`);
      return {
        success: true,
        message: 'Semantic chunk already has embeddings',
        chunkId,
        embeddingId: chunk.embeddings[0].id
      };
    }
    
    // Generate embeddings for the content
    const embeddingVector = await generateEmbeddings(chunk.content);
    
    if (!embeddingVector || !embeddingVector.length) {
      throw new Error('Failed to generate embeddings');
    }
    
    // Create embedding record in database
    const embedding = await prisma.embedding.create({
      data: {
        vector: JSON.stringify(embeddingVector),
        semanticChunk: { connect: { id: chunkId } },
        rawData: chunk.rawDataId ? { connect: { id: chunk.rawDataId } } : undefined,
        user: { connect: { id: userId } },
        perspectiveOwner: perspectiveOwnerId ? { connect: { id: perspectiveOwnerId } } : undefined,
        subject: chunk.subjectId ? { connect: { id: chunk.subjectId } } : undefined,
        importanceScore: chunk.importanceScore || 0.5
      }
    });
    
    // Store in vector database (Weaviate)
    await weaviateService.storeChunkEmbedding({
      vector: embeddingVector,
      content: chunk.content,
      summary: chunk.summary || '',
      chunkId,
      rawDataId: chunk.rawDataId,
      userId,
      importanceScore: chunk.importanceScore || 0.5,
      perspectiveOwnerId,
      subjectId: chunk.subjectId,
      embedId: embedding.id,
      createdAt: chunk.createdAt
    });
    
    return {
      success: true,
      message: 'Semantic chunk processed successfully',
      chunkId,
      embeddingId: embedding.id
    };
    
  } catch (error) {
    console.error('Error processing semantic chunk:', error);
    throw error;
  }
}

/**
 * Process a thought and generate embeddings
 * @param {string} thoughtId - ID of the thought to process
 * @param {string} userId - User ID
 * @param {string|null} perspectiveOwnerId - Perspective owner ID (defaults to userId if not provided)
 * @returns {Promise<Object>} - Processing result
 */
async function processThought(thoughtId, userId, perspectiveOwnerId = null) {
  try {
    // Default perspective owner to user ID if not provided
    perspectiveOwnerId = perspectiveOwnerId || userId;
    
    // Fetch thought
    const thought = await prisma.thought.findUnique({
      where: { id: thoughtId },
      include: {
        embeddings: true,
        perspectiveOwner: true
      }
    });
    
    if (!thought) {
      throw new Error(`Thought with ID ${thoughtId} not found`);
    }
    
    // Check if already processed
    if (thought.embeddings && thought.embeddings.length > 0) {
      console.log(`Thought ${thoughtId} already has embeddings. Skipping.`);
      return {
        success: true,
        message: 'Thought already has embeddings',
        thoughtId,
        embeddingId: thought.embeddings[0].id
      };
    }
    
    // Combine title and content for embedding
    const embeddingText = `${thought.title}: ${thought.content}`;
    
    // Generate embeddings for the content
    const embeddingVector = await generateEmbeddings(embeddingText);
    
    if (!embeddingVector || !embeddingVector.length) {
      throw new Error('Failed to generate embeddings');
    }
    
    // Create embedding record in database
    const embedding = await prisma.embedding.create({
      data: {
        vector: JSON.stringify(embeddingVector),
        thought: { connect: { id: thoughtId } },
        rawData: thought.rawDataId ? { connect: { id: thought.rawDataId } } : undefined,
        semanticChunk: thought.chunkId ? { connect: { id: thought.chunkId } } : undefined,
        user: { connect: { id: userId } },
        perspectiveOwner: { connect: { id: perspectiveOwnerId } },
        subject: thought.subjectId ? { connect: { id: thought.subjectId } } : undefined,
        importanceScore: thought.importanceScore || 0.7
      }
    });
    
    // Store in vector database (Weaviate)
    await weaviateService.storeThoughtEmbedding({
      vector: embeddingVector,
      title: thought.title,
      content: thought.content,
      thoughtId,
      rawDataId: thought.rawDataId,
      chunkId: thought.chunkId,
      userId,
      subjectType: thought.subjectType,
      subjectName: thought.subjectName,
      importanceScore: thought.importanceScore || 0.7,
      perspectiveOwnerId,
      subjectId: thought.subjectId,
      confidence: thought.confidence || 0.5,
      embedId: embedding.id,
      linkedNodeIds: thought.linkedNodeIds || [],
      createdAt: thought.createdAt
    });
    
    return {
      success: true,
      message: 'Thought processed successfully',
      thoughtId,
      embeddingId: embedding.id
    };
    
  } catch (error) {
    console.error('Error processing thought:', error);
    throw error;
  }
}

/**
 * Search for similar embeddings
 * @param {string} query - Search query text
 * @param {string} userId - User ID
 * @param {Object} options - Search options
 * @param {string} options.type - Type of embedding to search (raw, chunk, thought, all)
 * @param {number} options.limit - Maximum number of results
 * @param {string} options.perspectiveOwnerId - Perspective owner ID filter
 * @param {string} options.subjectId - Subject ID filter
 * @param {string} options.subjectType - Subject type filter (for thoughts)
 * @returns {Promise<Array>} - Search results
 */
async function searchSimilar(query, userId, options = {}) {
  try {
    const {
      type = 'all',
      limit = 5,
      perspectiveOwnerId,
      subjectId,
      subjectType
    } = options;
    
    // Generate embeddings for query
    const queryVector = await generateEmbeddings(query);
    
    if (!queryVector || !queryVector.length) {
      throw new Error('Failed to generate query embeddings');
    }
    
    const searchOptions = {
      limit,
      perspectiveOwnerId,
      subjectId,
      subjectType
    };
    
    let results = [];
    
    // Search in the appropriate collections based on type
    if (type === 'raw' || type === 'all') {
      const rawResults = await weaviateService.searchSimilarVectors(
        'RawDataEmbedding',
        queryVector,
        userId,
        searchOptions
      );
      
      results = [...results, ...rawResults.map(r => ({ ...r, type: 'raw' }))];
    }
    
    if (type === 'chunk' || type === 'all') {
      const chunkResults = await weaviateService.searchSimilarVectors(
        'ChunkEmbedding',
        queryVector,
        userId,
        searchOptions
      );
      
      results = [...results, ...chunkResults.map(r => ({ ...r, type: 'chunk' }))];
    }
    
    if (type === 'thought' || type === 'all') {
      const thoughtResults = await weaviateService.searchSimilarVectors(
        'ThoughtEmbedding',
        queryVector,
        userId,
        searchOptions
      );
      
      results = [...results, ...thoughtResults.map(r => ({ ...r, type: 'thought' }))];
    }
    
    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);
    
    // Limit total results
    if (results.length > limit) {
      results = results.slice(0, limit);
    }
    
    // Enhance results with additional data from database
    return await enhanceSearchResults(results);
    
  } catch (error) {
    console.error('Error searching similar embeddings:', error);
    throw error;
  }
}

/**
 * Enhance search results with data from the database
 * @param {Array} results - Search results to enhance
 * @returns {Promise<Array>} - Enhanced results
 */
async function enhanceSearchResults(results) {
  try {
    const enhancedResults = [];
    
    for (const result of results) {
      const { embedId, type } = result;
      
      let enhancedResult = { ...result };
      
      // Fetch additional data based on type
      if (embedId) {
        const embedding = await prisma.embedding.findUnique({
          where: { id: embedId },
          include: {
            rawData: type === 'raw',
            semanticChunk: type === 'chunk',
            thought: type === 'thought',
            user: true,
            perspectiveOwner: true,
            subject: true
          }
        });
        
        if (embedding) {
          // Add related records to result
          if (type === 'raw' && embedding.rawData) {
            enhancedResult.rawData = embedding.rawData;
          } else if (type === 'chunk' && embedding.semanticChunk) {
            enhancedResult.semanticChunk = embedding.semanticChunk;
          } else if (type === 'thought' && embedding.thought) {
            enhancedResult.thought = embedding.thought;
          }
          
          // Add common related records
          enhancedResult.user = embedding.user;
          enhancedResult.perspectiveOwner = embedding.perspectiveOwner;
          enhancedResult.subject = embedding.subject;
        }
      }
      
      enhancedResults.push(enhancedResult);
    }
    
    return enhancedResults;
    
  } catch (error) {
    console.error('Error enhancing search results:', error);
    // Return original results if enhancement fails
    return results;
  }
}

/**
 * Delete embeddings for a specific record
 * @param {string} recordId - ID of the record
 * @param {string} recordType - Type of record (raw, chunk, thought)
 * @returns {Promise<boolean>} - Success status
 */
async function deleteEmbeddings(recordId, recordType) {
  try {
    let refField, className;
    
    // Map record type to Weaviate class and reference field
    switch (recordType) {
      case 'raw':
        refField = 'rawDataId';
        className = 'RawDataEmbedding';
        break;
      case 'chunk':
        refField = 'chunkId';
        className = 'ChunkEmbedding';
        break;
      case 'thought':
        refField = 'thoughtId';
        className = 'ThoughtEmbedding';
        break;
      default:
        throw new Error(`Invalid record type: ${recordType}`);
    }
    
    // Delete from Weaviate
    await weaviateService.deleteEmbeddingsByReference(className, refField, recordId);
    
    // Delete from PostgreSQL
    await prisma.embedding.deleteMany({
      where: {
        OR: [
          { rawDataId: recordType === 'raw' ? recordId : undefined },
          { semanticChunkId: recordType === 'chunk' ? recordId : undefined },
          { thoughtId: recordType === 'thought' ? recordId : undefined }
        ]
      }
    });
    
    return true;
    
  } catch (error) {
    console.error('Error deleting embeddings:', error);
    throw error;
  }
}

/**
 * Get vector statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Statistics about the user's vectors
 */
async function getVectorStats(userId) {
  try {
    // Get stats from Weaviate
    const weaviateStats = await weaviateService.getUserVectorStats(userId);
    
    // Get stats from PostgreSQL
    const dbStats = await prisma.$transaction([
      prisma.embedding.count({
        where: { userId }
      }),
      prisma.embedding.count({
        where: { 
          userId,
          rawDataId: { not: null }
        }
      }),
      prisma.embedding.count({
        where: { 
          userId,
          semanticChunkId: { not: null }
        }
      }),
      prisma.embedding.count({
        where: { 
          userId,
          thoughtId: { not: null }
        }
      }),
      // Count raw data without embeddings
      prisma.rawData.count({
        where: {
          userId,
          embeddings: { none: {} }
        }
      }),
      // Count chunks without embeddings
      prisma.semanticChunk.count({
        where: {
          userId,
          embeddings: { none: {} }
        }
      }),
      // Count thoughts without embeddings
      prisma.thought.count({
        where: {
          userId,
          embeddings: { none: {} }
        }
      })
    ]);
    
    // Combine stats
    return {
      database: {
        totalEmbeddings: dbStats[0],
        rawDataEmbeddings: dbStats[1],
        chunkEmbeddings: dbStats[2],
        thoughtEmbeddings: dbStats[3],
        unprocessedRawData: dbStats[4],
        unprocessedChunks: dbStats[5],
        unprocessedThoughts: dbStats[6]
      },
      vectorDb: weaviateStats
    };
    
  } catch (error) {
    console.error('Error getting vector statistics:', error);
    throw error;
  }
}

/**
 * Process all unprocessed records for a user
 * @param {string} userId - User ID
 * @param {string|null} perspectiveOwnerId - Perspective owner ID
 * @returns {Promise<Object>} - Processing results
 */
async function processAllUnprocessed(userId, perspectiveOwnerId = null) {
  try {
    // Default perspective owner to user ID if not provided
    perspectiveOwnerId = perspectiveOwnerId || userId;
    
    // Find unprocessed raw data
    const unprocessedRawData = await prisma.rawData.findMany({
      where: {
        userId,
        embeddings: { none: {} }
      }
    });
    
    // Find unprocessed chunks
    const unprocessedChunks = await prisma.semanticChunk.findMany({
      where: {
        userId,
        embeddings: { none: {} }
      }
    });
    
    // Find unprocessed thoughts
    const unprocessedThoughts = await prisma.thought.findMany({
      where: {
        userId,
        embeddings: { none: {} }
      }
    });
    
    // Process in parallel batches
    const rawDataResults = await Promise.allSettled(
      unprocessedRawData.map(rd => processRawData(rd.id, userId, perspectiveOwnerId))
    );
    
    const chunkResults = await Promise.allSettled(
      unprocessedChunks.map(c => processSemanticChunk(c.id, userId, perspectiveOwnerId))
    );
    
    const thoughtResults = await Promise.allSettled(
      unprocessedThoughts.map(t => processThought(t.id, userId, perspectiveOwnerId))
    );
    
    // Count successes and failures
    const rawDataSuccesses = rawDataResults.filter(r => r.status === 'fulfilled').length;
    const rawDataFailures = rawDataResults.filter(r => r.status === 'rejected').length;
    
    const chunkSuccesses = chunkResults.filter(r => r.status === 'fulfilled').length;
    const chunkFailures = chunkResults.filter(r => r.status === 'rejected').length;
    
    const thoughtSuccesses = thoughtResults.filter(r => r.status === 'fulfilled').length;
    const thoughtFailures = thoughtResults.filter(r => r.status === 'rejected').length;
    
    return {
      success: true,
      message: 'Processed all unprocessed records',
      stats: {
        rawData: { total: unprocessedRawData.length, success: rawDataSuccesses, failed: rawDataFailures },
        chunks: { total: unprocessedChunks.length, success: chunkSuccesses, failed: chunkFailures },
        thoughts: { total: unprocessedThoughts.length, success: thoughtSuccesses, failed: thoughtFailures }
      }
    };
    
  } catch (error) {
    console.error('Error processing all unprocessed records:', error);
    throw error;
  }
}

module.exports = {
  processRawData,
  processSemanticChunk,
  processThought,
  searchSimilar,
  deleteEmbeddings,
  getVectorStats,
  processAllUnprocessed
}; 