#!/usr/bin/env node

/**
 * Analyze Duplicate Differences Script
 * 
 * This script analyzes 5 pairs of duplicated entities to understand
 * the differences between them and help decide which ones to keep.
 */

const { DatabaseService } = require('../packages/database/dist/DatabaseService.js');

class DuplicateDifferenceAnalyzer {
  constructor() {
    this.databaseService = new DatabaseService();
  }

  async analyzeDuplicateDifferences() {
    console.log('🔍 [DuplicateDifferenceAnalyzer] Analyzing differences between duplicate entities...');
    
    try {
      // Get all objects with their entity_id and vector status
      console.log('📊 [DuplicateDifferenceAnalyzer] Fetching all objects from Weaviate...');
      const result = await this.databaseService.weaviate
        .graphql
        .get()
        .withClassName('UserKnowledgeItem')
        .withFields('entity_id entity_type title content textContent sourceEntityId createdAt updatedAt _additional { id vector }')
        .withLimit(10000)
        .do();

      const objects = result.data?.Get?.UserKnowledgeItem || [];
      console.log(`📈 [DuplicateDifferenceAnalyzer] Found ${objects.length} total objects`);

      // Group by entity_id
      const entityGroups = {};
      objects.forEach(obj => {
        const entityId = obj.entity_id;
        if (!entityGroups[entityId]) {
          entityGroups[entityId] = [];
        }
        entityGroups[entityId].push({
          id: obj._additional.id,
          entity_id: obj.entity_id,
          entityType: obj.entity_type,
          title: obj.title,
          content: obj.content,
          textContent: obj.textContent,
          sourceEntityId: obj.sourceEntityId,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
          vectorLength: obj._additional?.vector?.length || 0
        });
      });

      // Find duplicates
      const duplicates = Object.entries(entityGroups)
        .filter(([entityId, objects]) => objects.length > 1)
        .slice(0, 5); // Take first 5 duplicate groups

      console.log(`\n🔍 [DuplicateDifferenceAnalyzer] Analyzing ${duplicates.length} duplicate groups...`);

      for (const [entityId, duplicateObjects] of duplicates) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📋 Entity ID: ${entityId}`);
        console.log(`   Total duplicates: ${duplicateObjects.length}`);
        
        // Analyze each duplicate
        duplicateObjects.forEach((obj, index) => {
          console.log(`\n   📄 Object ${index + 1}:`);
          console.log(`      ID: ${obj.id}`);
          console.log(`      Type: ${obj.entityType}`);
          console.log(`      Vector: ${obj.vectorLength}D`);
          console.log(`      Created: ${obj.createdAt || 'N/A'}`);
          console.log(`      Updated: ${obj.updatedAt || 'N/A'}`);
          console.log(`      Source Entity ID: ${obj.sourceEntityId || 'N/A'}`);
          console.log(`      Title: ${obj.title || 'N/A'}`);
          console.log(`      Content Length: ${(obj.content || obj.textContent || '').length} chars`);
          
          // Show first 200 chars of content
          const content = obj.content || obj.textContent || '';
          if (content.length > 0) {
            console.log(`      Content Preview: "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"`);
          }
        });

        // Compare objects
        this.compareObjects(duplicateObjects);
      }

    } catch (error) {
      console.error('❌ [DuplicateDifferenceAnalyzer] Error:', error);
      throw error;
    }
  }

  compareObjects(objects) {
    console.log(`\n   🔍 Comparison Analysis:`);
    
    // Check if all objects are identical
    const firstObj = objects[0];
    let allIdentical = true;
    const differences = [];

    for (let i = 1; i < objects.length; i++) {
      const obj = objects[i];
      const objDifferences = [];

      // Compare each field
      if (obj.entityType !== firstObj.entityType) {
        objDifferences.push(`entityType: "${firstObj.entityType}" vs "${obj.entityType}"`);
      }
      if (obj.title !== firstObj.title) {
        objDifferences.push(`title: "${firstObj.title}" vs "${obj.title}"`);
      }
      if (obj.content !== firstObj.content) {
        objDifferences.push(`content: different lengths (${(firstObj.content || '').length} vs ${(obj.content || '').length})`);
      }
      if (obj.textContent !== firstObj.textContent) {
        objDifferences.push(`textContent: different lengths (${(firstObj.textContent || '').length} vs ${(obj.textContent || '').length})`);
      }
      if (obj.sourceEntityId !== firstObj.sourceEntityId) {
        objDifferences.push(`sourceEntityId: "${firstObj.sourceEntityId}" vs "${obj.sourceEntityId}"`);
      }
      if (obj.createdAt !== firstObj.createdAt) {
        objDifferences.push(`createdAt: "${firstObj.createdAt}" vs "${obj.createdAt}"`);
      }
      if (obj.updatedAt !== firstObj.updatedAt) {
        objDifferences.push(`updatedAt: "${firstObj.updatedAt}" vs "${obj.updatedAt}"`);
      }
      if (obj.vectorLength !== firstObj.vectorLength) {
        objDifferences.push(`vectorLength: ${firstObj.vectorLength}D vs ${obj.vectorLength}D`);
      }

      if (objDifferences.length > 0) {
        allIdentical = false;
        differences.push(`Object ${i + 1} differs: ${objDifferences.join(', ')}`);
      }
    }

    if (allIdentical) {
      console.log(`      ✅ All objects are IDENTICAL - safe to remove duplicates`);
    } else {
      console.log(`      ⚠️  Objects have DIFFERENCES:`);
      differences.forEach(diff => {
        console.log(`         • ${diff}`);
      });
    }

    // Recommendations
    console.log(`\n   💡 Recommendations:`);
    if (allIdentical) {
      console.log(`      • Keep the object with the most recent updatedAt timestamp`);
      console.log(`      • Or keep the object with the longest vector (if any)`);
    } else {
      console.log(`      • Manual review required - objects have meaningful differences`);
      console.log(`      • Consider which version has the most complete/accurate data`);
    }
  }
}

// Main execution
async function main() {
  const analyzer = new DuplicateDifferenceAnalyzer();
  
  try {
    await analyzer.analyzeDuplicateDifferences();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 [DuplicateDifferenceAnalyzer] Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DuplicateDifferenceAnalyzer };
