/**
 * Manual sync script to populate Neo4j with DerivedArtifact and Community nodes
 * This is for testing the updated GraphProjectionWorker that supports all 4 node types
 */

import { DatabaseService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';

async function syncMissingNodes() {
  console.log('[SyncScript] Starting manual sync of missing nodes...');
  
  try {
    // Load environment
    environmentLoader.load();
    
    // Initialize database service
    const dbService = DatabaseService.getInstance();
    
    const userId = 'dev-user-123';
    
    // 1. Sync DerivedArtifacts
    console.log('[SyncScript] Syncing DerivedArtifacts...');
    const derivedArtifacts = await dbService.prisma.derived_artifacts.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${derivedArtifacts.length} DerivedArtifacts in PostgreSQL`);
    
    for (const artifact of derivedArtifacts) {
      const cypher = `
        MERGE (n:DerivedArtifact {artifact_id: $artifactId})
        SET n.title = $title,
            n.content_narrative = $content,
            n.artifact_type = $artifactType,
            n.userId = $userId,
            n.created_at = datetime($createdAt),
            n.updated_at = datetime()
        RETURN n.artifact_id as id
      `;
      
      const result = await dbService.neo4j.run(cypher, {
        artifactId: artifact.artifact_id,
        title: artifact.title,
        content: artifact.content_narrative,
        artifactType: artifact.artifact_type,
        userId: artifact.user_id,
        createdAt: artifact.created_at.toISOString()
      });
      
      console.log(`[SyncScript] ✅ Synced DerivedArtifact: ${artifact.artifact_id}`);
    }
    
    // 2. Sync Communities (if any exist)
    console.log('[SyncScript] Syncing Communities...');
    const communities = await dbService.prisma.communities.findMany({
      where: { user_id: userId }
    });
    
    console.log(`[SyncScript] Found ${communities.length} Communities in PostgreSQL`);
    
    for (const community of communities) {
      const cypher = `
        MERGE (n:Community {community_id: $communityId})
        SET n.name = $name,
            n.description = $description,
            n.community_type = $communityType,
            n.userId = $userId,
            n.created_at = datetime($createdAt),
            n.updated_at = datetime()
        RETURN n.community_id as id
      `;
      
      const result = await dbService.neo4j.run(cypher, {
        communityId: community.community_id,
        name: community.name,
        description: community.description,
        communityType: community.community_type,
        userId: community.user_id,
        createdAt: community.created_at.toISOString()
      });
      
      console.log(`[SyncScript] ✅ Synced Community: ${community.community_id}`);
    }
    
    // 3. Create some relationships between new nodes and existing ones
    console.log('[SyncScript] Creating relationships...');
    
    // Connect DerivedArtifacts to related Concepts
    const relationshipCypher = `
      MATCH (artifact:DerivedArtifact {userId: $userId})
      MATCH (concept:Concept {userId: $userId})
      WHERE artifact.artifact_type = 'insight' OR artifact.artifact_type = 'analysis'
      WITH artifact, concept
      LIMIT 10
      MERGE (artifact)-[:RELATED_TO]->(concept)
      RETURN count(*) as relationships_created
    `;
    
    const relationshipResult = await dbService.neo4j.run(relationshipCypher, { userId });
    console.log(`[SyncScript] ✅ Created ${relationshipResult.records[0].get('relationships_created')} relationships`);
    
    console.log('[SyncScript] ✅ Manual sync completed successfully!');
    
  } catch (error) {
    console.error('[SyncScript] ❌ Error during sync:', error);
    throw error;
  }
}

// Run the sync
syncMissingNodes().catch(console.error); 