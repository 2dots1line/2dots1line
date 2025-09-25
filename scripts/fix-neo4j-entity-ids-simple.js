#!/usr/bin/env node

const { execSync } = require('child_process');

// Helper function to execute PostgreSQL queries
function execPostgres(query) {
  try {
    const result = execSync(`docker exec postgres-2d1l psql -U danniwang -d twodots1line -t -c "${query}"`, { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 
    });
    return result.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    console.error(`PostgreSQL query failed: ${error.message}`);
    return [];
  }
}

// Helper function to execute Neo4j queries
function execNeo4j(query) {
  try {
    const result = execSync(`docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "${query}"`, { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 
    });
    return result.trim();
  } catch (error) {
    console.error(`Neo4j query failed: ${error.message}`);
    return null;
  }
}

async function fixNeo4jEntityIds() {
  console.log('🔧 Fixing Neo4j entity_id values to match PostgreSQL...');
  
  // Get all memory_units from PostgreSQL
  console.log('📊 Getting memory_units from PostgreSQL...');
  const pgResults = execPostgres(`
    SELECT entity_id, user_id, title 
    FROM memory_units 
    ORDER BY created_at
  `);
  
  console.log(`Found ${pgResults.length} memory_units in PostgreSQL`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each memory unit
  for (const line of pgResults) {
    if (!line.trim()) continue;
    
    try {
      // Parse the PostgreSQL result (tab-separated)
      const parts = line.split('\t');
      if (parts.length < 3) continue;
      
      const [entity_id, user_id, title] = parts;
      
      // Escape single quotes in title for Cypher
      const escapedTitle = title.replace(/'/g, "\\'");
      
      // Find matching Neo4j node by user_id and title
      const neo4jQuery = `
        MATCH (m:MemoryUnit)
        WHERE m.user_id = '${user_id}' 
        AND m.title = '${escapedTitle}'
        AND m.entity_id IS NULL
        SET m.entity_id = '${entity_id}'
        RETURN count(m) as updated
      `;
      
      const result = execNeo4j(neo4jQuery);
      if (result && result.includes('updated')) {
        successCount++;
        console.log(`✅ Updated entity_id for ${entity_id.substring(0, 8)}...`);
      } else {
        errorCount++;
        console.log(`❌ Failed to update entity_id for ${entity_id.substring(0, 8)}...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing line: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Neo4j entity_id fix complete!`);
  console.log(`   Successfully updated: ${successCount} nodes`);
  console.log(`   Failed: ${errorCount} nodes`);
  
  // Verify the fix
  console.log('\n🔍 Verifying fix...');
  const verifyResult = execNeo4j(`
    MATCH (m:MemoryUnit)
    WHERE m.entity_id IS NOT NULL
    RETURN count(m) as nodes_with_entity_id
  `);
  console.log(`📊 MemoryUnit nodes with entity_id: ${verifyResult}`);
}

// Run the fix
fixNeo4jEntityIds().catch(console.error);
