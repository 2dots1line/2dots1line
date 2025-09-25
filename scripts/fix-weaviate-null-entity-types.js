const { Client } = require('weaviate-ts-client');

// Initialize Weaviate client
const client = Client({
  scheme: 'http',
  host: 'localhost:8080',
});

async function fixNullEntityTypes() {
  console.log('🔧 FIXING NULL ENTITY_TYPES IN WEAVIATE');
  console.log('=======================================');
  
  try {
    // Get all objects with null entity_type
    const nullObjects = await client.graphql
      .get()
      .withClassName('UserKnowledgeItem')
      .withWhere({
        path: ['entity_type'],
        operator: 'IsNull'
      })
      .withFields('_additional { id } entity_id entity_type')
      .withLimit(2000)
      .do();
    
    const objects = nullObjects.data.Get.UserKnowledgeItem;
    console.log(`Found ${objects.length} objects with null entity_type`);
    
    if (objects.length === 0) {
      console.log('✅ No null entity_type objects found!');
      return;
    }
    
    // For each object, we need to determine the correct entity_type
    // We'll use a simple approach: check the entity_id against PostgreSQL
    const { execSync } = require('child_process');
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const obj of objects) {
      try {
        const entityId = obj.entity_id;
        
        // Check which table this entity_id belongs to in PostgreSQL
        const result = execSync(`psql -h localhost -p 5433 -U danniwang -d twodots1line -t -c "
          SELECT 'memory_units' as table_name FROM memory_units WHERE entity_id = '${entityId}'
          UNION ALL
          SELECT 'concepts' as table_name FROM concepts WHERE entity_id = '${entityId}'
          UNION ALL
          SELECT 'communities' as table_name FROM communities WHERE entity_id = '${entityId}'
          UNION ALL
          SELECT 'derived_artifacts' as table_name FROM derived_artifacts WHERE entity_id = '${entityId}'
          UNION ALL
          SELECT 'proactive_prompts' as table_name FROM proactive_prompts WHERE entity_id = '${entityId}'
          UNION ALL
          SELECT 'growth_events' as table_name FROM growth_events WHERE entity_id = '${entityId}'
          LIMIT 1;
        "`, { encoding: 'utf8' });
        
        const tableName = result.trim();
        
        if (!tableName) {
          console.log(`❌ Entity ${entityId} not found in PostgreSQL`);
          errorCount++;
          continue;
        }
        
        // Map table name to entity type
        const entityTypeMap = {
          'memory_units': 'MemoryUnit',
          'concepts': 'Concept',
          'communities': 'Community',
          'derived_artifacts': 'DerivedArtifact',
          'proactive_prompts': 'ProactivePrompt',
          'growth_events': 'GrowthEvent'
        };
        
        const entityType = entityTypeMap[tableName];
        
        if (!entityType) {
          console.log(`❌ Unknown table name: ${tableName}`);
          errorCount++;
          continue;
        }
        
        // Update the object with the correct entity_type
        await client.data.updater()
          .withClassName('UserKnowledgeItem')
          .withId(obj._additional.id)
          .withProperties({
            entity_type: entityType
          })
          .do();
        
        console.log(`✅ Fixed ${entityId}: ${tableName} -> ${entityType}`);
        fixedCount++;
        
      } catch (error) {
        console.error(`❌ Error fixing object ${obj.entity_id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📈 FIX RESULTS:`);
    console.log(`Objects fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

// Run the fix
fixNullEntityTypes().catch(console.error);
