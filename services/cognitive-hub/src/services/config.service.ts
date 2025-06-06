/**
 * Configuration Service - Implements Directive 3: Growth Model Configuration Management
 * Manages externalized growth dimension rules and configuration
 */

import { DatabaseService } from '@2dots1line/database';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface GrowthDimensionConfig {
  name: string;
  description: string;
  side: 'self' | 'world';
  actionType: 'know' | 'act' | 'show';
  color: string;
  icon: string;
  activation_rules: {
    emotion_keywords?: string[];
    reflection_patterns?: string[];
    introspection_patterns?: string[];
    action_keywords?: string[];
    commitment_patterns?: string[];
    achievement_patterns?: string[];
    expression_keywords?: string[];
    creation_patterns?: string[];
    vulnerability_patterns?: string[];
    learning_keywords?: string[];
    knowledge_patterns?: string[];
    source_patterns?: string[];
    contribution_keywords?: string[];
    impact_patterns?: string[];
    change_patterns?: string[];
    teaching_keywords?: string[];
    influence_patterns?: string[];
    platform_patterns?: string[];
    base_delta: number;
    source_multipliers: Record<string, number>;
  };
}

export interface GrowthModelRules {
  dimensions: Record<string, GrowthDimensionConfig>;
  concept_type_mappings: Record<string, string[]>;
  evolution_criteria: Record<string, {
    min_dimensions: number;
    min_connections: number;
    description: string;
  }>;
  metadata: {
    version: string;
    last_updated: string;
    created_by: string;
    description: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigurationVersion {
  version: string;
  timestamp: string;
  changes: string[];
  created_by: string;
}

export class ConfigService {
  private configPath: string;
  private redisKey = 'growth_model:rules';
  private currentRules: GrowthModelRules | null = null;

  constructor(private databaseService: DatabaseService) {
    this.configPath = path.join(__dirname, '../config/growth_model_rules.json');
  }

  /**
   * Load growth model rules from configuration
   * Implements Directive 3: Configuration over hardcoded rules
   */
  async getGrowthRules(): Promise<GrowthModelRules> {
    if (this.currentRules) {
      return this.currentRules;
    }

    try {
      // Try Redis first for runtime configuration
      const redisRules = await this.loadFromRedis();
      if (redisRules) {
        this.currentRules = redisRules;
        return redisRules;
      }

      // Fallback to file system
      const fileRules = await this.loadFromFile();
      this.currentRules = fileRules;
      
      // Cache in Redis for future use
      await this.saveToRedis(fileRules);
      
      return fileRules;

    } catch (error) {
      console.error('Error loading growth rules:', error);
      throw new Error(`Failed to load growth model configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate growth dimension delta based on configuration rules
   * Implements Directive 3: Configurable growth activation logic
   */
  async calculateDimensionDelta(
    content: string, 
    conceptType: string, 
    source: string,
    dimKey: string
  ): Promise<number> {
    const rules = await this.getGrowthRules();
    const dimension = rules.dimensions[dimKey];
    
    if (!dimension) {
      return 0;
    }

    const lowerContent = content.toLowerCase();
    let delta = 0;

    // Check concept type mapping
    const conceptMappings = rules.concept_type_mappings[conceptType] || [];
    if (!conceptMappings.includes(dimKey)) {
      return 0; // This concept type doesn't activate this dimension
    }

    // Check activation patterns
    const activationRules = dimension.activation_rules;
    let patternMatched = false;

    // Check all pattern types
    const patternTypes = [
      'emotion_keywords', 'reflection_patterns', 'introspection_patterns',
      'action_keywords', 'commitment_patterns', 'achievement_patterns',
      'expression_keywords', 'creation_patterns', 'vulnerability_patterns',
      'learning_keywords', 'knowledge_patterns', 'source_patterns',
      'contribution_keywords', 'impact_patterns', 'change_patterns',
      'teaching_keywords', 'influence_patterns', 'platform_patterns'
    ];

    for (const patternType of patternTypes) {
      const patterns = activationRules[patternType as keyof typeof activationRules] as string[] | undefined;
      if (patterns && patterns.some(pattern => lowerContent.includes(pattern.toLowerCase()))) {
        patternMatched = true;
        break;
      }
    }

    if (patternMatched) {
      delta = activationRules.base_delta;
      
      // Apply source multiplier
      const multiplier = activationRules.source_multipliers[source] || 1.0;
      delta *= multiplier;
      
      // Round to avoid floating point precision issues
      delta = Math.round(delta * 100) / 100;
    }

    return delta;
  }

  /**
   * Validate growth model configuration
   * Implements Directive 3: Configuration validation
   */
  async validateGrowthRules(rules: GrowthModelRules): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate dimensions
      const requiredDimensions = ['self_know', 'self_act', 'self_show', 'world_know', 'world_act', 'world_show'];
      for (const dimKey of requiredDimensions) {
        if (!rules.dimensions[dimKey]) {
          errors.push(`Missing required dimension: ${dimKey}`);
        } else {
          const dimension = rules.dimensions[dimKey];
          
          // Validate required fields
          if (!dimension.name || !dimension.description) {
            errors.push(`Dimension ${dimKey} missing name or description`);
          }
          
          if (!dimension.activation_rules || typeof dimension.activation_rules.base_delta !== 'number') {
            errors.push(`Dimension ${dimKey} missing or invalid activation rules`);
          }
          
          if (dimension.activation_rules.base_delta < 0 || dimension.activation_rules.base_delta > 1) {
            warnings.push(`Dimension ${dimKey} base_delta should be between 0 and 1`);
          }
        }
      }

      // Validate concept type mappings
      if (!rules.concept_type_mappings || Object.keys(rules.concept_type_mappings).length === 0) {
        errors.push('Missing concept type mappings');
      } else {
        for (const [conceptType, dimensions] of Object.entries(rules.concept_type_mappings)) {
          for (const dimKey of dimensions) {
            if (!rules.dimensions[dimKey]) {
              errors.push(`Concept type ${conceptType} maps to non-existent dimension: ${dimKey}`);
            }
          }
        }
      }

      // Validate evolution criteria
      const requiredStates = ['seed', 'sprout', 'bloom', 'constellation', 'supernova'];
      for (const state of requiredStates) {
        if (!rules.evolution_criteria[state]) {
          errors.push(`Missing evolution criteria for state: ${state}`);
        }
      }

      // Check for circular dependencies (basic check)
      const dimensionKeys = Object.keys(rules.dimensions);
      if (dimensionKeys.length !== new Set(dimensionKeys).size) {
        errors.push('Duplicate dimension keys detected');
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Update growth model configuration
   * Implements Directive 3: Runtime configuration updates
   */
  async updateGrowthConfiguration(updates: Partial<GrowthModelRules>): Promise<void> {
    const currentRules = await this.getGrowthRules();
    const updatedRules: GrowthModelRules = {
      ...currentRules,
      ...updates,
      metadata: {
        ...currentRules.metadata,
        ...updates.metadata,
        last_updated: new Date().toISOString(),
        version: this.incrementVersion(currentRules.metadata.version)
      }
    };

    // Validate before applying
    const validation = await this.validateGrowthRules(updatedRules);
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Save to Redis and file
    await this.saveToRedis(updatedRules);
    await this.saveToFile(updatedRules);
    
    // Update cached version
    this.currentRules = updatedRules;

    console.info(`Growth configuration updated to version ${updatedRules.metadata.version}`);
  }

  /**
   * Get configuration history
   */
  async getConfigurationHistory(): Promise<ConfigurationVersion[]> {
    // This would typically query a configuration history table
    // For now, return a stub implementation
    return [
      {
        version: '1.0.0',
        timestamp: '2025-01-26T10:30:00Z',
        changes: ['Initial configuration'],
        created_by: 'system'
      }
    ];
  }

  /**
   * Rollback to a previous configuration version
   */
  async rollbackConfiguration(versionId: string): Promise<void> {
    // This would typically restore from a configuration history table
    // For now, throw an error indicating this needs implementation
    throw new Error(`Configuration rollback not yet implemented for version ${versionId}`);
  }

  /**
   * Load configuration from Redis
   */
  private async loadFromRedis(): Promise<GrowthModelRules | null> {
    try {
      const redisClient = this.databaseService.getRedis();
      const configData = await redisClient.get(this.redisKey);
      
      if (configData) {
        return JSON.parse(configData);
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to load configuration from Redis:', error);
      return null;
    }
  }

  /**
   * Save configuration to Redis
   */
  private async saveToRedis(rules: GrowthModelRules): Promise<void> {
    try {
      const redisClient = this.databaseService.getRedis();
      await redisClient.set(this.redisKey, JSON.stringify(rules));
    } catch (error) {
      console.warn('Failed to save configuration to Redis:', error);
    }
  }

  /**
   * Load configuration from file system
   */
  private async loadFromFile(): Promise<GrowthModelRules> {
    const configData = await fs.readFile(this.configPath, 'utf-8');
    return JSON.parse(configData);
  }

  /**
   * Save configuration to file system
   */
  private async saveToFile(rules: GrowthModelRules): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(rules, null, 2));
  }

  /**
   * Increment semantic version
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
} 