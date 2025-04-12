/**
 * Test Knowledge Extraction without Neo4j
 * 
 * This script tests only the knowledge extraction from text using Gemini.
 * It does not require a running Neo4j database.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use the correct model name format for the latest Google Generative AI SDK
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Test messages with knowledge to extract
const testMessages = [
  "Apple Inc. was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976. The company is headquartered in Cupertino, California.",
  "Python is a programming language created by Guido van Rossum in 1991. It is widely used in data science and machine learning.",
  "The Eiffel Tower in Paris, France was built by Gustave Eiffel and was completed in 1889 for the World's Fair."
];

/**
 * Extract knowledge (entities and relationships) from a text message
 * @param {string} message - The message to extract knowledge from
 * @returns {Promise<Object>} Extracted entities and relationships
 */
async function extractKnowledge(message) {
  try {
    // Structured prompt for knowledge extraction
    const prompt = `
    Extract key entities and their relationships from the following text.
    Format the output as JSON with "entities" and "relationships" arrays.
    
    For entities, include:
    - name: The entity name
    - category: The entity type (PERSON, ORGANIZATION, LOCATION, CONCEPT, etc.)
    
    For relationships, include:
    - source: Name of the source entity
    - target: Name of the target entity
    - type: Type of relationship in UPPERCASE_WITH_UNDERSCORES format
    
    Text: "${message}"
    
    Response format:
    {
      "entities": [
        {"name": "entity_name", "category": "ENTITY_TYPE"},
        ...
      ],
      "relationships": [
        {"source": "source_entity", "target": "target_entity", "type": "RELATIONSHIP_TYPE"},
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
    
    return {
      entities: extractedData.entities || [],
      relationships: extractedData.relationships || []
    };
  } catch (error) {
    console.error('Knowledge extraction error:', error);
    // Return empty results on error
    return { entities: [], relationships: [] };
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log("=== KNOWLEDGE EXTRACTION TEST ===");
  console.log("Testing text-to-knowledge extraction using Gemini\n");
  
  try {
    // Process messages for knowledge extraction
    console.log("Extracting knowledge from test messages:");
    
    for (let i = 0; i < testMessages.length; i++) {
      console.log(`\nTest Message ${i+1}:`);
      console.log(`"${testMessages[i]}"`);
      
      const extractedKnowledge = await extractKnowledge(testMessages[i]);
      
      console.log("\nExtracted Entities:");
      if (extractedKnowledge.entities.length === 0) {
        console.log("No entities found");
      } else {
        extractedKnowledge.entities.forEach((entity, j) => {
          console.log(`${j+1}. ${entity.name} (${entity.category})`);
        });
      }
      
      console.log("\nExtracted Relationships:");
      if (extractedKnowledge.relationships.length === 0) {
        console.log("No relationships found");
      } else {
        extractedKnowledge.relationships.forEach((rel, j) => {
          console.log(`${j+1}. ${rel.source} -[${rel.type}]-> ${rel.target}`);
        });
      }
      
      console.log("\n------------------------------------");
    }
    
    console.log("\n✅ TEST COMPLETED SUCCESSFULLY");
    
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
  }
}

// Run the tests
runTests(); 