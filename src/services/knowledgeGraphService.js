/**
 * Knowledge Graph Service
 * Handles knowledge extraction and graph operations
 */

const neo4jService = require('./neo4jService');
const weaviateService = require('./weaviateService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateEmbeddings } = require('../models/vectorUtils');
require('dotenv').config();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Process a message to extract knowledge and store in Neo4j
 * @param {string} message - The message content
 * @param {string} interactionId - Unique ID for this interaction
 * @param {string} userId - ID of the user who sent the message
 * @returns {Promise<Object>} Processing results including entities and relationships
 */
async function processMessageForKnowledge(message, interactionId, userId) {
  try {
    console.log(`[DEBUG] Processing message for knowledge extraction: "${message.substring(0, 50)}..."`);
    
    // In a real implementation, this would:
    // 1. Use AI to extract entities and relationships
    // 2. Store them in Neo4j
    // 3. Return the created entities and relationships
    
    // For now, just return empty arrays
    return {
      status: 'success',
      message: 'Knowledge extraction processed (dummy implementation)',
      entities: [],
      relationships: []
    };
  } catch (error) {
    console.error(`[ERROR] Failed to process message for knowledge:`, error);
    return {
      status: 'error',
      message: `Knowledge extraction failed: ${error.message}`,
      error: error.message,
      entities: [],
      relationships: []
    };
  }
}

/**
 * Extract knowledge (entities and relationships) from a text message
 * @param {string} message - The message to extract knowledge from
 * @returns {Promise<Object>} Extracted entities and relationships
 */
async function extractKnowledge(message) {
  try {
    // Structured prompt for knowledge extraction with domain-specific schema
    const prompt = `
    Analyze the following text and extract meaningful entities and relationships for a user-focused knowledge graph.
    
    Use the following SCHEMA:
    
    NODE TYPES:
    - Person: People mentioned by name (including the user)
    - Trait: Character traits, personality attributes
    - Interest: Hobbies, activities, topics of interest
    - Value: Personal values, principles, beliefs
    - Event: Specific occurrences, happenings
    - Emotion: Feelings, emotional states
    - Action: Things done or to be done
    - Challenge: Problems, difficulties, obstacles
    - Location: Places, geographic entities
    - Organization: Companies, institutions, groups
    - Concept: Abstract ideas, theories
    - Goal: Objectives, aspirations
    - System: Contexts, environments (e.g., family system)
    
    RELATIONSHIP TYPES:
    - HAS_TRAIT: Links Person to Trait
    - PURSUES_INTEREST: Links Person to Interest
    - MOTIVATED_BY: Links Person/Action to Value
    - EXPERIENCED_EVENT: Links Person to Event
    - REACTED_WITH: Links Event to Emotion
    - TOOK_ACTION: Links Person to Action
    - GUIDED_BY: Links Action to Value/Goal
    - FACES_CHALLENGE: Links Person to Challenge
    - EMBEDS_INTO: Links Person to System
    - WORKS_AT: Links Person to Organization
    - LOCATED_IN: Links Person to Location
    - KNOWS: Links Person to Person
    - HAS_AFFECTION_FOR: Links Person to Person/Thing
    - INVOLVED_IN: Links Person to Event/Action
    - GIVEN_TO: Links Trait/Emotion to Person
    - OFFERED: Links Person to Service/Thing
    - HAS_RELATIONSHIP_WITH: Links Person to Person
    - REQUIRED_FOR: Links Interest/Skill to Goal
    - HAS_PET: Links Person to Pet
    
    Only extract entities and relationships that are explicitly mentioned or can be reasonably inferred from the text.
    Format the output as JSON with "entities" and "relationships" arrays.
    Include a confidence score (0.0-1.0) for each extraction.
    
    For entities, include:
    - name: The entity name (specific, not generic)
    - category: One of the node types listed above
    - confidence: How certain you are of this entity (0.0-1.0)
    - properties: Additional properties relevant to this entity type
    
    For relationships, include:
    - source: Name of the source entity (must match an entity name)
    - target: Name of the target entity (must match an entity name)
    - type: One of the relationship types listed above
    - confidence: How certain you are of this relationship (0.0-1.0)
    
    Text: "${message}"
    
    Response format:
    {
      "entities": [
        {"name": "entity_name", "category": "NODE_TYPE", "confidence": 0.9, "properties": {"key": "value"}},
        ...
      ],
      "relationships": [
        {"source": "source_entity", "target": "target_entity", "type": "RELATIONSHIP_TYPE", "confidence": 0.8},
        ...
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/{[\s\S]*}/) ||
                      text.match(/\{[\s\S]*\}/);
                      
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }
    
    // Parse the extracted JSON
    let jsonStr = jsonMatch[0];
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonMatch[1];
    }
    
    const extractedData = JSON.parse(jsonStr);
    
    // Filter out low-confidence extractions
    const entities = (extractedData.entities || [])
      .filter(entity => entity.confidence === undefined || entity.confidence >= 0.7);
    
    const relationships = (extractedData.relationships || [])
      .filter(rel => rel.confidence === undefined || rel.confidence >= 0.7);
    
    // Validate that relationship entities exist
    const validRelationships = relationships.filter(rel => {
      const sourceExists = entities.some(e => e.name === rel.source);
      const targetExists = entities.some(e => e.name === rel.target);
      return sourceExists && targetExists;
    });
    
    return {
      entities: entities,
      relationships: validRelationships
    };
  } catch (error) {
    console.error('Knowledge extraction error:', error);
    // Return empty results on error
    return { entities: [], relationships: [] };
  }
}

/**
 * Delete all knowledge associated with an interaction
 * @param {string} interactionId - ID of the interaction
 * @returns {Promise<Object>} Deletion results
 */
async function deleteKnowledgeByInteractionId(interactionId) {
  try {
    // Initialize Neo4j connection
    await neo4jService.init();
    
    // Delete all entities and relationships with this interaction ID
    const results = await neo4jService.deleteByInteractionId(interactionId);
    
    // Could also delete vectors associated with this interaction ID
    // This would require building query capability in weaviateService
    
    return {
      success: true,
      deletedCount: results.deletedCount
    };
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Close Neo4j connection
    await neo4jService.close();
  }
}

/**
 * Query entities by name pattern
 * @param {string} namePattern - Pattern to search for
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Matching entities
 */
async function queryEntitiesByName(namePattern, limit = 10) {
  try {
    // Initialize Neo4j connection
    await neo4jService.init();
    
    // Search for entities matching the pattern
    return await neo4jService.queryEntitiesByName(namePattern, limit);
  } catch (error) {
    console.error('Error querying entities:', error);
    throw new Error(`Entity query failed: ${error.message}`);
  } finally {
    // Close Neo4j connection
    await neo4jService.close();
  }
}

/**
 * Perform semantic search on knowledge graph data
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Search results
 */
async function semanticSearch(userId, query, options = {}) {
  try {
    // Generate embedding for the query
    const queryVector = await generateEmbeddings(query);
    
    // Search for similar entities and relationships
    const searchResults = await weaviateService.semanticSearch(
      userId, 
      queryVector,
      {
        limit: options.limit || 10,
        threshold: options.threshold || 0.7,
        includeRawData: false,
        includeChunks: false,
        includeThoughts: true
      }
    );
    
    // Format results
    const formatted = await Promise.all(searchResults.map(async (result) => {
      // For each result, we'll try to fetch additional information from Neo4j
      try {
        if (result.metadata && result.metadata.type) {
          if (result.metadata.type === 'entity' && result.metadata.category) {
            // For entities, get neighborhood if the function exists
            if (typeof neo4jService.getEntityDetails === 'function') {
              const entityDetails = await neo4jService.getEntityDetails(result.metadata.thoughtId);
              return {
                ...result,
                entityDetails: entityDetails || null
              };
            }
          } else if (result.metadata.type === 'relationship') {
            // For relationships, get relationship details if the function exists
            if (typeof neo4jService.getRelationshipDetails === 'function') {
              const relationshipDetails = await neo4jService.getRelationshipDetails(result.metadata.thoughtId);
              return {
                ...result,
                relationshipDetails: relationshipDetails || null
              };
            }
          }
        }
        return result;
      } catch (error) {
        console.error('Error enriching search result:', error);
        return result;
      }
    }));
    
    return formatted;
  } catch (error) {
    console.error('Error in semantic search:', error);
    throw new Error(`Semantic search failed: ${error.message}`);
  }
}

/**
 * Get neighborhood of an entity
 * @param {string} entityName - Name of the entity
 * @param {number} depth - Depth of neighborhood exploration
 * @returns {Promise<Object>} Entity and its neighborhood
 */
async function getEntityNeighborhood(entityName, depth = 1) {
  try {
    // Initialize Neo4j connection
    await neo4jService.init();
    
    // Get entity neighborhood
    return await neo4jService.getEntityNeighborhood(entityName, depth);
  } catch (error) {
    console.error('Error getting entity neighborhood:', error);
    throw new Error(`Neighborhood query failed: ${error.message}`);
  } finally {
    // Close Neo4j connection
    await neo4jService.close();
  }
}

module.exports = {
  processMessageForKnowledge,
  deleteKnowledgeByInteractionId,
  queryEntitiesByName,
  getEntityNeighborhood,
  semanticSearch
}; 