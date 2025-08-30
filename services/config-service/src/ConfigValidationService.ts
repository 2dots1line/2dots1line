/**
 * ConfigValidationService.ts
 * V9.5 - Configuration validation and consistency checking service
 * Ensures all tools use consistent token limits and configuration parameters
 */

import { ConfigService } from './ConfigService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface TokenLimitValidation {
  toolName: string;
  currentLimit: number;
  expectedLimit: number;
  isConsistent: boolean;
}

export class ConfigValidationService {
  private configService: ConfigService;
  private readonly EXPECTED_MAX_TOKENS = 50000;
  private readonly EXPECTED_TEMPERATURE = 0.7;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  /**
   * Validate all configuration files for consistency
   */
  async validateAllConfigurations(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      // Validate tool composition configuration
      const toolCompositionValidation = await this.validateToolCompositionConfig();
      this.mergeValidationResults(result, toolCompositionValidation);

      // Validate model configuration
      const modelValidation = await this.validateModelConfig();
      this.mergeValidationResults(result, modelValidation);

      // Validate token limit consistency
      const tokenValidation = await this.validateTokenLimits();
      this.mergeValidationResults(result, tokenValidation);

      // Generate recommendations
      this.generateRecommendations(result);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate tool composition configuration
   */
  private async validateToolCompositionConfig(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      const toolConfig = await this.configService.getToolCompositionConfig();
      
      if (!toolConfig) {
        result.isValid = false;
        result.errors.push('Tool composition configuration not found');
        return result;
      }

      // Check global LLM configuration
      if (toolConfig.tool_registry_config?.global_llm_config) {
        const globalConfig = toolConfig.tool_registry_config.global_llm_config;
        
        if (globalConfig.max_tokens !== this.EXPECTED_MAX_TOKENS) {
          result.warnings.push(`Global max_tokens (${globalConfig.max_tokens}) differs from expected (${this.EXPECTED_MAX_TOKENS})`);
        }
        
        if (globalConfig.temperature !== this.EXPECTED_TEMPERATURE) {
          result.warnings.push(`Global temperature (${globalConfig.temperature}) differs from expected (${this.EXPECTED_TEMPERATURE})`);
        }
      }

      // Check individual tool configurations
      if (toolConfig.compositions) {
        for (const [toolName, composition] of Object.entries(toolConfig.compositions)) {
          const comp = composition as any;
          if (comp.configuration?.max_tokens) {
            if (comp.configuration.max_tokens !== this.EXPECTED_MAX_TOKENS) {
              result.warnings.push(`${toolName} max_tokens (${comp.configuration.max_tokens}) differs from expected (${this.EXPECTED_MAX_TOKENS})`);
            }
          }
        }
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Tool composition validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate model configuration
   */
  private async validateModelConfig(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      const modelConfig = await this.configService.getModelConfig();
      
      if (!modelConfig) {
        result.isValid = false;
        result.errors.push('Model configuration not found');
        return result;
      }

      // Check available models
      if (modelConfig.available_models) {
        for (const [modelName, model] of Object.entries(modelConfig.available_models)) {
          const modelData = model as any;
          if (modelData.generation_config?.maxOutputTokens) {
            if (modelData.generation_config.maxOutputTokens !== this.EXPECTED_MAX_TOKENS) {
              result.warnings.push(`${modelName} maxOutputTokens (${modelData.generation_config.maxOutputTokens}) differs from expected (${this.EXPECTED_MAX_TOKENS})`);
            }
          }
        }
      }

      // Check validation settings
      if (modelConfig.validation) {
        if (modelConfig.validation.max_output_tokens !== this.EXPECTED_MAX_TOKENS) {
          result.warnings.push(`Validation max_output_tokens (${modelConfig.validation.max_output_tokens}) differs from expected (${this.EXPECTED_MAX_TOKENS})`);
        }
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Model validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate token limit consistency across all tools
   */
  private async validateTokenLimits(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    const tokenValidations: TokenLimitValidation[] = [];

    try {
      // Check tool composition config
      const toolConfig = await this.configService.getToolCompositionConfig();
      if (toolConfig?.compositions) {
        for (const [toolName, composition] of Object.entries(toolConfig.compositions)) {
          const comp = composition as any;
          if (comp.configuration?.max_tokens) {
            tokenValidations.push({
              toolName,
              currentLimit: comp.configuration.max_tokens,
              expectedLimit: this.EXPECTED_MAX_TOKENS,
              isConsistent: comp.configuration.max_tokens === this.EXPECTED_MAX_TOKENS
            });
          }
        }
      }

      // Check global config
      if (toolConfig?.tool_registry_config?.global_llm_config?.max_tokens) {
        tokenValidations.push({
          toolName: 'Global LLM Config',
          currentLimit: toolConfig.tool_registry_config.global_llm_config.max_tokens,
          expectedLimit: this.EXPECTED_MAX_TOKENS,
          isConsistent: toolConfig.tool_registry_config.global_llm_config.max_tokens === this.EXPECTED_MAX_TOKENS
        });
      }

      // Analyze results
      const inconsistentTools = tokenValidations.filter(v => !v.isConsistent);
      
      if (inconsistentTools.length > 0) {
        result.warnings.push(`Found ${inconsistentTools.length} tools with inconsistent token limits`);
        
        for (const tool of inconsistentTools) {
          result.warnings.push(`${tool.toolName}: ${tool.currentLimit} (expected: ${tool.expectedLimit})`);
        }
      }

      // Log summary
      console.log(`[ConfigValidationService] Token limit validation: ${tokenValidations.length} tools checked, ${inconsistentTools.length} inconsistent`);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Token limit validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(result: ValidationResult): void {
    if (result.warnings.length > 0) {
      result.recommendations.push('Update all tool configurations to use consistent max_tokens: 50000');
      result.recommendations.push('Update all tool configurations to use consistent temperature: 0.7');
      result.recommendations.push('Enable validation.enforce_consistent_token_limits in model configuration');
    }

    if (result.errors.length > 0) {
      result.recommendations.push('Fix configuration file errors before deployment');
      result.recommendations.push('Verify all required configuration files are present and valid');
    }

    if (result.warnings.length === 0 && result.errors.length === 0) {
      result.recommendations.push('Configuration is consistent and ready for production');
    }
  }

  /**
   * Merge validation results from multiple sources
   */
  private mergeValidationResults(target: ValidationResult, source: ValidationResult): void {
    target.isValid = target.isValid && source.isValid;
    target.errors.push(...source.errors);
    target.warnings.push(...source.warnings);
    target.recommendations.push(...source.recommendations);
  }

  /**
   * Get validation summary for logging
   */
  getValidationSummary(result: ValidationResult): string {
    const summary = [
      `Configuration Validation Summary:`,
      `✅ Valid: ${result.isValid}`,
      `❌ Errors: ${result.errors.length}`,
      `⚠️ Warnings: ${result.warnings.length}`,
      `💡 Recommendations: ${result.recommendations.length}`
    ];

    if (result.errors.length > 0) {
      summary.push('\nErrors:');
      result.errors.forEach(error => summary.push(`  - ${error}`));
    }

    if (result.warnings.length > 0) {
      summary.push('\nWarnings:');
      result.warnings.forEach(warning => summary.push(`  - ${warning}`));
    }

    if (result.recommendations.length > 0) {
      summary.push('\nRecommendations:');
      result.recommendations.forEach(rec => summary.push(`  - ${rec}`));
    }

    return summary.join('\n');
  }

  /**
   * Auto-fix common configuration issues
   */
  async autoFixConfiguration(): Promise<ValidationResult> {
    console.log('[ConfigValidationService] Starting auto-fix of configuration issues...');
    
    try {
      // This would implement automatic fixes for common issues
      // For now, just return a recommendation
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        recommendations: [
          'Auto-fix not yet implemented. Please manually update configurations.',
          'Use the validation results to identify and fix inconsistencies.'
        ]
      };

      return result;
    } catch (error) {
      const result: ValidationResult = {
        isValid: false,
        errors: [`Auto-fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        recommendations: ['Manual configuration review required']
      };
      return result;
    }
  }
}
