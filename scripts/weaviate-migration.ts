#!/usr/bin/env ts-node

import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import fs from 'fs';
import path from 'path';

// Configuration
const WEAVIATE_URL = 'http://localhost:8080';
const MIGRATION_LOG_FILE = './migration-weaviate.log';

// Logging function
function log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(MIGRATION_LOG_FILE, logMessage + '\n');
}

async function migrateWeaviate() {
    log('🔍 Starting Weaviate V11.0 Field Naming Standardization Migration');
    
    // Initialize Weaviate client
    const client: WeaviateClient = weaviate.client({
        scheme: 'http',
        host: 'localhost:8080',
    });

    try {
        // Step 1: Get current schema
        log('📋 Getting current Weaviate schema...');
        const schema = await client.schema.getter().do();
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

        await client.schema.classCreator().withClass(v2ClassDefinition).do();
        log('✅ Created UserKnowledgeItemV2 class');

        // Step 3: Get all objects from the original class
        log('📊 Fetching all objects from UserKnowledgeItem...');
        const allObjects = await client.data.getter()
            .withClassName('UserKnowledgeItem')
            .withLimit(10000) // Adjust based on your data size
            .do();

        log(`📦 Found ${allObjects.objects?.length || 0} objects to migrate`);

        // Step 4: Migrate data to new class
        if (allObjects.objects && allObjects.objects.length > 0) {
            log('🔄 Starting data migration...');
            
            let migratedCount = 0;
            let errorCount = 0;

            for (const obj of allObjects.objects) {
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
                    await client.data.creator()
                        .withClassName('UserKnowledgeItemV2')
                        .withProperties(newProperties)
                        .withId(obj.id) // Preserve original ID
                        .do();

                    migratedCount++;
                    
                    if (migratedCount % 100 === 0) {
                        log(`📈 Migrated ${migratedCount}/${allObjects.objects.length} objects`);
                    }

                } catch (error) {
                    errorCount++;
                    log(`❌ Error migrating object ${obj.id}: ${error}`);
                }
            }

            log(`✅ Data migration completed: ${migratedCount} successful, ${errorCount} errors`);
        }

        // Step 5: Verify migration
        log('🔍 Verifying migration...');
        const v2Objects = await client.data.getter()
            .withClassName('UserKnowledgeItemV2')
            .withLimit(5)
            .do();

        log(`✅ Verification: UserKnowledgeItemV2 has ${v2Objects.objects?.length || 0} sample objects`);

        // Step 6: Drop old class (commented out for safety - uncomment when ready)
        log('⚠️  Old UserKnowledgeItem class preserved for safety');
        log('💡 To complete migration, manually drop UserKnowledgeItem class and rename UserKnowledgeItemV2');
        
        // Uncomment these lines when ready to complete the migration:
        // log('🗑️  Dropping old UserKnowledgeItem class...');
        // await client.schema.classDeleter().withClassName('UserKnowledgeItem').do();
        // log('✅ Dropped old UserKnowledgeItem class');

        log('🎉 Weaviate migration completed successfully!');
        log('📋 Next steps:');
        log('   1. Verify data integrity in UserKnowledgeItemV2');
        log('   2. Update application code to use new field names');
        log('   3. Drop old UserKnowledgeItem class');
        log('   4. Rename UserKnowledgeItemV2 to UserKnowledgeItem');

    } catch (error) {
        log(`❌ Migration failed: ${error}`);
        throw error;
    }
}

// Run migration
if (require.main === module) {
    migrateWeaviate()
        .then(() => {
            log('✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            log(`❌ Migration script failed: ${error}`);
            process.exit(1);
        });
}

export { migrateWeaviate };
