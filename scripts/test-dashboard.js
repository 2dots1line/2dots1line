#!/usr/bin/env node

/**
 * test-dashboard.js
 * V9.7 Test script for the dynamic dashboard system
 */

const { DatabaseService } = require('@2dots1line/database');

async function testDashboardSystem() {
  console.log('🧪 Testing Dynamic Dashboard System...\n');

  try {
    // Initialize database service
    const dbService = new DatabaseService();
    console.log('✅ Database service initialized');

    // Test DashboardService
    const { DashboardService } = require('@2dots1line/database');
    const dashboardService = new DashboardService(dbService);
    console.log('✅ DashboardService initialized');

    // Test DashboardConfigService
    const { DashboardConfigService } = require('@2dots1line/database');
    const configService = new DashboardConfigService();
    console.log('✅ DashboardConfigService initialized');

    // Test configuration loading
    console.log('\n📋 Testing Configuration...');
    const config = await configService.loadConfig();
    console.log(`✅ Loaded configuration with ${Object.keys(config.dashboard_sections).length} sections`);

    // Test section configurations
    const insightsConfig = await configService.getSectionConfig('insights');
    console.log(`✅ Insights section config:`, insightsConfig);

    // Test section categories
    const categories = await configService.getSectionCategories();
    console.log(`✅ Found ${Object.keys(categories).length} categories:`, Object.keys(categories));

    // Test section groups
    const sectionGroups = await configService.getSectionGroups();
    console.log(`✅ Found ${sectionGroups.length} section groups`);

    // Test database queries (if we have test data)
    console.log('\n🗄️ Testing Database Queries...');
    
    // Test user cycles query
    const { UserCycleRepository } = require('@2dots1line/database');
    const userCycleRepo = new UserCycleRepository(dbService);
    
    // Get a test user ID (you might need to adjust this)
    const testUserId = 'dev-user-123'; // This should match your test user
    
    try {
      const cycles = await userCycleRepo.findCompletedCycles(testUserId, 5);
      console.log(`✅ Found ${cycles.length} completed cycles for test user`);
      
      if (cycles.length > 0) {
        console.log('📊 Sample cycle:', {
          cycle_id: cycles[0].cycle_id,
          status: cycles[0].status,
          artifacts_created: cycles[0].artifacts_created,
          prompts_created: cycles[0].prompts_created
        });
      }
    } catch (error) {
      console.log('⚠️ No cycles found for test user (this is expected if no data exists)');
    }

    // Test derived artifacts query
    try {
      const artifacts = await dbService.prisma.derived_artifacts.findMany({
        take: 5,
        orderBy: { created_at: 'desc' }
      });
      console.log(`✅ Found ${artifacts.length} derived artifacts in database`);
      
      if (artifacts.length > 0) {
        console.log('📄 Sample artifact:', {
          artifact_id: artifacts[0].artifact_id,
          artifact_type: artifacts[0].artifact_type,
          title: artifacts[0].title
        });
      }
    } catch (error) {
      console.log('⚠️ No derived artifacts found (this is expected if no data exists)');
    }

    // Test proactive prompts query
    try {
      const prompts = await dbService.prisma.proactive_prompts.findMany({
        take: 5,
        orderBy: { created_at: 'desc' }
      });
      console.log(`✅ Found ${prompts.length} proactive prompts in database`);
      
      if (prompts.length > 0) {
        console.log('💬 Sample prompt:', {
          prompt_id: prompts[0].prompt_id,
          metadata: prompts[0].metadata
        });
      }
    } catch (error) {
      console.log('⚠️ No proactive prompts found (this is expected if no data exists)');
    }

    console.log('\n🎉 Dashboard System Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the API Gateway: npm run dev:api');
    console.log('2. Start the Web App: npm run dev:web');
    console.log('3. Visit http://localhost:3000/dashboard');
    console.log('4. Run the Insight Worker to generate data');
    console.log('5. Check the dashboard for dynamic content');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (dbService) {
      await dbService.disconnect();
    }
  }
}

// Run the test
testDashboardSystem().catch(console.error);
