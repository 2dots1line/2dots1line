#!/usr/bin/env node

/**
 * Test Plan A Fixes for Insight Worker
 * 
 * This script tests the comprehensive fixes applied to the insight worker:
 * 1. Schema validation improvements with detailed error reporting
 * 2. Enhanced error logging for debugging
 * 3. Neo4j relationship query fixes
 * 4. Clear failure reporting (no fallback logic)
 */

const { Queue } = require('bullmq');
const Redis = require('ioredis');

async function testPlanAFixes() {
  console.log('🧪 Testing Plan A Fixes for Insight Worker...\n');
  console.log('📋 Focus: Clear error reporting and debugging information\n');

  // Initialize Redis connection
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  });

  // Initialize insight queue
  const insightQueue = new Queue('insight-queue', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
    },
  });

  try {
    console.log('📋 Test 1: Adding insight job with enhanced error reporting...');
    
    // Add a test job
    const job = await insightQueue.add('strategic-cycle', {
      userId: 'dev-user-123',
      cycleId: `test-cycle-${Date.now()}`,
      cycleStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      cycleEndDate: new Date(),
      testMode: true
    }, {
      jobId: `test-plan-a-${Date.now()}`,
      priority: 1
    });

    console.log(`✅ Test job added with ID: ${job.id}`);
    console.log('⏳ Waiting for job processing...\n');

    // Wait for job completion
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while (attempts < maxAttempts) {
      const jobStatus = await job.getState();
      
      if (jobStatus === 'completed') {
        console.log('✅ Test job completed successfully!');
        const result = await job.returnvalue;
        console.log('📊 Job result:', JSON.stringify(result, null, 2));
        break;
      } else if (jobStatus === 'failed') {
        console.log('❌ Test job failed - this is expected during development!');
        const failedReason = await job.failedReason;
        console.log('🚨 Failure reason:', failedReason);
        console.log('📝 Check the logs above for detailed error analysis');
        console.log('🔍 Look for sections marked with 🔴 for validation errors');
        break;
      }
      
      console.log(`⏳ Job status: ${jobStatus} (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log('⏰ Test timed out - job may still be processing');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Cleanup
    await insightQueue.close();
    await redis.quit();
    console.log('\n🧹 Test cleanup completed');
  }
}

// Run the test
if (require.main === module) {
  testPlanAFixes().catch(console.error);
}

module.exports = { testPlanAFixes };
