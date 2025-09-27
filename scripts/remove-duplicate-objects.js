#!/usr/bin/env node

/**
 * Remove Duplicate Objects Script
 * 
 * This script safely removes duplicate Weaviate objects that have no vectors,
 * keeping only the ones with 768-dimensional vectors.
 */

const { DatabaseService } = require('../packages/database/dist/DatabaseService.js');

class DuplicateRemover {
  constructor() {
    this.databaseService = new DatabaseService();
    this.removedCount = 0;
    this.errors = [];
  }

  async run() {
    console.log('🧹 [DuplicateRemover] Starting duplicate object removal...');
    
    try {
      // Get all objects with their entity_id and vector status
      console.log('📊 [DuplicateRemover] Fetching all objects from Weaviate...');
      const result = await this.databaseService.weaviate
        .graphql
        .get()
        .withClassName('UserKnowledgeItem')
        .withFields('entity_id entity_type title content textContent sourceEntityId _additional { id vector }')
        .withLimit(10000)
        .do();
      
      const objects = result.data?.Get?.UserKnowledgeItem || [];
      console.log(`📈 [DuplicateRemover] Found ${objects.length} total objects`);
      
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
          textContent: obj.textContent || obj.content,
          sourceEntityId: obj.sourceEntityId,
          vectorLength: obj._additional?.vector?.length || 0
        });
      });
      
      // Find duplicates
      const duplicates = {};
      Object.entries(entityGroups).forEach(([entityId, objects]) => {
        if (objects.length > 1) {
          duplicates[entityId] = objects;
        }
      });
      
      console.log(`🔍 [DuplicateRemover] Found ${Object.keys(duplicates).length} duplicated entity_ids`);
      
      // Process each duplicate group
      for (const [entityId, objects] of Object.entries(duplicates)) {
        await this.processDuplicateGroup(entityId, objects);
      }
      
      console.log('\n📊 [DuplicateRemover] Removal Summary:');
      console.log('============================================================');
      console.log(`✅ Successfully removed: ${this.removedCount} duplicate objects`);
      console.log(`❌ Errors encountered: ${this.errors.length}`);
      
      if (this.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        this.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
    } catch (error) {
      console.error('❌ [DuplicateRemover] Error:', error);
      throw error;
    }
  }

  async processDuplicateGroup(entityId, objects) {
    // Check vector status
    const withVectors = objects.filter(obj => obj.vectorLength > 0);
    const withoutVectors = objects.filter(obj => obj.vectorLength === 0);
    
    // Only process if we have exactly 1 object with vectors and others without
    if (withVectors.length === 1 && withoutVectors.length === objects.length - 1) {
      console.log(`\n🗑️  [DuplicateRemover] Processing entity: ${entityId}`);
      console.log(`   Objects with vectors: ${withVectors.length}`);
      console.log(`   Objects without vectors: ${withoutVectors.length}`);
      
      // Remove objects without vectors
      for (const obj of withoutVectors) {
        try {
          await this.removeObject(obj.id);
          console.log(`   ✅ Removed: ${obj.id} (${obj.entityType})`);
          this.removedCount++;
        } catch (error) {
          const errorMsg = `Failed to remove ${obj.id}: ${error.message}`;
          console.log(`   ❌ ${errorMsg}`);
          this.errors.push(errorMsg);
        }
      }
    } else {
      console.log(`\n⚠️  [DuplicateRemover] Skipping entity: ${entityId} (requires manual review)`);
      console.log(`   Objects with vectors: ${withVectors.length}`);
      console.log(`   Objects without vectors: ${withoutVectors.length}`);
    }
  }

  async removeObject(objectId) {
    try {
      // Use Weaviate's data deleter
      await this.databaseService.weaviate
        .data
        .deleter()
        .withClassName('UserKnowledgeItem')
        .withId(objectId)
        .do();
      
    } catch (error) {
      throw new Error(`Weaviate delete failed: ${error.message}`);
    }
  }
}

// Run the removal
async function main() {
  const remover = new DuplicateRemover();
  await remover.run();
}

main().catch(console.error);
