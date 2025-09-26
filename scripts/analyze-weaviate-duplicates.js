#!/usr/bin/env node

/**
 * Weaviate Duplicate Analysis Script
 * 
 * This script analyzes duplicate entries in Weaviate without making any changes.
 * It shows what would be deleted in a cleanup operation.
 */

const fetch = require('node-fetch');

const WEAVIATE_URL = 'http://127.0.0.1:8080';

async function makeGraphQLRequest(query) {
  const response = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

async function analyzeDuplicates() {
  console.log('🔍 Analyzing Weaviate duplicates...\n');
  
  const query = `
    {
      Get {
        UserKnowledgeItem(limit: 2000) {
          entity_id
          entity_type
          title
          created_at
          _additional {
            id
            vector
          }
        }
      }
    }
  `;

  const data = await makeGraphQLRequest(query);
  const entities = data.Get.UserKnowledgeItem;

  console.log(`📊 Total objects in Weaviate: ${entities.length}`);

  // Group by entity_id
  const grouped = entities.reduce((acc, entity) => {
    const entityId = entity.entity_id;
    if (!acc[entityId]) {
      acc[entityId] = [];
    }
    acc[entityId].push(entity);
    return acc;
  }, {});

  const uniqueEntities = Object.keys(grouped).length;
  console.log(`📊 Unique entities: ${uniqueEntities}`);

  // Find duplicates
  const duplicates = Object.entries(grouped)
    .filter(([entityId, entries]) => entries.length > 1)
    .map(([entityId, entries]) => ({
      entityId,
      entries: entries.map(entry => ({
        weaviateId: entry._additional.id,
        entityType: entry.entity_type,
        title: entry.title ? entry.title.substring(0, 50) + '...' : 'No title',
        createdAt: entry.created_at,
        vectorLength: entry._additional.vector ? entry._additional.vector.length : 0,
        hasVector: entry._additional.vector && entry._additional.vector.length === 768
      }))
    }));

  console.log(`📊 Entities with duplicates: ${duplicates.length}`);

  // Analyze cleanup impact
  let totalToDelete = 0;
  let totalToKeep = 0;
  let entitiesWithMultipleVectors = 0;

  console.log('\n📋 Detailed Analysis:\n');

  duplicates.forEach(({ entityId, entries }, index) => {
    const entriesWithVectors = entries.filter(entry => entry.hasVector);
    const entriesWithoutVectors = entries.filter(entry => !entry.hasVector);

    console.log(`${index + 1}. Entity: ${entityId}`);
    console.log(`   Type: ${entries[0].entityType}`);
    console.log(`   Title: ${entries[0].title}`);
    console.log(`   Total entries: ${entries.length}`);
    console.log(`   Entries with vectors: ${entriesWithVectors.length}`);
    console.log(`   Entries without vectors: ${entriesWithoutVectors.length}`);

    // Calculate what would be deleted
    let toDelete = entriesWithoutVectors.length;
    let toKeep = entriesWithVectors.length;

    if (entriesWithVectors.length > 1) {
      entitiesWithMultipleVectors++;
      toDelete += entriesWithVectors.length - 1; // Keep only the most recent
      toKeep = 1;
      console.log(`   ⚠️  Multiple entries with vectors - would keep most recent only`);
    }

    console.log(`   Would delete: ${toDelete} entries`);
    console.log(`   Would keep: ${toKeep} entries`);
    console.log('');

    totalToDelete += toDelete;
    totalToKeep += toKeep;
  });

  console.log('📊 Cleanup Impact Summary:');
  console.log(`   - Total entries to delete: ${totalToDelete}`);
  console.log(`   - Total entries to keep: ${totalToKeep}`);
  console.log(`   - Entities with multiple vector entries: ${entitiesWithMultipleVectors}`);
  console.log(`   - Net reduction: ${totalToDelete} entries`);

  // Show some examples of what would be deleted
  console.log('\n🔍 Examples of entries that would be deleted:');
  let exampleCount = 0;
  for (const { entityId, entries } of duplicates) {
    if (exampleCount >= 5) break;
    
    const entriesWithoutVectors = entries.filter(entry => !entry.hasVector);
    if (entriesWithoutVectors.length > 0) {
      console.log(`\n${exampleCount + 1}. Entity: ${entityId}`);
      entriesWithoutVectors.forEach(entry => {
        console.log(`   - Would delete: ${entry.weaviateId} (${entry.createdAt})`);
      });
      exampleCount++;
    }
  }

  return {
    totalObjects: entities.length,
    uniqueEntities,
    duplicateEntities: duplicates.length,
    totalToDelete,
    totalToKeep,
    entitiesWithMultipleVectors
  };
}

async function main() {
  try {
    const analysis = await analyzeDuplicates();
    
    console.log('\n✅ Analysis complete!');
    console.log('\nTo run the actual cleanup, use:');
    console.log('node scripts/cleanup-weaviate-duplicates.js');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { analyzeDuplicates };

