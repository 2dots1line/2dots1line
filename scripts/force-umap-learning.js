#!/usr/bin/env node

/**
 * Force UMAP Learning Script
 * 
 * This script directly triggers UMAP Learning by calling the GraphProjectionWorker
 * without going through the queue system. This allows us to force UMAP Learning
 * even when the worker is running old code.
 */

const { GraphProjectionWorker } = require('../workers/graph-projection-worker/dist/GraphProjectionWorker');
const { databaseService } = require('../packages/database/dist/DatabaseService');

async function forceUMAPLearning() {
  console.log('🚀 Starting Force UMAP Learning...');
  
  try {
    // Create a GraphProjectionWorker instance with DatabaseService
    const worker = new GraphProjectionWorker(databaseService);
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Worker initialized');
    
    // Force UMAP Learning by calling the method directly with forceUMAPLearning = true
    const userId = 'dev-user-123';
    const entities = [{ id: 'force-umap-learning', type: 'Concept' }];
    
    console.log(`🧠 Forcing UMAP Learning for user: ${userId}`);
    console.log(`📊 Entities: ${entities.length}`);
    
    const result = await worker.generateProjectionWithHybridUMAP(userId, entities, true);
    
    console.log('✅ UMAP Learning completed successfully!');
    console.log(`📈 Projection method: ${result.projectionMethod}`);
    console.log(`🎯 Nodes processed: ${result.nodes.length}`);
    
    if (result.metadata) {
      console.log('📋 Metadata:', JSON.stringify(result.metadata, null, 2));
    }
    
    // Show some sample coordinates to verify they're not boundary clipped
    if (result.nodes.length > 0) {
      const sampleNode = result.nodes[0];
      console.log(`🎲 Sample coordinates: [${sampleNode.position.join(', ')}]`);
      
      // Check if coordinates are natural (not -50/-50/-50)
      const isNatural = sampleNode.position.every(coord => coord !== -50 && coord !== 50);
      console.log(`✨ Natural coordinates: ${isNatural ? 'YES' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error during UMAP Learning:', error);
    process.exit(1);
  }
  
  console.log('🎉 Force UMAP Learning script completed!');
  process.exit(0);
}

// Run the script
forceUMAPLearning().catch(console.error);
