#!/usr/bin/env node

/**
 * validate-llm-config.js
 * Script to validate LLM model configuration and show which models are being used
 * Usage: node scripts/validate-llm-config.js
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

async function validateLLMConfig() {
  console.log('🔍 LLM Configuration Validation Script');
  console.log('=====================================\n');

  try {
    // Try to import from compiled version first, then source
    let EnvironmentModelConfigService;
    try {
      const configServiceModule = require('../services/config-service/dist/EnvironmentModelConfigService');
      EnvironmentModelConfigService = configServiceModule.EnvironmentModelConfigService;
      console.log('✅ Using compiled version from dist/');
    } catch (distError) {
      console.log('⚠️ Compiled version not found, trying source...');
      const configServiceModule = require('../services/config-service/src/EnvironmentModelConfigService');
      EnvironmentModelConfigService = configServiceModule.EnvironmentModelConfigService;
      console.log('✅ Using source version from src/');
    }
    
    const configService = EnvironmentModelConfigService.getInstance();
    
    // Log current configuration
    configService.logCurrentConfiguration();
    
    // Validate configuration
    const isValid = configService.validateConfiguration();
    
    if (isValid) {
      console.log('✅ LLM configuration is valid!');
    } else {
      console.log('❌ LLM configuration validation failed!');
      process.exit(1);
    }

    // Show environment variable precedence
    console.log('\n🔍 Configuration Precedence:');
    console.log('1. Environment variables (highest priority)');
    console.log('2. JSON configuration file (config/gemini_models.json)');
    console.log('3. Hardcoded fallbacks (lowest priority)');
    
    // Check if .env file exists
    const envPath = path.join(projectRoot, '.env');
    if (fs.existsSync(envPath)) {
      console.log('\n✅ .env file found at:', envPath);
      
      // Read and show LLM-related environment variables
      const envContent = fs.readFileSync(envPath, 'utf8');
      const llmVars = envContent.split('\n')
        .filter(line => line.trim() && line.startsWith('LLM_'))
        .map(line => line.trim());
      
      if (llmVars.length > 0) {
        console.log('\n📋 LLM Environment Variables in .env:');
        llmVars.forEach(line => {
          const [key, value] = line.split('=');
          console.log(`  ${key}=${value}`);
        });
      } else {
        console.log('\n⚠️ No LLM environment variables found in .env file');
        console.log('   Consider adding:');
        console.log('   LLM_CHAT_MODEL=gemini-2.5-flash');
        console.log('   LLM_VISION_MODEL=gemini-2.5-flash');
        console.log('   LLM_EMBEDDING_MODEL=text-embedding-004');
        console.log('   LLM_FALLBACK_MODEL=gemini-2.0-flash-exp');
      }
    } else {
      console.log('\n⚠️ No .env file found at:', envPath);
      console.log('   Create one based on envexample.md');
    }

    // Check JSON configuration file
    const jsonConfigPath = path.join(projectRoot, 'config/gemini_models.json');
    if (fs.existsSync(jsonConfigPath)) {
      console.log('\n✅ JSON configuration file found at:', jsonConfigPath);
      
      const jsonConfig = JSON.parse(fs.readFileSync(jsonConfigPath, 'utf8'));
      console.log('\n📋 JSON Configuration:');
      console.log(`  Chat Primary: ${jsonConfig.models.chat.primary}`);
      console.log(`  Chat Fallbacks: ${jsonConfig.models.chat.fallback.join(', ')}`);
      console.log(`  Vision Primary: ${jsonConfig.models.vision.primary}`);
      console.log(`  Vision Fallbacks: ${jsonConfig.models.vision.fallback.join(', ')}`);
      console.log(`  Embedding Primary: ${jsonConfig.models.embedding.primary}`);
    } else {
      console.log('\n❌ JSON configuration file not found at:', jsonConfigPath);
    }

    console.log('\n🎯 Current Active Configuration:');
    const currentConfig = configService.getCurrentConfiguration();
    console.log(`  Chat Model: ${currentConfig.chat}`);
    console.log(`  Vision Model: ${currentConfig.vision}`);
    console.log(`  Embedding Model: ${currentConfig.embedding}`);
    console.log(`  Fallback Model: ${currentConfig.fallback}`);

    console.log('\n✅ Validation complete!');

  } catch (error) {
    console.error('❌ Error during validation:', error);
    process.exit(1);
  }
}

// Run the validation
validateLLMConfig();
