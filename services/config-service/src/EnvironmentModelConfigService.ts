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
    this.modelConfigService = new ModelConfigService();
  }

  public static getInstance(): EnvironmentModelConfigService {
    if (!EnvironmentModelConfigService.instance) {
      EnvironmentModelConfigService.instance = new EnvironmentModelConfigService();
    }
    return EnvironmentModelConfigService.instance;
  }

  /**
   * Get model for specific use case, prioritizing environment variables
   */
  public getModelForUseCase(useCase: 'chat' | 'vision' | 'embedding'): string {
    // Ensure environment is loaded
    environmentLoader.load();

    // Check environment variables first (highest priority)
    const envModel = this.getModelFromEnvironment(useCase);
    if (envModel) {
      console.log(`🔧 EnvironmentModelConfigService: Using environment variable for ${useCase}: ${envModel}`);
      return envModel;
    }

    // Fallback to JSON configuration
    try {
      const jsonModel = this.modelConfigService.getModelForUseCase(useCase);
      console.log(`🔧 EnvironmentModelConfigService: Using JSON config for ${useCase}: ${jsonModel}`);
      return jsonModel;
    } catch (error) {
      // If JSON config fails, use hardcoded fallback
      const fallbackModel = this.getHardcodedFallback(useCase);
      console.log(`⚠️ EnvironmentModelConfigService: JSON config failed for ${useCase}, using hardcoded fallback: ${fallbackModel}`);
      return fallbackModel;
    }
  }

  /**
   * Get model from environment variables
   */
  private getModelFromEnvironment(useCase: 'chat' | 'vision' | 'embedding'): string | null {
    const envKey = `LLM_${useCase.toUpperCase()}_MODEL`;
    const model = environmentLoader.get(envKey);
    
    if (model) {
      console.log(`🔧 EnvironmentModelConfigService: Found ${envKey}=${model}`);
      return model;
    }

    // Check for fallback model if specific use case not found
    if (useCase !== 'embedding') {
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
  private getHardcodedFallback(useCase: 'chat' | 'vision' | 'embedding'): string {
    const fallbacks = {
      chat: 'gemini-2.5-flash',
      vision: 'gemini-2.5-flash',
      embedding: 'text-embedding-004'
    };
    return fallbacks[useCase];
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
