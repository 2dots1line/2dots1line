#!/usr/bin/env node

const http = require('http');

// Helper function to make HTTP requests
function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function removeWeaviateDuplicates() {
  console.log('🔄 Starting Weaviate duplicate removal...');
  
  try {
    // Get all objects
    const allObjects = await makeRequest('GET', 'http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=2000');
    console.log(`📊 Found ${allObjects.objects.length} total objects`);
    
    // Group by entity_id
    const entityIdGroups = {};
    allObjects.objects.forEach(obj => {
      const entityId = obj.properties.entity_id;
      if (!entityIdGroups[entityId]) {
        entityIdGroups[entityId] = [];
      }
      entityIdGroups[entityId].push(obj);
    });
    
    // Find duplicates
    const duplicates = Object.entries(entityIdGroups)
      .filter(([entityId, objects]) => objects.length > 1)
      .map(([entityId, objects]) => ({ entityId, objects }));
    
    console.log(`🔍 Found ${duplicates.length} entity_ids with duplicates`);
    
    let removedCount = 0;
    
    // Remove duplicates (keep first, remove rest)
    for (const { entityId, objects } of duplicates) {
      console.log(`🗑️  Removing ${objects.length - 1} duplicates for entity_id: ${entityId}`);
      
      // Keep the first object, remove the rest
      for (let i = 1; i < objects.length; i++) {
        try {
          await makeRequest('DELETE', `http://localhost:8080/v1/objects/${objects[i].id}`);
          removedCount++;
        } catch (error) {
          console.error(`❌ Failed to delete object ${objects[i].id}: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Duplicate removal complete!`);
    console.log(`   Removed: ${removedCount} duplicate objects`);
    
    // Verify final count
    const finalObjects = await makeRequest('GET', 'http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=2000');
    console.log(`📊 Final object count: ${finalObjects.objects.length}`);
    
  } catch (error) {
    console.error(`❌ Error during duplicate removal: ${error.message}`);
  }
}

// Run the duplicate removal
removeWeaviateDuplicates().catch(console.error);
