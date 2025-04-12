/**
 * Milvus Vector Database Service
 * Handles vector embeddings storage and similarity search
 */

const { MilvusClient } = require('@zilliz/milvus2-sdk-node');
const { generateEmbedding } = require('./embeddingService');
require('dotenv').config();

// Initialize Milvus client
const client = new MilvusClient(process.env.MILVUS_URI);

// Collection configuration
const ENTITY_COLLECTION = 'entity_embeddings';
const EMBEDDING_DIM = 768; // Dimension for embedding vectors

/**
 * Initialize Milvus database with required collections
 */
async function initDatabase() {
  try {
    // Check if collection exists
    const hasCollection = await client.hasCollection({
      collection_name: ENTITY_COLLECTION
    });

    // Create collection if it doesn't exist
    if (!hasCollection) {
      await client.createCollection({
        collection_name: ENTITY_COLLECTION,
        fields: [
          {
            name: 'id',
            data_type: 5, // DataType.VarChar
            is_primary_key: true,
            max_length: 100
          },
          {
            name: 'entity_name',
            data_type: 5, // DataType.VarChar
            max_length: 100
          },
          {
            name: 'category',
            data_type: 5, // DataType.VarChar
            max_length: 50
          },
          {
            name: 'interaction_id',
            data_type: 5, // DataType.VarChar
            max_length: 100
          },
          {
            name: 'embedding',
            data_type: 101, // DataType.FloatVector
            dim: EMBEDDING_DIM
          }
        ]
      });

      // Create index for vector search
      await client.createIndex({
        collection_name: ENTITY_COLLECTION,
        field_name: 'embedding',
        index_type: 'HNSW',
        metric_type: 'COSINE',
        params: { M: 8, efConstruction: 64 }
      });

      console.log('Milvus collection created and indexed successfully');
    } else {
      console.log('Milvus collection already exists');
    }

    // Load collection into memory for faster search
    await client.loadCollection({
      collection_name: ENTITY_COLLECTION
    });

    return true;
  } catch (error) {
    console.error('Error initializing Milvus database:', error);
    throw error;
  }
}

/**
 * Store entity embeddings in Milvus
 * @param {Array} entities - Array of entity objects with name and category
 * @param {string} interactionId - ID of the interaction these entities belong to
 * @returns {Promise<Object>} - Operation results
 */
async function storeEntityEmbeddings(entities, interactionId) {
  try {
    if (!entities || entities.length === 0) {
      return { success: true, count: 0 };
    }

    const data = [];

    // Generate embeddings for each entity
    for (const entity of entities) {
      const entityName = entity.entity;
      const category = entity.category;
      
      // Generate unique ID
      const entityId = `${entityName.toLowerCase().replace(/\s+/g, '_')}_${category.toLowerCase()}_${interactionId}`;
      
      // Generate embedding for entity name
      const embedding = await generateEmbedding(entityName);
      
      data.push({
        id: entityId,
        entity_name: entityName,
        category: category, 
        interaction_id: interactionId,
        embedding: embedding
      });
    }

    // Insert data in batches to Milvus
    const insertResult = await client.insert({
      collection_name: ENTITY_COLLECTION,
      data
    });

    return { 
      success: true, 
      count: data.length, 
      ids: insertResult.data.insertCnt
    };
  } catch (error) {
    console.error('Error storing entity embeddings:', error);
    throw error;
  }
}

/**
 * Search for similar entities based on text query
 * @param {string} textQuery - Text to search for similar entities
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} - Array of similar entities with scores
 */
async function searchSimilarEntities(textQuery, limit = 10) {
  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(textQuery);
    
    // Search for similar entities
    const searchResult = await client.search({
      collection_name: ENTITY_COLLECTION,
      vector: queryEmbedding,
      output_fields: ['entity_name', 'category', 'interaction_id'],
      limit: limit,
      search_params: {
        metric_type: 'COSINE',
        params: { ef: 64 }
      }
    });
    
    // Format results
    return searchResult.data.map(result => ({
      entityName: result.entity_name,
      category: result.category,
      interactionId: result.interaction_id,
      score: result.score
    }));
  } catch (error) {
    console.error('Error searching similar entities:', error);
    throw error;
  }
}

/**
 * Delete entities by interaction ID
 * @param {string} interactionId - ID of the interaction to delete entities for
 * @returns {Promise<Object>} - Operation results
 */
async function deleteByInteractionId(interactionId) {
  try {
    const deleteResult = await client.delete({
      collection_name: ENTITY_COLLECTION,
      expr: `interaction_id == "${interactionId}"`
    });
    
    return {
      success: true,
      deleted: deleteResult.data.deleteCnt
    };
  } catch (error) {
    console.error('Error deleting entities by interaction ID:', error);
    throw error;
  }
}

module.exports = {
  initDatabase,
  storeEntityEmbeddings,
  searchSimilarEntities,
  deleteByInteractionId
}; 