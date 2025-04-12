/**
 * Knowledge Extraction Service
 * Extracts knowledge entities and relationships from text using AI
 */

const { GeminiAI } = require('../utils/geminiAI');
const neo4jService = require('./neo4jService');
const milvusService = require('./milvusService');
require('dotenv').config();

const gemini = new GeminiAI(process.env.GEMINI_API_KEY);

/**
 * Extract knowledge from text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} - Extracted entities and relationships
 */
async function extractKnowledge(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Valid text input is required');
    }

    // Prompt for knowledge extraction
    const prompt = `
      Extract named entities and their relationships from the following text.
      Identify people, organizations, concepts, locations, and other important entities.
      For each entity, determine its category (PERSON, ORGANIZATION, CONCEPT, LOCATION, etc.)
      Also identify relationships between entities.

      Text: "${text}"

      Return the extracted knowledge as a JSON object with this structure:
      {
        "entities": [
          {
            "name": "entity name",
            "category": "PERSON/ORGANIZATION/CONCEPT/LOCATION/etc."
          }
        ],
        "relationships": [
          {
            "source": "source entity name",
            "target": "target entity name",
            "type": "relationship type in uppercase with underscores"
          }
        ]
      }
    `;

    const response = await gemini.generateContent(prompt);
    
    if (!response || !response.text) {
      throw new Error('Failed to get valid response from AI model');
    }

    // Extract JSON from the response
    const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/) || 
                     response.text.match(/{[\s\S]*}/);
                     
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }
    
    let jsonStr = jsonMatch[0];
    if (jsonMatch[1]) {
      jsonStr = jsonMatch[1];
    }

    // Parse JSON
    const extractedKnowledge = JSON.parse(jsonStr);
    
    // Validate structure
    if (!extractedKnowledge.entities || !Array.isArray(extractedKnowledge.entities)) {
      throw new Error('Invalid extraction format: missing entities array');
    }
    
    if (!extractedKnowledge.relationships || !Array.isArray(extractedKnowledge.relationships)) {
      extractedKnowledge.relationships = []; // Initialize empty relationships if none found
    }
    
    return extractedKnowledge;
  } catch (error) {
    console.error('Knowledge extraction error:', error);
    // Return empty results instead of failing completely
    return {
      entities: [],
      relationships: [],
      error: error.message
    };
  }
}

/**
 * Process a user message and store extracted knowledge
 * @param {string} message - User message
 * @param {string} interactionId - Unique ID for this interaction
 * @returns {Promise<Object>} - Processing result
 */
async function processMessage(message, interactionId) {
  try {
    // Extract knowledge from message
    const extractedData = await extractKnowledge(message);
    
    // Store in Neo4j graph database
    const graphResult = await neo4jService.storeKnowledgeGraph(interactionId, extractedData);
    
    // Store entity embeddings in Milvus
    const vectorResult = await milvusService.storeEntityEmbeddings(extractedData, interactionId);
    
    return {
      success: true,
      extractedData,
      graphResult,
      vectorResult
    };
  } catch (error) {
    console.error('Error processing message:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Query knowledge graph with semantic search capabilities
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Query results
 */
async function queryKnowledge(options = {}) {
  try {
    // Get graph data from Neo4j
    const graphData = await neo4jService.queryKnowledgeGraph(options);
    
    // If there's a text query, perform vector similarity search
    let similarEntities = [];
    if (options.queryText) {
      similarEntities = await milvusService.searchSimilarEntities(options.queryText, {
        limit: options.limit || 10
      });
    }
    
    return {
      success: true,
      graphData,
      similarEntities
    };
  } catch (error) {
    console.error('Error querying knowledge:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  extractKnowledge,
  processMessage,
  queryKnowledge
}; 