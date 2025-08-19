#!/usr/bin/env node

/**
 * Populate Weaviate with existing PostgreSQL memory units
 * This script syncs memory units from PostgreSQL to Weaviate for testing
 */

const { Pool } = require('pg');
const weaviate = require('weaviate-ts-client');
require('dotenv').config();

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Weaviate client
const weaviateClient = weaviate.client({
  scheme: process.env.WEAVIATE_SCHEME || 'http',
  host: process.env.WEAVIATE_HOST_DOCKER || 'localhost:8080',
});

async function populateWeaviate() {
  console.log('🔄 Starting Weaviate population...');
  
  try {
    // Get memory units from PostgreSQL
    console.log('📊 Fetching memory units from PostgreSQL...');
    const result = await pgPool.query(`
      SELECT muid, title, content, importance_score, user_id, created_at
      FROM memory_units 
      WHERE user_id = 'dev-user-123'
      ORDER BY importance_score DESC
    `);
    
    console.log(`📋 Found ${result.rows.length} memory units`);
    
    // Clear existing Weaviate data
    console.log('🧹 Clearing existing Weaviate data...');
    try {
      await weaviateClient.data.deleter()
        .withClassName('UserKnowledgeItem')
        .do();
      console.log('✅ Cleared existing data');
    } catch (e) {
      console.log('ℹ️ No existing data to clear');
    }
    
    // Populate Weaviate with memory units
    console.log('📝 Populating Weaviate...');
    for (const memoryUnit of result.rows) {
      const weaviateObject = {
        class: 'UserKnowledgeItem',
        properties: {
          externalId: memoryUnit.muid,
          userId: memoryUnit.user_id,
          title: memoryUnit.title,
          content: memoryUnit.content,
          importanceScore: memoryUnit.importance_score,
          createdAt: memoryUnit.created_at.toISOString(),
          sourceEntityType: 'memory_unit',
          sourceEntityId: memoryUnit.muid
        }
      };
      
      try {
        await weaviateClient.data.creator()
          .withClassName('UserKnowledgeItem')
          .withProperties(weaviateObject.properties)
          .do();
        console.log(`✅ Added: ${memoryUnit.title}`);
      } catch (e) {
        console.error(`❌ Failed to add ${memoryUnit.title}:`, e.message);
      }
    }
    
    // Verify population
    console.log('🔍 Verifying population...');
    const verifyResult = await weaviateClient.data.getter()
      .withClassName('UserKnowledgeItem')
      .withLimit(5)
      .do();
    
    console.log(`✅ Successfully populated ${verifyResult.data.length} objects in Weaviate`);
    
    // Show sample data
    if (verifyResult.data.length > 0) {
      console.log('📋 Sample data:');
      verifyResult.data.slice(0, 2).forEach(obj => {
        console.log(`  - ${obj.properties.title}: ${obj.properties.content?.substring(0, 50)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error populating Weaviate:', error);
  } finally {
    await pgPool.end();
  }
}

populateWeaviate(); 