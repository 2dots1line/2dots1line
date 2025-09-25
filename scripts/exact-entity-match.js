const { Client } = require('weaviate-ts-client');
const { execSync } = require('child_process');

// Initialize Weaviate client
const client = Client({
  scheme: 'http',
  host: 'localhost:8080',
});

async function getPostgresEntityIds(tableName) {
  try {
    const result = execSync(`docker exec postgres-2d1l psql -U danniwang -d twodots1line -t -c "SELECT entity_id FROM ${tableName} ORDER BY entity_id;"`, { encoding: 'utf8' });
    return result.trim().split('\n').filter(id => id.trim()).map(id => id.trim());
  } catch (error) {
    console.error(`Error getting PostgreSQL ${tableName} entity_ids:`, error.message);
    return [];
  }
}

async function getWeaviateEntityIds(entityType) {
  try {
    const result = await client.graphql
      .get()
      .withClassName('UserKnowledgeItem')
      .withWhere({
        path: ['entity_type'],
        operator: 'Equal',
        valueString: entityType
      })
      .withFields('entity_id')
      .withLimit(2000)
      .do();
    
    return result.data.Get.UserKnowledgeItem.map(obj => obj.entity_id);
  } catch (error) {
    console.error(`Error getting Weaviate ${entityType} entity_ids:`, error.message);
    return [];
  }
}

async function analyzeExactMatch(pgTable, weaviateType) {
  console.log(`\n🔍 EXACT MATCH ANALYSIS: ${pgTable} vs ${weaviateType}`);
  console.log('='.repeat(50));
  
  const pgIds = await getPostgresEntityIds(pgTable);
  const weaviateIds = await getWeaviateEntityIds(weaviateType);
  
  console.log(`PostgreSQL ${pgTable}: ${pgIds.length} entities`);
  console.log(`Weaviate ${weaviateType}: ${weaviateIds.length} entities`);
  
  // Find exact matches
  const pgSet = new Set(pgIds);
  const weaviateSet = new Set(weaviateIds);
  
  const exactMatches = pgIds.filter(id => weaviateSet.has(id));
  const pgOnly = pgIds.filter(id => !weaviateSet.has(id));
  const weaviateOnly = weaviateIds.filter(id => !pgSet.has(id));
  
  console.log(`\n📊 MATCH RESULTS:`);
  console.log(`Exact matches: ${exactMatches.length}`);
  console.log(`Only in PostgreSQL: ${pgOnly.length}`);
  console.log(`Only in Weaviate: ${weaviateOnly.length}`);
  console.log(`Match rate: ${((exactMatches.length / pgIds.length) * 100).toFixed(1)}%`);
  
  if (pgOnly.length > 0) {
    console.log(`\n❌ Missing in Weaviate (first 5):`);
    pgOnly.slice(0, 5).forEach(id => console.log(`  ${id}`));
  }
  
  if (weaviateOnly.length > 0) {
    console.log(`\n❌ Extra in Weaviate (first 5):`);
    weaviateOnly.slice(0, 5).forEach(id => console.log(`  ${id}`));
  }
  
  return {
    pgCount: pgIds.length,
    weaviateCount: weaviateIds.length,
    exactMatches: exactMatches.length,
    pgOnly: pgOnly.length,
    weaviateOnly: weaviateOnly.length,
    matchRate: (exactMatches.length / pgIds.length) * 100
  };
}

async function main() {
  console.log('🔍 EXACT ENTITY_ID MATCHING ANALYSIS');
  console.log('====================================');
  
  const tables = [
    { pg: 'memory_units', weaviate: 'MemoryUnit' },
    { pg: 'concepts', weaviate: 'Concept' },
    { pg: 'communities', weaviate: 'Community' },
    { pg: 'derived_artifacts', weaviate: 'DerivedArtifact' },
    { pg: 'proactive_prompts', weaviate: 'ProactivePrompt' },
    { pg: 'growth_events', weaviate: 'GrowthEvent' }
  ];
  
  const results = [];
  
  for (const table of tables) {
    const result = await analyzeExactMatch(table.pg, table.weaviate);
    results.push({ ...table, ...result });
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('===========');
  results.forEach(r => {
    console.log(`${r.pg}: ${r.exactMatches}/${r.pgCount} (${r.matchRate.toFixed(1)}%)`);
  });
  
  const totalPg = results.reduce((sum, r) => sum + r.pgCount, 0);
  const totalMatches = results.reduce((sum, r) => sum + r.exactMatches, 0);
  const overallMatchRate = (totalMatches / totalPg) * 100;
  
  console.log(`\n🎯 OVERALL MATCH RATE: ${totalMatches}/${totalPg} (${overallMatchRate.toFixed(1)}%)`);
}

main().catch(console.error);
