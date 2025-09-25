#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Helper function to execute curl commands
function curlCommand(method, url, data = null) {
  try {
    let command = `curl -s -X ${method} "${url}"`;
    if (data) {
      command += ` -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
    }
    const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
    return JSON.parse(result);
  } catch (error) {
    console.error(`Curl command failed: ${error.message}`);
    return null;
  }
}

async function restoreWeaviateData() {
  console.log('🔄 Starting Weaviate data restoration...');
  
  // Read backup data
  const backupFile = JSON.parse(fs.readFileSync('backups/20250924_121751_pre_migration/weaviate_data.json', 'utf8'));
  const backupData = backupFile.objects || backupFile;
  console.log(`📊 Found ${backupData.length} objects in backup`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process objects in batches
  const batchSize = 50;
  for (let i = 0; i < backupData.length; i += batchSize) {
    const batch = backupData.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(backupData.length/batchSize)} (${batch.length} objects)`);
    
    for (const obj of batch) {
      try {
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
        
        const result = curlCommand('POST', 'http://localhost:8080/v1/objects', newObject);
        if (result && result.id) {
          successCount++;
        } else {
          errorCount++;
          console.error(`❌ Failed to restore object ${obj.id}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing object ${obj.id}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n✅ Weaviate restoration complete!`);
  console.log(`   Successfully restored: ${successCount} objects`);
  console.log(`   Failed: ${errorCount} objects`);
  
  // Verify final count
  const finalCount = curlCommand('GET', 'http://localhost:8080/v1/objects?class=UserKnowledgeItem');
  console.log(`📊 Final object count: ${finalCount?.objects?.length || 0}`);
}

// Run the restoration
restoreWeaviateData().catch(console.error);
