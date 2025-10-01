#!/usr/bin/env node

/**
 * Fix Null Vectors Script
 * 
 * This script identifies entities in Weaviate that have null or empty vectors
 * and re-queues them for embedding generation.
 * 
 * Usage: node scripts/fix-null-vectors.js [options]
 * Options:
 *   --batch-size N     Process N entities per batch (default: 20)
 *   --user-id ID       User ID for embedding jobs (default: dev-user-123)
 *   --dry-run          Show what would be processed without queuing jobs
 *   --entity-types     Comma-separated list of entity types to process
 *   --max-entities N   Maximum number of entities to process (default: all)
 */

const { DatabaseService } = require('../packages/database/dist/DatabaseService.js');
const { Queue } = require('bullmq');
const { execSync } = require('child_process');

class NullVectorFixer {
  constructor() {
    this.databaseService = new DatabaseService();
    this.embeddingQueue = new Queue('embedding-queue', {
      connection: { host: 'localhost', port: 6379 }
    });
    this.stats = {
      totalEntities: 0,
      nullVectors: 0,
      queuedJobs: 0,
      errors: 0,
      skipped: 0
    };
  }

  async fixNullVectors(options = {}) {
    const {
      batchSize = 20,
      userId = 'dev-user-123',
      dryRun = false,
      entityTypes = null, // null means all types
      maxEntities = null
    } = options;

    console.log('🔍 [NullVectorFixer] Starting null vector analysis...\n');
    
    try {
      // Step 1: Find entities with null vectors
      console.log('📊 [Step 1] Finding entities with null vectors...');
      const nullVectorEntities = await this.findNullVectorEntities(entityTypes);
      console.log(`✅ Found ${nullVectorEntities.length} entities with null vectors`);

      if (nullVectorEntities.length === 0) {
        console.log('✅ No null vector entities found!');
        return;
      }

      // Step 2: Show breakdown by entity type
      this.showBreakdownByType(nullVectorEntities);

      // Step 3: Apply max entities limit if specified
      let entitiesToProcess = nullVectorEntities;
      if (maxEntities && nullVectorEntities.length > maxEntities) {
        entitiesToProcess = nullVectorEntities.slice(0, maxEntities);
        console.log(`📝 Limited processing to ${maxEntities} entities (${nullVectorEntities.length} total available)`);
      }

      this.stats.totalEntities = entitiesToProcess.length;
      this.stats.nullVectors = nullVectorEntities.length;

      // Step 4: Show sample of entities to be processed
      console.log('\n📋 Sample entities to be processed:');
      entitiesToProcess.slice(0, 10).forEach((entity, index) => {
        console.log(`  ${index + 1}. ${entity.entity_type}: ${entity.title || entity.entity_id}`);
        console.log(`      Vector issue: ${entity.vector_issue}`);
      });
      if (entitiesToProcess.length > 10) {
        console.log(`  ... and ${entitiesToProcess.length - 10} more`);
      }

      if (dryRun) {
        console.log('\n🔍 DRY RUN - No jobs will be queued');
        console.log(`Would process ${entitiesToProcess.length} entities in batches of ${batchSize}`);
        return;
      }

      // Step 5: Batch process through embedding queue
      console.log('\n📦 [Step 2] Processing entities through embedding queue...');
      await this.batchProcessEntities(entitiesToProcess, batchSize, userId);

      // Step 6: Print final statistics
      this.printFinalStats();

    } catch (error) {
      console.error('❌ [NullVectorFixer] Error:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async findNullVectorEntities(entityTypes) {
    // First get total count
    const countResult = execSync(
      'curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d \'{"query": "{ Aggregate { UserKnowledgeItem { meta { count } } } }"}\' | jq -r \'.data.Aggregate.UserKnowledgeItem[0].meta.count\'',
      { encoding: 'utf8' }
    );
    
    const totalCount = parseInt(countResult.trim());
    
    // Use a more efficient query that only fetches vector info without full content
    const query = `{
      Get {
        UserKnowledgeItem(limit: ${Math.max(totalCount, 10000)}) {
          _additional { id vector }
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
    const allEntities = data.data?.Get?.UserKnowledgeItem || [];
    
    // Filter for null vectors
    const nullVectorEntities = allEntities
      .filter(entity => {
        const vector = entity._additional?.vector;
        return !vector || vector.length === 0 || vector.length !== 768;
      })
      .map(entity => ({
        entity_id: entity.entity_id,
        entity_type: entity.entity_type,
        title: entity.title,
        weaviate_id: entity._additional?.id,
        vector_issue: this.getVectorIssueDescription(entity._additional?.vector)
      }));

    // Filter by entity types if specified
    if (entityTypes && entityTypes.length > 0) {
      return nullVectorEntities.filter(entity => 
        entityTypes.includes(entity.entity_type)
      );
    }

    return nullVectorEntities;
  }

  getVectorIssueDescription(vector) {
    if (!vector) return 'null_vector';
    if (!Array.isArray(vector)) return 'invalid_vector_type';
    if (vector.length === 0) return 'empty_vector';
    if (vector.length !== 768) return `wrong_dimensions_${vector.length}`;
    if (vector.some(v => typeof v !== 'number' || isNaN(v))) return 'invalid_vector_values';
    return 'unknown_issue';
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
          if (!this.isValidUuid(entity.entity_id)) {
            console.warn(`⚠️ Skipping ${entity.entity_type} ${entity.entity_id} - invalid UUID format`);
            this.stats.skipped++;
            continue;
          }

          const textContent = this.extractTextContent(entity);
          if (!textContent) {
            console.warn(`⚠️ Skipping ${entity.entity_type} ${entity.entity_id} - no text content`);
            this.stats.skipped++;
            continue;
          }

          // Queue embedding job with upsert flag
          const job = await this.embeddingQueue.add('generate_embedding', {
            entityId: entity.entity_id,
            entityType: entity.entity_type,
            textContent,
            userId,
            source: 'fix_null_vectors',
            upsertMode: true, // Important: use upsert to update existing object
            vectorIssue: entity.vector_issue,
            weaviateId: entity.weaviate_id
          }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 10,
            removeOnFail: 100
          });

          this.stats.queuedJobs++;
          console.log(`  ✅ Queued: ${entity.entity_type} ${entity.entity_id} (Job ID: ${job.id})`);
          
        } catch (error) {
          this.stats.errors++;
          console.error(`  ❌ Error queuing ${entity.entity_type} ${entity.entity_id}:`, error.message);
        }
      }
      
      // Small delay between batches
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

  isValidUuid(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  printFinalStats() {
    console.log('\n📈 [NullVectorFixer] Final Statistics:');
    console.log('=' .repeat(60));
    console.log(`Total null vector entities: ${this.stats.nullVectors}`);
    console.log(`Entities processed: ${this.stats.totalEntities}`);
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
    batchSize: 20,
    userId: 'dev-user-123',
    dryRun: false,
    entityTypes: null,
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
      case '--max-entities':
        options.maxEntities = parseInt(args[++i]);
        break;
    }
  }

  const fixer = new NullVectorFixer();
  
  try {
    await fixer.fixNullVectors(options);
    process.exit(0);
  } catch (error) {
    console.error('\n💥 [NullVectorFixer] Processing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { NullVectorFixer };
