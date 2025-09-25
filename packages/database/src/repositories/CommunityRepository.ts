import { DatabaseService } from '../DatabaseService';
import type { Prisma } from '@prisma/client';

export interface CreateCommunityData {
  community_id: string;
  user_id: string;
  title: string;
  content?: string | null;
  created_at?: Date;
  updated_at?: Date | null;
}

export interface UpdateCommunityData {
  title?: string;
  content?: string | null;
  updated_at?: Date | null;
}

export interface CommunityWithConcepts {
  entity_id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: Date;
  updated_at: Date | null;
  concepts: Array<{
    entity_id: string;
    title: string;
    content: string | null;
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
    entity_id: string;
    user_id: string;
    title: string;
    content: string | null;
    created_at: Date;
    updated_at: Date | null;
  }> {
    try {
      const community = await this.dbService.prisma.communities.create({
        data: {
          entity_id: data.community_id,
          user_id: data.user_id,
          title: data.title,
          content: data.content,
          created_at: data.created_at || new Date(),
          updated_at: data.updated_at
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
  async update(entityId: string, data: UpdateCommunityData): Promise<{
    entity_id: string;
    user_id: string;
    title: string;
    content: string | null;
    created_at: Date;
    updated_at: Date | null;
  }> {
    try {
      const community = await this.dbService.prisma.communities.update({
        where: { entity_id: entityId },
        data: {
          title: data.title,
          content: data.content,
          updated_at: data.updated_at
        }
      });

      return community;
    } catch (error) {
      console.error('[CommunityRepository] Error updating community:', error);
      throw new Error(`Failed to update community ${entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get community by ID with associated concepts
   */
  async getByIdWithConcepts(communityId: string): Promise<CommunityWithConcepts | null> {
    try {
      const community = await this.dbService.prisma.communities.findUnique({
        where: { entity_id: communityId },
        include: {
          concepts: {
            select: {
               entity_id: true,
               title: true,
               content: true,
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
    entity_id: string;
    title: string;
    content: string | null;
    created_at: Date;
    updated_at: Date | null;
  }>> {
    try {
      const communities = await this.dbService.prisma.communities.findMany({
        where: { user_id: userId },
        select: {
          entity_id: true,
          title: true,
          content: true,
          created_at: true,
          updated_at: true
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
  async delete(entityId: string): Promise<void> {
    try {
      await this.dbService.prisma.communities.delete({
        where: { entity_id: entityId }
      });
    } catch (error) {
      console.error('[CommunityRepository] Error deleting community:', error);
      throw new Error(`Failed to delete community ${entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          entity_id: { in: conceptIds }
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
          entity_id: { in: conceptIds }
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
