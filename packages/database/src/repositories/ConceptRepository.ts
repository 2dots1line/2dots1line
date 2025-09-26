/**
 * ConceptRepository.ts
 * V9.7 Repository for Concept operations
 */

// Use any type for now since Prisma types are complex
type concepts = any;
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

export interface CreateConceptData {
  user_id: string;
  title: string;
  type: string;
  content?: string;
  importance_score?: number;
  community_id?: string;
}

export interface UpdateConceptData {
  title?: string;
  type?: string;
  content?: string;
  status?: string;
  importance_score?: number;
  community_id?: string;
  merged_into_entity_id?: string;
  updated_at?: Date;
}

export class ConceptRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateConceptData): Promise<concepts> {
    const concept = await this.db.prisma.concepts.create({
      data: {
        entity_id: randomUUID(),
        user_id: data.user_id,
        updated_at: new Date(),
        title: data.title,
        content: data.content,
        type: data.type,
        importance_score: data.importance_score,
        community_id: data.community_id || null,
      },
    });
    return concept;
  }

  /**
   * Find concept by ID - only returns active concepts
   */
  async findById(entityId: string): Promise<concepts | null> {
    return this.db.prisma.concepts.findUnique({
      where: { 
        entity_id: entityId,
        status: 'active'
      },
      include: {
        communities: true,
        concepts: true,
        other_concepts: true,
      },
    });
  }

  /**
   * Find concept by ID without status filtering - used for special cases like MergedConcepts
   */
  async findByIdUnfiltered(entityId: string): Promise<concepts | null> {
    return this.db.prisma.concepts.findUnique({
      where: { entity_id: entityId },
      include: {
        communities: true,
        concepts: true,
        other_concepts: true,
      },
    });
  }

  /**
   * Batch method for HybridRetrievalTool - find multiple concepts by IDs
   */
  async findByIds(entityIds: string[], userId: string): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
      where: {
        entity_id: { in: entityIds },
        user_id: userId,
        status: 'active',
      },
      include: {
        communities: true,
        concepts: true,
        other_concepts: true,
      },
      orderBy: { importance_score: 'desc' },
    });
  }

  async findByUserId(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
      where: {
        user_id: userId,
        status: 'active',
      },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
      include: {
        communities: true,
      },
    });
  }

  async findByType(
    userId: string,
    type: string,
    limit = 50
  ): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
      where: {
        user_id: userId,
        type,
        status: 'active',
      },
      take: limit,
      orderBy: { importance_score: 'desc' },
    });
  }

  async findByCommunity(communityId: string): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
      where: {
        community_id: communityId,
        status: 'active',
      },
      orderBy: { importance_score: 'desc' },
    });
  }

  async update(
    entityId: string,
    data: UpdateConceptData
  ): Promise<concepts> {
    return this.db.prisma.concepts.update({
      where: { entity_id: entityId },
      data,
    });
  }

  async mergeConcept(
    sourceConceptId: string,
    targetConceptId: string
  ): Promise<concepts> {
    return this.db.prisma.concepts.update({
      where: { entity_id: sourceConceptId },
      data: {
        status: 'merged',
        merged_into_entity_id: targetConceptId,
      },
    });
  }

  async archiveConcept(entityId: string): Promise<concepts> {
    return this.db.prisma.concepts.update({
      where: { entity_id: entityId },
      data: { status: 'archived' },
    });
  }

  async delete(entityId: string): Promise<void> {
    await this.db.prisma.concepts.delete({
      where: { entity_id: entityId },
    });
  }

  async findBySalienceRange(
    userId: string,
    minSalience: number,
    maxSalience: number,
    limit = 50
  ): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
      where: {
        user_id: userId,
        status: 'active',
        importance_score: {
          gte: minSalience,
          lte: maxSalience,
        },
      },
      take: limit,
      orderBy: { importance_score: 'desc' },
    });
  }

  async searchByName(
    userId: string,
    searchTerm: string,
    limit = 50
  ): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
      where: {
        user_id: userId,
        status: 'active',
        title: { contains: searchTerm, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { importance_score: 'desc' },
    });
  }

  async findMostSalient(userId: string, limit = 10): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
      where: {
        user_id: userId,
        status: 'active',
        importance_score: { not: null },
      },
      take: limit,
      orderBy: { importance_score: 'desc' },
    });
  }

  async count(userId?: string, status?: string): Promise<number> {
    return this.db.prisma.concepts.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(status && { status }),
      },
    });
  }

  async findRecentlyUpdated(
    userId: string,
    days = 7,
    limit = 50
  ): Promise<concepts[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.db.prisma.concepts.findMany({
      where: {
        user_id: userId,
        status: 'active',
        updated_at: {
          gte: dateThreshold,
        },
      },
      take: limit,
      orderBy: { updated_at: 'desc' },
    });
  }

}