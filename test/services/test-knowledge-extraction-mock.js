/**
 * Test Knowledge Extraction using Mock Data
 * 
 * This script tests the knowledge graph pipeline with mock extraction data
 * (no real API calls to Gemini or Neo4j).
 */

require('dotenv').config();

// Test messages with knowledge to extract
const testMessages = [
  "Apple Inc. was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976. The company is headquartered in Cupertino, California.",
  "Python is a programming language created by Guido van Rossum in 1991. It is widely used in data science and machine learning.",
  "The Eiffel Tower in Paris, France was built by Gustave Eiffel and was completed in 1889 for the World's Fair."
];

// Mock knowledge extraction responses
const mockExtractions = [
  {
    entities: [
      { name: "Apple Inc.", category: "ORGANIZATION" },
      { name: "Steve Jobs", category: "PERSON" },
      { name: "Steve Wozniak", category: "PERSON" },
      { name: "Ronald Wayne", category: "PERSON" },
      { name: "Cupertino", category: "LOCATION" },
      { name: "California", category: "LOCATION" }
    ],
    relationships: [
      { source: "Apple Inc.", target: "Steve Jobs", type: "FOUNDED_BY" },
      { source: "Apple Inc.", target: "Steve Wozniak", type: "FOUNDED_BY" },
      { source: "Apple Inc.", target: "Ronald Wayne", type: "FOUNDED_BY" },
      { source: "Apple Inc.", target: "Cupertino", type: "HEADQUARTERED_IN" },
      { source: "Cupertino", target: "California", type: "LOCATED_IN" }
    ]
  },
  {
    entities: [
      { name: "Python", category: "TECHNOLOGY" },
      { name: "Guido van Rossum", category: "PERSON" },
      { name: "data science", category: "FIELD" },
      { name: "machine learning", category: "FIELD" }
    ],
    relationships: [
      { source: "Python", target: "Guido van Rossum", type: "CREATED_BY" },
      { source: "Python", target: "data science", type: "USED_IN" },
      { source: "Python", target: "machine learning", type: "USED_IN" }
    ]
  },
  {
    entities: [
      { name: "Eiffel Tower", category: "LANDMARK" },
      { name: "Paris", category: "LOCATION" },
      { name: "France", category: "LOCATION" },
      { name: "Gustave Eiffel", category: "PERSON" },
      { name: "World's Fair", category: "EVENT" }
    ],
    relationships: [
      { source: "Eiffel Tower", target: "Paris", type: "LOCATED_IN" },
      { source: "Paris", target: "France", type: "LOCATED_IN" },
      { source: "Eiffel Tower", target: "Gustave Eiffel", type: "BUILT_BY" },
      { source: "Eiffel Tower", target: "World's Fair", type: "BUILT_FOR" }
    ]
  }
];

/**
 * Mock extraction function that returns pre-defined results
 * @param {string} message - The message text
 * @param {number} index - The index of the message in test array
 * @returns {Object} Mock extracted knowledge
 */
function mockExtractKnowledge(message, index) {
  // Just return the corresponding mock result
  return mockExtractions[index];
}

/**
 * Mock Neo4j entity creation
 * @param {string} name - Entity name
 * @param {string} category - Entity category
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Mock entity object
 */
function mockCreateEntity(name, category, metadata = {}) {
  return {
    name,
    category,
    ...metadata,
    id: `entity-${name.toLowerCase().replace(/\s+/g, '-')}`,
    createdAt: new Date().toISOString()
  };
}

/**
 * Mock Neo4j relationship creation
 * @param {string} sourceName - Source entity name
 * @param {string} targetName - Target entity name
 * @param {string} type - Relationship type
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Mock relationship object
 */
function mockCreateRelationship(sourceName, targetName, type, metadata = {}) {
  return {
    source: { name: sourceName },
    target: { name: targetName },
    relationship: {
      type,
      ...metadata,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Process a message to extract knowledge (using mock data)
 * @param {string} message - The message content
 * @param {string} interactionId - Unique ID for this interaction
 * @param {string} userId - ID of the user who sent the message
 * @param {number} index - Index in the test messages array
 * @returns {Object} Processing results including entities and relationships
 */
function processMessageForKnowledge(message, interactionId, userId, index) {
  // Step 1: Extract knowledge from message (mocked)
  const extractedKnowledge = mockExtractKnowledge(message, index);
  
  // Step 2: Simulate storing entities and relationships
  const results = {
    entities: [],
    relationships: [],
    error: null
  };

  // Process entities
  if (extractedKnowledge.entities && extractedKnowledge.entities.length > 0) {
    for (const entity of extractedKnowledge.entities) {
      try {
        // Include metadata with the entity
        const entityWithMeta = mockCreateEntity(
          entity.name,
          entity.category,
          {
            sourceInteractionId: interactionId,
            sourceUserId: userId,
            extractedAt: new Date().toISOString(),
            confidence: 0.9
          }
        );
        results.entities.push(entityWithMeta);
      } catch (err) {
        console.error(`Error creating entity ${entity.name}:`, err);
      }
    }
  }

  // Process relationships
  if (extractedKnowledge.relationships && extractedKnowledge.relationships.length > 0) {
    for (const rel of extractedKnowledge.relationships) {
      try {
        // Include metadata with the relationship
        const relWithMeta = mockCreateRelationship(
          rel.source,
          rel.target,
          rel.type,
          {
            sourceInteractionId: interactionId,
            sourceUserId: userId,
            extractedAt: new Date().toISOString(),
            confidence: 0.9
          }
        );
        results.relationships.push(relWithMeta);
      } catch (err) {
        console.error(`Error creating relationship from ${rel.source} to ${rel.target}:`, err);
      }
    }
  }

  return results;
}

/**
 * Main test function
 */
async function runTests() {
  console.log("=== KNOWLEDGE GRAPH MOCK TEST ===");
  console.log("Testing knowledge extraction and processing with mock data\n");
  
  try {
    // Test IDs
    const userId = "test-user-" + Date.now();
    const interactionIds = ["interaction-1", "interaction-2", "interaction-3"];
    
    // Process messages for knowledge extraction
    console.log("Processing test messages:");
    
    for (let i = 0; i < testMessages.length; i++) {
      console.log(`\nTest Message ${i+1}:`);
      console.log(`"${testMessages[i]}"`);
      
      const result = processMessageForKnowledge(
        testMessages[i],
        interactionIds[i],
        userId,
        i
      );
      
      console.log("\nExtracted Entities:");
      result.entities.forEach((entity, j) => {
        console.log(`${j+1}. ${entity.name} (${entity.category})`);
      });
      
      console.log("\nExtracted Relationships:");
      result.relationships.forEach((rel, j) => {
        console.log(`${j+1}. ${rel.source.name} -[${rel.relationship.type}]-> ${rel.target.name}`);
      });
      
      console.log("\n------------------------------------");
    }
    
    console.log("\n✅ TEST COMPLETED SUCCESSFULLY");
    
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
  }
}

// Run the tests
runTests(); 