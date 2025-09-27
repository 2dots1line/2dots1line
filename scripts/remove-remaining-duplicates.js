#!/usr/bin/env node

/**
 * Remove Remaining Duplicates Script
 * 
 * This script removes the remaining duplicate objects that have no vectors,
 * keeping only the ones with 768-dimensional vectors.
 */

const { DatabaseService } = require('../packages/database/dist/DatabaseService.js');

class RemainingDuplicateRemover {
  constructor() {
    this.databaseService = new DatabaseService();
    this.removedCount = 0;
    this.errors = [];
  }

  async run() {
    console.log('🧹 [RemainingDuplicateRemover] Starting remaining duplicate removal...');
    
    try {
      // Get all objects with their entity_id and vector status (with pagination)
      console.log('📊 [RemainingDuplicateRemover] Fetching all objects from Weaviate...');
      let allObjects = [];
      let after = null;
      let hasMore = true;
      
      while (hasMore) {
        const result = await this.databaseService.weaviate
          .graphql
          .get()
          .withClassName('UserKnowledgeItem')
          .withFields('entity_id entity_type title content textContent sourceEntityId _additional { id vector }')
          .withLimit(1000)
          .withAfter(after)
          .do();

        const objects = result.data.Get.UserKnowledgeItem;
        allObjects = allObjects.concat(objects);
        
        // Check if there are more objects
        hasMore = objects.length === 1000;
        if (hasMore && objects.length > 0) {
          after = objects[objects.length - 1]._additional.id;
        }
        
        console.log(`   Fetched ${objects.length} objects (total: ${allObjects.length})`);
      }

      const objects = allObjects;
      console.log(`📈 [RemainingDuplicateRemover] Found ${objects.length} total objects`);

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

      // Find duplicates (groups with more than 1 object)
      const duplicateGroups = Object.entries(entityGroups)
        .filter(([entityId, objects]) => objects.length > 1)
        .map(([entityId, objects]) => ({ entityId, objects }));

      console.log(`🔍 [RemainingDuplicateRemover] Found ${duplicateGroups.length} duplicate groups`);

      // Process each duplicate group
      for (const group of duplicateGroups) {
        const { entityId, objects } = group;
        
        // Check vector status
        const withVectors = objects.filter(obj => obj.vectorLength > 0);
        const withoutVectors = objects.filter(obj => obj.vectorLength === 0);

        // Only process groups where we have objects with vectors and objects without vectors
        if (withVectors.length > 0 && withoutVectors.length > 0) {
          console.log(`\n📋 Processing Entity ID: ${entityId}`);
          console.log(`   Total duplicates: ${objects.length}`);
          console.log(`   With vectors: ${withVectors.length}`);
          console.log(`   Without vectors: ${withoutVectors.length}`);

          // Remove objects without vectors
          for (const objToRemove of withoutVectors) {
            try {
              await this.removeObject(objToRemove.id);
              this.removedCount++;
              console.log(`   ✅ Removed object ${objToRemove.id} (no vector)`);
            } catch (error) {
              this.errors.push(`Failed to remove ${objToRemove.id}: ${error.message}`);
              console.log(`   ❌ Failed to remove object ${objToRemove.id}: ${error.message}`);
            }
          }
        }
      }

      console.log(`\n🎉 [RemainingDuplicateRemover] Cleanup completed!`);
      console.log(`   Objects removed: ${this.removedCount}`);
      console.log(`   Errors: ${this.errors.length}`);

      if (this.errors.length > 0) {
        console.log(`\n❌ Errors encountered:`);
        this.errors.forEach(error => console.log(`   - ${error}`));
      }

    } catch (error) {
      console.error('❌ [RemainingDuplicateRemover] Fatal error:', error);
      throw error;
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

// Run the script
async function main() {
  const remover = new RemainingDuplicateRemover();
  await remover.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RemainingDuplicateRemover;
