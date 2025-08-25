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
    url: 'http://localhost:8080'
  },
  userId: 'dev-user-123',
  sinceDate: '2025-08-20'
};

async function getDetailedMissingRecords() {
  const client = new Client(config.postgres);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Get missing concepts with details
    const missingConceptsResult = await client.query(`
      SELECT concept_id, name, type, created_at, last_updated_ts
      FROM concepts 
      WHERE user_id = $1 AND created_at >= $2 
      ORDER BY created_at
    `, [config.userId, config.sinceDate]);
    
    // Get missing memory units with details
    const missingMemoryUnitsResult = await client.query(`
      SELECT muid, title, creation_ts, last_modified_ts, importance_score, sentiment_score
      FROM memory_units 
      WHERE user_id = $1 AND creation_ts >= $2 
      ORDER BY creation_ts
    `, [config.userId, config.sinceDate]);
    
    // Get missing proactive prompts with details
    const missingProactivePromptsResult = await client.query(`
      SELECT prompt_id, prompt_text, source_agent, status, created_at, metadata
      FROM proactive_prompts 
      WHERE user_id = $1 AND created_at >= $2 
      ORDER BY created_at
    `, [config.userId, config.sinceDate]);
    
    // Get Weaviate data for comparison
    const weaviateResponse = await axios.get(`${config.weaviate.url}/v1/objects`, {
      params: { class: 'UserKnowledgeItem', limit: 1000 }
    });
    
    const weaviateMemoriesResponse = await axios.get(`${config.weaviate.url}/v1/objects`, {
      params: { class: 'UserMemory', limit: 1000 }
    });
    
    const weaviateConceptIds = new Set(
      weaviateResponse.data.objects
        .filter(item => item.properties.sourceEntityType === 'Concept')
        .map(item => item.properties.sourceEntityId)
    );
    
    const weaviateMemoryUnitIds = new Set(
      weaviateMemoriesResponse.data.objects
        .map(item => item.properties.sourceEntityId)
    );
    
    const weaviateProactivePromptIds = new Set(
      weaviateResponse.data.objects
        .filter(item => item.properties.sourceEntityType === 'ProactivePrompt')
        .map(item => item.properties.sourceEntityId)
    );
    
    // Find missing records
    const missingConcepts = missingConceptsResult.rows.filter(concept => !weaviateConceptIds.has(concept.concept_id));
    const missingMemoryUnits = missingMemoryUnitsResult.rows.filter(mu => !weaviateMemoryUnitIds.has(mu.muid));
    const missingProactivePrompts = missingProactivePromptsResult.rows.filter(pp => !weaviateProactivePromptIds.has(pp.prompt_id));
    
    console.log('\n🔍 DETAILED MISSING RECORDS ANALYSIS');
    console.log('=====================================');
    
    if (missingConcepts.length > 0) {
      console.log(`\n❌ Missing Concepts (${missingConcepts.length}):`);
      missingConcepts.forEach(concept => {
        console.log(`  - ${concept.concept_id}: "${concept.name}" (${concept.type}) - Created: ${concept.created_at}`);
      });
    }
    
    if (missingMemoryUnits.length > 0) {
      console.log(`\n❌ Missing Memory Units (${missingMemoryUnits.length}):`);
      missingMemoryUnits.forEach(mu => {
        console.log(`  - ${mu.muid}: "${mu.title}" - Created: ${mu.creation_ts} - Importance: ${mu.importance_score}, Sentiment: ${mu.sentiment_score}`);
      });
    }
    
    if (missingProactivePrompts.length > 0) {
      console.log(`\n❌ Missing Proactive Prompts (${missingProactivePrompts.length}):`);
      missingProactivePrompts.forEach(pp => {
        console.log(`  - ${pp.prompt_id}: "${pp.prompt_text.substring(0, 100)}..." (${pp.source_agent}) - Status: ${pp.status} - Created: ${pp.created_at}`);
      });
    }
    
    // Analyze patterns
    console.log('\n📊 PATTERN ANALYSIS');
    console.log('===================');
    
    // Check if missing records have any common characteristics
    if (missingMemoryUnits.length > 0) {
      const sourceTypeCounts = {};
      missingMemoryUnits.forEach(mu => {
        sourceTypeCounts[mu.source_type] = (sourceTypeCounts[mu.source_type] || 0) + 1;
      });
      console.log('\nMemory Unit Source Types (Missing):', sourceTypeCounts);
      
      const importanceScores = missingMemoryUnits.map(mu => mu.importance_score).filter(score => score !== null);
      if (importanceScores.length > 0) {
        console.log(`Importance Score Range: ${Math.min(...importanceScores)} - ${Math.max(...importanceScores)}`);
      }
    }
    
    if (missingConcepts.length > 0) {
      const conceptTypeCounts = {};
      missingConcepts.forEach(concept => {
        conceptTypeCounts[concept.type] = (conceptTypeCounts[concept.type] || 0) + 1;
      });
      console.log('\nConcept Types (Missing):', conceptTypeCounts);
    }
    
    if (missingProactivePrompts.length > 0) {
      const sourceAgentCounts = {};
      missingProactivePrompts.forEach(pp => {
        sourceAgentCounts[pp.source_agent] = (sourceAgentCounts[pp.source_agent] || 0) + 1;
      });
      console.log('\nProactive Prompt Source Agents (Missing):', sourceAgentCounts);
      
      const statusCounts = {};
      missingProactivePrompts.forEach(pp => {
        statusCounts[pp.status] = (statusCounts[pp.status] || 0) + 1;
      });
      console.log('Proactive Prompt Statuses (Missing):', statusCounts);
    }
    
    // Check if there are any records in Weaviate that shouldn't be there
    console.log('\n🔍 WEAVIATE DATA VALIDATION');
    console.log('============================');
    
    const pgConceptIds = new Set(missingConceptsResult.rows.map(c => c.concept_id));
    const pgMemoryUnitIds = new Set(missingMemoryUnitsResult.rows.map(mu => mu.muid));
    const pgProactivePromptIds = new Set(missingProactivePromptsResult.rows.map(pp => pp.prompt_id));
    
    const extraWeaviateConcepts = weaviateResponse.data.objects
      .filter(item => item.properties.sourceEntityType === 'Concept' && !pgConceptIds.has(item.properties.sourceEntityId));
    
    const extraWeaviateMemoryUnits = weaviateMemoriesResponse.data.objects
      .filter(item => !pgMemoryUnitIds.has(item.properties.sourceEntityId));
    
    const extraWeaviateProactivePrompts = weaviateResponse.data.objects
      .filter(item => item.properties.sourceEntityType === 'ProactivePrompt' && !pgProactivePromptIds.has(item.properties.sourceEntityId));
    
    if (extraWeaviateConcepts.length > 0) {
      console.log(`⚠️  Extra Concepts in Weaviate: ${extraWeaviateConcepts.length}`);
    }
    
    if (extraWeaviateMemoryUnits.length > 0) {
      console.log(`⚠️  Extra Memory Units in Weaviate: ${extraWeaviateMemoryUnits.length}`);
    }
    
    if (extraWeaviateProactivePrompts.length > 0) {
      console.log(`⚠️  Extra Proactive Prompts in Weaviate: ${extraWeaviateProactivePrompts.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

getDetailedMissingRecords().catch(console.error);
