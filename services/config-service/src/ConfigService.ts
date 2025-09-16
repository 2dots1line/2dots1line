/**
 * ConfigService.ts
 * Centralized configuration loader and validator for 2dots1line system
 * V11.0 - Integrated with EnvironmentLoader for consistent environment management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import yaml from 'js-yaml';
import { Redis } from 'ioredis';
import { CoreIdentity } from '@2dots1line/shared-types';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';

export class ConfigService {
  private configCache = new Map<string, any>();
  private configDir: string;
  private initialized = false;

  constructor(private redisClient?: Redis) {
    // CRITICAL: Load environment variables first
    console.log('[ConfigService] Loading environment variables...');
    environmentLoader.load();
    console.log('[ConfigService] Environment variables loaded successfully');

    // Find the monorepo root by looking for package.json with workspaces
    this.configDir = this.findMonorepoRoot();
    
    console.log(`[ConfigService] Config directory resolved: ${this.configDir}`);
  }

  private findMonorepoRoot(): string {
    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      try {
        const packageJson = require(packageJsonPath);
        if (packageJson.workspaces) {
          return path.join(currentDir, 'config');
        }
      } catch (e) {
        // Continue searching
      }
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback to relative path from services
    return path.join(process.cwd(), '../../config');
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log(`Initializing ConfigService: Loading configs from ${this.configDir}...`);
    
    try {
      const yamlFiles = ['CoreIdentity.yaml', 'prompt_templates.yaml'];
      const jsonFiles = ['card_templates.json', 'card_eligibility_rules.json', 'cypher_templates.json', 'insight_worker_key_phrases.json', 'insight_worker_scenarios.json'];

             // Load YAML files
       for (const fileName of yamlFiles) {
         try {
           const configName = fileName.replace('.yaml', '');
           await this.loadConfigFile(configName);
           console.log(`Loaded YAML config: ${configName}`);
         } catch (error) {
           console.warn(`Failed to load YAML config ${fileName}:`, error);
         }
       }

       // Load JSON files  
       for (const fileName of jsonFiles) {
         try {
           const configName = fileName.replace('.json', '');
           await this.loadConfigFile(configName);
           console.log(`Loaded JSON config: ${configName}`);
         } catch (error) {
           console.warn(`Failed to load JSON config ${fileName}:`, error);
         }
       }

      this.initialized = true;
      console.log('All configurations loaded into memory cache.');

    } catch (error) {
      console.error('ConfigService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get environment variable using EnvironmentLoader
   */
  public getEnv(key: string, defaultValue?: string): string | undefined {
    return environmentLoader.get(key) || defaultValue;
  }

  /**
   * Get required environment variable using EnvironmentLoader
   */
  public getRequiredEnv(key: string): string {
    return environmentLoader.getRequired(key);
  }

  /**
   * Validate that required environment variables are present
   */
  public validateEnvironment(requiredVars: string[]): void {
    const missing = requiredVars.filter(varName => !environmentLoader.get(varName));
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  public getCoreIdentity(): CoreIdentity {
    const config = this.configCache.get('CoreIdentity');
    if (!config) {
      throw new Error('CoreIdentity configuration not loaded');
    }
    return config;
  }

  public getTemplate(templateName: string): string {
    const templates = this.configCache.get('prompt_templates');
    if (!templates) {
      throw new Error('Prompt templates not loaded');
    }
    
    // Handle both structures: templates.templates[templateName] and templates[templateName]
    const template = templates.templates?.[templateName] || templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    return template;
  }

  public getAllTemplates(): Record<string, string> {
    const templates = this.configCache.get('prompt_templates');
    if (!templates) {
      throw new Error('Prompt templates not loaded');
    }
    
    // YAML file has flat structure with template names as direct keys
    return templates;
  }

  public getCardTemplates(): any {
    const config = this.configCache.get('card_templates');
    if (!config) {
      throw new Error('Card templates configuration not loaded');
    }
    return config;
  }

  public getCardEligibilityRules(): any {
    const config = this.configCache.get('card_eligibility_rules');
    if (!config) {
      throw new Error('Card eligibility rules configuration not loaded');
    }
    return config;
  }

  public getCypherTemplates(): any {
    const config = this.configCache.get('cypher_templates');
    if (!config) {
      throw new Error('Cypher templates configuration not loaded');
    }
    return config;
  }

  // Internal method for loading config files during initialization
  private async loadConfigFile(configName: string): Promise<any> {
    const yamlPath = path.join(this.configDir, `${configName}.yaml`);
    const jsonPath = path.join(this.configDir, `${configName}.json`);
    
    try {
      // Try YAML first
      if (await this.fileExists(yamlPath)) {
        const content = await fs.readFile(yamlPath, 'utf8');
        const parsed = yaml.load(content);
        this.configCache.set(configName, parsed);
        return parsed;
      }
      
      // Try JSON next
      if (await this.fileExists(jsonPath)) {
        const content = await fs.readFile(jsonPath, 'utf8');
        const parsed = JSON.parse(content);
        this.configCache.set(configName, parsed);
        return parsed;
      }
      
      throw new Error(`Config file not found: ${configName}.yaml or ${configName}.json`);
    } catch (error) {
      console.warn(`Failed to load config ${configName}:`, error);
      throw error;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Public method for getting loaded config
  async loadConfig(configName: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('ConfigService not initialized. Call initialize() first.');
    }
    
    return this.configCache.get(configName);
  }

  async validateConfig(config: any, schema: any): Promise<boolean> {
    // Implementation pending - would use a JSON schema validator
    console.warn('ConfigService.validateConfig() - Implementation pending');
    return true;
  }

  /**
   * Load and return tool composition configuration
   */
  async getToolCompositionConfig(): Promise<any> {
    const configPath = path.join(this.configDir, 'tool_composition.json');
    try {
      const content = await fs.readFile(configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load tool composition config:', error);
      throw new Error(`Tool composition configuration not found: ${configPath}`);
    }
  }

  /**
   * Load and return model configuration (gemini_models.json)
   */
  async getModelConfig(): Promise<any> {
    const configPath = path.join(this.configDir, 'gemini_models.json');
    try {
      const content = await fs.readFile(configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load model config:', error);
      throw new Error(`Model configuration not found: ${configPath}`);
    }
  }
} 