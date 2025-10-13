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
  public getModelForUseCase(useCase: 'chat' | 'vision' | 'embedding' | 'key_phrase' | 'ontology' | 'image' | 'video' | 'live' | 'audio_tts'): string {
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
  private getModelFromEnvironment(useCase: 'chat' | 'vision' | 'embedding' | 'key_phrase' | 'ontology' | 'image' | 'video' | 'live' | 'audio_tts'): string | null {
    // Map use cases to env var names
    const envKeyMap: Record<string, string> = {
      'chat': 'LLM_CHAT_MODEL',
      'vision': 'LLM_VISION_MODEL',
      'embedding': 'LLM_EMBEDDING_MODEL',
      'key_phrase': 'LLM_KEY_PHRASE_MODEL',
      'ontology': 'LLM_ONTOLOGY_MODEL',
      'image': 'LLM_IMAGE_MODEL',
      'video': 'LLM_VIDEO_MODEL',
      'live': 'LLM_LIVE_MODEL',
      'audio_tts': 'LLM_AUDIO_TTS_MODEL'
    };
    
    const envKey = envKeyMap[useCase];
    const model = environmentLoader.get(envKey);
    
    // Backward compatibility: Check legacy GEMINI_IMAGE_MODEL
    if (!model && useCase === 'image') {
      const legacyModel = environmentLoader.get('GEMINI_IMAGE_MODEL');
      if (legacyModel) {
        console.log(`🔧 EnvironmentModelConfigService: Using legacy GEMINI_IMAGE_MODEL=${legacyModel}`);
        return legacyModel;
      }
    }
    
    if (model) {
      console.log(`🔧 EnvironmentModelConfigService: Found ${envKey}=${model}`);
      return model;
    }

    // Check for fallback model if specific use case not found
    // Don't use fallback for media-specific use cases
    if (!['embedding', 'image', 'video', 'live', 'audio_tts'].includes(useCase)) {
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
  private getHardcodedFallback(useCase: 'chat' | 'vision' | 'embedding' | 'key_phrase' | 'ontology' | 'image' | 'video' | 'live' | 'audio_tts'): string {
    const provider = this.getProvider();
    
    if (provider === 'openai') {
      const openaiFallbacks = {
        chat: 'gpt-4o-mini',
        vision: 'gpt-4o',
        embedding: 'text-embedding-3-small',
        key_phrase: 'gpt-4o-mini',
        ontology: 'gpt-4o-mini',
        image: 'dall-e-3',
        video: 'unsupported',
        live: 'gpt-4o-realtime-preview',
        audio_tts: 'tts-1'
      };
      return openaiFallbacks[useCase];
    } else {
      const geminiFallbacks = {
        chat: 'gemini-2.5-flash',
        vision: 'gemini-2.5-flash',
        embedding: 'text-embedding-004',
        key_phrase: 'gemini-2.5-flash',
        ontology: 'gemini-2.5-flash-lite',
        image: 'gemini-2.5-flash-image',
        video: 'veo-3.0-fast-generate-001',
        live: 'gemini-live-2.5-flash-preview-native-audio',
        audio_tts: 'gemini-native-audio'
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
