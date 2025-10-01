#!/usr/bin/env node

/**
 * Manual Graph Projection Worker Trigger Script
 * 
 * This script allows you to manually trigger the graph projection worker to process
 * a specific entity and generate 3D coordinates. It follows the normal decision logic
 * to choose between UMAP Learning and UMAP Transform modes.
 * 
 * Compatible with V11.0 Hybrid UMAP System:
 * - Uses normal decision logic (not forced UMAP learning)
 * - Automatically chooses between UMAP Learning and UMAP Transform
 * - Works with existing database entities
 * 
 * Usage:
 *   node scripts/trigger-graph-projection.js <entityId> [userId]
 * 
 * Examples:
 *   node scripts/trigger-graph-projection.js "5f4c1612-cb67-4729-9e56-f8186ba340de"
 *   node scripts/trigger-graph-projection.js "5f4c1612-cb67-4729-9e56-f8186ba340de" "user-456"
 * 
 * @version 1.0.0 - V11.0 Hybrid UMAP Compatible
 */

const { Queue } = require('bullmq');

async function triggerGraphProjection() {
  // Get entity ID from command line arguments
  const entityId = process.argv[2];
  const userId = process.argv[3] || 'dev-user-123'; // Default user ID if not provided
  
  if (!entityId) {
    console.error('❌ Error: Entity ID is required');
    console.log('');
    console.log('Usage: node scripts/trigger-graph-projection.js <entityId> [userId]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/trigger-graph-projection.js "5f4c1612-cb67-4729-9e56-f8186ba340de"');
    console.log('  node scripts/trigger-graph-projection.js "5f4c1612-cb67-4729-9e56-f8186ba340de" "user-456"');
    console.log('');
    console.log('This will add a job to the graph projection queue to process the specified entity.');
    console.log('The worker will automatically choose between UMAP Learning and UMAP Transform modes.');
    process.exit(1);
  }

  // Validate entity ID format (should be a UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(entityId)) {
    console.error('❌ Error: Entity ID must be a valid UUID');
    console.log(`   Provided: "${entityId}"`);
    console.log('   Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    process.exit(1);
  }

  console.log('🚀 Manual Graph Projection Worker Trigger');
  console.log('==========================================');
  console.log(`🆔 Entity ID: ${entityId}`);
  console.log(`👤 User ID: ${userId}`);
  console.log('');

  try {
    // Create connection to the graph projection queue
    const graphQueue = new Queue('graph-queue', {
      connection: {
        host: 'localhost',
        port: 6379
      }
    });

    // Create the job data for new entities created event
    const jobData = {
      type: 'new_entities_created',
      userId: userId,
      entities: [
        {
          id: entityId,
          type: 'Concept' // Default type, will be determined by the worker
        }
      ],
      source: 'manual_trigger',
      timestamp: new Date().toISOString(),
      manualTrigger: true // Flag to indicate this was manually triggered
    };

    console.log('📤 Adding graph projection job to queue...');
    console.log('Job data:', JSON.stringify(jobData, null, 2));

    // Add the job to the queue
    const job = await graphQueue.add('graph-projection', jobData, {
      removeOnComplete: 10,
      removeOnFail: 1000, // Keep failed jobs for longer inspection
      jobId: `manual-graph-${entityId}-${Date.now()}`, // Unique job ID
      attempts: 3, // Allow up to 3 retry attempts
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });

    console.log('');
    console.log('✅ Graph projection job added successfully!');
    console.log(`🆔 Job ID: ${job.id}`);
    console.log(`📊 Queue: graph-queue`);
    console.log('');

    // Close the queue connection
    await graphQueue.close();

    console.log('🔍 Next steps:');
    console.log('1. Check if graph projection worker is running:');
    console.log('   pm2 status | grep graph-projection-worker');
    console.log('');
    console.log('2. Monitor the job processing:');
    console.log('   pm2 logs graph-projection-worker --lines 50');
    console.log('');
    console.log('3. Look for these success messages:');
    console.log('   - [GraphProjectionWorker] Processing job <job-id>: new_entities_created');
    console.log('   - [GraphProjectionWorker] 🧠 Running UMAP Learning Phase (if learning)');
    console.log('   - [GraphProjectionWorker] 🔄 Running UMAP Transform Phase (if transform)');
    console.log('   - [GraphProjectionWorker] ✅ Successfully stored 3D coordinates');
    console.log('');
    console.log('4. Check the entity coordinates in the database:');
    console.log(`   docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT entity_id, position_x, position_y, position_z FROM concepts WHERE entity_id = '${entityId}';"`);
    console.log('');
    console.log('5. If the job fails, check the logs for error details:');
    console.log('   pm2 logs graph-projection-worker --lines 100 | grep -A 10 -B 10 "ERROR"');
    console.log('');
    console.log('6. To check job status in Redis:');
    console.log('   docker exec redis-2d1l redis-cli KEYS "bull:graph-queue:*"');
    console.log('');

    // Decision logic explanation
    console.log('🧠 Decision Logic:');
    console.log('The worker will automatically choose the projection mode based on:');
    console.log('• UMAP Learning: If no existing model, or too many changes, or model too old');
    console.log('• UMAP Transform: If recent model exists and small number of new entities');
    console.log('• The decision is made in generateProjectionWithHybridUMAP() method');
    console.log('');

  } catch (error) {
    console.error('❌ Error triggering graph projection job:', error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure Redis is running: docker ps | grep redis');
    console.log('2. Make sure graph projection worker is running: pm2 status | grep graph-projection-worker');
    console.log('3. Check Redis connection: docker exec redis-2d1l redis-cli ping');
    console.log('4. Verify entity exists in database:');
    console.log(`   docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT entity_id, title FROM concepts WHERE entity_id = '${entityId}';"`);
    process.exit(1);
  }
}

// Run the script
triggerGraphProjection();