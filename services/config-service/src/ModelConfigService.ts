import * as fs from 'fs';
import * as path from 'path';

export interface ModelConfig {
  primary: string;
  fallback: string[];
  description: string;
  capabilities: string[];
  context_window: number;
  note?: string;
}

export interface ModelDetails {
  status: 'available' | 'quota_exceeded' | 'unavailable';
  type: 'stable' | 'experimental';
  capabilities: string[];
  context_window: number;
  generation_config?: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

export interface GeminiModelConfiguration {
  models: {
    chat: ModelConfig;
    vision: ModelConfig;
    embedding: ModelConfig;
  };
  available_models: Record<string, ModelDetails>;
  quota_info: {
    free_tier_limits: {
      requests_per_minute: number;
      tokens_per_minute: number;
      requests_per_day: number;
    };
    note: string;
  };
  last_updated: string;
  testing_results: Record<string, string>;
}

export class ModelConfigService {
  private static instance: ModelConfigService;
  private config: GeminiModelConfiguration | null = null;
  private configPath: string;

  private constructor() {
    // Path to config file relative to the monorepo root
    this.configPath = path.join(process.cwd(), '../../config/gemini_models.json');
    
    // Try different paths if the above doesn't work
    if (!fs.existsSync(this.configPath)) {
      this.configPath = path.join(process.cwd(), '../../../config/gemini_models.json');
    }
    if (!fs.existsSync(this.configPath)) {
      this.configPath = path.join(__dirname, '../../../config/gemini_models.json');
    }
    if (!fs.existsSync(this.configPath)) {
      this.configPath = path.join(__dirname, '../../../../config/gemini_models.json');
    }
  }

  public static getInstance(): ModelConfigService {
    if (!ModelConfigService.instance) {
      ModelConfigService.instance = new ModelConfigService();
    }
    return ModelConfigService.instance;
  }

  public loadConfig(): GeminiModelConfiguration {
    try {
      if (!this.config) {
        console.log(`🔧 ModelConfigService: Loading configuration from ${this.configPath}`);
        
        if (!fs.existsSync(this.configPath)) {
          throw new Error(`Configuration file not found at ${this.configPath}`);
        }

        const configData = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
        console.log(`✅ ModelConfigService: Configuration loaded successfully`);
      }
      return this.config!;
    } catch (error) {
      console.error(`❌ ModelConfigService: Failed to load configuration:`, error);
      throw new Error(`Failed to load model configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getModelForUseCase(useCase: 'chat' | 'vision' | 'embedding'): string {
    const config = this.loadConfig();
    const modelConfig = config.models[useCase];
    
    // Check if primary model is available
    const primaryModel = modelConfig.primary;
    const primaryStatus = config.available_models[primaryModel]?.status;
    
    if (primaryStatus === 'available') {
      console.log(`📱 ModelConfigService: Using primary ${useCase} model: ${primaryModel}`);
      return primaryModel;
    }

    // Try fallback models
    for (const fallbackModel of modelConfig.fallback) {
      const fallbackStatus = config.available_models[fallbackModel]?.status;
      if (fallbackStatus === 'available') {
        console.log(`📱 ModelConfigService: Primary ${useCase} model ${primaryModel} unavailable (${primaryStatus}), using fallback: ${fallbackModel}`);
        return fallbackModel;
      }
    }

    // If no models are available, throw an error
    throw new Error(`No available models for ${useCase}. Primary: ${primaryModel} (${primaryStatus}), fallbacks: ${modelConfig.fallback.join(', ')}`);
  }

  public getModelDetails(modelName: string): ModelDetails | null {
    const config = this.loadConfig();
    return config.available_models[modelName] || null;
  }

  public getGenerationConfig(modelName: string): any {
    const details = this.getModelDetails(modelName);
    return details?.generation_config || {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192
    };
  }

  public getAllAvailableModels(): string[] {
    const config = this.loadConfig();
    return Object.entries(config.available_models)
      .filter(([_, details]) => details.status === 'available')
      .map(([modelName, _]) => modelName);
  }

  public getQuotaInfo() {
    const config = this.loadConfig();
    return config.quota_info;
  }

  public isModelAvailable(modelName: string): boolean {
    const config = this.loadConfig();
    return config.available_models[modelName]?.status === 'available';
  }

  public refreshConfig(): void {
    this.config = null;
    this.loadConfig();
  }

  // For debugging/logging
  public logCurrentConfiguration(): void {
    const config = this.loadConfig();
    console.log('\n🔧 Current Gemini Model Configuration:');
    console.log('=====================================');
    
    for (const [useCase, modelConfig] of Object.entries(config.models)) {
      console.log(`\n📱 ${useCase.toUpperCase()}:`);
      console.log(`  Primary: ${modelConfig.primary}`);
      console.log(`  Fallbacks: ${modelConfig.fallback.join(', ')}`);
      console.log(`  Status: ${config.available_models[modelConfig.primary]?.status || 'unknown'}`);
    }

    console.log('\n📊 Available Models:');
    Object.entries(config.available_models)
      .filter(([_, details]) => details.status === 'available')
      .forEach(([name, details]) => {
        console.log(`  ✅ ${name} (${details.type})`);
      });

    console.log('\n🚫 Unavailable Models:');
    Object.entries(config.available_models)
      .filter(([_, details]) => details.status !== 'available')
      .forEach(([name, details]) => {
        console.log(`  ❌ ${name} (${details.status})`);
      });
    
    console.log('=====================================\n');
  }
}

export default ModelConfigService; 