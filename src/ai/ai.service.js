/**
 * AI Service Module
 * Handles interactions with the Gemini API for:
 * 1. Thought extraction from user interactions
 * 2. Entity and relationship extraction for knowledge graph
 * 3. Vector embedding generation
 */

const axios = require('axios');
const prompts = require('./prompts');

// Models
const TEXT_MODEL = 'gemini-1.5-flash'; // For text generation/analysis
const EMBEDDING_MODEL = 'embedding-001'; // For vector embeddings

// API Key - from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Extract thoughts, entities, and relationships from interaction text
 * @param {string} text - The interaction text to analyze 
 * @param {object} context - Optional context (e.g., user info, session history)
 * @returns {Promise<object>} - Structured analysis with thoughts, entities, and relationships
 */
async function extractThoughts(text, context = {}) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }

    // Combine prompt with text
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompts.THOUGHT_EXTRACTION_PROMPT },
            { text: `\nINPUT TEXT TO ANALYZE:\n${text}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent, deterministic output
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192, // Allow large output
        responseFormat: { type: "OBJECT" } // Request JSON response
      }
    };

    console.log('[DEBUG] Sending thought extraction request to Gemini...');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log(`[DEBUG] Received Gemini response status: ${response.status}`);

    if (response.status !== 200) {
      console.error(`[ERROR] Gemini API returned non-200 status: ${response.status}`);
      throw new Error(`Gemini API request failed with status ${response.status}`);
    }

    // Parse the response to extract the generated thoughts
    const thoughts = parseThoughtExtractionResponse(response.data);
    return thoughts;
  } catch (error) {
    console.error('[ERROR] Thought extraction failed:', error);
    throw new Error(`Failed to extract thoughts: ${error.message}`);
  }
}

/**
 * Generate a clarification question for ambiguous information
 * @param {string} previousContext - The interaction text that contains ambiguity
 * @param {string} ambiguityDescription - Description of what needs clarification
 * @returns {Promise<string>} - A clear question to ask the user
 */
async function generateClarificationQuestion(previousContext, ambiguityDescription) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }

    // Replace placeholders in the clarification prompt
    const promptText = prompts.CLARIFICATION_PROMPT
      .replace('{previousContext}', previousContext)
      .replace('{ambiguityDescription}', ambiguityDescription);

    const requestBody = {
      contents: [
        {
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 100 // Short response
      }
    };

    console.log('[DEBUG] Sending clarification request to Gemini...');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.status !== 200) {
      console.error(`[ERROR] Gemini API returned non-200 status: ${response.status}`);
      throw new Error(`Gemini API request failed with status ${response.status}`);
    }

    // Extract the question from response
    const question = response.data.candidates[0].content.parts[0].text.trim();
    return question;
  } catch (error) {
    console.error('[ERROR] Clarification question generation failed:', error);
    throw new Error(`Failed to generate clarification question: ${error.message}`);
  }
}

/**
 * Generate vector embeddings for text
 * @param {string} text - The text to generate embeddings for
 * @returns {Promise<object>} - Object containing the embedding vector
 */
async function generateEmbeddings(text) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
      {
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: text }] }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.status !== 200) {
      throw new Error(`Embedding API request failed with status ${response.status}`);
    }

    // Extract the embedding vector from the response
    const embedding = {
      vector: response.data.embedding.values,
      model: EMBEDDING_MODEL
    };

    return embedding;
  } catch (error) {
    console.error('[ERROR] Failed to generate embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Parse the response from the thought extraction API call
 * @param {object} response - The raw API response
 * @returns {array} - Array of thought objects with entities and relationships
 */
function parseThoughtExtractionResponse(response) {
  try {
    // Extract the generated JSON content
    const candidates = response.candidates || [];
    if (candidates.length === 0) {
      throw new Error('No candidates in API response');
    }

    const content = candidates[0].content;
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error('Invalid content structure in API response');
    }

    // Try to parse the JSON from the text response
    let thoughts;
    try {
      // Check if it's already an object (responseFormat: OBJECT was used)
      if (typeof content.parts[0] === 'object' && content.parts[0].functionResponse) {
        const functionResponse = content.parts[0].functionResponse;
        thoughts = functionResponse.response || [];
      } else {
        // It's a text response, so we need to parse it
        const textContent = content.parts[0].text.trim();
        // Find JSON array in the response
        const jsonMatch = textContent.match(/\[\s*{[\s\S]*}\s*\]/);
        if (jsonMatch) {
          thoughts = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in response');
        }
      }
    } catch (parseError) {
      console.error('[ERROR] Failed to parse JSON from response:', parseError);
      throw new Error(`Failed to parse thought extraction response: ${parseError.message}`);
    }

    // Validate the structure of the parsed thoughts
    if (!Array.isArray(thoughts)) {
      throw new Error('Parsed response is not an array');
    }

    return thoughts;
  } catch (error) {
    console.error('[ERROR] Failed to parse thought extraction response:', error);
    throw new Error(`Failed to parse thought extraction response: ${error.message}`);
  }
}

module.exports = {
  extractThoughts,
  generateClarificationQuestion,
  generateEmbeddings
}; 