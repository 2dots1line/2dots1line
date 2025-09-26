#!/usr/bin/env node

/**
 * Weaviate Duplicate Cleanup Script
 * 
 * This script cleans up duplicate entries in Weaviate that were created during
 * the database schema migration. It removes entries with empty vectors while
 * preserving entries with proper 768-dimensional vectors.
 * 
 * Strategy:
 * 1. Find all entities with multiple entries
 * 2. For each entity, keep entries with vectors (768-dim)
 * 3. Delete entries with empty vectors (0-dim)
 * 4. If multiple entries have vectors, keep the most recent one
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

async function deleteWeaviateObject(objectId) {
  const response = await fetch(`${WEAVIATE_URL}/v1/objects/${objectId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Delete request failed: ${response.status} ${response.statusText}`);
  }

  return true;
}

async function getDuplicateEntities() {
  console.log('🔍 Fetching all entities to identify duplicates...');
  
  const query = `
    {
      Get {
        UserKnowledgeItem(limit: 2000) {
          entity_id
          entity_type
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

  // Group by entity_id
  const grouped = entities.reduce((acc, entity) => {
    const entityId = entity.entity_id;
    if (!acc[entityId]) {
      acc[entityId] = [];
    }
    acc[entityId].push(entity);
    return acc;
  }, {});

  // Find duplicates
  const duplicates = Object.entries(grouped)
    .filter(([entityId, entries]) => entries.length > 1)
    .map(([entityId, entries]) => ({
      entityId,
      entries: entries.map(entry => ({
        weaviateId: entry._additional.id,
        entityType: entry.entity_type,
        createdAt: entry.created_at,
        vectorLength: entry._additional.vector ? entry._additional.vector.length : 0,
        hasVector: entry._additional.vector && entry._additional.vector.length === 768
      }))
    }));

  return duplicates;
}

async function cleanupDuplicates(duplicates) {
  console.log(`🧹 Found ${duplicates.length} entities with duplicates`);
  
  let totalDeleted = 0;
  let totalKept = 0;

  for (const { entityId, entries } of duplicates) {
    console.log(`\n📋 Processing entity: ${entityId}`);
    
    // Separate entries with and without vectors
    const entriesWithVectors = entries.filter(entry => entry.hasVector);
    const entriesWithoutVectors = entries.filter(entry => !entry.hasVector);

    console.log(`   - Entries with vectors: ${entriesWithVectors.length}`);
    console.log(`   - Entries without vectors: ${entriesWithoutVectors.length}`);

    // Delete all entries without vectors
    for (const entry of entriesWithoutVectors) {
      try {
        await deleteWeaviateObject(entry.weaviateId);
        console.log(`   ✅ Deleted empty vector entry: ${entry.weaviateId}`);
        totalDeleted++;
      } catch (error) {
        console.error(`   ❌ Failed to delete ${entry.weaviateId}:`, error.message);
      }
    }

    // If multiple entries have vectors, keep the most recent one
    if (entriesWithVectors.length > 1) {
      // Sort by created_at (most recent first)
      const sortedEntries = entriesWithVectors.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Keep the first (most recent), delete the rest
      const toKeep = sortedEntries[0];
      const toDelete = sortedEntries.slice(1);

      console.log(`   📅 Keeping most recent entry: ${toKeep.weaviateId} (${toKeep.createdAt})`);
      totalKept++;

      for (const entry of toDelete) {
        try {
          await deleteWeaviateObject(entry.weaviateId);
          console.log(`   ✅ Deleted older vector entry: ${entry.weaviateId}`);
          totalDeleted++;
        } catch (error) {
          console.error(`   ❌ Failed to delete ${entry.weaviateId}:`, error.message);
        }
      }
    } else if (entriesWithVectors.length === 1) {
      console.log(`   ✅ Keeping single vector entry: ${entriesWithVectors[0].weaviateId}`);
      totalKept++;
    }
  }

  return { totalDeleted, totalKept };
}

async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup...');
  
  const duplicates = await getDuplicateEntities();
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicates found - cleanup successful!');
  } else {
    console.log(`⚠️  Still found ${duplicates.length} entities with duplicates`);
    duplicates.forEach(({ entityId, entries }) => {
      console.log(`   - ${entityId}: ${entries.length} entries`);
    });
  }

  return duplicates.length === 0;
}

async function main() {
  try {
    console.log('🚀 Starting Weaviate duplicate cleanup...\n');

    // Get all duplicates
    const duplicates = await getDuplicateEntities();
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found - nothing to clean up!');
      return;
    }

    // Show summary before cleanup
    console.log('\n📊 Pre-cleanup summary:');
    duplicates.forEach(({ entityId, entries }) => {
      const withVectors = entries.filter(e => e.hasVector).length;
      const withoutVectors = entries.filter(e => !e.hasVector).length;
      console.log(`   - ${entityId}: ${entries.length} total (${withVectors} with vectors, ${withoutVectors} without)`);
    });

    // Ask for confirmation
    console.log(`\n⚠️  This will delete ${duplicates.reduce((sum, d) => sum + d.entries.filter(e => !e.hasVector).length, 0)} entries with empty vectors.`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Perform cleanup
    const { totalDeleted, totalKept } = await cleanupDuplicates(duplicates);

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   - Entries deleted: ${totalDeleted}`);
    console.log(`   - Entries kept: ${totalKept}`);

    // Verify cleanup
    const success = await verifyCleanup();
    
    if (success) {
      console.log('\n🎉 Cleanup completed successfully!');
    } else {
      console.log('\n⚠️  Cleanup completed with some issues. Please review the output above.');
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, getDuplicateEntities, cleanupDuplicates, verifyCleanup };