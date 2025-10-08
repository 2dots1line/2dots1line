#!/usr/bin/env node

/**
 * Ontology Results Validation Script
 * 
 * This script validates the results of ontology optimization by checking:
 * 1. PostgreSQL llm_interactions table for recent ontology optimization entries
 * 2. Concept merges and archives in the concepts table
 * 3. Strategic relationships in Neo4j
 * 4. Community structures in the communities table
 * 5. Concept description synthesis updates
 * 
 * Usage: node scripts/validate-ontology-results.js [userId] [hoursAgo]
 */

const { Client } = require('pg');
const neo4j = require('neo4j-driver');

// Configuration
const PG_CONFIG = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || '2dots1line',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password'
};

const NEO4J_CONFIG = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSubSection(title) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`  ${title}`, 'bright');
  log(`${'-'.repeat(40)}`, 'blue');
}

async function validateOntologyResults(userId, hoursAgo = 1) {
  logSection('ONTOLOGY RESULTS VALIDATION');
  log(`Target User ID: ${userId}`, 'bright');
  log(`Time Window: Last ${hoursAgo} hour(s)`, 'blue');

  const pgClient = new Client(PG_CONFIG);
  const neo4jDriver = neo4j.driver(NEO4J_CONFIG.uri, neo4j.auth.basic(NEO4J_CONFIG.user, NEO4J_CONFIG.password));

  try {
    // Connect to databases
    logSection('STEP 1: CONNECTING TO DATABASES');
    await pgClient.connect();
    log('✅ PostgreSQL connected', 'green');
    
    const neo4jSession = neo4jDriver.session();
    log('✅ Neo4j connected', 'green');

    // Step 2: Check LLM interactions
    logSection('STEP 2: CHECKING LLM INTERACTIONS');
    const llmInteractionsQuery = `
      SELECT 
        id,
        user_id,
        worker_type,
        worker_job_id,
        created_at,
        model_name,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        success
      FROM llm_interactions 
      WHERE user_id = $1 
        AND worker_type = 'ontology-optimization-worker'
        AND created_at > NOW() - INTERVAL '${hoursAgo} hours'
      ORDER BY created_at DESC 
      LIMIT 10;
    `;

    const llmInteractions = await pgClient.query(llmInteractionsQuery, [userId]);
    
    if (llmInteractions.rows.length > 0) {
      log(`✅ Found ${llmInteractions.rows.length} ontology optimization LLM interactions`, 'green');
      llmInteractions.rows.forEach((row, index) => {
        log(`  ${index + 1}. Job ID: ${row.worker_job_id}`, 'blue');
        log(`     Created: ${row.created_at}`, 'blue');
        log(`     Model: ${row.model_name}`, 'blue');
        log(`     Tokens: ${row.total_tokens} (${row.prompt_tokens} + ${row.completion_tokens})`, 'blue');
        log(`     Success: ${row.success}`, row.success ? 'green' : 'red');
      });
    } else {
      log(`⚠️  No ontology optimization LLM interactions found in the last ${hoursAgo} hour(s)`, 'yellow');
    }

    // Step 3: Check concept updates
    logSection('STEP 3: CHECKING CONCEPT UPDATES');
    const conceptsQuery = `
      SELECT 
        id,
        title,
        status,
        created_at,
        updated_at,
        CASE 
          WHEN updated_at > created_at THEN 'UPDATED'
          ELSE 'NEW'
        END as change_type
      FROM concepts 
      WHERE user_id = $1 
        AND (created_at > NOW() - INTERVAL '${hoursAgo} hours' 
             OR updated_at > NOW() - INTERVAL '${hoursAgo} hours')
      ORDER BY updated_at DESC, created_at DESC 
      LIMIT 20;
    `;

    const concepts = await pgClient.query(conceptsQuery, [userId]);
    
    if (concepts.rows.length > 0) {
      log(`✅ Found ${concepts.rows.length} concept changes`, 'green');
      
      const updated = concepts.rows.filter(c => c.change_type === 'UPDATED');
      const newConcepts = concepts.rows.filter(c => c.change_type === 'NEW');
      const archived = concepts.rows.filter(c => c.status === 'archived');
      
      if (updated.length > 0) {
        log(`  📝 ${updated.length} concepts updated (potential merges)`, 'blue');
        updated.forEach(concept => {
          log(`    - ${concept.title} (${concept.id}) - Updated: ${concept.updated_at}`, 'blue');
        });
      }
      
      if (newConcepts.length > 0) {
        log(`  🆕 ${newConcepts.length} new concepts created`, 'blue');
        newConcepts.forEach(concept => {
          log(`    - ${concept.title} (${concept.id}) - Created: ${concept.created_at}`, 'blue');
        });
      }
      
      if (archived.length > 0) {
        log(`  🗄️  ${archived.length} concepts archived`, 'blue');
        archived.forEach(concept => {
          log(`    - ${concept.title} (${concept.id}) - Archived: ${concept.updated_at}`, 'blue');
        });
      }
    } else {
      log(`⚠️  No concept changes found in the last ${hoursAgo} hour(s)`, 'yellow');
    }

    // Step 4: Check community structures
    logSection('STEP 4: CHECKING COMMUNITY STRUCTURES');
    const communitiesQuery = `
      SELECT 
        id,
        name,
        description,
        member_entity_ids,
        strategic_importance,
        created_at
      FROM communities 
      WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '${hoursAgo} hours'
      ORDER BY created_at DESC 
      LIMIT 10;
    `;

    const communities = await pgClient.query(communitiesQuery, [userId]);
    
    if (communities.rows.length > 0) {
      log(`✅ Found ${communities.rows.length} new community structures`, 'green');
      communities.rows.forEach(community => {
        log(`  🏘️  ${community.name}`, 'blue');
        log(`     ID: ${community.id}`, 'blue');
        log(`     Members: ${community.member_entity_ids.length} entities`, 'blue');
        log(`     Importance: ${community.strategic_importance}/10`, 'blue');
        log(`     Created: ${community.created_at}`, 'blue');
      });
    } else {
      log(`⚠️  No new community structures found in the last ${hoursAgo} hour(s)`, 'yellow');
    }

    // Step 5: Check Neo4j strategic relationships
    logSection('STEP 5: CHECKING NEO4J STRATEGIC RELATIONSHIPS');
    const relationshipsQuery = `
      MATCH (a)-[r:STRATEGIC_ALIGNMENT|GROWTH_CATALYST|KNOWLEDGE_BRIDGE|SYNERGY_POTENTIAL]->(b)
      WHERE a.user_id = $userId OR b.user_id = $userId
      AND r.created_at > datetime() - duration({hours: $hoursAgo})
      RETURN 
        type(r) as relationship_type,
        a.title as source_title,
        a.id as source_id,
        b.title as target_title,
        b.id as target_id,
        r.created_at as created_at
      ORDER BY r.created_at DESC
      LIMIT 20;
    `;

    const relationships = await neo4jSession.run(relationshipsQuery, { userId, hoursAgo });
    
    if (relationships.records.length > 0) {
      log(`✅ Found ${relationships.records.length} new strategic relationships`, 'green');
      relationships.records.forEach(record => {
        const relType = record.get('relationship_type');
        const sourceTitle = record.get('source_title');
        const targetTitle = record.get('target_title');
        const createdAt = record.get('created_at');
        
        log(`  🔗 ${relType}`, 'blue');
        log(`     ${sourceTitle} → ${targetTitle}`, 'blue');
        log(`     Created: ${createdAt}`, 'blue');
      });
    } else {
      log(`⚠️  No new strategic relationships found in the last ${hoursAgo} hour(s)`, 'yellow');
    }

    // Step 6: Check derived artifacts for concept synthesis
    logSection('STEP 6: CHECKING CONCEPT SYNTHESIS ARTIFACTS');
    const artifactsQuery = `
      SELECT 
        id,
        type,
        title,
        content,
        source_entity_ids,
        created_at
      FROM derived_artifacts 
      WHERE user_id = $1 
        AND type = 'concept_description_synthesis'
        AND created_at > NOW() - INTERVAL '${hoursAgo} hours'
      ORDER BY created_at DESC 
      LIMIT 10;
    `;

    const artifacts = await pgClient.query(artifactsQuery, [userId]);
    
    if (artifacts.rows.length > 0) {
      log(`✅ Found ${artifacts.rows.length} concept synthesis artifacts`, 'green');
      artifacts.rows.forEach(artifact => {
        log(`  📄 ${artifact.title}`, 'blue');
        log(`     ID: ${artifact.id}`, 'blue');
        log(`     Source Entities: ${artifact.source_entity_ids.length}`, 'blue');
        log(`     Created: ${artifact.created_at}`, 'blue');
        log(`     Content Preview: ${artifact.content.substring(0, 100)}...`, 'blue');
      });
    } else {
      log(`⚠️  No concept synthesis artifacts found in the last ${hoursAgo} hour(s)`, 'yellow');
    }

    // Step 7: Summary
    logSection('VALIDATION SUMMARY');
    const totalChanges = llmInteractions.rows.length + concepts.rows.length + communities.rows.length + relationships.records.length + artifacts.rows.length;
    
    if (totalChanges > 0) {
      log(`✅ Ontology optimization appears to have completed successfully`, 'green');
      log(`   Total changes detected: ${totalChanges}`, 'green');
      log(`   - LLM Interactions: ${llmInteractions.rows.length}`, 'blue');
      log(`   - Concept Changes: ${concepts.rows.length}`, 'blue');
      log(`   - Community Structures: ${communities.rows.length}`, 'blue');
      log(`   - Strategic Relationships: ${relationships.records.length}`, 'blue');
      log(`   - Synthesis Artifacts: ${artifacts.rows.length}`, 'blue');
    } else {
      log(`⚠️  No ontology optimization changes detected`, 'yellow');
      log(`   This could mean:`, 'yellow');
      log(`   - The optimization job hasn't completed yet`, 'yellow');
      log(`   - The optimization found no changes to make`, 'yellow');
      log(`   - There was an error in the optimization process`, 'yellow');
    }

  } catch (error) {
    log(`❌ Error during validation: ${error.message}`, 'red');
    log(`Stack trace: ${error.stack}`, 'red');
  } finally {
    // Cleanup
    await pgClient.end();
    await neo4jDriver.close();
    log('\n✅ Database connections closed', 'green');
  }
}

async function main() {
  const userId = process.argv[2];
  const hoursAgo = parseInt(process.argv[3]) || 1;
  
  if (!userId) {
    log('Usage: node scripts/validate-ontology-results.js <userId> [hoursAgo]', 'red');
    log('Example: node scripts/validate-ontology-results.js user-123 2', 'yellow');
    process.exit(1);
  }

  await validateOntologyResults(userId, hoursAgo);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n🛑 Validation interrupted by user', 'yellow');
  process.exit(0);
});

// Run the script
main().catch(error => {
  log(`\n❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});
