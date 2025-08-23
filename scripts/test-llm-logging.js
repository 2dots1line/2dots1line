#!/usr/bin/env node

/**
 * Test script for LLM interaction logging
 * This script tests the LLM interaction logging functionality
 */

const { DatabaseService } = require('../packages/database/dist/DatabaseService');
const { LLMChatTool } = require('../packages/tools/dist/ai/LLMChatTool');

async function testLLMLogging() {
  console.log('🧪 Testing LLM Interaction Logging...\n');

  try {
    // Initialize database service
    const dbService = DatabaseService.getInstance();
    console.log('✅ DatabaseService initialized');

    // Test LLM call with logging
    console.log('🤖 Making test LLM call...');
    const testResult = await LLMChatTool.execute({
      payload: {
        userId: 'test-user-123',
        sessionId: 'test-session-456',
        workerType: 'test-worker',
        workerJobId: 'test-job-789',
        conversationId: 'test-conversation-101',
        messageId: 'test-message-202',
        sourceEntityId: 'test-entity-303',
        systemPrompt: 'You are a helpful assistant. Respond with a simple greeting.',
        history: [],
        userMessage: 'Hello, this is a test message for LLM interaction logging.',
        temperature: 0.7,
        maxTokens: 100
      }
    });

    console.log('✅ LLM call completed');
    console.log('📝 Response:', testResult.result?.text?.substring(0, 100) + '...');

    // Wait a moment for logging to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Query the logged interaction
    console.log('\n🔍 Querying logged interaction...');
    const interactions = await dbService.llmInteractionRepository.getInteractions({
      userId: 'test-user-123',
      workerType: 'test-worker'
    }, 1);

    if (interactions.length > 0) {
      const interaction = interactions[0];
      console.log('✅ LLM interaction logged successfully!');
      console.log('📊 Log Details:');
      console.log(`   - Interaction ID: ${interaction.interaction_id}`);
      console.log(`   - Worker Type: ${interaction.worker_type}`);
      console.log(`   - User ID: ${interaction.user_id}`);
      console.log(`   - Model: ${interaction.model_name}`);
      console.log(`   - Status: ${interaction.status}`);
      console.log(`   - Prompt Length: ${interaction.prompt_length} chars`);
      console.log(`   - Response Length: ${interaction.response_length} chars`);
      console.log(`   - Processing Time: ${interaction.processing_time_ms}ms`);
      console.log(`   - Created At: ${interaction.created_at}`);
    } else {
      console.log('❌ No LLM interaction found in database');
    }

    // Test statistics
    console.log('\n📈 Testing statistics...');
    const stats = await dbService.llmInteractionRepository.getStats({
      userId: 'test-user-123'
    });
    
    console.log('📊 Statistics:');
    console.log(`   - Total Interactions: ${stats.totalInteractions}`);
    console.log(`   - Success Count: ${stats.successCount}`);
    console.log(`   - Error Count: ${stats.errorCount}`);
    console.log(`   - Average Processing Time: ${Math.round(stats.averageProcessingTime)}ms`);
    console.log(`   - Total Tokens Used: ${stats.totalTokensUsed}`);
    console.log(`   - By Worker Type:`, stats.byWorkerType);

    console.log('\n🎉 LLM Interaction Logging Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testLLMLogging().catch(console.error);
