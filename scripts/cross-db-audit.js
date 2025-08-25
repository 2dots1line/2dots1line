const { Client } = require('pg');
const axios = require('axios');

// Configuration
const config = {
  postgres: {
    host: 'localhost',
    port: 5433,
    database: 'twodots1line',
    user: 'danniwang',
    password: 'MaxJax2023@'
  },
  weaviate: {
    url: 'http://localhost:8080',
    apiKey: null // Anonymous access enabled
  },
  userId: 'dev-user-123',
  sinceDate: '2025-08-20'
};

async function queryPostgreSQL() {
  const client = new Client(config.postgres);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Get concepts since Aug 20
    const conceptsResult = await client.query(`
      SELECT concept_id, name, created_at 
      FROM concepts 
      WHERE user_id = $1 AND created_at >= $2 
      ORDER BY created_at
    `, [config.userId, config.sinceDate]);
    
    // Get memory units since Aug 20
    const memoryUnitsResult = await client.query(`
      SELECT muid, title, creation_ts 
      FROM memory_units 
      WHERE user_id = $1 AND creation_ts >= $2 
      ORDER BY creation_ts
    `, [config.userId, config.sinceDate]);
    
    // Get derived artifacts since Aug 20
    const derivedArtifactsResult = await client.query(`
      SELECT artifact_id, title, created_at 
      FROM derived_artifacts 
      WHERE user_id = $1 AND created_at >= $2 
      ORDER BY created_at
    `, [config.userId, config.sinceDate]);
    
    // Get proactive prompts since Aug 20
    const proactivePromptsResult = await client.query(`
      SELECT prompt_id, prompt_text as title, created_at 
      FROM proactive_prompts 
      WHERE user_id = $1 AND created_at >= $2 
      ORDER BY created_at
    `, [config.userId, config.sinceDate]);
    
    return {
      concepts: conceptsResult.rows,
      memoryUnits: memoryUnitsResult.rows,
      derivedArtifacts: derivedArtifactsResult.rows,
      proactivePrompts: proactivePromptsResult.rows
    };
    
  } catch (error) {
    console.error('❌ PostgreSQL query error:', error.message);
    return null;
  } finally {
    await client.end();
  }
}

async function queryWeaviate() {
  try {
    console.log('✅ Querying Weaviate...');
    
    // Get all UserKnowledgeItem records
    const userKnowledgeResponse = await axios.get(`${config.weaviate.url}/v1/objects`, {
      params: {
        class: 'UserKnowledgeItem',
        limit: 1000
      }
    });
    
    // Get all UserMemory records
    const userMemoryResponse = await axios.get(`${config.weaviate.url}/v1/objects`, {
      params: {
        class: 'UserMemory',
        limit: 1000
      }
    });
    
    return {
      userKnowledgeItems: userKnowledgeResponse.data.objects || [],
      userMemories: userMemoryResponse.data.objects || []
    };
    
  } catch (error) {
    console.error('❌ Weaviate query error:', error.message);
    return null;
  }
}

function analyzeMissingRecords(pgData, weaviateData) {
  if (!pgData || !weaviateData) {
    console.log('❌ Cannot analyze - missing data from one or both databases');
    return;
  }
  
  console.log('\n📊 ANALYSIS RESULTS');
  console.log('==================');
  
  // Extract IDs from Weaviate for comparison
  const weaviateConceptIds = new Set(
    weaviateData.userKnowledgeItems
      .filter(item => item.properties.sourceEntityType === 'Concept')
      .map(item => item.properties.sourceEntityId)
  );
  
  const weaviateMemoryUnitIds = new Set(
    weaviateData.userMemories
      .map(item => item.properties.sourceEntityId)
  );
  
  const weaviateDerivedArtifactIds = new Set(
    weaviateData.userKnowledgeItems
      .filter(item => item.properties.sourceEntityType === 'DerivedArtifact')
      .map(item => item.properties.sourceEntityId)
  );
  
  const weaviateProactivePromptIds = new Set(
    weaviateData.userKnowledgeItems
      .filter(item => item.properties.sourceEntityType === 'ProactivePrompt')
      .map(item => item.properties.sourceEntityId)
  );
  
  // Find missing records
  const missingConcepts = pgData.concepts.filter(concept => !weaviateConceptIds.has(concept.concept_id));
  const missingMemoryUnits = pgData.memoryUnits.filter(mu => !weaviateMemoryUnitIds.has(mu.muid));
  const missingDerivedArtifacts = pgData.derivedArtifacts.filter(da => !weaviateDerivedArtifactIds.has(da.artifact_id));
  const missingProactivePrompts = pgData.proactivePrompts.filter(pp => !weaviateProactivePromptIds.has(pp.id));
  
  // Group by date for pattern analysis
  function groupByDate(records, dateField) {
    const groups = {};
    records.forEach(record => {
      const date = new Date(record[dateField]).toISOString().split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(record);
    });
    return groups;
  }
  
  console.log('\n🔍 MISSING RECORDS ANALYSIS');
  console.log('============================');
  
  if (missingConcepts.length > 0) {
    console.log(`\n❌ Missing Concepts: ${missingConcepts.length}/${pgData.concepts.length}`);
    const conceptGroups = groupByDate(missingConcepts, 'created_at');
    Object.keys(conceptGroups).sort().forEach(date => {
      console.log(`  ${date}: ${conceptGroups[date].length} missing`);
    });
  } else {
    console.log('\n✅ All concepts are synced to Weaviate');
  }
  
  if (missingMemoryUnits.length > 0) {
    console.log(`\n❌ Missing Memory Units: ${missingMemoryUnits.length}/${pgData.memoryUnits.length}`);
    const muGroups = groupByDate(missingMemoryUnits, 'creation_ts');
    Object.keys(muGroups).sort().forEach(date => {
      console.log(`  ${date}: ${muGroups[date].length} missing`);
    });
  } else {
    console.log('\n✅ All memory units are synced to Weaviate');
  }
  
  if (missingDerivedArtifacts.length > 0) {
    console.log(`\n❌ Missing Derived Artifacts: ${missingDerivedArtifacts.length}/${pgData.derivedArtifacts.length}`);
    const daGroups = groupByDate(missingDerivedArtifacts, 'created_at');
    Object.keys(daGroups).sort().forEach(date => {
      console.log(`  ${date}: ${daGroups[date].length} missing`);
    });
  } else {
    console.log('\n✅ All derived artifacts are synced to Weaviate');
  }
  
  if (missingProactivePrompts.length > 0) {
    console.log(`\n❌ Missing Proactive Prompts: ${missingProactivePrompts.length}/${pgData.proactivePrompts.length}`);
    const ppGroups = groupByDate(missingProactivePrompts, 'created_at');
    Object.keys(ppGroups).sort().forEach(date => {
      console.log(`  ${date}: ${ppGroups[date].length} missing`);
    });
  } else {
    console.log('\n✅ All proactive prompts are synced to Weaviate');
  }
  
  // Summary statistics
  console.log('\n📈 SYNC RATES BY DATE');
  console.log('======================');
  
  const allDates = new Set([
    ...pgData.concepts.map(c => new Date(c.created_at).toISOString().split('T')[0]),
    ...pgData.memoryUnits.map(mu => new Date(mu.creation_ts).toISOString().split('T')[0]),
    ...pgData.derivedArtifacts.map(da => new Date(da.created_at).toISOString().split('T')[0]),
    ...pgData.proactivePrompts.map(pp => new Date(pp.created_at).toISOString().split('T')[0])
  ]);
  
  Array.from(allDates).sort().forEach(date => {
    const totalPG = [
      pgData.concepts.filter(c => new Date(c.created_at).toISOString().split('T')[0] === date).length,
      pgData.memoryUnits.filter(mu => new Date(mu.creation_ts).toISOString().split('T')[0] === date).length,
      pgData.derivedArtifacts.filter(da => new Date(da.created_at).toISOString().split('T')[0] === date).length,
      pgData.proactivePrompts.filter(pp => new Date(pp.created_at).toISOString().split('T')[0] === date).length
    ].reduce((sum, count) => sum + count, 0);
    
    if (totalPG > 0) {
      const totalWeaviate = [
        weaviateData.userKnowledgeItems.filter(item => 
          item.properties.sourceEntityType === 'Concept' && 
          new Date(item.properties.createdAt).toISOString().split('T')[0] === date
        ).length,
        weaviateData.userMemories.filter(item => 
          new Date(item.properties.createdAt).toISOString().split('T')[0] === date
        ).length,
        weaviateData.userKnowledgeItems.filter(item => 
          item.properties.sourceEntityType === 'DerivedArtifact' && 
          new Date(item.properties.createdAt).toISOString().split('T')[0] === date
        ).length,
        weaviateData.userKnowledgeItems.filter(item => 
          item.properties.sourceEntityType === 'ProactivePrompt' && 
          new Date(item.properties.createdAt).toISOString().split('T')[0] === date
        ).length
      ].reduce((sum, count) => sum + count, 0);
      
      const syncRate = totalWeaviate / totalPG * 100;
      console.log(`  ${date}: ${totalWeaviate}/${totalPG} (${syncRate.toFixed(1)}% synced)`);
    }
  });
}

async function main() {
  console.log('🔍 Starting Cross-Database Audit...');
  console.log(`📅 Analyzing data since: ${config.sinceDate}`);
  console.log(`👤 User ID: ${config.userId}`);
  
  // Query both databases
  const pgData = await queryPostgreSQL();
  const weaviateData = await queryWeaviate();
  
  if (pgData && weaviateData) {
    console.log('\n📊 DATA COUNTS');
    console.log('==============');
    console.log(`PostgreSQL Concepts: ${pgData.concepts.length}`);
    console.log(`PostgreSQL Memory Units: ${pgData.memoryUnits.length}`);
    console.log(`PostgreSQL Derived Artifacts: ${pgData.derivedArtifacts.length}`);
    console.log(`PostgreSQL Proactive Prompts: ${pgData.proactivePrompts.length}`);
    console.log(`Weaviate UserKnowledgeItems: ${weaviateData.userKnowledgeItems.length}`);
    console.log(`Weaviate UserMemories: ${weaviateData.userMemories.length}`);
    
    // Analyze missing records
    analyzeMissingRecords(pgData, weaviateData);
  }
  
  console.log('\n✅ Audit complete!');
}

// Run the audit
main().catch(console.error);
