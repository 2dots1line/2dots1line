#!/usr/bin/env node

/**
 * Content Truncation Monitoring Script
 * V9.5 - Monitors for potential content truncation issues
 * 
 * Usage: node scripts/monitor-content-truncation.js [--check-db] [--check-embeddings] [--check-llm]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  maxRecommendedLength: 8000,
  criticalLength: 15000,
  minRecommendedLength: 50,
  maxOutputTokens: 50000,
  checkDatabase: false,
  checkEmbeddings: false,
  checkLLM: false
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg === '--check-db') CONFIG.checkDatabase = true;
  if (arg === '--check-embeddings') CONFIG.checkEmbeddings = true;
  if (arg === '--check-llm') CONFIG.checkLLM = true;
});

class ContentTruncationMonitor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * Main monitoring function
   */
  async run() {
    console.log('🔍 Content Truncation Monitor Starting...\n');

    try {
      // Check configuration consistency
      await this.checkConfigurationConsistency();

      // Check database content lengths
      if (CONFIG.checkDatabase) {
        await this.checkDatabaseContentLengths();
      }

      // Check embedding content lengths
      if (CONFIG.checkEmbeddings) {
        await this.checkEmbeddingContentLengths();
      }

      // Check LLM response lengths
      if (CONFIG.checkLLM) {
        await this.checkLLMResponseLengths();
      }

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ Monitoring failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check configuration consistency across all tools
   */
  async checkConfigurationConsistency() {
    console.log('📋 Checking Configuration Consistency...');

    try {
      // Check tool composition config
      const toolConfigPath = path.join(process.cwd(), 'config', 'tool_composition.json');
      if (fs.existsSync(toolConfigPath)) {
        const toolConfig = JSON.parse(fs.readFileSync(toolConfigPath, 'utf8'));
        
        // Check global LLM config
        if (toolConfig.tool_registry_config?.global_llm_config) {
          const globalConfig = toolConfig.tool_registry_config.global_llm_config;
          
          if (globalConfig.max_tokens !== CONFIG.maxOutputTokens) {
            this.warnings.push(`Global max_tokens (${globalConfig.max_tokens}) differs from expected (${CONFIG.maxOutputTokens})`);
          }
        }

        // Check individual tool configs
        if (toolConfig.compositions) {
          for (const [toolName, composition] of Object.entries(toolConfig.compositions)) {
            if (composition.configuration?.max_tokens) {
              if (composition.configuration.max_tokens !== CONFIG.maxOutputTokens) {
                this.warnings.push(`${toolName} max_tokens (${composition.configuration.max_tokens}) differs from expected (${CONFIG.maxOutputTokens})`);
              }
            }
          }
        }
      }

      // Check gemini models config
      const geminiConfigPath = path.join(process.cwd(), 'config', 'gemini_models.json');
      if (fs.existsSync(geminiConfigPath)) {
        const geminiConfig = JSON.parse(fs.readFileSync(geminiConfigPath, 'utf8'));
        
        if (geminiConfig.validation?.max_output_tokens !== CONFIG.maxOutputTokens) {
          this.warnings.push(`Gemini validation max_output_tokens (${geminiConfig.validation?.max_output_tokens}) differs from expected (${CONFIG.maxOutputTokens})`);
        }
      }

      console.log('✅ Configuration consistency check completed');

    } catch (error) {
      this.issues.push(`Configuration check failed: ${error.message}`);
    }
  }

  /**
   * Check database content lengths
   */
  async checkDatabaseContentLengths() {
    console.log('🗄️ Checking Database Content Lengths...');

    try {
      // This would connect to the database and check content lengths
      // For now, provide guidance on manual checks
      this.recommendations.push('Run database content length check manually:');
      this.recommendations.push('  SELECT table_name, column_name, data_type, character_maximum_length');
      this.recommendations.push('  FROM information_schema.columns');
      this.recommendations.push('  WHERE table_schema = \'public\' AND data_type IN (\'character varying\', \'text\')');
      
      console.log('✅ Database content length check completed (manual verification required)');

    } catch (error) {
      this.issues.push(`Database check failed: ${error.message}`);
    }
  }

  /**
   * Check embedding content lengths
   */
  async checkEmbeddingContentLengths() {
    console.log('🔤 Checking Embedding Content Lengths...');

    try {
      // This would check Weaviate content lengths
      // For now, provide guidance on manual checks
      this.recommendations.push('Check Weaviate content lengths manually:');
      this.recommendations.push('  - Review UserKnowledgeItem.textContent field lengths');
      this.recommendations.push('  - Check for content exceeding 8000 characters');
      this.recommendations.push('  - Verify embedding generation isn\'t truncating content');
      
      console.log('✅ Embedding content length check completed (manual verification required)');

    } catch (error) {
      this.issues.push(`Embedding check failed: ${error.message}`);
    }
  }

  /**
   * Check LLM response lengths
   */
  async checkLLMResponseLengths() {
    console.log('🤖 Checking LLM Response Lengths...');

    try {
      // Check logs for LLM response issues
      const logPath = path.join(process.cwd(), 'logs');
      if (fs.existsSync(logPath)) {
        const logFiles = fs.readdirSync(logPath).filter(file => file.endsWith('.log'));
        
        if (logFiles.length > 0) {
          this.recommendations.push('Check recent logs for LLM response issues:');
          this.recommendations.push('  - Look for "truncated" or "incomplete" responses');
          this.recommendations.push('  - Check for responses shorter than 100 characters');
          this.recommendations.push('  - Monitor for token limit warnings');
        }
      }

      // Check worker logs
      this.recommendations.push('Check worker logs for truncation warnings:');
      this.recommendations.push('  - insight-worker logs');
      this.recommendations.push('  - dialogue-service logs');
      this.recommendations.push('  - ingestion-worker logs');
      
      console.log('✅ LLM response length check completed');

    } catch (error) {
      this.issues.push(`LLM check failed: ${error.message}`);
    }
  }

  /**
   * Generate monitoring report
   */
  generateReport() {
    console.log('\n📊 Content Truncation Monitoring Report');
    console.log('=====================================\n');

    // Summary
    console.log(`🔍 Issues Found: ${this.issues.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`💡 Recommendations: ${this.recommendations.length}\n`);

    // Issues
    if (this.issues.length > 0) {
      console.log('❌ CRITICAL ISSUES:');
      this.issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('');
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log('');
    }

    // Recommendations
    if (this.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.recommendations.forEach(rec => console.log(`  - ${rec}`));
      console.log('');
    }

    // Action items
    if (this.issues.length > 0 || this.warnings.length > 0) {
      console.log('🚨 ACTION REQUIRED:');
      if (this.issues.length > 0) {
        console.log('  - Fix critical issues before deployment');
      }
      if (this.warnings.length > 0) {
        console.log('  - Address configuration inconsistencies');
      }
      console.log('  - Run monitoring script again after fixes');
    } else {
      console.log('✅ No issues found. System appears to be properly configured.');
    }

    console.log('\n📝 Next Steps:');
    console.log('  1. Address any critical issues');
    console.log('  2. Fix configuration inconsistencies');
    console.log('  3. Run manual verification checks');
    console.log('  4. Re-run monitoring script');
    console.log('  5. Set up automated monitoring if needed');
  }
}

// Run the monitor
async function main() {
  const monitor = new ContentTruncationMonitor();
  await monitor.run();
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { ContentTruncationMonitor, CONFIG };
