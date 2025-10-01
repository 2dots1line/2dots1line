#!/usr/bin/env node

/**
 * Full Database Synchronization Workflow
 * 
 * This script runs the complete database synchronization workflow:
 * 1. Analysis
 * 2. Fix missing entities
 * 3. Fix null vectors
 * 4. Clean up duplicates
 * 5. Clean up orphaned entities
 * 6. Final verification
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

class FullSyncWorkflow {
  constructor() {
    this.scriptsDir = __dirname;
    this.stats = {
      startTime: Date.now(),
      steps: [],
      errors: []
    };
  }

  async run() {
    console.log('🚀 [FullSyncWorkflow] Starting complete database synchronization workflow...\n');

    try {
      await this.runStep('Analysis', 'analyze-database-sync.js');
      await this.runStep('Fix Missing Entities', 'batch-embed-missing.js');
      await this.runStep('Fix Null Vectors', 'fix-null-vectors.js');
      await this.runStep('Clean Up Duplicates', 'cleanup-duplicate-vectors.js');
      await this.runStep('Clean Up Orphaned Entities', 'cleanup-orphaned-entities.js --confirm');
      await this.runStep('Final Verification', 'analyze-database-sync.js');
      
      this.printSummary();
    } catch (error) {
      console.error('❌ [FullSyncWorkflow] Workflow failed:', error.message);
      this.printSummary();
      process.exit(1);
    }
  }

  async runStep(stepName, scriptName) {
    console.log(`\n📋 [Step ${this.stats.steps.length + 1}] ${stepName}...`);
    console.log(`Running: node ${scriptName}`);
    
    const startTime = Date.now();
    
    try {
      const result = execSync(`node ${path.join(this.scriptsDir, scriptName)}`, {
        encoding: 'utf8',
        stdio: 'inherit'
      });
      
      const duration = Date.now() - startTime;
      this.stats.steps.push({
        name: stepName,
        script: scriptName,
        status: 'success',
        duration: duration,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ [${stepName}] Completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.steps.push({
        name: stepName,
        script: scriptName,
        status: 'error',
        duration: duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      this.stats.errors.push({
        step: stepName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ [${stepName}] Failed: ${error.message}`);
      
      // Ask user if they want to continue
      if (stepName !== 'Final Verification') {
        console.log('\n⚠️  Workflow paused due to error.');
        console.log('You can:');
        console.log('1. Fix the issue and run the remaining steps manually');
        console.log('2. Restart the workflow from the beginning');
        console.log('3. Check the logs for more details');
        throw error;
      }
    }
  }

  printSummary() {
    const totalDuration = Date.now() - this.stats.startTime;
    const successfulSteps = this.stats.steps.filter(step => step.status === 'success').length;
    const failedSteps = this.stats.steps.filter(step => step.status === 'error').length;
    
    console.log('\n📈 [FullSyncWorkflow] Workflow Summary');
    console.log('============================================================');
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`Steps Completed: ${successfulSteps}/${this.stats.steps.length}`);
    console.log(`Errors: ${failedSteps}`);
    
    console.log('\n📋 Step Details:');
    this.stats.steps.forEach((step, index) => {
      const status = step.status === 'success' ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${step.name} (${step.duration}ms)`);
      if (step.error) {
        console.log(`     Error: ${step.error}`);
      }
    });
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.step}: ${error.error}`);
      });
    }
    
    if (failedSteps === 0) {
      console.log('\n🎉 Database synchronization completed successfully!');
      console.log('💡 Next steps:');
      console.log('   - Monitor system performance');
      console.log('   - Run regular health checks');
      console.log('   - Set up automated monitoring');
    } else {
      console.log('\n⚠️  Workflow completed with errors.');
      console.log('💡 Next steps:');
      console.log('   - Review error messages above');
      console.log('   - Fix any issues found');
      console.log('   - Re-run specific steps as needed');
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  skipCleanup: args.includes('--skip-cleanup'),
  entityTypes: args.find(arg => arg.startsWith('--entity-types='))?.split('=')[1]
};

// Run the workflow
if (require.main === module) {
  const workflow = new FullSyncWorkflow();
  workflow.run().catch(console.error);
}

module.exports = FullSyncWorkflow;
