/**
 * Test Routes for Memory Pipeline
 * 
 * These routes enable automated testing of the memory system components.
 * IMPORTANT: These should be disabled in production.
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

// Services
const semanticMemoryService = require('../services/semanticMemoryService');
const thoughtService = require('../services/thoughtService');
const memoryBroker = require('../memory/memoryBroker');

// Only allow these routes in development/test environments
if (process.env.NODE_ENV !== 'production') {
  /**
   * Test the full memory pipeline end-to-end
   * POST /api/test/memory-pipeline
   */
  router.post('/memory-pipeline', async (req, res) => {
    try {
      console.log(`[TEST] Starting end-to-end memory pipeline test`);
      
      // Get test parameters or use defaults
      const {
        userId = null,
        content = "I've been thinking a lot about my career goals lately. I want to find a balance between creative work and stability. My partner thinks I should take more risks, but I'm worried about financial security with our new baby coming in July.",
        contentType = 'test_input',
        runThoughtExtraction = true
      } = req.body;
      
      // Create a test user if not provided
      let testUserId = userId;
      let createdTestUser = false;
      
      if (!testUserId) {
        // Create a temporary test user
        const testUser = await prisma.user.create({
          data: {
            user_id: uuidv4(),
            email: `test-${Date.now()}@example.com`,
            password_hash: 'test-hash-not-for-auth',
            first_name: 'Test',
            last_name: 'User'
          }
        });
        
        testUserId = testUser.user_id;
        createdTestUser = true;
        console.log(`[TEST] Created test user with ID: ${testUserId}`);
      }
      
      // Generate a session ID
      const sessionId = uuidv4();
      console.log(`[TEST] Using test session with ID: ${sessionId}`);
      
      // Test 1: Create an interaction
      console.log(`[TEST] Step 1: Creating test interaction`);
      const interaction = await prisma.interaction.create({
        data: {
          interaction_id: uuidv4(),
          interaction_type: 'test',
          raw_data: { message: content },
          user: { connect: { user_id: testUserId } },
          session_id: sessionId
        }
      });
      
      console.log(`[TEST] Created test interaction: ${interaction.interaction_id}`);
      
      // Test 2: Process raw data
      console.log(`[TEST] Step 2: Processing raw data`);
      const processingResult = await semanticMemoryService.processRawData(
        testUserId,
        content,
        contentType,
        { 
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        }
      );
      
      console.log(`[TEST] Raw data processed. Created ${processingResult.chunks.length} chunks`);
      
      // Test 3: Calculate importance score
      console.log(`[TEST] Step 3: Testing importance scoring`);
      const importanceScore = semanticMemoryService.calculateImportanceScore(content, contentType);
      console.log(`[TEST] Importance score for content: ${importanceScore.toFixed(2)}`);
      
      let thoughtResults = { thoughts: [] };
      
      // Test 4: Extract thoughts if requested
      if (runThoughtExtraction) {
        console.log(`[TEST] Step 4: Testing thought extraction`);
        const thoughts = await thoughtService.processInteractionForThoughts(interaction.interaction_id);
        console.log(`[TEST] Extracted ${thoughts.length} thoughts`);
        
        thoughtResults = { thoughts };
      }
      
      // Test 5: Get memory statistics
      console.log(`[TEST] Step 5: Getting memory statistics`);
      const memoryStats = await semanticMemoryService.getUserMemoryStats(testUserId);
      console.log(`[TEST] Memory statistics: ${JSON.stringify(memoryStats)}`);
      
      // Clean up test data if we created a test user
      if (createdTestUser && process.env.TEST_KEEP_DATA !== 'true') {
        console.log(`[TEST] Cleaning up test data`);
        
        // Delete all thoughts
        await prisma.thought.deleteMany({
          where: { userId: testUserId }
        });
        
        // Delete all semantic chunks
        await prisma.semanticChunk.deleteMany({
          where: { perspectiveOwnerId: testUserId }
        });
        
        // Delete all raw data
        await prisma.rawData.deleteMany({
          where: { userId: testUserId }
        });
        
        // Delete all interactions
        await prisma.interaction.deleteMany({
          where: { user_id: testUserId }
        });
        
        // Delete the user
        await prisma.user.delete({
          where: { user_id: testUserId }
        });
        
        console.log(`[TEST] Test data cleaned up`);
      }
      
      // Return test results
      res.status(200).json({
        success: true,
        testId: uuidv4(),
        steps: {
          interaction: {
            id: interaction.interaction_id,
            type: interaction.interaction_type,
            success: true
          },
          rawData: {
            id: processingResult.rawData.id,
            chunks: processingResult.chunks.length,
            success: true
          },
          importanceScoring: {
            score: importanceScore,
            success: true
          },
          thoughtExtraction: {
            count: thoughtResults.thoughts.length,
            success: runThoughtExtraction
          },
          memoryStats: memoryStats
        },
        session: sessionId,
        user: testUserId,
        cleaned: createdTestUser && process.env.TEST_KEEP_DATA !== 'true'
      });
    } catch (error) {
      console.error(`[TEST ERROR] Memory pipeline test failed:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  /**
   * Test the importance scoring algorithm
   * POST /api/test/importance-scoring
   */
  router.post('/importance-scoring', async (req, res) => {
    try {
      console.log(`[TEST] Testing importance scoring algorithm`);
      
      const { 
        samples = [
          { content: "Hello, how are you today?", type: "chat_message" },
          { content: "I'm feeling anxious about my job interview tomorrow.", type: "chat_message" },
          { content: "My son started college this fall and I'm really proud of him.", type: "chat_message" },
          { content: "I'm having trouble with my partner. We argue about finances constantly.", type: "chat_message" },
          { content: "Let me think about that for a moment.", type: "ai_response" }
        ]
      } = req.body;
      
      // Score each sample
      const results = samples.map(sample => {
        const score = semanticMemoryService.calculateImportanceScore(sample.content, sample.type);
        
        return {
          content: sample.content,
          type: sample.type,
          score: score,
          meetsThreshold: score >= 0.6
        };
      });
      
      // Sort by score descending
      results.sort((a, b) => b.score - a.score);
      
      res.status(200).json({
        success: true,
        results,
        summary: {
          totalSamples: results.length,
          avgScore: results.reduce((sum, item) => sum + item.score, 0) / results.length,
          meetsThreshold: results.filter(r => r.meetsThreshold).length
        }
      });
    } catch (error) {
      console.error(`[TEST ERROR] Importance scoring test failed:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  /**
   * Test the semantic chunking algorithm
   * POST /api/test/semantic-chunking
   */
  router.post('/semantic-chunking', async (req, res) => {
    try {
      console.log(`[TEST] Testing semantic chunking algorithm`);
      
      const { 
        content = "This is a test of the semantic chunking algorithm. It should break this content into meaningful chunks based on sentence boundaries. Each chunk should maintain context while respecting natural language structures. This approach ensures that when the content is processed further, the semantic meaning is preserved. For longer passages, especially those with multiple paragraphs, the algorithm should maintain a reasonable overlap between chunks to ensure context is not lost. This is particularly important when processing user narratives that might contain complex stories or multi-faceted descriptions of events and emotions."
      } = req.body;
      
      // Get chunks using the service
      const chunks = semanticMemoryService.createSemanticChunks(content);
      
      // Generate a simple summary for each chunk (first 50 characters)
      const generateSummary = (text) => text.substring(0, Math.min(50, text.length)) + '...';
      
      res.status(200).json({
        success: true,
        originalLength: content.length,
        chunks: chunks.map((chunk, index) => ({
          index,
          content: chunk,
          length: chunk.length,
          summary: generateSummary(chunk)
        })),
        summary: {
          totalChunks: chunks.length,
          avgChunkLength: chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length
        }
      });
    } catch (error) {
      console.error(`[TEST ERROR] Semantic chunking test failed:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = router; 