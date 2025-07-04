/**
 * ConfigService.ts
 * Centralized configuration loader and validator for 2dots1line system
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import yaml from 'js-yaml';
import { Redis } from 'ioredis';
import { CoreIdentity } from '@2dots1line/shared-types';

export class ConfigService {
  private configCache = new Map<string, any>();
  private configDir: string;
  private initialized = false;

  constructor(private redisClient?: Redis) {
    // Find the monorepo root by looking for package.json with workspaces
    this.configDir = this.findMonorepoRoot();
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
      const jsonFiles = ['card_templates.json', 'card_eligibility_rules.json'];

      for (const file of yamlFiles) {
        const filePath = path.join(this.configDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const configKey = path.basename(file, path.extname(file));
        const parsedContent = yaml.load(content) as any;
        this.configCache.set(configKey, parsedContent);
        console.log(`Loaded YAML config: ${configKey}`);
      }

      for (const file of jsonFiles) {
        const filePath = path.join(this.configDir, file);
        const configKey = path.basename(file, path.extname(file));
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const parsedContent = JSON.parse(content);
          this.configCache.set(configKey, parsedContent);
          console.log(`Loaded JSON config: ${configKey}`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.warn(`WARN: Config file ${file} not found. Using fallback for '${configKey}'.`);
                if (configKey === 'card_eligibility_rules') {
                    const fallbackRules = {
                      "MemoryUnit": { "min_importance_score": 5.0 },
                      "Concept": { "min_salience": 0.6 },
                      "DerivedArtifact": { "eligible_types": ["cycle_report", "insight_summary"] },
                      "ProactivePrompt": { "always_eligible": true }
                    };
                    this.configCache.set(configKey, fallbackRules);
                }
            } else {
                throw error;
            }
        }
      }
      
      this.initialized = true;
      console.log("All configurations loaded into memory cache.");
      
      // Optionally, cache in Redis for cross-service access
      if (this.redisClient) {
        for (const [key, value] of this.configCache.entries()) {
          await this.redisClient.setex(`config:${key}`, 3600, JSON.stringify(value));
        }
        console.log("Configurations cached in Redis.");
      }
    } catch (error) {
      console.error('Failed to initialize ConfigService:', error);
      throw new Error(`ConfigService initialization failed: ${error}`);
    }
  }

  public getCoreIdentity(): CoreIdentity {
    if (!this.initialized) {
      throw new Error('ConfigService not initialized. Call initialize() first.');
    }
    
    const identity = this.configCache.get('CoreIdentity');
    if (!identity) {
      throw new Error('CoreIdentity configuration not found');
    }
    
    return identity as CoreIdentity;
  }

  public getTemplate(templateName: string): string {
    if (!this.initialized) {
      throw new Error('ConfigService not initialized. Call initialize() first.');
    }
    
    const templates = this.configCache.get('prompt_templates');
    if (!templates) {
      throw new Error('prompt_templates configuration not found');
    }
    
    const template = templates[templateName];
    if (template === undefined) {
      throw new Error(`Template '${templateName}' not found in prompt_templates.yaml`);
    }
    
    return template || '';
  }

  public getAllTemplates(): Record<string, string> {
    if (!this.initialized) {
      throw new Error('ConfigService not initialized. Call initialize() first.');
    }
    
    const templates = this.configCache.get('prompt_templates');
    if (!templates) {
      throw new Error('prompt_templates configuration not found');
    }
    
    return templates;
  }

  public getCardTemplates(): any {
    if (!this.initialized) {
      throw new Error('ConfigService not initialized. Call initialize() first.');
    }
    const templates = this.configCache.get('card_templates');
    if (!templates) {
      throw new Error('card_templates configuration not found');
    }
    return templates;
  }

  public getCardEligibilityRules(): any {
    if (!this.initialized) {
      throw new Error('ConfigService not initialized. Call initialize() first.');
    }
    const rules = this.configCache.get('card_eligibility_rules');
    if (!rules) {
      throw new Error('card_eligibility_rules configuration not found');
    }
    return rules;
  }

  // Placeholder methods for future configuration loading and validation
  async loadConfig(configName: string): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.configCache.get(configName);
  }

  async validateConfig(config: any, schema: any): Promise<boolean> {
    // Implementation pending - would use a JSON schema validator
    console.warn('ConfigService.validateConfig() - Implementation pending');
    return true;
  }
} 