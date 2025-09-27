#!/usr/bin/env node

const { DatabaseService } = require('../packages/database/dist/DatabaseService.js');

async function analyzeDuplicates() {
  console.log('🔍 [DuplicateAnalyzer] Analyzing Weaviate objects for duplicates...');
  
  try {
    const db = new DatabaseService();
    
    // Get all objects with their entity_id and vector status
    console.log('📊 [DuplicateAnalyzer] Fetching all objects from Weaviate...');
    const result = await db.weaviate
      .graphql
      .get()
      .withClassName('UserKnowledgeItem')
      .withFields('entity_id entity_type title content textContent sourceEntityId _additional { id vector }')
      .withLimit(10000)
      .do();
    
    const objects = result.data?.Get?.UserKnowledgeItem || [];
    
    console.log(`📈 [DuplicateAnalyzer] Found ${objects.length} total objects`);
    
    // Group by entity_id
    const entityGroups = {};
    objects.forEach(obj => {
      const entityId = obj.entity_id;
      if (!entityGroups[entityId]) {
        entityGroups[entityId] = [];
      }
      entityGroups[entityId].push({
        id: obj._additional.id,
        entity_id: obj.entity_id,
        entityType: obj.entity_type,
        textContent: obj.textContent || obj.content,
        sourceEntityId: obj.sourceEntityId,
        vectorLength: obj._additional?.vector?.length || 0
      });
    });
    
    // Find duplicates
    const duplicates = {};
    const uniqueEntities = {};
    
    Object.entries(entityGroups).forEach(([entityId, objects]) => {
      if (objects.length > 1) {
        duplicates[entityId] = objects;
      } else {
        uniqueEntities[entityId] = objects[0];
      }
    });
    
    console.log('\n📊 [DuplicateAnalyzer] Duplicate Analysis Results:');
    console.log('============================================================');
    
    console.log(`\n🔢 Overall Statistics:`);
    console.log(`   Total objects: ${objects.length}`);
    console.log(`   Unique entity_ids: ${Object.keys(entityGroups).length}`);
    console.log(`   Duplicated entity_ids: ${Object.keys(duplicates).length}`);
    console.log(`   Objects with duplicates: ${Object.values(duplicates).reduce((sum, group) => sum + group.length, 0)}`);
    
    if (Object.keys(duplicates).length > 0) {
      console.log(`\n🔍 Duplicate Details:`);
      
      let totalDuplicates = 0;
      let safeToRemove = 0;
      let needManualReview = 0;
      
      Object.entries(duplicates).forEach(([entityId, objects]) => {
        totalDuplicates += objects.length;
        
        // Check vector status
        const withVectors = objects.filter(obj => obj.vectorLength > 0);
        const withoutVectors = objects.filter(obj => obj.vectorLength === 0);
        
        console.log(`\n   📋 Entity ID: ${entityId}`);
        console.log(`      Total duplicates: ${objects.length}`);
        console.log(`      With vectors: ${withVectors.length}`);
        console.log(`      Without vectors: ${withoutVectors.length}`);
        
        // Determine if safe to remove
        if (withVectors.length === 1 && withoutVectors.length === objects.length - 1) {
          console.log(`      ✅ SAFE TO REMOVE: ${withoutVectors.length} objects without vectors`);
          safeToRemove += withoutVectors.length;
        } else if (withVectors.length > 1) {
          console.log(`      ⚠️  MANUAL REVIEW NEEDED: Multiple objects with vectors`);
          needManualReview += objects.length;
        } else if (withoutVectors.length === objects.length) {
          console.log(`      ⚠️  MANUAL REVIEW NEEDED: All duplicates lack vectors`);
          needManualReview += objects.length;
        }
        
        // Show details for each duplicate
        objects.forEach((obj, index) => {
          console.log(`         ${index + 1}. ID: ${obj.id} | Vector: ${obj.vectorLength}D | Type: ${obj.entityType}`);
        });
      });
      
      console.log(`\n📊 Summary:`);
      console.log(`   Total duplicate objects: ${totalDuplicates}`);
      console.log(`   Safe to remove (no vectors): ${safeToRemove}`);
      console.log(`   Need manual review: ${needManualReview}`);
      
      if (safeToRemove > 0) {
        console.log(`\n💡 Recommendation:`);
        console.log(`   You can safely remove ${safeToRemove} duplicate objects that have no vectors.`);
        console.log(`   This will clean up the database and reduce confusion.`);
      }
    } else {
      console.log(`\n✅ No duplicates found! All entity_ids are unique.`);
    }
    
    // No need to close - DatabaseService handles cleanup automatically
    
  } catch (error) {
    console.error('❌ [DuplicateAnalyzer] Error:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeDuplicates();
