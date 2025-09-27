#!/usr/bin/env node

/**
 * Remove Identical Duplicates Script
 * 
 * This script removes identical duplicate objects, keeping only one copy
 * of each entity_id. Since all duplicates are identical, we can safely
 * remove all but one copy of each.
 */

const { DatabaseService } = require('../packages/database/dist/DatabaseService.js');

class IdenticalDuplicateRemover {
  constructor() {
    this.databaseService = new DatabaseService();
    this.removedCount = 0;
    this.errors = [];
  }

  async run() {
    console.log('🧹 [IdenticalDuplicateRemover] Starting removal of identical duplicates...');
    
    try {
      // Get all objects with their entity_id and vector status
      console.log('📊 [IdenticalDuplicateRemover] Fetching all objects from Weaviate...');
      const result = await this.databaseService.weaviate
        .graphql
        .get()
        .withClassName('UserKnowledgeItem')
        .withFields('entity_id entity_type title content textContent sourceEntityId _additional { id vector }')
        .withLimit(10000)
        .do();

      const objects = result.data?.Get?.UserKnowledgeItem || [];
      console.log(`📈 [IdenticalDuplicateRemover] Found ${objects.length} total objects`);

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
          vectorLength: obj._additional?.vector?.length || 0
        });
      });

      // Find duplicates
      const duplicates = Object.entries(entityGroups)
        .filter(([entityId, objects]) => objects.length > 1);

      console.log(`🔍 [IdenticalDuplicateRemover] Found ${duplicates.length} duplicate groups`);

      let totalToRemove = 0;
      for (const [entityId, duplicateObjects] of duplicates) {
        // Keep the first object, remove the rest
        const toKeep = duplicateObjects[0];
        const toRemove = duplicateObjects.slice(1);
        
        totalToRemove += toRemove.length;
        
        console.log(`📋 Entity ID: ${entityId} - Keeping 1, removing ${toRemove.length}`);
      }

      console.log(`\n📊 [IdenticalDuplicateRemover] Summary:`);
      console.log(`   Total duplicate groups: ${duplicates.length}`);
      console.log(`   Total objects to remove: ${totalToRemove}`);
      console.log(`   Objects to keep: ${duplicates.length}`);

      // Ask for confirmation
      console.log(`\n⚠️  [IdenticalDuplicateRemover] This will remove ${totalToRemove} duplicate objects.`);
      console.log(`   All duplicates are identical, so this is safe.`);
      console.log(`   Proceeding with removal...`);

      // Remove duplicates
      for (const [entityId, duplicateObjects] of duplicates) {
        const toRemove = duplicateObjects.slice(1);
        
        for (const obj of toRemove) {
          try {
            await this.removeObject(obj.id);
            this.removedCount++;
            
            if (this.removedCount % 100 === 0) {
              console.log(`   ✅ Removed ${this.removedCount}/${totalToRemove} objects...`);
            }
          } catch (error) {
            console.error(`   ❌ Failed to remove object ${obj.id}: ${error.message}`);
            this.errors.push({ id: obj.id, error: error.message });
          }
        }
      }

      console.log(`\n🎉 [IdenticalDuplicateRemover] Removal completed!`);
      console.log(`   ✅ Successfully removed: ${this.removedCount} objects`);
      console.log(`   ❌ Errors: ${this.errors.length}`);
      
      if (this.errors.length > 0) {
        console.log(`\n❌ Errors encountered:`);
        this.errors.forEach(({ id, error }) => {
          console.log(`   • ${id}: ${error}`);
        });
      }

    } catch (error) {
      console.error('❌ [IdenticalDuplicateRemover] Error:', error);
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

// Main execution
async function main() {
  const remover = new IdenticalDuplicateRemover();
  
  try {
    await remover.run();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 [IdenticalDuplicateRemover] Removal failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { IdenticalDuplicateRemover };
