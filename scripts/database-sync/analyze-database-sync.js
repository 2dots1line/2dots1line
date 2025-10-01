#!/usr/bin/env node

/**
 * Database Synchronization Analysis Script
 * 
 * This script performs a comprehensive analysis of data consistency between
 * PostgreSQL and Weaviate databases, identifying missing entities, orphaned
 * records, and null vectors.
 * 
 * Usage: node scripts/analyze-database-sync.js [options]
 * Options:
 *   --detailed    Show detailed breakdown by entity type
 *   --export      Export results to JSON file
 *   --time-filter Filter by creation date (YYYY-MM-DD)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DatabaseSyncAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      postgresql: { total: 0, byType: {} },
      weaviate: { total: 0, byType: {}, nullVectors: 0 },
      sync: { missing: [], orphaned: [], nullVectors: [], synchronized: 0 },
      summary: {}
    };
  }

  async analyze(options = {}) {
    console.log('🔍 [DatabaseSyncAnalyzer] Starting comprehensive database analysis...\n');
    
    try {
      // Step 1: Analyze PostgreSQL entities
      await this.analyzePostgreSQL(options.timeFilter);
      
      // Step 2: Analyze Weaviate entities
      await this.analyzeWeaviate();
      
      // Step 3: Cross-reference databases
      await this.crossReferenceDatabases();
      
      // Step 4: Find null vectors
      await this.findNullVectors();
      
      // Step 5: Generate summary
      this.generateSummary();
      
      // Step 6: Display results
      this.displayResults(options.detailed);
      
      // Step 7: Export if requested
      if (options.export) {
        this.exportResults();
      }
      
      return this.results;
      
    } catch (error) {
      console.error('❌ [DatabaseSyncAnalyzer] Analysis failed:', error);
      throw error;
    }
  }

  async analyzePostgreSQL(timeFilter) {
    console.log('📊 [Step 1] Analyzing PostgreSQL entities...');
    
    const tables = ['concepts', 'memory_units', 'growth_events'];
    let totalCount = 0;
    const byType = {};
    
    for (const table of tables) {
      const query = timeFilter 
        ? `SELECT COUNT(*) as count FROM ${table} WHERE created_at > '${timeFilter}'`
        : `SELECT COUNT(*) as count FROM ${table}`;
      
      const result = execSync(
        `docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "${query}"`,
        { encoding: 'utf8' }
      );
      
      const count = parseInt(result.match(/\d+/)[0]);
      byType[table] = count;
      totalCount += count;
    }
    
    this.results.postgresql = { total: totalCount, byType };
    console.log(`✅ PostgreSQL: ${totalCount} total entities`);
    console.log(`   - Concepts: ${byType.concepts}`);
    console.log(`   - Memory Units: ${byType.memory_units}`);
    console.log(`   - Growth Events: ${byType.growth_events}\n`);
  }

  async analyzeWeaviate() {
    console.log('📊 [Step 2] Analyzing Weaviate entities...');
    
    // Get total count using aggregate query
    const countResult = execSync(
      'curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d \'{"query": "{ Aggregate { UserKnowledgeItem { meta { count } } } }"}\' | jq -r \'.data.Aggregate.UserKnowledgeItem[0].meta.count\'',
      { encoding: 'utf8' }
    );
    
    const totalCount = parseInt(countResult.trim());
    
    // Get breakdown by entity type - use high limit to get all entities
    // Weaviate GraphQL doesn't support offset, so we use a high limit
    const breakdownResult = execSync(
      `curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(limit: ${Math.max(totalCount, 10000)}) { entity_type } } }"}' | jq '.data.Get.UserKnowledgeItem | group_by(.entity_type) | map({entity_type: .[0].entity_type, count: length})'`,
      { encoding: 'utf8' }
    );
    
    const breakdown = JSON.parse(breakdownResult);
    const byType = {};
    breakdown.forEach(item => {
      byType[item.entity_type] = item.count;
    });
    
    this.results.weaviate = { total: totalCount, byType };
    console.log(`✅ Weaviate: ${totalCount} total objects`);
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
    console.log();
  }

  async crossReferenceDatabases() {
    console.log('🔍 [Step 3] Cross-referencing databases...');
    
    // Get all PostgreSQL entity IDs
    const pgResult = execSync(
      'docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT entity_id FROM concepts UNION SELECT entity_id FROM memory_units UNION SELECT entity_id FROM growth_events;"',
      { encoding: 'utf8' }
    );
    
    const pgLines = pgResult.split('\n').filter(line => 
      line.trim() && !line.includes('entity_id') && !line.includes('---') && !line.includes('rows)')
    );
    const pgEntityIds = new Set(pgLines.map(line => line.trim()).filter(id => id));
    
    // Get all Weaviate entity IDs - use dynamic limit based on total count
    const weaviateResult = execSync(
      `curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(limit: ${Math.max(this.results.weaviate.total, 10000)}) { entity_id, entity_type } } }"}' | jq -r '.data.Get.UserKnowledgeItem[].entity_id'`,
      { encoding: 'utf8' }
    );
    
    const weaviateEntityIds = new Set(weaviateResult.split('\n').filter(id => id.trim()));
    
    // Find missing and orphaned entities
    const missingFromWeaviate = [...pgEntityIds].filter(id => !weaviateEntityIds.has(id));
    const orphanedInWeaviate = [...weaviateEntityIds].filter(id => !pgEntityIds.has(id));
    
    this.results.sync.missing = missingFromWeaviate;
    this.results.sync.orphaned = orphanedInWeaviate;
    this.results.sync.synchronized = pgEntityIds.size - missingFromWeaviate.length;
    
    console.log(`✅ Cross-reference complete:`);
    console.log(`   - Missing from Weaviate: ${missingFromWeaviate.length}`);
    console.log(`   - Orphaned in Weaviate: ${orphanedInWeaviate.length}`);
    console.log(`   - Properly synchronized: ${this.results.sync.synchronized}\n`);
  }

  async findNullVectors() {
    console.log('🔍 [Step 4] Finding null vectors...');
    
    const nullVectorResult = execSync(
      `curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(limit: ${Math.max(this.results.weaviate.total, 10000)}) { _additional { id vector }, entity_id, entity_type, title } } }"}' | jq '.data.Get.UserKnowledgeItem | map(select(._additional.vector == null or (._additional.vector | length) == 0)) | map({entity_id, entity_type, title, vector_length: (._additional.vector | length // 0)})'`,
      { encoding: 'utf8' }
    );
    
    const nullVectors = JSON.parse(nullVectorResult);
    this.results.weaviate.nullVectors = nullVectors.length;
    this.results.sync.nullVectors = nullVectors;
    
    console.log(`✅ Found ${nullVectors.length} entities with null vectors`);
    if (nullVectors.length > 0) {
      console.log('   Sample null vector entities:');
      nullVectors.slice(0, 5).forEach((entity, index) => {
        console.log(`   ${index + 1}. ${entity.entity_type}: ${entity.title || entity.entity_id}`);
      });
    }
    console.log();
  }

  generateSummary() {
    const { postgresql, weaviate, sync } = this.results;
    
    this.results.summary = {
      totalIssues: sync.missing.length + sync.orphaned.length + sync.nullVectors.length,
      syncRate: ((sync.synchronized / postgresql.total) * 100).toFixed(1),
      missingRate: ((sync.missing.length / postgresql.total) * 100).toFixed(1),
      orphanedRate: ((sync.orphaned.length / weaviate.total) * 100).toFixed(1),
      nullVectorRate: ((sync.nullVectors.length / weaviate.total) * 100).toFixed(1),
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const { sync } = this.results;
    const recommendations = [];
    
    if (sync.missing.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Missing entities in Weaviate',
        count: sync.missing.length,
        action: 'Run batch embedding script to process missing entities',
        script: 'node scripts/batch-embed-missing.js'
      });
    }
    
    if (sync.nullVectors.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Null vectors in Weaviate',
        count: sync.nullVectors.length,
        action: 'Re-embed entities with null vectors',
        script: 'node scripts/fix-null-vectors.js'
      });
    }
    
    if (sync.orphaned.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Orphaned entities in Weaviate',
        count: sync.orphaned.length,
        action: 'Clean up orphaned entities',
        script: 'node scripts/cleanup-orphaned-entities.js'
      });
    }
    
    return recommendations;
  }

  displayResults(detailed = false) {
    console.log('📈 [ANALYSIS COMPLETE] Database Synchronization Report');
    console.log('=' .repeat(60));
    
    console.log('\n📊 Database Overview:');
    console.log(`PostgreSQL Total: ${this.results.postgresql.total} entities`);
    console.log(`Weaviate Total: ${this.results.weaviate.total} objects`);
    
    console.log('\n🔍 Synchronization Status:');
    console.log(`Synchronized: ${this.results.sync.synchronized} (${this.results.summary.syncRate}%)`);
    console.log(`Missing from Weaviate: ${this.results.sync.missing.length} (${this.results.summary.missingRate}%)`);
    console.log(`Orphaned in Weaviate: ${this.results.sync.orphaned.length} (${this.results.summary.orphanedRate}%)`);
    console.log(`Null Vectors: ${this.results.sync.nullVectors.length} (${this.results.summary.nullVectorRate}%)`);
    
    console.log('\n🎯 Recommendations:');
    this.results.summary.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.issue} (${rec.count} items)`);
      console.log(`   Action: ${rec.action}`);
      console.log(`   Script: ${rec.script}\n`);
    });
    
    if (detailed) {
      this.displayDetailedResults();
    }
  }

  displayDetailedResults() {
    console.log('\n📋 Detailed Breakdown:');
    
    console.log('\nPostgreSQL by Type:');
    Object.entries(this.results.postgresql.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\nWeaviate by Type:');
    Object.entries(this.results.weaviate.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    if (this.results.sync.missing.length > 0) {
      console.log('\nSample Missing Entities:');
      this.results.sync.missing.slice(0, 10).forEach((id, index) => {
        console.log(`  ${index + 1}. ${id}`);
      });
    }
  }

  exportResults() {
    const filename = `database-sync-analysis-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(process.cwd(), 'logs', filename);
    
    // Ensure logs directory exists
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n📁 Results exported to: ${filepath}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    detailed: args.includes('--detailed'),
    export: args.includes('--export'),
    timeFilter: null
  };
  
  // Parse time filter
  const timeFilterIndex = args.indexOf('--time-filter');
  if (timeFilterIndex !== -1 && args[timeFilterIndex + 1]) {
    options.timeFilter = args[timeFilterIndex + 1];
  }
  
  const analyzer = new DatabaseSyncAnalyzer();
  
  try {
    await analyzer.analyze(options);
    process.exit(0);
  } catch (error) {
    console.error('\n💥 [DatabaseSyncAnalyzer] Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DatabaseSyncAnalyzer };
