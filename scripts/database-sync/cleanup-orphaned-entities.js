#!/usr/bin/env node

/**
 * Cleanup Orphaned Entities Script
 * 
 * This script identifies entities in Weaviate that don't exist in PostgreSQL
 * and provides options to clean them up.
 * 
 * Usage: node scripts/cleanup-orphaned-entities.js [options]
 * Options:
 *   --dry-run          Show what would be deleted without actually deleting
 *   --confirm          Actually delete the orphaned entities (requires confirmation)
 *   --entity-types     Comma-separated list of entity types to process
 *   --max-entities N   Maximum number of entities to process (default: all)
 *   --backup           Create backup before deletion
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class OrphanedEntityCleaner {
  constructor() {
    this.stats = {
      totalOrphaned: 0,
      processed: 0,
      deleted: 0,
      errors: 0,
      skipped: 0
    };
  }

  async cleanupOrphanedEntities(options = {}) {
    const {
      dryRun = true,
      confirm = false,
      entityTypes = null,
      maxEntities = null,
      backup = false
    } = options;

    console.log('🔍 [OrphanedEntityCleaner] Starting orphaned entity analysis...\n');
    
    try {
      // Step 1: Find orphaned entities
      console.log('📊 [Step 1] Finding orphaned entities...');
      const orphanedEntities = await this.findOrphanedEntities(entityTypes);
      console.log(`✅ Found ${orphanedEntities.length} orphaned entities`);

      if (orphanedEntities.length === 0) {
        console.log('✅ No orphaned entities found!');
        return;
      }

      // Step 2: Show breakdown by entity type
      this.showBreakdownByType(orphanedEntities);

      // Step 3: Apply max entities limit if specified
      let entitiesToProcess = orphanedEntities;
      if (maxEntities && orphanedEntities.length > maxEntities) {
        entitiesToProcess = orphanedEntities.slice(0, maxEntities);
        console.log(`📝 Limited processing to ${maxEntities} entities (${orphanedEntities.length} total available)`);
      }

      this.stats.totalOrphaned = orphanedEntities.length;
      this.stats.processed = entitiesToProcess.length;

      // Step 4: Show sample of entities to be processed
      console.log('\n📋 Sample orphaned entities:');
      entitiesToProcess.slice(0, 10).forEach((entity, index) => {
        console.log(`  ${index + 1}. ${entity.entity_type}: ${entity.title || entity.entity_id}`);
        console.log(`      Weaviate ID: ${entity.weaviate_id}`);
      });
      if (entitiesToProcess.length > 10) {
        console.log(`  ... and ${entitiesToProcess.length - 10} more`);
      }

      // Step 5: Handle backup if requested
      if (backup && !dryRun) {
        await this.createBackup(entitiesToProcess);
      }

      // Step 6: Process entities
      if (dryRun) {
        console.log('\n🔍 DRY RUN - No entities will be deleted');
        console.log(`Would delete ${entitiesToProcess.length} orphaned entities`);
        this.showDeletionSummary(entitiesToProcess);
      } else if (confirm) {
        console.log('\n⚠️ CONFIRMATION REQUIRED');
        const confirmed = await this.requestConfirmation(entitiesToProcess.length);
        if (confirmed) {
          await this.deleteEntities(entitiesToProcess);
        } else {
          console.log('❌ Deletion cancelled by user');
          return;
        }
      } else {
        console.log('\n⚠️ Use --confirm flag to actually delete entities');
        console.log('Use --dry-run to see what would be deleted');
        this.showDeletionSummary(entitiesToProcess);
      }

      // Step 7: Print final statistics
      this.printFinalStats();

    } catch (error) {
      console.error('❌ [OrphanedEntityCleaner] Error:', error);
      throw error;
    }
  }

  async findOrphanedEntities(entityTypes) {
    // Get all PostgreSQL entity IDs
    const pgResult = execSync(
      'docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT entity_id FROM concepts UNION SELECT entity_id FROM memory_units UNION SELECT entity_id FROM growth_events;"',
      { encoding: 'utf8' }
    );
    
    const pgLines = pgResult.split('\n').filter(line => 
      line.trim() && !line.includes('entity_id') && !line.includes('---') && !line.includes('rows)')
    );
    const pgEntityIds = new Set(pgLines.map(line => line.trim()).filter(id => id));
    
    // First get total count
    const countResult = execSync(
      'curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d \'{"query": "{ Aggregate { UserKnowledgeItem { meta { count } } } }"}\' | jq -r \'.data.Aggregate.UserKnowledgeItem[0].meta.count\'',
      { encoding: 'utf8' }
    );
    
    const totalCount = parseInt(countResult.trim());
    
    // Get all Weaviate entities with dynamic limit
    // Get all Weaviate entities with essential fields only (no content to reduce size)
    const query = `{
      Get {
        UserKnowledgeItem(limit: ${Math.max(totalCount, 10000)}) {
          _additional { id }
          entity_id
          entity_type
          title
        }
      }
    }`;

    const result = execSync(
      `curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '${JSON.stringify({ query })}'`,
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 } // Increase buffer size to 50MB
    );

    const data = JSON.parse(result);
    const weaviateEntities = data.data?.Get?.UserKnowledgeItem || [];
    
    // Find orphaned entities
    const orphanedEntities = weaviateEntities
      .filter(entity => !pgEntityIds.has(entity.entity_id))
      .map(entity => ({
        entity_id: entity.entity_id,
        entity_type: entity.entity_type,
        title: entity.title,
        weaviate_id: entity._additional?.id
      }));

    console.log(`✅ Found ${orphanedEntities.length} orphaned entities in Weaviate`);
    
    // Filter by entity types if specified
    if (entityTypes && entityTypes.length > 0) {
      return orphanedEntities.filter(entity => 
        entityTypes.includes(entity.entity_type)
      );
    }

    return orphanedEntities;
  }

  async fetchOrphanedEntityDetails(orphanedEntityIds, entityTypes) {
    console.log(`📋 Fetching details for ${orphanedEntityIds.length} orphaned entities...`);
    
    // Process in batches to avoid overwhelming Weaviate
    const batchSize = 100;
    const allOrphanedEntities = [];
    
    for (let i = 0; i < orphanedEntityIds.length; i += batchSize) {
      const batch = orphanedEntityIds.slice(i, i + batchSize);
      const batchEntities = await this.fetchBatchDetails(batch);
      allOrphanedEntities.push(...batchEntities);
    }
    
    // Filter by entity types if specified
    if (entityTypes && entityTypes.length > 0) {
      return allOrphanedEntities.filter(entity => 
        entityTypes.includes(entity.entity_type)
      );
    }
    
    return allOrphanedEntities;
  }

  async fetchBatchDetails(weaviateIds) {
    // Use individual queries for each ID since ContainsAny might not work as expected
    const allEntities = [];
    
    for (const weaviateId of weaviateIds) {
      try {
        const query = `{
          Get {
            UserKnowledgeItem(where: {
              path: ["_additional", "id"]
              operator: "Equal"
              valueString: "${weaviateId}"
            }) {
              _additional { id }
              entity_id
              entity_type
              title
            }
          }
        }`;

        const result = execSync(
          `curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '${JSON.stringify({ query })}'`,
          { encoding: 'utf8', maxBuffer: 1024 * 1024 }
        );

        const data = JSON.parse(result);
        const entities = data.data?.Get?.UserKnowledgeItem || [];
        
        if (entities.length > 0) {
          allEntities.push({
            entity_id: entities[0].entity_id,
            entity_type: entities[0].entity_type,
            title: entities[0].title,
            weaviate_id: entities[0]._additional?.id
          });
        }
      } catch (error) {
        console.error(`Error fetching details for ${weaviateId}:`, error.message);
      }
    }
    
    return allEntities;
  }

  showBreakdownByType(entities) {
    const breakdown = entities.reduce((acc, entity) => {
      acc[entity.entity_type] = (acc[entity.entity_type] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Breakdown by entity type:');
    Object.entries(breakdown).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }

  async createBackup(entities) {
    console.log('\n💾 Creating backup...');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      totalEntities: entities.length,
      entities: entities
    };
    
    const filename = `orphaned-entities-backup-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(process.cwd(), 'logs', filename);
    
    // Ensure logs directory exists
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup created: ${filepath}`);
  }

  async requestConfirmation(count) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`\n⚠️ Are you sure you want to delete ${count} orphaned entities? (yes/no): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }

  async deleteEntities(entities) {
    console.log('\n🗑️ Deleting orphaned entities...');
    
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      
      try {
        // Delete from Weaviate using REST API
        const deleteUrl = `http://localhost:8080/v1/objects/${entity.weaviate_id}`;
        
        const result = execSync(
          `curl -s -X DELETE "${deleteUrl}"`,
          { encoding: 'utf8' }
        );
        
        this.stats.deleted++;
        console.log(`  ✅ Deleted: ${entity.entity_type} ${entity.entity_id}`);
        
        // Small delay to avoid overwhelming Weaviate
        if (i % 10 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        this.stats.errors++;
        console.error(`  ❌ Error deleting ${entity.entity_type} ${entity.entity_id}:`, error.message);
      }
    }
  }

  showDeletionSummary(entities) {
    console.log('\n📋 Deletion Summary:');
    console.log(`Total orphaned entities: ${entities.length}`);
    
    const breakdown = entities.reduce((acc, entity) => {
      acc[entity.entity_type] = (acc[entity.entity_type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(breakdown).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} entities`);
    });
    
    console.log('\n⚠️ WARNING: This action cannot be undone!');
    console.log('Make sure to create a backup with --backup flag if needed.');
  }

  printFinalStats() {
    console.log('\n📈 [OrphanedEntityCleaner] Final Statistics:');
    console.log('=' .repeat(60));
    console.log(`Total orphaned entities: ${this.stats.totalOrphaned}`);
    console.log(`Entities processed: ${this.stats.processed}`);
    console.log(`Successfully deleted: ${this.stats.deleted}`);
    console.log(`Errors: ${this.stats.errors}`);
    
    if (this.stats.deleted > 0) {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('💡 Next steps:');
      console.log('1. Verify cleanup: node scripts/analyze-database-sync.js');
      console.log('2. Check Weaviate health: curl -s "http://localhost:8080/v1/meta" | jq');
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: true,
    confirm: false,
    entityTypes: null,
    maxEntities: null,
    backup: false
  };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--confirm':
        options.confirm = true;
        options.dryRun = false;
        break;
      case '--entity-types':
        options.entityTypes = args[++i].split(',');
        break;
      case '--max-entities':
        options.maxEntities = parseInt(args[++i]);
        break;
      case '--backup':
        options.backup = true;
        break;
    }
  }

  const cleaner = new OrphanedEntityCleaner();
  
  try {
    await cleaner.cleanupOrphanedEntities(options);
    process.exit(0);
  } catch (error) {
    console.error('\n💥 [OrphanedEntityCleaner] Processing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { OrphanedEntityCleaner };
