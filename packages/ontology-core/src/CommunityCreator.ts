import { CommunityRepository, DatabaseService } from '@2dots1line/database/dist';
import { randomUUID } from 'crypto';

export interface CommunityStructure {
  community_id: string;
  member_concept_ids: string[];
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
      name: community.theme,
      description: `Strategic importance: ${community.strategic_importance}/10. Members: ${community.member_concept_ids.length} concepts.`,
      created_at: new Date(),
      last_analyzed_ts: new Date()
    };

    // Actually create the community in the database
    const createdCommunity = await this.dbService.communityRepository.create(communityData);
    
    // Assign concepts to this community
    if (community.member_concept_ids.length > 0) {
      await this.dbService.communityRepository.assignConceptsToCommunity(
        createdCommunity.community_id, 
        community.member_concept_ids
      );
    }

    console.log(`[CommunityCreator] Created community: ${community.theme} with ID ${generatedCommunityId} and ${community.member_concept_ids.length} members`);
    return createdCommunity.community_id;
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
  async createNeo4jCommunity(community: any, memberConceptIds: string[], generatedCommunityId: string): Promise<void> {
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
        const memberRelationshipsCypher = `
          MATCH (c:Community {community_id: $communityId})
          MATCH (concept:Concept {id: $conceptId})
          CREATE (concept)-[r:MEMBER_OF {
            joined_at: datetime(),
            community_id: $communityId
          }]->(c)
          RETURN r
        `;

        for (const conceptId of memberConceptIds) {
          try {
            await session.run(memberRelationshipsCypher, {
              communityId: generatedCommunityId,
              conceptId
            });
            console.log(`[CommunityCreator] Created MEMBER_OF relationship: Concept ${conceptId} -> Community ${generatedCommunityId}`);
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
