#!/usr/bin/env node

const fs = require('fs');

// Simple Weaviate migration using curl commands
const WEAVIATE_URL = 'http://localhost:8080';
const MIGRATION_LOG_FILE = './migration-weaviate.log';

// Logging function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(MIGRATION_LOG_FILE, logMessage + '\n');
}

// Execute curl command
async function curlCommand(url, method = 'GET', data = null) {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    let command = `curl -s -X ${method} "${url}"`;
    if (data) {
        command += ` -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
    }
    
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            throw new Error(stderr);
        }
        return JSON.parse(stdout);
    } catch (error) {
        log(`❌ Curl command failed: ${error.message}`);
        throw error;
    }
}

async function migrateWeaviate() {
    log('🔍 Starting Weaviate V11.0 Field Naming Standardization Migration');
    
    try {
        // Step 1: Get current schema
        log('📋 Getting current Weaviate schema...');
        const schema = await curlCommand(`${WEAVIATE_URL}/v1/schema`);
        const currentClass = schema.classes.find(c => c.class === 'UserKnowledgeItem');
        
        if (!currentClass) {
            throw new Error('UserKnowledgeItem class not found');
        }
        
        log(`✅ Found UserKnowledgeItem class with ${currentClass.properties?.length || 0} properties`);

        // Step 2: Create UserKnowledgeItemV2 with standardized field names
        log('🏗️  Creating UserKnowledgeItemV2 class with standardized fields...');
        
        const v2ClassDefinition = {
            class: 'UserKnowledgeItemV2',
            description: 'V11.0 standardized UserKnowledgeItem with snake_case field names',
            properties: [
                { name: 'entity_id', dataType: ['text'], description: 'Unique identifier for the entity' },
                { name: 'user_id', dataType: ['text'], description: 'User identifier' },
                { name: 'entity_type', dataType: ['text'], description: 'Type of entity (concept, memory_unit, etc.)' },
                { name: 'type', dataType: ['text'], description: 'Entity subtype or category' },
                { name: 'title', dataType: ['text'], description: 'Display title of the entity' },
                { name: 'content', dataType: ['text'], description: 'Main content/text of the entity' },
                { name: 'status', dataType: ['text'], description: 'Status of the entity' },
                { name: 'importance_score', dataType: ['number'], description: 'Importance score (0-1)' },
                { name: 'sentiment_score', dataType: ['number'], description: 'Sentiment score (-1 to 1)' },
                { name: 'created_at', dataType: ['date'], description: 'Creation timestamp' },
                { name: 'updated_at', dataType: ['date'], description: 'Last update timestamp' },
                { name: 'tags', dataType: ['text[]'], description: 'Array of tags' },
                { name: 'model_version', dataType: ['text'], description: 'Embedding model version used' }
            ]
        };

        await curlCommand(`${WEAVIATE_URL}/v1/schema`, 'POST', v2ClassDefinition);
        log('✅ Created UserKnowledgeItemV2 class');

        // Step 3: Get object count first
        log('📊 Getting object count from UserKnowledgeItem...');
        const countResponse = await curlCommand(`${WEAVIATE_URL}/v1/objects?class=UserKnowledgeItem&limit=1`);
        const totalObjects = countResponse.totalResults || 0;
        log(`📦 Found ${totalObjects} objects to migrate`);

        // Step 4: Migrate data to new class in batches
        if (totalObjects > 0) {
            log('🔄 Starting data migration in batches...');
            
            let migratedCount = 0;
            let errorCount = 0;
            const batchSize = 100;
            let offset = 0;

            while (offset < totalObjects) {
                try {
                    log(`📦 Fetching batch ${Math.floor(offset/batchSize) + 1} (${offset}-${Math.min(offset + batchSize, totalObjects)})...`);
                    
                    const batchObjects = await curlCommand(`${WEAVIATE_URL}/v1/objects?class=UserKnowledgeItem&limit=${batchSize}&offset=${offset}`);
                    
                    if (!batchObjects.objects || batchObjects.objects.length === 0) {
                        break;
                    }

                    for (const obj of batchObjects.objects) {
                        try {
                            // Map old fields to new standardized fields
                            const newProperties = {
                                entity_id: obj.properties?.sourceEntityId || obj.properties?.externalId || obj.id,
                                user_id: obj.properties?.userId,
                                entity_type: obj.properties?.sourceEntityType,
                                type: obj.properties?.sourceEntityType, // Use entity_type as type
                                title: obj.properties?.title,
                                content: obj.properties?.textContent,
                                status: obj.properties?.status || 'active',
                                importance_score: obj.properties?.importanceScore || 0.5,
                                sentiment_score: 0.0, // Default value, can be calculated later
                                created_at: obj.properties?.createdAt || new Date().toISOString(),
                                updated_at: obj.properties?.updatedAt || new Date().toISOString(),
                                tags: obj.properties?.tags || [],
                                model_version: obj.properties?.modelVersion || obj.properties?.embeddingModelVersion || 'text-embedding-3-small'
                            };

                            // Create object in new class
                            const createData = {
                                class: 'UserKnowledgeItemV2',
                                properties: newProperties,
                                id: obj.id // Preserve original ID
                            };

                            await curlCommand(`${WEAVIATE_URL}/v1/objects`, 'POST', createData);

                            migratedCount++;

                        } catch (error) {
                            errorCount++;
                            log(`❌ Error migrating object ${obj.id}: ${error.message}`);
                        }
                    }

                    offset += batchSize;
                    log(`📈 Migrated ${migratedCount}/${totalObjects} objects so far`);

                } catch (error) {
                    log(`❌ Error fetching batch at offset ${offset}: ${error.message}`);
                    offset += batchSize; // Skip this batch and continue
                }
            }

            log(`✅ Data migration completed: ${migratedCount} successful, ${errorCount} errors`);
        }

        // Step 5: Verify migration
        log('🔍 Verifying migration...');
        const v2Objects = await curlCommand(`${WEAVIATE_URL}/v1/objects?class=UserKnowledgeItemV2&limit=5`);
        
        log(`✅ Verification: UserKnowledgeItemV2 has ${v2Objects.objects?.length || 0} sample objects`);

        // Step 6: Show sample migrated object
        if (v2Objects.objects && v2Objects.objects.length > 0) {
            log('📋 Sample migrated object:');
            log(JSON.stringify(v2Objects.objects[0], null, 2));
        }

        log('🎉 Weaviate migration completed successfully!');
        log('📋 Next steps:');
        log('   1. Verify data integrity in UserKnowledgeItemV2');
        log('   2. Update application code to use new field names');
        log('   3. Drop old UserKnowledgeItem class when ready');
        log('   4. Rename UserKnowledgeItemV2 to UserKnowledgeItem');

    } catch (error) {
        log(`❌ Migration failed: ${error.message}`);
        throw error;
    }
}

// Run migration
migrateWeaviate()
    .then(() => {
        log('✅ Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        log(`❌ Migration script failed: ${error.message}`);
        process.exit(1);
    });
