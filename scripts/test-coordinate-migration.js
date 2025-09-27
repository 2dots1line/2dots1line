#!/usr/bin/env node

/**
 * Test 3D Coordinates Migration Script
 * V11.0 Cosmos - Test migration with a small subset of entities
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

// Configuration
const DIMENSION_REDUCER_URL = 'http://localhost:8000';
const WEAVIATE_URL = 'http://localhost:8080';
const TEST_LIMIT = 5; // Test with only 5 entities
const USER_ID = 'dev-user-123';

class TestCoordinateMigration {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async run() {
    console.log('🧪 Testing 3D Coordinates Migration...');
    console.log(`📊 Target User: ${USER_ID}`);
    console.log(`🔧 Dimension Reducer: ${DIMENSION_REDUCER_URL}`);
    console.log(`🔍 Weaviate: ${WEAVIATE_URL}`);
    console.log(`📦 Test Limit: ${TEST_LIMIT} entities`);
    console.log('');

    try {
      // Step 1: Test database connection
      await this.testDatabaseConnection();
      
      // Step 2: Test Weaviate connection
      await this.testWeaviateConnection();
      
      // Step 3: Test dimension reducer connection
      await this.testDimensionReducerConnection();
      
      // Step 4: Test with a small batch
      await this.testSmallBatch();
      
      console.log('✅ All tests passed! Ready for full migration.');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    
    const count = await this.prisma.concepts.count({
      where: { user_id: USER_ID }
    });
    
    console.log(`  ✅ Database connected. Found ${count} concepts for user ${USER_ID}`);
  }

  async testWeaviateConnection() {
    console.log('🔍 Testing Weaviate connection...');
    
    const response = await axios.get(`${WEAVIATE_URL}/v1/schema`);
    
    if (response.data && response.data.classes) {
      const classNames = response.data.classes.map(c => c.class);
      console.log(`  ✅ Weaviate connected. Classes: ${classNames.join(', ')}`);
    } else {
      throw new Error('Invalid Weaviate response');
    }
  }

  async testDimensionReducerConnection() {
    console.log('🔍 Testing dimension reducer connection...');
    
    const response = await axios.get(`${DIMENSION_REDUCER_URL}/`);
    
    if (response.data) {
      console.log(`  ✅ Dimension reducer connected. Available endpoints: ${Object.keys(response.data).join(', ')}`);
    } else {
      throw new Error('Invalid dimension reducer response');
    }
  }

  async testSmallBatch() {
    console.log('🔍 Testing small batch processing...');
    
    // Get a small batch of concepts
    const concepts = await this.prisma.concepts.findMany({
      where: {
        user_id: USER_ID,
        position_x: null
      },
      take: TEST_LIMIT,
      select: {
        entity_id: true,
        title: true,
        content: true
      }
    });

    if (concepts.length === 0) {
      console.log('  ⚠️  No concepts without coordinates found');
      return;
    }

    console.log(`  📦 Testing with ${concepts.length} concepts`);

    // Test getting embeddings from Weaviate
    const embeddings = [];
    for (const concept of concepts) {
      try {
        const response = await axios.get(`${WEAVIATE_URL}/v1/objects`, {
          params: {
            class: 'UserKnowledgeItem',
            where: JSON.stringify({
              path: ['sourceEntityId'],
              operator: 'Equal',
              valueString: concept.entity_id
            }),
            limit: 1
          }
        });

        if (response.data && response.data.objects && response.data.objects.length > 0) {
          const weaviateObject = response.data.objects[0];
          
          // Get the vector
          const vectorResponse = await axios.get(`${WEAVIATE_URL}/v1/objects/${weaviateObject.id}`, {
            params: {
              include: 'vector'
            }
          });

          if (vectorResponse.data && vectorResponse.data.vector) {
            embeddings.push({
              entityId: concept.entity_id,
              embedding: vectorResponse.data.vector
            });
          }
        }
      } catch (error) {
        console.log(`    ⚠️  No embedding found for concept ${concept.entity_id}`);
      }
    }

    console.log(`  📊 Found ${embeddings.length} embeddings`);

    if (embeddings.length === 0) {
      console.log('  ⚠️  No embeddings found, skipping coordinate generation test');
      return;
    }

    // Test coordinate generation
    const vectors = embeddings.map(e => e.embedding);
    
    const response = await axios.post(`${DIMENSION_REDUCER_URL}/reduce`, {
      vectors,
      method: 'hybrid_umap',
      target_dimensions: 3,
      min_dist: 0.8,
      spread: 3.0,
      use_linear_transformation: true
    });

    if (response.data && response.data.coordinates) {
      const coordinates = response.data.coordinates;
      console.log(`  ✅ Generated ${coordinates.length} 3D coordinates`);
      
      // Show sample coordinates
      coordinates.slice(0, 3).forEach((coord, index) => {
        console.log(`    📍 Entity ${index + 1}: (${coord[0].toFixed(3)}, ${coord[1].toFixed(3)}, ${coord[2].toFixed(3)})`);
      });
    } else {
      throw new Error('No coordinates returned from dimension reducer');
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new TestCoordinateMigration();
  test.run().catch(console.error);
}

module.exports = TestCoordinateMigration;
