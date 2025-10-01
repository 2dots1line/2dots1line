#!/usr/bin/env node

/**
 * Database Sync Status Checker
 * 
 * Quick status check for all database synchronization components
 */

const { execSync } = require('child_process');
const path = require('path');

class DatabaseSyncStatus {
  constructor() {
    this.scriptsDir = __dirname;
  }

  async run() {
    console.log('🔍 [DatabaseSyncStatus] Checking database synchronization status...\n');

    try {
      await this.checkDatabaseHealth();
      await this.checkQueueStatus();
      await this.checkSyncStatus();
      await this.checkWorkers();
    } catch (error) {
      console.error('❌ [DatabaseSyncStatus] Error:', error.message);
    }
  }

  async checkDatabaseHealth() {
    console.log('📊 [Database Health]');
    
    try {
      // Check PostgreSQL
      const pgResult = execSync(
        'docker exec postgres psql -U postgres -d 2dots1line -c "SELECT COUNT(*) as total FROM (SELECT entity_id FROM concepts UNION SELECT entity_id FROM memory_units UNION SELECT entity_id FROM growth_events) as all_entities;"',
        { encoding: 'utf8' }
      );
      const pgCount = pgResult.match(/\s+(\d+)\s*/)?.[1] || 'Unknown';
      console.log(`  ✅ PostgreSQL: ${pgCount} entities`);
    } catch (error) {
      console.log(`  ❌ PostgreSQL: Connection failed`);
    }

    try {
      // Check Weaviate
      const weaviateResult = execSync(
        'curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d \'{"query": "{ Aggregate { UserKnowledgeItem { meta { count } } } }"}\' | jq -r \'.data.Aggregate.UserKnowledgeItem[0].meta.count\'',
        { encoding: 'utf8' }
      );
      const weaviateCount = weaviateResult.trim();
      console.log(`  ✅ Weaviate: ${weaviateCount} objects`);
    } catch (error) {
      console.log(`  ❌ Weaviate: Connection failed`);
    }

    try {
      // Check Neo4j
      const neo4jResult = execSync(
        'docker exec neo4j cypher-shell -u neo4j -p password "MATCH (n) RETURN count(n) as total;"',
        { encoding: 'utf8' }
      );
      const neo4jCount = neo4jResult.match(/\|\s*(\d+)\s*\|/)?.[1] || 'Unknown';
      console.log(`  ✅ Neo4j: ${neo4jCount} nodes`);
    } catch (error) {
      console.log(`  ❌ Neo4j: Connection failed`);
    }
    
    console.log();
  }

  async checkQueueStatus() {
    console.log('📦 [Queue Status]');
    
    try {
      const queueResult = execSync(
        'node monitor-embedding-queue.js --quiet',
        { encoding: 'utf8', cwd: this.scriptsDir }
      );
      console.log(`  ✅ Embedding Queue: Active`);
    } catch (error) {
      console.log(`  ❌ Embedding Queue: Error - ${error.message}`);
    }
    
    console.log();
  }

  async checkSyncStatus() {
    console.log('🔄 [Sync Status]');
    
    try {
      const syncResult = execSync(
        'node analyze-database-sync.js --quiet',
        { encoding: 'utf8', cwd: this.scriptsDir }
      );
      
      // Parse the sync result for key metrics
      const lines = syncResult.split('\n');
      const syncLine = lines.find(line => line.includes('Synchronized:'));
      const missingLine = lines.find(line => line.includes('Missing from Weaviate:'));
      const orphanedLine = lines.find(line => line.includes('Orphaned in Weaviate:'));
      const nullVectorsLine = lines.find(line => line.includes('Null Vectors:'));
      
      if (syncLine) console.log(`  ${syncLine.trim()}`);
      if (missingLine) console.log(`  ${missingLine.trim()}`);
      if (orphanedLine) console.log(`  ${orphanedLine.trim()}`);
      if (nullVectorsLine) console.log(`  ${nullVectorsLine.trim()}`);
      
    } catch (error) {
      console.log(`  ❌ Sync Analysis: Error - ${error.message}`);
    }
    
    console.log();
  }

  async checkWorkers() {
    console.log('👷 [Workers Status]');
    
    try {
      const pm2Result = execSync('pm2 status', { encoding: 'utf8' });
      const lines = pm2Result.split('\n');
      
      const workers = ['embedding-worker', 'ingestion-worker', 'insight-worker'];
      workers.forEach(worker => {
        const workerLine = lines.find(line => line.includes(worker));
        if (workerLine) {
          const status = workerLine.includes('online') ? '✅' : '❌';
          console.log(`  ${status} ${worker}`);
        } else {
          console.log(`  ❓ ${worker}: Not found`);
        }
      });
      
    } catch (error) {
      console.log(`  ❌ Workers: Error - ${error.message}`);
    }
    
    console.log();
  }
}

// Run the status check
if (require.main === module) {
  const status = new DatabaseSyncStatus();
  status.run().catch(console.error);
}

module.exports = DatabaseSyncStatus;
