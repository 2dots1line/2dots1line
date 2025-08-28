const { Pool } = require('pg');

/**
 * Find Failed Conversations Script
 * 
 * This script helps identify conversations that may have failed ingestion processing
 * by finding conversations that are marked as 'ended' but don't have corresponding
 * memory units or concepts created.
 * 
 * Usage:
 *   node scripts/find-failed-conversations.js
 */

async function findFailedConversations() {
  console.log('🔍 Finding Failed Conversations');
  console.log('===============================');
  console.log('');

  // Database connection configuration
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: '2d1l_db',
    user: 'postgres',
    password: 'password'
  });

  try {
    // Query 1: Find conversations that ended but have no memory units
    console.log('📊 Checking for conversations without memory units...');
    const noMemoryUnitsQuery = `
      SELECT 
        c.id as conversation_id,
        c.user_id,
        c.status,
        c.created_at,
        c.updated_at,
        'No memory units created' as issue
      FROM conversations c
      WHERE c.status = 'ended'
      AND c.id NOT IN (
        SELECT DISTINCT conversation_id 
        FROM memory_units 
        WHERE conversation_id IS NOT NULL
      )
      ORDER BY c.created_at DESC
      LIMIT 20;
    `;

    const noMemoryUnitsResult = await pool.query(noMemoryUnitsQuery);
    
    if (noMemoryUnitsResult.rows.length > 0) {
      console.log(`❌ Found ${noMemoryUnitsResult.rows.length} conversations without memory units:`);
      console.log('');
      noMemoryUnitsResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.conversation_id}`);
        console.log(`   User: ${row.user_id}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Issue: ${row.issue}`);
        console.log('');
      });
    } else {
      console.log('✅ All ended conversations have memory units');
    }

    // Query 2: Find conversations that ended but have no concepts
    console.log('📊 Checking for conversations without concepts...');
    const noConceptsQuery = `
      SELECT 
        c.id as conversation_id,
        c.user_id,
        c.status,
        c.created_at,
        c.updated_at,
        'No concepts created' as issue
      FROM conversations c
      WHERE c.status = 'ended'
      AND c.id NOT IN (
        SELECT DISTINCT conversation_id 
        FROM concepts 
        WHERE conversation_id IS NOT NULL
      )
      ORDER BY c.created_at DESC
      LIMIT 20;
    `;

    const noConceptsResult = await pool.query(noConceptsQuery);
    
    if (noConceptsResult.rows.length > 0) {
      console.log(`❌ Found ${noConceptsResult.rows.length} conversations without concepts:`);
      console.log('');
      noConceptsResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.conversation_id}`);
        console.log(`   User: ${row.user_id}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Issue: ${row.issue}`);
        console.log('');
      });
    } else {
      console.log('✅ All ended conversations have concepts');
    }

    // Query 3: Get recent conversation statistics
    console.log('📊 Recent conversation statistics...');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations,
        COUNT(CASE WHEN status = 'ended' THEN 1 END) as ended_conversations,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_conversations
      FROM conversations
      WHERE created_at >= NOW() - INTERVAL '7 days';
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log(`📈 Last 7 days:`);
    console.log(`   Total conversations: ${stats.total_conversations}`);
    console.log(`   Active: ${stats.active_conversations}`);
    console.log(`   Ended: ${stats.ended_conversations}`);
    console.log(`   Processed: ${stats.processed_conversations}`);
    console.log('');

    // Query 4: Find conversations with partial processing
    console.log('📊 Checking for partially processed conversations...');
    const partialProcessingQuery = `
      SELECT 
        c.id as conversation_id,
        c.user_id,
        c.created_at,
        COUNT(mu.id) as memory_units_count,
        COUNT(con.id) as concepts_count,
        CASE 
          WHEN COUNT(mu.id) = 0 AND COUNT(con.id) = 0 THEN 'No entities created'
          WHEN COUNT(mu.id) > 0 AND COUNT(con.id) = 0 THEN 'Only memory units created'
          WHEN COUNT(mu.id) = 0 AND COUNT(con.id) > 0 THEN 'Only concepts created'
          ELSE 'Partially processed'
        END as processing_status
      FROM conversations c
      LEFT JOIN memory_units mu ON c.id = mu.conversation_id
      LEFT JOIN concepts con ON c.id = con.conversation_id
      WHERE c.status = 'ended'
      GROUP BY c.id, c.user_id, c.created_at
      HAVING COUNT(mu.id) = 0 OR COUNT(con.id) = 0
      ORDER BY c.created_at DESC
      LIMIT 10;
    `;

    const partialResult = await pool.query(partialProcessingQuery);
    
    if (partialResult.rows.length > 0) {
      console.log(`⚠️  Found ${partialResult.rows.length} conversations with partial processing:`);
      console.log('');
      partialResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.conversation_id}`);
        console.log(`   User: ${row.user_id}`);
        console.log(`   Memory Units: ${row.memory_units_count}`);
        console.log(`   Concepts: ${row.concepts_count}`);
        console.log(`   Status: ${row.processing_status}`);
        console.log('');
      });
    } else {
      console.log('✅ No partially processed conversations found');
    }

    console.log('🎯 Next Steps:');
    console.log('');
    console.log('To reprocess a failed conversation, use:');
    console.log('  node scripts/trigger-ingestion.js "<conversation-id>"');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/trigger-ingestion.js "db5e7751-e6e2-473d-95b8-058a0414eb80"');
    console.log('');
    console.log('To monitor the reprocessing:');
    console.log('  pm2 logs ingestion-worker --lines 50');

  } catch (error) {
    console.error('❌ Error querying database:', error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running: docker ps | grep postgres');
    console.log('2. Check database connection: docker exec postgres-2d1l psql -U postgres -d 2d1l_db -c "SELECT 1;"');
  } finally {
    await pool.end();
  }
}

// Run the script
findFailedConversations();
