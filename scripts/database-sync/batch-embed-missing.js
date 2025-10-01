#!/usr/bin/env node

/**
 * Batch Embed Missing Entities Script
 * 
 * This script identifies entities that exist in PostgreSQL but are missing
 * from Weaviate, then batch processes them through the embedding worker queue.
 * 
 * Usage: node scripts/batch-embed-missing.js [options]
 * Options:
 *   --batch-size N     Process N entities per batch (default: 50)
 *   --user-id ID       User ID for embedding jobs (default: dev-user-123)
 *   --dry-run          Show what would be processed without queuing jobs
 *   --entity-types     Comma-separated list of entity types to process
 *   --time-filter      Only process entities created after this date (YYYY-MM-DD)
 *   --max-entities N   Maximum number of entities to process (default: all)
 */

const { DatabaseService } = require('../packages/database/dist/DatabaseService.js');
const { Queue } = require('bullmq');
const { execSync } = require('child_process');

class BatchEmbeddingProcessor {
  constructor() {
    this.databaseService = new DatabaseService();
    this.embeddingQueue = new Queue('embedding-queue', {
      connection: { host: 'localhost', port: 6379 }
    });
    this.stats = {
      totalEntities: 0,
      missingFromWeaviate: 0,
      queuedJobs: 0,
      errors: 0,
      skipped: 0
    };
  }

  async processMissingEmbeddings(options = {}) {
    const {
      batchSize = 50,
      userId = 'dev-user-123',
      dryRun = false,
      entityTypes = ['Concept', 'MemoryUnit', 'GrowthEvent'],
      timeFilter = null,
      maxEntities = null
    } = options;

    console.log('🔍 [BatchEmbeddingProcessor] Starting missing entity analysis...\n');
    
    try {
      // Step 1: Get all entities from PostgreSQL
      console.log('📊 [Step 1] Fetching entities from PostgreSQL...');
      const pgEntities = await this.getAllPostgreSQLEntities(timeFilter, entityTypes);
      console.log(`✅ Found ${pgEntities.length} entities in PostgreSQL`);

      // Step 2: Get all entity IDs from Weaviate
      console.log('📊 [Step 2] Fetching entity IDs from Weaviate...');
      const weaviateEntityIds = await this.getAllWeaviateEntityIds();
      console.log(`✅ Found ${weaviateEntityIds.size} entities in Weaviate`);

      // Step 3: Find missing entities
      console.log('🔍 [Step 3] Identifying missing entities...');
      const missingEntities = pgEntities.filter(entity => 
        !weaviateEntityIds.has(entity.entityId)
      );
      
      this.stats.missingFromWeaviate = missingEntities.length;
      console.log(`❌ Found ${missingEntities.length} entities missing from Weaviate`);

      if (missingEntities.length === 0) {
        console.log('✅ No missing entities found!');
        return;
      }

      // Step 4: Apply max entities limit if specified
      let entitiesToProcess = missingEntities;
      if (maxEntities && missingEntities.length > maxEntities) {
        entitiesToProcess = missingEntities.slice(0, maxEntities);
        console.log(`📝 Limited processing to ${maxEntities} entities (${missingEntities.length} total available)`);
      }

      this.stats.totalEntities = entitiesToProcess.length;

      // Step 5: Show sample of entities to be processed
      console.log('\n📋 Sample entities to be processed:');
      entitiesToProcess.slice(0, 10).forEach((entity, index) => {
        console.log(`  ${index + 1}. ${entity.entityType}: ${entity.title || entity.entityId}`);
      });
      if (entitiesToProcess.length > 10) {
        console.log(`  ... and ${entitiesToProcess.length - 10} more`);
      }

      if (dryRun) {
        console.log('\n🔍 DRY RUN - No jobs will be queued');
        console.log(`Would process ${entitiesToProcess.length} entities in batches of ${batchSize}`);
        return;
      }

      // Step 6: Batch process through embedding queue
      console.log('\n📦 [Step 4] Processing entities through embedding queue...');
      await this.batchProcessEntities(entitiesToProcess, batchSize, userId);

      // Step 7: Print final statistics
      this.printFinalStats();

    } catch (error) {
      console.error('❌ [BatchEmbeddingProcessor] Error:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async getAllPostgreSQLEntities(timeFilter, entityTypes) {
    const entities = [];
    
    for (const entityType of entityTypes) {
      const tableName = this.getTableName(entityType);
      const whereClause = timeFilter 
        ? `WHERE created_at > '${timeFilter}'`
        : '';
      
      const query = `SELECT entity_id, title, content, created_at FROM ${tableName} ${whereClause} ORDER BY created_at DESC`;
      
      const result = execSync(
        `docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "${query}"`,
        { encoding: 'utf8' }
      );
      
      const rows = this.parsePostgreSQLOutput(result);
      entities.push(...rows.map(row => ({
        entityId: row.entity_id,
        entityType,
        title: row.title,
        content: row.content,
        createdAt: row.created_at
      })));
    }
    
    return entities;
  }

  async getAllWeaviateEntityIds() {
    // First get total count
    const countResult = execSync(
      'curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d \'{"query": "{ Aggregate { UserKnowledgeItem { meta { count } } } }"}\' | jq -r \'.data.Aggregate.UserKnowledgeItem[0].meta.count\'',
      { encoding: 'utf8' }
    );
    
    const totalCount = parseInt(countResult.trim());
    
    // Then get all entity IDs with dynamic limit
    const result = execSync(
      `curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(limit: ${Math.max(totalCount, 10000)}) { entity_id } } }"}' | jq -r '.data.Get.UserKnowledgeItem[].entity_id'`,
      { encoding: 'utf8' }
    );
    
    const entityIds = result.split('\n').filter(id => id.trim());
    return new Set(entityIds);
  }

  async batchProcessEntities(entities, batchSize, userId) {
    console.log(`📦 Processing ${entities.length} entities in batches of ${batchSize}...`);
    
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(entities.length / batchSize);
      
      console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} entities)`);
      
      for (const entity of batch) {
        try {
          // Validate entity ID format
          if (!this.isValidUuid(entity.entityId)) {
            console.warn(`⚠️ Skipping ${entity.entityType} ${entity.entityId} - invalid UUID format`);
            this.stats.skipped++;
            continue;
          }

          const textContent = this.extractTextContent(entity);
          if (!textContent) {
            console.warn(`⚠️ Skipping ${entity.entityType} ${entity.entityId} - no text content`);
            this.stats.skipped++;
            continue;
          }

          // Queue embedding job
          const job = await this.embeddingQueue.add('generate_embedding', {
            entityId: entity.entityId,
            entityType: entity.entityType,
            textContent,
            userId,
            source: 'batch_embed_missing',
            createdAt: entity.createdAt
          }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 10,
            removeOnFail: 100
          });

          this.stats.queuedJobs++;
          console.log(`  ✅ Queued: ${entity.entityType} ${entity.entityId} (Job ID: ${job.id})`);
          
        } catch (error) {
          this.stats.errors++;
          console.error(`  ❌ Error queuing ${entity.entityType} ${entity.entityId}:`, error.message);
        }
      }
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < entities.length) {
        console.log(`  ⏳ Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  extractTextContent(entity) {
    // Extract appropriate text content based on entity type
    if (entity.content && entity.content.trim()) {
      return entity.content.trim();
    }
    if (entity.title && entity.title.trim()) {
      return entity.title.trim();
    }
    return null;
  }

  getTableName(entityType) {
    const mapping = {
      'Concept': 'concepts',
      'MemoryUnit': 'memory_units', 
      'GrowthEvent': 'growth_events'
    };
    return mapping[entityType] || entityType.toLowerCase();
  }

  parsePostgreSQLOutput(output) {
    const lines = output.split('\n').filter(line => {
      const trimmed = line.trim();
      // Filter out empty lines, separator lines, and row count lines
      return trimmed && 
             !trimmed.includes('---') && 
             !trimmed.includes('rows)') &&
             !trimmed.match(/^[|+\-\s]+$/); // Filter out separator lines with only |, +, -, and spaces
    });
    
    if (lines.length === 0) return [];
    
    const headers = lines[0].split('|').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split('|').map(v => v.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    }).filter(row => {
      // Filter out rows where entity_id is empty (these are likely parsing artifacts)
      return row.entity_id && row.entity_id.trim() !== '';
    });
  }

  isValidUuid(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  printFinalStats() {
    console.log('\n📈 [BatchEmbeddingProcessor] Final Statistics:');
    console.log('=' .repeat(60));
    console.log(`Total entities processed: ${this.stats.totalEntities}`);
    console.log(`Missing from Weaviate: ${this.stats.missingFromWeaviate}`);
    console.log(`Jobs queued: ${this.stats.queuedJobs}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors}`);
    
    console.log('\n💡 Next steps:');
    console.log('1. Monitor embedding worker: pm2 logs embedding-worker --lines 50');
    console.log('2. Check queue status: node scripts/monitor-embedding-queue.js');
    console.log('3. Verify completion: node scripts/analyze-database-sync.js');
    
    if (this.stats.errors > 0) {
      console.log('\n⚠️ Some entities failed to queue. Check the error messages above.');
    }
  }

  async cleanup() {
    await this.embeddingQueue.close();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    batchSize: 50,
    userId: 'dev-user-123',
    dryRun: false,
    entityTypes: ['Concept', 'MemoryUnit', 'GrowthEvent'],
    timeFilter: null,
    maxEntities: null
  };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--batch-size':
        options.batchSize = parseInt(args[++i]);
        break;
      case '--user-id':
        options.userId = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--entity-types':
        options.entityTypes = args[++i].split(',');
        break;
      case '--time-filter':
        options.timeFilter = args[++i];
        break;
      case '--max-entities':
        options.maxEntities = parseInt(args[++i]);
        break;
    }
  }

  const processor = new BatchEmbeddingProcessor();
  
  try {
    await processor.processMissingEmbeddings(options);
    process.exit(0);
  } catch (error) {
    console.error('\n💥 [BatchEmbeddingProcessor] Processing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { BatchEmbeddingProcessor };
