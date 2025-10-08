/**
 * EnvironmentModelConfigService.ts
 * Environment-first model configuration service for 2dots1line V11.0
 * Prioritizes environment variables over JSON configuration for reliable model selection
 */

import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { ModelConfigService } from './ModelConfigService';

export interface EnvironmentModelConfig {
  chat: string;
  vision: string;
  embedding: string;
  fallback: string;
}

export class EnvironmentModelConfigService {
  private static instance: EnvironmentModelConfigService;
  private modelConfigService: ModelConfigService;
  private initialized = false;

  private constructor() {
    // Will be initialized based on provider
    this.modelConfigService = new ModelConfigService('gemini');
  }

  public static getInstance(): EnvironmentModelConfigService {
    if (!EnvironmentModelConfigService.instance) {
      EnvironmentModelConfigService.instance = new EnvironmentModelConfigService();
    }
    return EnvironmentModelConfigService.instance;
  }

  /**
   * Get current LLM provider from environment
   */
  public getProvider(): 'gemini' | 'openai' {
    // Ensure env is loaded
    environmentLoader.load();
    const provider = (environmentLoader.get('LLM_PROVIDER') || 'gemini').toLowerCase();
    if (provider !== 'gemini' && provider !== 'openai') {
      return 'gemini';
    }
    return provider as 'gemini' | 'openai';
  }

  /**
   * Get model for specific use case, prioritizing environment variables
   */
  public getModelForUseCase(useCase: 'chat' | 'vision' | 'embedding' | 'key_phrase' | 'ontology'): string {
    // Ensure environment is loaded
    environmentLoader.load();

    // Check environment variables first (highest priority)
    const envModel = this.getModelFromEnvironment(useCase);
    if (envModel) {
      console.log(`🔧 EnvironmentModelConfigService: Using environment variable for ${useCase}: ${envModel}`);
      return envModel;
    }

    // Update ModelConfigService based on current provider
    const currentProvider = this.getProvider();
    if (this.modelConfigService['provider'] !== currentProvider) {
      this.modelConfigService = new ModelConfigService(currentProvider);
    }

    // Fallback to hardcoded fallback (avoiding recursive call)
    const fallbackModel = this.getHardcodedFallback(useCase);
    console.log(`🔧 EnvironmentModelConfigService: Using hardcoded fallback for ${useCase}: ${fallbackModel}`);
    return fallbackModel;
  }

  /**
   * Get model from environment variables
   */
  private getModelFromEnvironment(useCase: 'chat' | 'vision' | 'embedding' | 'key_phrase' | 'ontology'): string | null {
    const envKey = `LLM_${useCase.toUpperCase()}_MODEL`;
    const model = environmentLoader.get(envKey);
    
    if (model) {
      console.log(`🔧 EnvironmentModelConfigService: Found ${envKey}=${model}`);
      return model;
    }

    // Check for fallback model if specific use case not found
    if (useCase !== 'embedding') {
      // For key_phrase, check for specific fallback first
      if (useCase === 'key_phrase') {
        const keyPhraseFallback = environmentLoader.get('LLM_KEY_PHRASE_FALLBACK_MODEL');
        if (keyPhraseFallback) {
          console.log(`🔧 EnvironmentModelConfigService: Using LLM_KEY_PHRASE_FALLBACK_MODEL=${keyPhraseFallback} for ${useCase}`);
          return keyPhraseFallback;
        }
      }
      
      const fallbackModel = environmentLoader.get('LLM_FALLBACK_MODEL');
      if (fallbackModel) {
        console.log(`🔧 EnvironmentModelConfigService: Using LLM_FALLBACK_MODEL=${fallbackModel} for ${useCase}`);
        return fallbackModel;
      }
    }

    return null;
  }

  /**
   * Hardcoded fallback models (last resort)
   */
  private getHardcodedFallback(useCase: 'chat' | 'vision' | 'embedding' | 'key_phrase' | 'ontology'): string {
    const provider = this.getProvider();
    
    if (provider === 'openai') {
      const openaiFallbacks = {
        chat: 'gpt-4o-mini',
        vision: 'gpt-4o',
        embedding: 'text-embedding-3-small',
        key_phrase: 'gpt-4o-mini',
        ontology: 'gpt-4o-mini'
      };
      return openaiFallbacks[useCase];
    } else {
      const geminiFallbacks = {
        chat: 'gemini-2.5-flash',
        vision: 'gemini-2.5-flash',
        embedding: 'text-embedding-004',
        key_phrase: 'gemini-2.5-flash',
        ontology: 'gemini-2.5-flash-lite'
      };
      return geminiFallbacks[useCase];
    }
  }

  /**
   * Get all current model configuration
   */
  public getCurrentConfiguration(): EnvironmentModelConfig {
    environmentLoader.load();
    
    return {
      chat: this.getModelForUseCase('chat'),
      vision: this.getModelForUseCase('vision'),
      embedding: this.getModelForUseCase('embedding'),
      fallback: environmentLoader.get('LLM_FALLBACK_MODEL') || 'gemini-2.0-flash-exp'
    };
  }

  /**
   * Log current configuration for debugging
   */
  public logCurrentConfiguration(): void {
    const config = this.getCurrentConfiguration();
    
    console.log('\n🔧 Environment-First Model Configuration:');
    console.log('==========================================');
    console.log(`📱 Chat Model: ${config.chat}`);
    console.log(`👁️ Vision Model: ${config.vision}`);
    console.log(`🔗 Embedding Model: ${config.embedding}`);
    console.log(`🔄 Fallback Model: ${config.fallback}`);
    
    // Show environment variable status
    console.log('\n🔍 Environment Variable Status:');
    console.log(`LLM_CHAT_MODEL: ${environmentLoader.get('LLM_CHAT_MODEL') || 'NOT SET'}`);
    console.log(`LLM_VISION_MODEL: ${environmentLoader.get('LLM_VISION_MODEL') || 'NOT SET'}`);
    console.log(`LLM_EMBEDDING_MODEL: ${environmentLoader.get('LLM_EMBEDDING_MODEL') || 'NOT SET'}`);
    console.log(`LLM_ONTOLOGY_MODEL: ${environmentLoader.get('LLM_ONTOLOGY_MODEL') || 'NOT SET'}`);
    console.log(`LLM_FALLBACK_MODEL: ${environmentLoader.get('LLM_FALLBACK_MODEL') || 'NOT SET'}`);
    
    console.log('==========================================\n');
  }

  /**
   * Validate that all required models are available
   */
  public validateConfiguration(): boolean {
    try {
      const config = this.getCurrentConfiguration();
      const requiredModels = [config.chat, config.vision, config.embedding];
      
      console.log('🔍 Validating model configuration...');
      for (const model of requiredModels) {
        if (!model) {
          console.error(`❌ Missing model configuration`);
          return false;
        }
        console.log(`✅ Model configured: ${model}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Model configuration validation failed:', error);
      return false;
    }
  }
}

export default EnvironmentModelConfigService;
