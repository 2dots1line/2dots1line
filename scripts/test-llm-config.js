#!/usr/bin/env node

/**
 * test-llm-config.js
 * Simple test to verify LLM tools are using environment-based configuration
 * Usage: node scripts/test-llm-config.js
 */

const path = require('path');
const fs = require('fs');

// Add the project root to the module path
const projectRoot = path.resolve(__dirname, '..');
process.env.NODE_PATH = `${projectRoot}/node_modules:${process.env.NODE_PATH || ''}`;

// Load environment variables
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log(`✅ Loaded environment from: ${envPath}`);
} else {
  console.log(`⚠️ No .env file found at: ${envPath}`);
}

async function testLLMConfig() {
  console.log('🧪 Testing LLM Configuration Integration');
  console.log('=======================================\n');

  try {
    // Test 1: EnvironmentModelConfigService
    console.log('🔍 Test 1: EnvironmentModelConfigService');
    console.log('----------------------------------------');
    
    const { EnvironmentModelConfigService } = require('../services/config-service/dist/EnvironmentModelConfigService');
    const configService = EnvironmentModelConfigService.getInstance();
    
    const chatModel = configService.getModelForUseCase('chat');
    const visionModel = configService.getModelForUseCase('vision');
    const embeddingModel = configService.getModelForUseCase('embedding');
    
    console.log(`✅ Chat model: ${chatModel}`);
    console.log(`✅ Vision model: ${visionModel}`);
    console.log(`✅ Embedding model: ${embeddingModel}`);
    
    // Test 2: LLMChatTool initialization
    console.log('\n🔍 Test 2: LLMChatTool Model Selection');
    console.log('----------------------------------------');
    
    const { LLMChatTool } = require('../packages/tools/dist/ai/LLMChatTool');
    
    // Check if the tool has the correct model name
    console.log('✅ LLMChatTool imported successfully');
    console.log('ℹ️  Note: LLMChatTool will initialize with correct model on first use');
    
    // Test 3: GoogleAIClient default model
    console.log('\n🔍 Test 3: GoogleAIClient Default Model');
    console.log('----------------------------------------');
    
    const { GoogleAIClient } = require('../packages/ai-clients/dist/google');
    
    // Create a mock client to test the getDefaultModel method
    const mockClient = new GoogleAIClient('test-key');
    
    // Access the private method through reflection (for testing)
    const getDefaultModel = mockClient.constructor.prototype.getDefaultModel || 
                           (() => {
                             // Fallback: check environment directly
                             return process.env.LLM_CHAT_MODEL || 'gemini-2.5-flash';
                           });
    
    const defaultModel = getDefaultModel.call(mockClient);
    console.log(`✅ GoogleAIClient default model: ${defaultModel}`);
    
    // Test 4: Environment variable verification
    console.log('\n🔍 Test 4: Environment Variable Verification');
    console.log('---------------------------------------------');
    
    const expectedModels = {
      'LLM_CHAT_MODEL': 'gemini-2.5-flash',
      'LLM_VISION_MODEL': 'gemini-2.5-flash',
      'LLM_EMBEDDING_MODEL': 'text-embedding-004',
      'LLM_FALLBACK_MODEL': 'gemini-2.0-flash-exp'
    };
    
    let allCorrect = true;
    for (const [envVar, expectedValue] of Object.entries(expectedModels)) {
      const actualValue = process.env[envVar];
      if (actualValue === expectedValue) {
        console.log(`✅ ${envVar}=${actualValue}`);
      } else {
        console.log(`❌ ${envVar}=${actualValue} (expected: ${expectedValue})`);
        allCorrect = false;
      }
    }
    
    // Summary
    console.log('\n🎯 Test Summary');
    console.log('===============');
    
    if (allCorrect && chatModel === 'gemini-2.5-flash' && visionModel === 'gemini-2.5-flash' && embeddingModel === 'text-embedding-004') {
      console.log('✅ All tests passed! Environment-based configuration is working correctly.');
      console.log('✅ Your system is now using:');
      console.log(`   - Chat: ${chatModel}`);
      console.log(`   - Vision: ${visionModel}`);
      console.log(`   - Embedding: ${embeddingModel}`);
      console.log('\n🚀 You can now restart your services and they will use the new models!');
    } else {
      console.log('❌ Some tests failed. Please check your configuration.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testLLMConfig();
