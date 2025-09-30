import { CommunityRepository, DatabaseService } from '@2dots1line/database/dist';
import { RelationshipUtils } from '@2dots1line/core-utils';
import { randomUUID } from 'crypto';

export interface CommunityStructure {
  community_id: string;
  member_entity_ids: string[];
  theme: string;
  strategic_importance: number;
}

export class CommunityCreator {
  constructor(
    private communityRepository: CommunityRepository,
    private dbService: DatabaseService
  ) {}

  /**
   * Create a single community
   */
  async executeCommunityCreation(community: CommunityStructure, userId: string): Promise<string> {
    // Generate UUID instead of using semantic ID from LLM
    const generatedCommunityId = randomUUID();
    
    // Create community in PostgreSQL using the repository
    const communityData = {
      community_id: generatedCommunityId,
      user_id: userId,
      title: community.theme,
      content: `Strategic importance: ${community.strategic_importance}/10. Members: ${community.member_entity_ids.length} concepts.`,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Actually create the community in the database
    const createdCommunity = await this.dbService.communityRepository.create(communityData);
    
    // Assign concepts to this community
    if (community.member_entity_ids.length > 0) {
      await this.dbService.communityRepository.assignConceptsToCommunity(
        createdCommunity.entity_id, 
        community.member_entity_ids
      );
    }

    console.log(`[CommunityCreator] Created community: ${community.theme} with ID ${generatedCommunityId} and ${community.member_entity_ids.length} members`);
    return createdCommunity.entity_id;
  }

  /**
   * Create multiple communities
   */
  async executeCommunityCreations(communities: CommunityStructure[], userId: string): Promise<string[]> {
    const communityIds: string[] = [];
    
    try {
      for (const community of communities) {
        const communityId = await this.executeCommunityCreation(community, userId);
        communityIds.push(communityId);
      }
    } catch (error: unknown) {
      console.error('[CommunityCreator] Error creating communities:', error);
      throw error;
    }
    
    return communityIds;
  }

  /**
   * Create Community node in Neo4j with member concept relationships
   */
  async createNeo4jCommunity(community: any, memberConceptIds: string[], generatedCommunityId: string, userId: string): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[CommunityCreator] Neo4j client not available, skipping community creation');
      return;
    }

    const session = this.dbService.neo4j.session();
    
    try {
      // Create Community node
      const createCommunityCypher = `
        CREATE (c:Community {
          community_id: $communityId,
          name: $name,
          description: $description,
          userId: $userId,
          created_at: datetime(),
          last_analyzed_ts: datetime(),
          strategic_importance: $strategicImportance
        })
        RETURN c.community_id as communityId
      `;

      const communityResult = await session.run(createCommunityCypher, {
        communityId: generatedCommunityId, // Use the generated UUID
        name: community.name,
        description: community.description,
        userId: community.user_id,
        strategicImportance: community.strategic_importance || 5
      });

      if (communityResult.records.length === 0) {
        throw new Error(`Failed to create Community node for ${generatedCommunityId}`);
      }

      console.log(`[CommunityCreator] Created Community node in Neo4j: ${generatedCommunityId}`);

      // Create MEMBER_OF relationships with concepts
      if (memberConceptIds.length > 0) {
        for (const conceptId of memberConceptIds) {
          try {
            // Generate complete relationship properties
            // Use community's strategic importance to derive relationship strength
            // Strategic importance is 1-10, convert to 0.0-1.0 scale
            const derivedStrength = Math.min(1.0, Math.max(0.1, community.strategic_importance / 10));
            
            const relationshipProps = RelationshipUtils.createRelationshipProps(
              'MEMBER_OF',
              'community-creator',
              userId,
              { 
                strength: derivedStrength, // Derived from community's strategic importance
                description: `Member of community: ${community.theme}` 
              }
            );
            
            const memberRelationshipsCypher = `
              MATCH (c:Community {community_id: $communityId})
              MATCH (concept:Concept {id: $conceptId})
              CREATE (concept)-[r:MEMBER_OF {
                relationship_id: $relationshipId,
                relationship_type: $relationshipType,
                created_at: $createdAt,
                user_id: $userId,
                source_agent: $sourceAgent,
                strength: $strength,
                description: $description,
                joined_at: datetime(),
                community_id: $communityId
              }]->(c)
              RETURN r
            `;

            await session.run(memberRelationshipsCypher, {
              communityId: generatedCommunityId,
              conceptId,
              relationshipId: relationshipProps.relationship_id,
              relationshipType: relationshipProps.relationship_type,
              createdAt: relationshipProps.created_at,
              userId: relationshipProps.user_id,
              sourceAgent: relationshipProps.source_agent,
              strength: relationshipProps.strength,
              description: relationshipProps.description
            });
            console.log(`[CommunityCreator] Created MEMBER_OF relationship: Concept ${conceptId} -> Community ${generatedCommunityId} (ID: ${relationshipProps.relationship_id})`);
          } catch (error) {
            console.error(`[CommunityCreator] Error creating MEMBER_OF relationship for concept ${conceptId}:`, error);
            // Continue with other concepts even if one fails
          }
        }
      }

      console.log(`[CommunityCreator] Successfully created Neo4j Community ${generatedCommunityId} with ${memberConceptIds.length} member concepts`);

    } catch (error: unknown) {
      console.error(`[CommunityCreator] Error creating Neo4j Community ${generatedCommunityId}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
}
