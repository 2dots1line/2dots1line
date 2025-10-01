#!/usr/bin/env node

/**
 * Cleanup Duplicate Vectors Script
 * 
 * This script identifies and removes duplicate Weaviate entries that were created
 * during the null vector fixing process. It keeps the entry with the proper entity_id
 * and removes the orphaned entries that have null entity_id values.
 */

const { execSync } = require('child_process');

class DuplicateVectorCleaner {
  constructor() {
    this.stats = {
      totalDuplicates: 0,
      cleaned: 0,
      errors: 0,
      skipped: 0
    };
  }

  async run() {
    console.log('🧹 [DuplicateVectorCleaner] Starting duplicate vector cleanup...\n');

    try {
      await this.findDuplicates();
      await this.cleanupDuplicates();
      this.printSummary();
    } catch (error) {
      console.error('❌ [DuplicateVectorCleaner] Fatal error:', error);
      process.exit(1);
    }
  }

  async findDuplicates() {
    console.log('🔍 [Step 1] Finding duplicate entries...');

    // Get all entities grouped by entity_id
    const result = execSync(
      'curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d \'{"query": "{ Get { UserKnowledgeItem(limit: 10000) { _additional { id, vector }, entity_id, entity_type, title } } }"}\' | jq \'.data.Get.UserKnowledgeItem | group_by(.entity_id) | map(select(length > 1))\'',
      { encoding: 'utf8' }
    );

    const duplicates = JSON.parse(result);
    this.duplicates = duplicates;

    console.log(`✅ Found ${duplicates.length} entities with duplicate entries`);
    
    // Analyze the duplicates
    let nullEntityIdCount = 0;
    let properEntityIdCount = 0;

    duplicates.forEach(group => {
      if (group[0].entity_id === null) {
        nullEntityIdCount++;
      } else {
        properEntityIdCount++;
      }
    });

    console.log(`   - ${nullEntityIdCount} groups with null entity_id (orphaned entries)`);
    console.log(`   - ${properEntityIdCount} groups with proper entity_id (duplicates)`);
    console.log();

    this.stats.totalDuplicates = duplicates.length;
  }

  async cleanupDuplicates() {
    console.log('🧹 [Step 2] Cleaning up duplicate entries...');

    for (const group of this.duplicates) {
      try {
        await this.cleanupGroup(group);
      } catch (error) {
        console.error(`❌ Error cleaning up group:`, error);
        this.stats.errors++;
      }
    }
  }

  async cleanupGroup(group) {
    // All entries in the group have the same entity_id, so we need to keep one and remove the rest
    // Sort by vector length (keep the one with a proper vector) and then by weaviate ID for consistency
    const sortedGroup = group.sort((a, b) => {
      const aVectorLength = a._additional?.vector?.length || 0;
      const bVectorLength = b._additional?.vector?.length || 0;
      
      // First sort by vector length (descending - keep entries with vectors)
      if (aVectorLength !== bVectorLength) {
        return bVectorLength - aVectorLength;
      }
      
      // Then sort by weaviate ID for consistency
      return a._additional.id.localeCompare(b._additional.id);
    });

    const keepEntry = sortedGroup[0]; // Keep the first (best) entry
    const removeEntries = sortedGroup.slice(1); // Remove the rest

    console.log(`🧹 Cleaning up ${group[0].entity_type || 'Unknown'}: ${group[0].title || 'Unknown Title'}`);
    console.log(`   Keeping: ${keepEntry._additional.id} (entity_id: ${keepEntry.entity_id}, vector_length: ${keepEntry._additional?.vector?.length || 0})`);

    // Remove duplicate entries
    for (const entry of removeEntries) {
      try {
        await this.deleteWeaviateObject(entry._additional.id);
        console.log(`   ✅ Removed: ${entry._additional.id} (vector_length: ${entry._additional?.vector?.length || 0})`);
        this.stats.cleaned++;
      } catch (error) {
        console.error(`   ❌ Failed to remove ${entry._additional.id}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  async deleteWeaviateObject(weaviateId) {
    const result = execSync(
      `curl -s -X DELETE "http://localhost:8080/v1/objects/${weaviateId}"`,
      { encoding: 'utf8' }
    );
    
    // Check if deletion was successful
    if (result.includes('error') || result.includes('404')) {
      throw new Error(`Failed to delete object ${weaviateId}: ${result}`);
    }
  }

  printSummary() {
    console.log('\n📈 [DuplicateVectorCleaner] Cleanup Summary');
    console.log('============================================================');
    console.log(`Total duplicate groups found: ${this.stats.totalDuplicates}`);
    console.log(`Entries cleaned: ${this.stats.cleaned}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    
    if (this.stats.cleaned > 0) {
      console.log('\n✅ Duplicate cleanup completed successfully!');
      console.log('💡 Next steps:');
      console.log('   1. Run: node scripts/analyze-database-sync.js');
      console.log('   2. Verify no duplicates remain');
    } else {
      console.log('\n⚠️  No duplicates were cleaned up');
    }
  }
}

// Run the cleanup
if (require.main === module) {
  const cleaner = new DuplicateVectorCleaner();
  cleaner.run().catch(console.error);
}

module.exports = DuplicateVectorCleaner;
