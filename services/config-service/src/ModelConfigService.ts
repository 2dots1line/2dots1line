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
  private config: GeminiModelConfiguration | null = null;
  private configPath: string;
  private lastLoadTime: number | null = null;

  constructor() {
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



  public loadConfig(): GeminiModelConfiguration {
    try {
      // Always check file modification time to detect changes
      const stats = fs.statSync(this.configPath);
      const currentMtime = stats.mtime.getTime();
      
      if (!this.config || !this.lastLoadTime || currentMtime > this.lastLoadTime) {
        console.log(`🔧 ModelConfigService: Loading configuration from ${this.configPath}`);
        console.log(`🔍 File last modified: ${stats.mtime}`);
        console.log(`🔍 Current time: ${new Date()}`);
        
        if (!fs.existsSync(this.configPath)) {
          throw new Error(`Configuration file not found at ${this.configPath}`);
        }

        const configData = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
        this.lastLoadTime = currentMtime;
        
        console.log(`✅ ModelConfigService: Configuration loaded successfully at ${new Date()}`);
        console.log(`🔍 Chat primary model: ${this.config?.models.chat.primary}`);
        console.log(`🔍 Chat fallback models: ${this.config?.models.chat.fallback.join(', ')}`);
      } else {
        console.log(`🔍 ModelConfigService: Using cached configuration (file unchanged)`);
      }
      
      return this.config!;
    } catch (error) {
      console.error(`❌ ModelConfigService: Failed to load configuration:`, error);
      throw new Error(`Failed to load model configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getModelForUseCase(useCase: 'chat' | 'vision' | 'embedding'): string {
    console.log(`🔍 === ModelConfigService.getModelForUseCase(${useCase}) called ===`);
    
    const config = this.loadConfig();
    console.log(`🔍 Config loaded successfully from: ${this.configPath}`);
    console.log(`🔍 FULL CONFIG OBJECT:`, JSON.stringify(config, null, 2));
    
    const modelConfig = config.models[useCase];
    console.log(`🔍 Model config for ${useCase}:`, JSON.stringify(modelConfig, null, 2));
    
    // Check if primary model is available
    const primaryModel = modelConfig.primary;
    const primaryStatus = config.available_models[primaryModel]?.status;
    
    console.log(`🔍 Primary model: ${primaryModel}`);
    console.log(`🔍 Primary model status: ${primaryStatus}`);
    console.log(`🔍 Available models:`, Object.keys(config.available_models));
    console.log(`🔍 ALL AVAILABLE MODELS WITH STATUS:`, JSON.stringify(config.available_models, null, 2));
    
    if (primaryStatus === 'available') {
      console.log(`✅ ModelConfigService: Using primary ${useCase} model: ${primaryModel}`);
      return primaryModel;
    }

    console.log(`⚠️ Primary ${useCase} model ${primaryModel} unavailable (${primaryStatus}), trying fallbacks...`);
    
    // Try fallback models
    for (const fallbackModel of modelConfig.fallback) {
      const fallbackStatus = config.available_models[fallbackModel]?.status;
      console.log(`🔍 Checking fallback model: ${fallbackModel} (status: ${fallbackStatus})`);
      
      if (fallbackStatus === 'available') {
        console.log(`📱 ModelConfigService: Primary ${useCase} model ${primaryModel} unavailable (${primaryStatus}), using fallback: ${fallbackModel}`);
        return fallbackModel;
      }
    }

    // If no models are available, throw an error
    const errorMsg = `No available models for ${useCase}. Primary: ${primaryModel} (${primaryStatus}), fallbacks: ${modelConfig.fallback.join(', ')}`;
    console.error(`❌ ModelConfigService: ${errorMsg}`);
    throw new Error(errorMsg);
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
    console.log(`🔄 ModelConfigService: Refreshing configuration...`);
    this.config = null;
    this.loadConfig();
    console.log(`✅ ModelConfigService: Configuration refreshed successfully`);
  }

  public forceRefresh(): void {
    console.log(`🔄 ModelConfigService: Force refreshing configuration...`);
    this.config = null;
    this.loadConfig();
    console.log(`✅ ModelConfigService: Configuration force refreshed successfully`);
  }

  public logConfigIntegrity(): void {
    try {
      const stats = fs.statSync(this.configPath);
      const content = fs.readFileSync(this.configPath, 'utf8');
      const checksum = require('crypto').createHash('md5').update(content).digest('hex');
      
      console.log(`🔍 === Configuration File Integrity Check ===`);
      console.log(`🔍 File path: ${this.configPath}`);
      console.log(`🔍 File exists: ${fs.existsSync(this.configPath)}`);
      console.log(`🔍 File size: ${stats.size} bytes`);
      console.log(`🔍 Last modified: ${stats.mtime}`);
      console.log(`🔍 MD5 checksum: ${checksum}`);
      console.log(`🔍 File content preview:`, content.substring(0, 200) + '...');
      console.log(`🔍 ==========================================`);
    } catch (error) {
      console.error(`❌ Error checking config integrity:`, error);
    }
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