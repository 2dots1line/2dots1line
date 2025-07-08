#!/usr/bin/env node
/**
 * Gemini Model Testing Script
 * Tests all available models and updates the configuration file
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'gemini_models.json');

// Models to test
const MODELS_TO_TEST = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'text-embedding-004'
];

async function testModel(genAI, modelName) {
  try {
    console.log(`Testing ${modelName}...`);
    
    if (modelName.includes('embedding')) {
      const model = genAI.getGenerativeModel({ model: modelName });
      await model.embedContent('test');
      return { status: 'available', type: 'stable', capabilities: ['embeddings'] };
    } else {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      await result.response;
      
      const type = modelName.includes('exp') ? 'experimental' : 'stable';
      return { 
        status: 'available', 
        type,
        capabilities: ['text', 'images', 'multimodal'],
        context_window: modelName.includes('pro') ? 2000000 : 1000000
      };
    }
  } catch (error) {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes('quota')) {
      return { status: 'quota_exceeded', type: 'stable', error: 'Quota exceeded' };
    } else if (errorMsg.includes('not found') || errorMsg.includes('invalid')) {
      return { status: 'unavailable', type: 'unknown', error: 'Model not supported' };
    } else {
      return { status: 'unavailable', type: 'unknown', error: error.message };
    }
  }
}

async function updateConfiguration() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('🧪 Testing Gemini models with current API key...\n');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const results = {};
  
  // Test all models
  for (const modelName of MODELS_TO_TEST) {
    const result = await testModel(genAI, modelName);
    results[modelName] = result;
    
    const statusEmoji = result.status === 'available' ? '✅' : 
                       result.status === 'quota_exceeded' ? '🚫' : '❌';
    console.log(`${statusEmoji} ${modelName}: ${result.status.toUpperCase()}`);
  }

  // Load current configuration
  let config = {};
  if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }

  // Update available_models section
  config.available_models = {};
  for (const [modelName, result] of Object.entries(results)) {
    config.available_models[modelName] = {
      status: result.status,
      type: result.type,
      capabilities: result.capabilities || ['text'],
      context_window: result.context_window || (modelName.includes('embedding') ? 2048 : 1000000)
    };

    // Add generation config for non-embedding models
    if (!modelName.includes('embedding')) {
      config.available_models[modelName].generation_config = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      };
    }
  }

  // Update testing results
  config.testing_results = {};
  for (const [modelName, result] of Object.entries(results)) {
    const statusEmoji = result.status === 'available' ? '✅' : 
                       result.status === 'quota_exceeded' ? '🚫' : '❌';
    config.testing_results[modelName] = `${statusEmoji} ${result.status}`;
  }

  // Update last_updated timestamp
  config.last_updated = new Date().toISOString();

  // Ensure models section exists with intelligent defaults
  if (!config.models) {
    const availableModels = Object.keys(results).filter(m => results[m].status === 'available');
    const chatModel = availableModels.find(m => m.includes('2.0-flash')) || 
                     availableModels.find(m => m.includes('1.5-flash')) || 
                     availableModels[0];
    const visionModel = chatModel; // Use same model for vision
    const embeddingModel = availableModels.find(m => m.includes('embedding')) || 'text-embedding-004';

    config.models = {
      chat: {
        primary: chatModel,
        fallback: availableModels.filter(m => !m.includes('embedding') && m !== chatModel),
        description: "For general conversation and text generation",
        capabilities: ["text", "reasoning", "conversation"],
        context_window: 1000000
      },
      vision: {
        primary: visionModel,
        fallback: availableModels.filter(m => !m.includes('embedding') && m !== visionModel),
        description: "For image analysis and vision tasks",
        capabilities: ["text", "images", "multimodal"],
        context_window: 1000000
      },
      embedding: {
        primary: embeddingModel,
        fallback: [],
        description: "For text embeddings and semantic search",
        capabilities: ["embeddings"],
        context_window: 2048
      }
    };
  }

  // Write updated configuration
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  console.log(`\n📄 Configuration updated: ${CONFIG_FILE}`);
  console.log('\n🎯 Current Model Selection:');
  console.log(`  Chat: ${config.models.chat.primary}`);
  console.log(`  Vision: ${config.models.vision.primary}`);
  console.log(`  Embedding: ${config.models.embedding.primary}`);
  
  console.log('\n✅ Available Models:');
  Object.entries(results)
    .filter(([_, result]) => result.status === 'available')
    .forEach(([model, result]) => console.log(`  ✅ ${model} (${result.type})`));
    
  console.log('\n🚫 Unavailable Models:');
  Object.entries(results)
    .filter(([_, result]) => result.status !== 'available')
    .forEach(([model, result]) => console.log(`  ❌ ${model} (${result.status})`));
}

if (require.main === module) {
  updateConfiguration().catch(console.error);
}

module.exports = { updateConfiguration, testModel }; 