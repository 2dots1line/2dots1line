/**
 * AI Service for entity and relation extraction
 * Handles interactions with the Gemini API to extract entities and relationships
 * for the knowledge graph from user input text
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract entities and relations from text input
 * @param {string} text - The input text to analyze
 * @returns {Promise<Array>} - Array of extracted entities and relations
 */
async function extractEntitiesAndRelations(text) {
  try {
    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
    Extract entities and their relationships from the following text. Format the output as a JSON array where each item represents an entity or relationship.

    For entities, use this format:
    {
      "type": "entity",
      "entity": "entity_name",
      "category": "person|organization|concept|project|emotion|activity",
      "attributes": { optional attributes as key-value pairs }
    }

    For relationships, use this format:
    {
      "type": "relation",
      "source": "source_entity",
      "relation": "relation_type",
      "target": "target_entity",
      "attributes": { optional attributes as key-value pairs }
    }

    Text to analyze: "${text}"

    Return only valid JSON - no other text, explanations or commentary.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\[\s*{.*}\s*\]/s);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from AI response");
      return [];
    }
    
    // Parse the JSON result
    const extractionResult = JSON.parse(jsonMatch[0]);
    return extractionResult;
  } catch (error) {
    console.error("Error in entity extraction:", error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

module.exports = {
  extractEntitiesAndRelations
}; 