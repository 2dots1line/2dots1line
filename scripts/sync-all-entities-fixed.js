/**
 * Sync all entities from PostgreSQL to Neo4j with proper property handling
 * This script ensures all entities are available in Neo4j for the GraphProjectionWorker
 */

// Load environment variables first
require('dotenv').config({ path: '.env' });

const { DatabaseService } = require('../packages/database/dist/DatabaseService');

/**
 * Clean properties to only include primitive types for Neo4j
 */
function cleanNeo4jProperties(properties) {
  const clean = {};
  
  for (const [key, value] of Object.entries(properties)) {
    // Skip id and userId as they're handled separately
    if (key === 'id' || key === 'userId') continue;
    
    // Only include primitive types
    if (value === null || value === undefined) {
      continue;
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (Array.isArray(value)) {
      // Convert arrays to strings for Neo4j
      clean[key] = JSON.stringify(value);
    } else if (typeof value === 'object') {
      // Convert objects to strings for Neo4j
      clean[key] = JSON.stringify(value);
    }
  }
  
  return clean;
}

/**
 * Create a node in Neo4j
 */
async function createNeo4jNode(neo4jClient, nodeType, properties) {
  if (!neo4jClient) {
    console.warn(`[SyncScript] Neo4j client not available, skipping node creation`);
    return;
  }

  const session = neo4jClient.session();
  
  try {
    // Clean properties to only include primitive types
    const cleanProperties = cleanNeo4jProperties(properties);
    
    const cypher = `
      MERGE (n:${nodeType} {id: $id, userId: $userId})
      SET n += $properties
      SET n.updatedAt = datetime()
      RETURN n
    `;
    
    const result = await session.run(cypher, {
      id: properties.id,
      userId: properties.userId,
      properties: cleanProperties
    });
    
    if (result.records.length > 0) {
      console.log(`[SyncScript] ✅ Created ${nodeType} node: ${properties.id}`);
      return true;
    } else {
      console.warn(`[SyncScript] ⚠️ Failed to create ${nodeType} node: ${properties.id}`);
      return false;
    }
    
  } catch (error) {
    console.error(`[SyncScript] ❌ Error creating ${nodeType} node:`, error.message);
    return false;
  } finally {
    await session.close();
  }
}

async function syncAllEntities() {
  console.log('[SyncScript] Starting sync of all entities from PostgreSQL to Neo4j...');
  
  try {
    // Initialize DatabaseService
    const dbService = DatabaseService.getInstance();
    const userId = 'dev-user-123';
    
    let totalSynced = 0;
    
    // 1. Sync MemoryUnits
    console.log('[SyncScript] Syncing MemoryUnits...');
    const memoryUnits = await dbService.prisma.memory_units.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${memoryUnits.length} MemoryUnits in PostgreSQL`);
    
    for (const memory of memoryUnits) {
      const success = await createNeo4jNode(dbService.neo4j, 'MemoryUnit', {
        id: memory.muid,
        userId: memory.user_id,
        title: memory.title,
        content: memory.content,
        importance_score: memory.importance_score,
        sentiment_score: memory.sentiment_score,
        creation_ts: memory.creation_ts.toISOString(),
        source_conversation_id: memory.source_conversation_id
      });
      if (success) totalSynced++;
    }
    
    // 2. Sync Concepts
    console.log('[SyncScript] Syncing Concepts...');
    const concepts = await dbService.prisma.concepts.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${concepts.length} Concepts in PostgreSQL`);
    
    for (const concept of concepts) {
      const success = await createNeo4jNode(dbService.neo4j, 'Concept', {
        id: concept.concept_id,
        userId: concept.user_id,
        name: concept.name,
        description: concept.description,
        type: concept.type,
        salience: concept.salience,
        status: concept.status,
        created_at: concept.created_at.toISOString(),
        community_id: concept.community_id
      });
      if (success) totalSynced++;
    }
    
    // 3. Sync DerivedArtifacts
    console.log('[SyncScript] Syncing DerivedArtifacts...');
    const derivedArtifacts = await dbService.prisma.derived_artifacts.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${derivedArtifacts.length} DerivedArtifacts in PostgreSQL`);
    
    for (const artifact of derivedArtifacts) {
      const success = await createNeo4jNode(dbService.neo4j, 'DerivedArtifact', {
        id: artifact.artifact_id,
        userId: artifact.user_id,
        title: artifact.title,
        content_narrative: artifact.content_narrative,
        artifact_type: artifact.artifact_type,
        created_at: artifact.created_at.toISOString()
      });
      if (success) totalSynced++;
    }
    
    // 4. Sync Communities
    console.log('[SyncScript] Syncing Communities...');
    const communities = await dbService.prisma.communities.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${communities.length} Communities in PostgreSQL`);
    
    for (const community of communities) {
      const success = await createNeo4jNode(dbService.neo4j, 'Community', {
        id: community.community_id,
        userId: community.user_id,
        name: community.name,
        description: community.description,
        community_type: community.community_type,
        created_at: community.created_at.toISOString(),
        last_analyzed_ts: community.last_analyzed_ts?.toISOString()
      });
      if (success) totalSynced++;
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
    console.log(`[SyncScript] Successfully synced: ${totalSynced} nodes`);
    
    console.log('[SyncScript] ✅ Sync completed successfully!');
    
  } catch (error) {
    console.error('[SyncScript] ❌ Sync failed:', error);
    throw error;
  }
}

// Run the sync
syncAllEntities().catch(console.error);
