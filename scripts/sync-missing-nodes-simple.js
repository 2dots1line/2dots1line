/**
 * Simple manual sync script to populate Neo4j with DerivedArtifact and Community nodes
 */

import { PrismaClient } from '@prisma/client';
import neo4j from 'neo4j-driver';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function syncMissingNodes() {
  console.log('[SyncScript] Starting manual sync of missing nodes...');
  
  try {
    // Initialize Prisma
    const prisma = new PrismaClient();
    
    // Initialize Neo4j
    const neo4jDriver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password123'
      )
    );
    
    const userId = 'dev-user-123';
    
    // 1. Sync DerivedArtifacts
    console.log('[SyncScript] Syncing DerivedArtifacts...');
    const derivedArtifacts = await prisma.derived_artifacts.findMany({
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
      
      const session = neo4jDriver.session();
      try {
        const result = await session.run(cypher, {
          artifactId: artifact.artifact_id,
          title: artifact.title,
          content: artifact.content_narrative,
          artifactType: artifact.artifact_type,
          userId: artifact.user_id,
          createdAt: artifact.created_at.toISOString()
        });
        
        console.log(`[SyncScript] ✅ Synced DerivedArtifact: ${artifact.artifact_id}`);
      } finally {
        await session.close();
      }
    }
    
    // 2. Sync Communities (if any exist)
    console.log('[SyncScript] Syncing Communities...');
    const communities = await prisma.communities.findMany({
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
      
      const session = neo4jDriver.session();
      try {
        const result = await session.run(cypher, {
          communityId: community.community_id,
          name: community.name,
          description: community.description,
          communityType: community.community_type,
          userId: community.user_id,
          createdAt: community.created_at.toISOString()
        });
        
        console.log(`[SyncScript] ✅ Synced Community: ${community.community_id}`);
      } finally {
        await session.close();
      }
    }
    
    // 3. Create some relationships between new nodes and existing ones
    console.log('[SyncScript] Creating relationships...');
    
    const session = neo4jDriver.session();
    try {
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
      
      const relationshipResult = await session.run(relationshipCypher, { userId });
      console.log(`[SyncScript] ✅ Created ${relationshipResult.records[0].get('relationships_created')} relationships`);
    } finally {
      await session.close();
    }
    
    console.log('[SyncScript] ✅ Manual sync completed successfully!');
    
    // Cleanup
    await prisma.$disconnect();
    await neo4jDriver.close();
    
  } catch (error) {
    console.error('[SyncScript] ❌ Error during sync:', error);
    throw error;
  }
}

// Run the sync
syncMissingNodes().catch(console.error); 