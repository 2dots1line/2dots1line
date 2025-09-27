#!/usr/bin/env node

/**
 * Analyze Missing Vectors Script
 * 
 * This script analyzes Weaviate objects to identify which ones are missing vectors
 * and provides detailed statistics without actually generating vectors.
 */

const { DatabaseService } = require('../packages/database/dist/DatabaseService.js');

class MissingVectorAnalyzer {
  constructor() {
    this.databaseService = new DatabaseService();
    this.stats = {
      total: 0,
      withVectors: 0,
      missingVectors: 0,
      byEntityType: {},
      byTextLength: {
        empty: 0,
        short: 0,    // < 100 chars
        medium: 0,   // 100-1000 chars
        long: 0      // > 1000 chars
      }
    };
  }

  async analyzeMissingVectors() {
    console.log('🔍 [MissingVectorAnalyzer] Analyzing Weaviate objects for missing vectors...');
    
    try {
      // Get all Weaviate objects
      const allObjects = await this.getAllWeaviateObjects();
      this.stats.total = allObjects.length;
      console.log(`📊 [MissingVectorAnalyzer] Found ${allObjects.length} total objects in Weaviate`);

      // Analyze each object
      for (const obj of allObjects) {
        this.analyzeObject(obj);
      }

      // Print detailed statistics
      this.printStatistics();

    } catch (error) {
      console.error('❌ [MissingVectorAnalyzer] Error:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async getAllWeaviateObjects() {
    if (!this.databaseService.weaviate) {
      throw new Error('Weaviate client not available');
    }

    try {
      const result = await this.databaseService.weaviate
        .graphql
        .get()
        .withClassName('UserKnowledgeItem')
        .withFields('entity_id entity_type title content textContent _additional { vector }')
        .withLimit(10000)
        .do();

      const objects = result.data?.Get?.UserKnowledgeItem || [];
      
      return objects.map(obj => ({
        id: obj.entity_id,
        entityType: obj.entity_type,
        title: obj.title,
        content: obj.content || obj.textContent,
        vectorLength: obj._additional?.vector?.length || 0
      }));
    } catch (error) {
      console.error('❌ [MissingVectorAnalyzer] Error fetching Weaviate objects:', error);
      throw error;
    }
  }

  analyzeObject(obj) {
    const hasVector = obj.vectorLength > 0;
    const textContent = obj.content || obj.title || '';
    const textLength = textContent.length;

    // Count vectors
    if (hasVector) {
      this.stats.withVectors++;
    } else {
      this.stats.missingVectors++;
    }

    // Count by entity type
    if (!this.stats.byEntityType[obj.entityType]) {
      this.stats.byEntityType[obj.entityType] = {
        total: 0,
        withVectors: 0,
        missingVectors: 0
      };
    }
    this.stats.byEntityType[obj.entityType].total++;
    if (hasVector) {
      this.stats.byEntityType[obj.entityType].withVectors++;
    } else {
      this.stats.byEntityType[obj.entityType].missingVectors++;
    }

    // Count by text length
    if (textLength === 0) {
      this.stats.byTextLength.empty++;
    } else if (textLength < 100) {
      this.stats.byTextLength.short++;
    } else if (textLength < 1000) {
      this.stats.byTextLength.medium++;
    } else {
      this.stats.byTextLength.long++;
    }
  }

  printStatistics() {
    console.log('\n📈 [MissingVectorAnalyzer] Detailed Statistics:');
    console.log('=' .repeat(60));
    
    console.log('\n🔢 Overall Statistics:');
    console.log(`   Total objects: ${this.stats.total}`);
    console.log(`   With vectors: ${this.stats.withVectors} (${((this.stats.withVectors / this.stats.total) * 100).toFixed(1)}%)`);
    console.log(`   Missing vectors: ${this.stats.missingVectors} (${((this.stats.missingVectors / this.stats.total) * 100).toFixed(1)}%)`);

    console.log('\n📊 By Entity Type:');
    Object.entries(this.stats.byEntityType).forEach(([entityType, stats]) => {
      const vectorPercentage = ((stats.withVectors / stats.total) * 100).toFixed(1);
      const missingPercentage = ((stats.missingVectors / stats.total) * 100).toFixed(1);
      console.log(`   ${entityType}:`);
      console.log(`     Total: ${stats.total}`);
      console.log(`     With vectors: ${stats.withVectors} (${vectorPercentage}%)`);
      console.log(`     Missing vectors: ${stats.missingVectors} (${missingPercentage}%)`);
    });

    console.log('\n📝 By Text Content Length:');
    console.log(`   Empty content: ${this.stats.byTextLength.empty}`);
    console.log(`   Short (< 100 chars): ${this.stats.byTextLength.short}`);
    console.log(`   Medium (100-1000 chars): ${this.stats.byTextLength.medium}`);
    console.log(`   Long (> 1000 chars): ${this.stats.byTextLength.long}`);

    console.log('\n💡 Recommendations:');
    if (this.stats.missingVectors > 0) {
      console.log(`   • ${this.stats.missingVectors} objects need vector generation`);
      console.log(`   • Estimated processing time: ${Math.ceil(this.stats.missingVectors / 50)} batches of 50 objects each`);
      console.log(`   • Run: node scripts/generate-missing-vectors.js`);
    } else {
      console.log(`   • All objects already have vectors! 🎉`);
    }
  }

  async cleanup() {
    // No cleanup needed for analyzer
  }
}

// Main execution
async function main() {
  const analyzer = new MissingVectorAnalyzer();
  
  try {
    await analyzer.analyzeMissingVectors();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 [MissingVectorAnalyzer] Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MissingVectorAnalyzer };
