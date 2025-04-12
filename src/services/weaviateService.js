/**
 * Weaviate Service
 * 
 * Handles interaction with Weaviate vector database for semantic search capabilities.
 */

const weaviate = require('weaviate-ts-client');
const { v4: uuidv4 } = require('uuid');
const { calculateCosineSimilarity } = require('../models/vectorUtils');
require('dotenv').config();

// Weaviate client configuration
const client = weaviate.default.client({
  scheme: process.env.WEAVIATE_SCHEME || 'http',
  host: process.env.WEAVIATE_HOST || 'localhost:8080',
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY, // Optional for OpenAI modules
  },
});

// Class names for different embedding types
const SCHEMA_CLASSES = {
  RAW_DATA: 'RawData',
  SEMANTIC_CHUNK: 'SemanticChunk',
  THOUGHT: 'Thought'
};

/**
 * Initialize the Weaviate schema if it doesn't exist
 */
async function initializeSchema() {
  try {
    // Check if schema exists already
    const schema = await client.schema.getter().do();
    const existingClasses = schema.classes?.map(c => c.class) || [];
    
    // Create class for raw data embeddings if it doesn't exist
    if (!existingClasses.includes(SCHEMA_CLASSES.RAW_DATA)) {
      await client.schema
        .classCreator()
        .withClass({
          class: SCHEMA_CLASSES.RAW_DATA,
          description: 'Vector embeddings for raw user data',
          vectorizer: 'none', // We'll provide our own vectors
          properties: [
            {
              name: 'userId',
              dataType: ['string'],
              description: 'ID of the user who owns this data'
            },
            {
              name: 'rawDataId',
              dataType: ['string'],
              description: 'ID of the original raw data in PostgreSQL'
            },
            {
              name: 'content',
              dataType: ['text'],
              description: 'Text content that was embedded',
              indexSearchable: true
            },
            {
              name: 'metadata',
              dataType: ['text'],
              description: 'Additional metadata as JSON string',
              indexSearchable: false
            },
            {
              name: 'createdAt',
              dataType: ['date'],
              description: 'When this embedding was created'
            }
          ]
        })
        .do();
      console.log(`Created ${SCHEMA_CLASSES.RAW_DATA} schema class`);
    }
    
    // Create class for semantic chunk embeddings if it doesn't exist
    if (!existingClasses.includes(SCHEMA_CLASSES.SEMANTIC_CHUNK)) {
      await client.schema
        .classCreator()
        .withClass({
          class: SCHEMA_CLASSES.SEMANTIC_CHUNK,
          description: 'Vector embeddings for semantic chunks',
          vectorizer: 'none', // We'll provide our own vectors
          properties: [
            {
              name: 'userId',
              dataType: ['string'],
              description: 'ID of the user who owns this data'
            },
            {
              name: 'chunkId',
              dataType: ['string'],
              description: 'ID of the semantic chunk in PostgreSQL'
            },
            {
              name: 'content',
              dataType: ['text'],
              description: 'Text content that was embedded',
              indexSearchable: true
            },
            {
              name: 'metadata',
              dataType: ['text'],
              description: 'Additional metadata as JSON string',
              indexSearchable: false
            },
            {
              name: 'createdAt',
              dataType: ['date'],
              description: 'When this embedding was created'
            }
          ]
        })
        .do();
      console.log(`Created ${SCHEMA_CLASSES.SEMANTIC_CHUNK} schema class`);
    }
    
    // Create class for thought embeddings if it doesn't exist
    if (!existingClasses.includes(SCHEMA_CLASSES.THOUGHT)) {
      await client.schema
        .classCreator()
        .withClass({
          class: SCHEMA_CLASSES.THOUGHT,
          description: 'Vector embeddings for user thoughts',
          vectorizer: 'none', // We'll provide our own vectors
          properties: [
            {
              name: 'userId',
              dataType: ['string'],
              description: 'ID of the user who owns this thought'
            },
            {
              name: 'thoughtId',
              dataType: ['string'],
              description: 'ID of the thought in PostgreSQL'
            },
            {
              name: 'content',
              dataType: ['text'],
              description: 'Text content that was embedded',
              indexSearchable: true
            },
            {
              name: 'metadata',
              dataType: ['text'],
              description: 'Additional metadata as JSON string',
              indexSearchable: false
            },
            {
              name: 'createdAt',
              dataType: ['date'],
              description: 'When this embedding was created'
            }
          ]
        })
        .do();
      console.log(`Created ${SCHEMA_CLASSES.THOUGHT} schema class`);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Weaviate schema:', error);
    throw error;
  }
}

/**
 * Store raw data embedding in Weaviate
 * @param {string} userId - User ID
 * @param {string} rawDataId - ID of the raw data in PostgreSQL
 * @param {Array<number>} vector - The embedding vector
 * @param {string} content - The text content that was embedded
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Result with the Weaviate ID
 */
async function storeRawDataEmbedding(userId, rawDataId, vector, content, metadata = {}) {
  try {
    await initializeSchema();
    
    const weaviateId = uuidv4();
    
    await client.data
      .creator()
      .withClassName(SCHEMA_CLASSES.RAW_DATA)
      .withId(weaviateId)
      .withProperties({
        userId,
        rawDataId,
        content: content.substring(0, 500), // Store truncated content for search preview
        metadata: JSON.stringify(metadata),
        createdAt: new Date().toISOString(),
      })
      .withVector(vector)
      .do();
    
    return {
      weaviateId,
      status: 'success'
    };
  } catch (error) {
    console.error('Error storing raw data embedding:', error);
    throw error;
  }
}

/**
 * Store semantic chunk embedding in Weaviate
 * @param {string} userId - User ID
 * @param {string} chunkId - ID of the semantic chunk in PostgreSQL
 * @param {Array<number>} vector - The embedding vector
 * @param {string} content - The text content that was embedded
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Result with the Weaviate ID
 */
async function storeSemanticChunkEmbedding(userId, chunkId, vector, content, metadata = {}) {
  try {
    await initializeSchema();
    
    const weaviateId = uuidv4();
    
    await client.data
      .creator()
      .withClassName(SCHEMA_CLASSES.SEMANTIC_CHUNK)
      .withId(weaviateId)
      .withProperties({
        userId,
        chunkId,
        content: content.substring(0, 500), // Store truncated content for search preview
        metadata: JSON.stringify(metadata),
        createdAt: new Date().toISOString(),
      })
      .withVector(vector)
      .do();
    
    return {
      weaviateId,
      status: 'success'
    };
  } catch (error) {
    console.error('Error storing semantic chunk embedding:', error);
    throw error;
  }
}

/**
 * Store thought embedding in Weaviate
 * @param {string} userId - User ID
 * @param {string} thoughtId - ID of the thought in PostgreSQL
 * @param {Array<number>} vector - The embedding vector
 * @param {string} content - The text content that was embedded
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Result with the Weaviate ID
 */
async function storeThoughtEmbedding(userId, thoughtId, vector, content, metadata = {}) {
  try {
    await initializeSchema();
    
    const weaviateId = uuidv4();
    
    await client.data
      .creator()
      .withClassName(SCHEMA_CLASSES.THOUGHT)
      .withId(weaviateId)
      .withProperties({
        userId,
        thoughtId,
        content: content.substring(0, 500), // Store truncated content for search preview
        metadata: JSON.stringify(metadata),
        createdAt: new Date().toISOString(),
      })
      .withVector(vector)
      .do();
    
    return {
      weaviateId,
      status: 'success'
    };
  } catch (error) {
    console.error('Error storing thought embedding:', error);
    throw error;
  }
}

/**
 * Perform semantic search over all vector types
 * @param {string} userId - User ID
 * @param {Array<number>} queryVector - Query vector
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Search results
 */
async function semanticSearch(userId, queryVector, options = {}) {
  try {
    const { limit = 5, threshold = 0.7, includeRawData = true, includeChunks = true, includeThoughts = true } = options;
    const results = [];
    
    // Helper function to search in a specific class
    async function searchInClass(className) {
      try {
        const response = await client.graphql
          .get()
          .withClassName(className)
          .withFields('content metadata _additional { id certainty }')
          .withNearVector({ vector: queryVector })
          .withWhere({
            operator: 'Equal',
            path: ['userId'],
            valueString: userId
          })
          .withLimit(limit)
          .do();
        
        const classResults = response.data.Get[className] || [];
        
        // Map results to a common format
        return classResults
          .filter(item => item._additional.certainty >= threshold)
          .map(item => {
            let type, id;
            const metadata = JSON.parse(item.metadata || '{}');
            
            switch (className) {
              case SCHEMA_CLASSES.RAW_DATA:
                type = 'raw_data';
                id = metadata.rawDataId;
                break;
              case SCHEMA_CLASSES.SEMANTIC_CHUNK:
                type = 'semantic_chunk';
                id = metadata.chunkId;
                break;
              case SCHEMA_CLASSES.THOUGHT:
                type = 'thought';
                id = metadata.thoughtId;
                break;
            }
            
            return {
              id: id || item._additional.id,
              weaviateId: item._additional.id,
              content: item.content,
              score: item._additional.certainty,
              type: type,
              metadata: metadata,
              className: className
            };
          });
      } catch (error) {
        console.error(`Error searching in ${className}:`, error);
        return [];
      }
    }
    
    // Search in each selected class
    const searchPromises = [];
    
    if (includeRawData) {
      searchPromises.push(searchInClass(SCHEMA_CLASSES.RAW_DATA));
    }
    
    if (includeChunks) {
      searchPromises.push(searchInClass(SCHEMA_CLASSES.SEMANTIC_CHUNK));
    }
    
    if (includeThoughts) {
      searchPromises.push(searchInClass(SCHEMA_CLASSES.THOUGHT));
    }
    
    // Gather and sort all results
    const allResults = [].concat(...(await Promise.all(searchPromises)));
    
    // Sort by certainty/score
    const sortedResults = allResults.sort((a, b) => b.score - a.score);
    
    // Take top N results
    return sortedResults.slice(0, limit);
  } catch (error) {
    console.error('Error in semantic search:', error);
    throw error;
  }
}

/**
 * Get vector stats for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Vector statistics
 */
async function getUserVectorStats(userId) {
  try {
    const classCounts = {};
    let totalVectors = 0;
    
    // Count vectors for each class
    for (const className of Object.values(SCHEMA_CLASSES)) {
      try {
        const response = await client.graphql
          .aggregate()
          .withClassName(className)
          .withFields('meta { count }')
          .withWhere({
            operator: 'Equal',
            path: ['userId'],
            valueString: userId
          })
          .do();
        
        const count = response.data.Aggregate[className][0]?.meta?.count || 0;
        classCounts[className] = count;
        totalVectors += count;
      } catch (error) {
        console.error(`Error getting vector stats for ${className}:`, error);
        classCounts[className] = 0;
      }
    }
    
    return {
      totalVectors,
      classCounts
    };
  } catch (error) {
    console.error('Error getting user vector stats:', error);
    return {
      totalVectors: 0,
      classCounts: {}
    };
  }
}

module.exports = {
  initializeSchema,
  storeRawDataEmbedding,
  storeSemanticChunkEmbedding,
  storeThoughtEmbedding,
  semanticSearch,
  getUserVectorStats,
  SCHEMA_CLASSES
}; 