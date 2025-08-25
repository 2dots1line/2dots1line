#!/usr/bin/env node

/**
 * Test Script: Verify StrategicSynthesisTool Parsing Fix
 * 
 * This script triggers a new insight worker job to test if our parsing fix works.
 * It's a minimal test to verify the downstream processing now receives correct data.
 * 
 * Usage: node test-fixed-insight.js
 */

const Bull = require('bull');

// Configuration
const QUEUE_NAME = 'insight';
const REDIS_CONFIG = {
  host: 'localhost',
  port: 6379,
  db: 0
};
const USER_ID = 'dev-user-123';

async function main() {
  console.log('🧪 Test Script: Verifying StrategicSynthesisTool Parsing Fix\n');
  
  try {
    // Step 1: Create a test insight job
    console.log('📊 Step 1: Creating Test Insight Job...');
    const jobId = await triggerTestInsightJob();
    
    if (!jobId) {
      console.error('❌ Failed to create test job');
      return;
    }
    
    console.log(`✅ Test job created with ID: ${jobId}\n`);
    
    // Step 2: Monitor the job processing
    console.log('🔍 Step 2: Monitoring Job Processing...');
    console.log('   - Check PM2 logs: pm2 logs insight-worker');
    console.log('   - Look for our new debug logging');
    console.log('   - Verify parsing succeeds and downstream processing receives data\n');
    
    // Step 3: Instructions for verification
    console.log('📋 Step 3: Verification Steps...');
    console.log('   1. Monitor the insight worker logs:');
    console.log('      pm2 logs insight-worker --lines 50');
    console.log('   2. Look for these debug messages:');
    console.log('      - "Found begin marker variation" (if any)');
    console.log('      - "Extracted JSON string length: X"');
    console.log('      - "Validation successful. Parsed data: {...}"');
    console.log('      - "persistStrategicUpdates called for user dev-user-123"');
    console.log('      - "Updated PostgreSQL concepts for X merges"');
    console.log('   3. Check the database after completion:');
    console.log('      - Users table should show correct counts');
    console.log('      - Concepts table should show merged concepts');
    console.log('      - Memory profile should contain strategic insights\n');
    
    console.log('💡 Expected Outcome:');
    console.log('   - The LLM response should be parsed successfully');
    console.log('   - Downstream processing should receive rich data (not empty arrays)');
    console.log('   - Database should be updated with actual concept merges and insights');
    console.log('   - No more "0 concepts merged" issues\n');
    
    console.log('🎯 If the fix works:');
    console.log('   - We\'ll see successful parsing in the logs');
    console.log('   - The database will contain the actual insights from the LLM');
    console.log('   - Future insight worker runs will work correctly');
    console.log('   - We can then manually process job 8 data if needed\n');
    
  } catch (error) {
    console.error('❌ Test script execution failed:', error);
    process.exit(1);
  }
}

async function triggerTestInsightJob() {
  try {
    // Create queue connection
    const queue = new Bull(QUEUE_NAME, REDIS_CONFIG);
    
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add job to queue
    const job = await queue.add({
      userId: USER_ID,
      timestamp: new Date().toISOString()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    
    console.log(`   ✅ Job added to queue with ID: ${job.id}`);
    console.log(`   📊 Queue status: ${await queue.getJobCounts()}`);
    
    // Close connection
    await queue.close();
    
    return job.id;
    
  } catch (error) {
    console.error('   ❌ Failed to trigger insight job:', error.message);
    return null;
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, triggerTestInsightJob };

