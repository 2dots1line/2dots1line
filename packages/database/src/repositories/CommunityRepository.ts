import { DatabaseService } from '../DatabaseService';
import type { Prisma } from '@prisma/client';

export interface CreateCommunityData {
  community_id: string;
  user_id: string;
  name: string;
  description?: string | null;
  created_at?: Date;
  last_analyzed_ts?: Date | null;
}

export interface UpdateCommunityData {
  name?: string;
  description?: string | null;
  last_analyzed_ts?: Date | null;
}

export interface CommunityWithConcepts {
  community_id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: Date;
  last_analyzed_ts: Date | null;
  concepts: Array<{
    concept_id: string;
    name: string;
    description: string | null;
    type: string;
    status: string;
  }>;
}

export class CommunityRepository {
  constructor(private dbService: DatabaseService) {}

  /**
   * Create a new community
   */
  async create(data: CreateCommunityData): Promise<{
    community_id: string;
    user_id: string;
    name: string;
    description: string | null;
    created_at: Date;
    last_analyzed_ts: Date | null;
  }> {
    try {
      const community = await this.dbService.prisma.communities.create({
        data: {
          community_id: data.community_id,
          user_id: data.user_id,
          name: data.name,
          description: data.description,
          created_at: data.created_at || new Date(),
          last_analyzed_ts: data.last_analyzed_ts
        }
      });

      return community;
    } catch (error) {
      console.error('[CommunityRepository] Error creating community:', error);
      throw new Error(`Failed to create community: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing community
   */
  async update(communityId: string, data: UpdateCommunityData): Promise<{
    community_id: string;
    user_id: string;
    name: string;
    description: string | null;
    created_at: Date;
    last_analyzed_ts: Date | null;
  }> {
    try {
      const community = await this.dbService.prisma.communities.update({
        where: { community_id: communityId },
        data: {
          name: data.name,
          description: data.description,
          last_analyzed_ts: data.last_analyzed_ts
        }
      });

      return community;
    } catch (error) {
      console.error('[CommunityRepository] Error updating community:', error);
      throw new Error(`Failed to update community ${communityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get community by ID with associated concepts
   */
  async getByIdWithConcepts(communityId: string): Promise<CommunityWithConcepts | null> {
    try {
      const community = await this.dbService.prisma.communities.findUnique({
        where: { community_id: communityId },
        include: {
          concepts: {
            select: {
              concept_id: true,
              name: true,
              description: true,
              type: true,
              status: true
            }
          }
        }
      });

      return community;
    } catch (error) {
      console.error('[CommunityRepository] Error getting community with concepts:', error);
      throw new Error(`Failed to get community ${communityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all communities for a user
   */
  async getByUserId(userId: string): Promise<Array<{
    community_id: string;
    name: string;
    description: string | null;
    created_at: Date;
    last_analyzed_ts: Date | null;
  }>> {
    try {
      const communities = await this.dbService.prisma.communities.findMany({
        where: { user_id: userId },
        select: {
          community_id: true,
          name: true,
          description: true,
          created_at: true,
          last_analyzed_ts: true
        },
        orderBy: { created_at: 'desc' }
      });

      return communities;
    } catch (error) {
      console.error('[CommunityRepository] Error getting communities by user:', error);
      throw new Error(`Failed to get communities for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a community
   */
  async delete(communityId: string): Promise<void> {
    try {
      await this.dbService.prisma.communities.delete({
        where: { community_id: communityId }
      });
    } catch (error) {
      console.error('[CommunityRepository] Error deleting community:', error);
      throw new Error(`Failed to delete community ${communityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assign concepts to a community
   */
  async assignConceptsToCommunity(communityId: string, conceptIds: string[]): Promise<void> {
    try {
      // Update all concepts to reference this community
      await this.dbService.prisma.concepts.updateMany({
        where: {
          concept_id: { in: conceptIds }
        },
        data: {
          community_id: communityId
        }
      });

      console.log(`[CommunityRepository] Assigned ${conceptIds.length} concepts to community ${communityId}`);
    } catch (error) {
      console.error('[CommunityRepository] Error assigning concepts to community:', error);
      throw new Error(`Failed to assign concepts to community ${communityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove concepts from a community
   */
  async removeConceptsFromCommunity(conceptIds: string[]): Promise<void> {
    try {
      await this.dbService.prisma.concepts.updateMany({
        where: {
          concept_id: { in: conceptIds }
        },
        data: {
          community_id: null
        }
      });

      console.log(`[CommunityRepository] Removed ${conceptIds.length} concepts from their communities`);
    } catch (error) {
      console.error('[CommunityRepository] Error removing concepts from community:', error);
      throw new Error(`Failed to remove concepts from communities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
