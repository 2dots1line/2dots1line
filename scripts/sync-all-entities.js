/**
 * Sync all entities from PostgreSQL to Neo4j
 * This script ensures all entities are available in Neo4j for the GraphProjectionWorker
 */

// Load environment variables first
require('dotenv').config({ path: '.env' });

const { DatabaseService } = require('../packages/database/dist/DatabaseService');
const { Neo4jService } = require('../packages/database/dist/services/Neo4jService');

async function syncAllEntities() {
  console.log('[SyncScript] Starting sync of all entities from PostgreSQL to Neo4j...');
  
  try {
    // Initialize DatabaseService
    const dbService = DatabaseService.getInstance();
    const neo4jService = new Neo4jService(dbService);
    
    const userId = 'dev-user-123';
    
    // 1. Sync MemoryUnits
    console.log('[SyncScript] Syncing MemoryUnits...');
    const memoryUnits = await dbService.prisma.memory_units.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${memoryUnits.length} MemoryUnits in PostgreSQL`);
    
    for (const memory of memoryUnits) {
      try {
        await neo4jService.upsertKnowledgeEntity({
          id: memory.muid,
          userId: memory.user_id,
          type: 'MemoryUnit',
          properties: {
            title: memory.title,
            content: memory.content,
            importance_score: memory.importance_score,
            sentiment_score: memory.sentiment_score,
            creation_ts: memory.creation_ts,
            last_modified_ts: memory.last_modified_ts,
            source_conversation_id: memory.source_conversation_id
          }
        });
        console.log(`[SyncScript] ✅ Synced MemoryUnit: ${memory.muid}`);
      } catch (error) {
        console.error(`[SyncScript] ❌ Failed to sync MemoryUnit ${memory.muid}:`, error.message);
      }
    }
    
    // 2. Sync Concepts
    console.log('[SyncScript] Syncing Concepts...');
    const concepts = await dbService.prisma.concepts.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${concepts.length} Concepts in PostgreSQL`);
    
    for (const concept of concepts) {
      try {
        await neo4jService.upsertKnowledgeEntity({
          id: concept.concept_id,
          userId: concept.user_id,
          type: 'Concept',
          properties: {
            name: concept.name,
            description: concept.description,
            type: concept.type,
            salience: concept.salience,
            status: concept.status,
            created_at: concept.created_at,
            last_updated_ts: concept.last_updated_ts,
            community_id: concept.community_id
          }
        });
        console.log(`[SyncScript] ✅ Synced Concept: ${concept.concept_id}`);
      } catch (error) {
        console.error(`[SyncScript] ❌ Failed to sync Concept ${concept.concept_id}:`, error.message);
      }
    }
    
    // 3. Sync DerivedArtifacts
    console.log('[SyncScript] Syncing DerivedArtifacts...');
    const derivedArtifacts = await dbService.prisma.derived_artifacts.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${derivedArtifacts.length} DerivedArtifacts in PostgreSQL`);
    
    for (const artifact of derivedArtifacts) {
      try {
        await neo4jService.upsertKnowledgeEntity({
          id: artifact.artifact_id,
          userId: artifact.user_id,
          type: 'DerivedArtifact',
          properties: {
            title: artifact.title,
            content_narrative: artifact.content_narrative,
            artifact_type: artifact.artifact_type,
            source_memory_unit_ids: artifact.source_memory_unit_ids,
            source_concept_ids: artifact.source_concept_ids,
            created_at: artifact.created_at
          }
        });
        console.log(`[SyncScript] ✅ Synced DerivedArtifact: ${artifact.artifact_id}`);
      } catch (error) {
        console.error(`[SyncScript] ❌ Failed to sync DerivedArtifact ${artifact.artifact_id}:`, error.message);
      }
    }
    
    // 4. Sync Communities
    console.log('[SyncScript] Syncing Communities...');
    const communities = await dbService.prisma.communities.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${communities.length} Communities in PostgreSQL`);
    
    for (const community of communities) {
      try {
        await neo4jService.upsertKnowledgeEntity({
          id: community.community_id,
          userId: community.user_id,
          type: 'Community',
          properties: {
            name: community.name,
            description: community.description,
            community_type: community.community_type,
            created_at: community.created_at,
            last_analyzed_ts: community.last_analyzed_ts
          }
        });
        console.log(`[SyncScript] ✅ Synced Community: ${community.community_id}`);
      } catch (error) {
        console.error(`[SyncScript] ❌ Failed to sync Community ${community.community_id}:`, error.message);
      }
    }
    
    // 5. Verify sync
    console.log('[SyncScript] Verifying sync...');
    const neo4jNodeCount = await dbService.neo4j.run(
      "MATCH (n) WHERE n.userId = $userId RETURN count(n) as node_count",
      { userId }
    );
    
    const pgEntityCount = await dbService.prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM memory_units WHERE user_id = ${userId}) +
        (SELECT COUNT(*) FROM concepts WHERE user_id = ${userId}) +
        (SELECT COUNT(*) FROM derived_artifacts WHERE user_id = ${userId}) +
        (SELECT COUNT(*) FROM communities WHERE user_id = ${userId}) as total_count
    `;
    
    console.log(`[SyncScript] PostgreSQL entities: ${pgEntityCount[0].total_count}`);
    console.log(`[SyncScript] Neo4j nodes: ${neo4jNodeCount.records[0].get('node_count')}`);
    
    console.log('[SyncScript] ✅ Sync completed successfully!');
    
  } catch (error) {
    console.error('[SyncScript] ❌ Sync failed:', error);
    throw error;
  }
}

// Run the sync
syncAllEntities().catch(console.error);
