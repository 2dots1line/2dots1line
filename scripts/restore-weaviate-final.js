#!/usr/bin/env node

const fs = require('fs');
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

async function restoreWeaviateData() {
  console.log('🔄 Starting full Weaviate data restoration...');
  
  // Read backup data
  const backupFile = JSON.parse(fs.readFileSync('backups/20250924_121751_pre_migration/weaviate_data.json', 'utf8'));
  const backupData = backupFile.objects || backupFile;
  console.log(`📊 Found ${backupData.length} objects in backup`);
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  // Process objects in batches
  const batchSize = 50;
  for (let i = 0; i < backupData.length; i += batchSize) {
    const batch = backupData.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(backupData.length/batchSize)} (${batch.length} objects)`);
    
    for (const obj of batch) {
      try {
        // Skip objects that only have status updates (no content)
        if (!obj.properties.sourceEntityId && !obj.properties.textContent) {
          skippedCount++;
          continue;
        }
        
        // Map old fields to new standardized fields
        const newProperties = {
          entity_id: obj.properties.sourceEntityId || obj.id,
          user_id: obj.properties.userId,
          entity_type: obj.properties.sourceEntityType,
          content: obj.properties.textContent,
          title: obj.properties.title,
          type: obj.properties.sourceEntityType?.toLowerCase() || 'unknown',
          embedding_model_version: obj.properties.modelVersion || obj.properties.embeddingModelVersion,
          created_at: obj.properties.createdAt,
          status: obj.properties.status || 'active'
        };
        
        // Create new object with standardized schema
        const newObject = {
          class: 'UserKnowledgeItem',
          properties: newProperties
        };
        
        const result = await makeRequest('POST', 'http://localhost:8080/v1/objects', newObject);
        if (result && result.id) {
          successCount++;
        } else {
          errorCount++;
          console.error(`❌ Failed to restore object ${obj.id}: ${JSON.stringify(result)}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing object ${obj.id}: ${error.message}`);
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check progress every 10 batches
    if ((Math.floor(i/batchSize) + 1) % 10 === 0) {
      try {
        const currentCount = await makeRequest('GET', 'http://localhost:8080/v1/objects?class=UserKnowledgeItem');
        console.log(`📊 Current object count: ${currentCount?.objects?.length || 0}`);
      } catch (error) {
        console.error(`❌ Error getting current count: ${error.message}`);
      }
    }
  }
  
  console.log(`\n✅ Weaviate restoration complete!`);
  console.log(`   Successfully restored: ${successCount} objects`);
  console.log(`   Failed: ${errorCount} objects`);
  console.log(`   Skipped: ${skippedCount} objects`);
  
  // Verify final count
  try {
    const finalCount = await makeRequest('GET', 'http://localhost:8080/v1/objects?class=UserKnowledgeItem');
    console.log(`📊 Final object count: ${finalCount?.objects?.length || 0}`);
  } catch (error) {
    console.error(`❌ Error getting final count: ${error.message}`);
  }
}

// Run the restoration
restoreWeaviateData().catch(console.error);
