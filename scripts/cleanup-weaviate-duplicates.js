const { Client } = require('weaviate-ts-client');

// Initialize Weaviate client
const client = Client({
  scheme: 'http',
  host: 'localhost:8080',
});

async function cleanupWeaviateDuplicates() {
  console.log('🧹 STARTING WEAVIATE DUPLICATE CLEANUP');
  console.log('=====================================');
  
  try {
    // Step 1: Get all objects and identify duplicates
    console.log('\n📊 Step 1: Analyzing current state...');
    const allObjects = await client.graphql
      .get()
      .withClassName('UserKnowledgeItem')
      .withFields('_additional { id } entity_id entity_type')
      .withLimit(2000)
      .do();
    
    const objects = allObjects.data.Get.UserKnowledgeItem;
    console.log(`Total objects in Weaviate: ${objects.length}`);
    
    // Group by entity_id to find duplicates
    const entityIdGroups = {};
    objects.forEach(obj => {
      const entityId = obj.entity_id;
      if (!entityId) return;
      
      if (!entityIdGroups[entityId]) {
        entityIdGroups[entityId] = [];
      }
      entityIdGroups[entityId].push(obj);
    });
    
    // Find duplicates
    const duplicates = Object.entries(entityIdGroups)
      .filter(([entityId, group]) => group.length > 1)
      .map(([entityId, group]) => ({ entityId, objects: group }));
    
    console.log(`Unique entity_ids: ${Object.keys(entityIdGroups).length}`);
    console.log(`Duplicate entity_ids: ${duplicates.length}`);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }
    
    // Step 2: Remove duplicates (keep the first occurrence)
    console.log('\n🗑️ Step 2: Removing duplicates...');
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const duplicate of duplicates) {
      const { entityId, objects } = duplicate;
      console.log(`Processing ${entityId}: ${objects.length} duplicates`);
      
      // Keep the first object, delete the rest
      const toDelete = objects.slice(1);
      
      for (const obj of toDelete) {
        try {
          await client.data.deleter()
            .withClassName('UserKnowledgeItem')
            .withId(obj._additional.id)
            .do();
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting object ${obj._additional.id}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📈 CLEANUP RESULTS:`);
    console.log(`Objects deleted: ${deletedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    // Step 3: Verify cleanup
    console.log('\n🔍 Step 3: Verifying cleanup...');
    const finalObjects = await client.graphql
      .get()
      .withClassName('UserKnowledgeItem')
      .withFields('_additional { id } entity_id')
      .withLimit(2000)
      .do();
    
    const finalObjectList = finalObjects.data.Get.UserKnowledgeItem;
    const finalEntityIds = finalObjectList.map(obj => obj.entity_id);
    const uniqueFinalEntityIds = new Set(finalEntityIds);
    
    console.log(`Final object count: ${finalObjectList.length}`);
    console.log(`Final unique entity_ids: ${uniqueFinalEntityIds.size}`);
    console.log(`Duplicates remaining: ${finalObjectList.length - uniqueFinalEntityIds.size}`);
    
    if (finalObjectList.length === uniqueFinalEntityIds.size) {
      console.log('✅ SUCCESS: All duplicates removed!');
    } else {
      console.log('❌ WARNING: Some duplicates may still exist');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupWeaviateDuplicates().catch(console.error);
