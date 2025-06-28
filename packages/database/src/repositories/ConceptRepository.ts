/**
 * ConceptRepository.ts
 * V9.7 Repository for Concept operations
 */

import { Concept, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';

export interface CreateConceptData {
  user_id: string;
  name: string;
  type: string;
  description?: string;
  salience?: number;
  community_id?: string;
}

export interface UpdateConceptData {
  name?: string;
  type?: string;
  description?: string;
  status?: string;
  salience?: number;
  community_id?: string;
  merged_into_concept_id?: string;
}

export class ConceptRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateConceptData): Promise<Concept> {
    return this.db.prisma.concept.create({
      data,
    });
  }

  async findById(conceptId: string): Promise<Concept | null> {
    return this.db.prisma.concept.findUnique({
      where: { concept_id: conceptId },
      include: {
        community: true,
        merged_into_concept: true,
        merged_from_concepts: true,
        derived_artifacts_as_source: true,
      },
    });
  }

  /**
   * Batch method for HybridRetrievalTool - find multiple concepts by IDs
   */
  async findByIds(conceptIds: string[], userId: string): Promise<Concept[]> {
    return this.db.prisma.concept.findMany({
      where: { 
        concept_id: { in: conceptIds },
        user_id: userId,
        status: 'active'
      },
      include: {
        community: true,
        merged_into_concept: true,
        merged_from_concepts: true,
        derived_artifacts_as_source: true,
      },
      orderBy: { salience: 'desc' }
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Concept[]> {
    return this.db.prisma.concept.findMany({
      where: { 
        user_id: userId,
        status: 'active',
      },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
      include: {
        community: true,
      },
    });
  }

  async findByNameAndType(userId: string, name: string, type: string): Promise<Concept | null> {
    return this.db.prisma.concept.findUnique({
      where: {
        user_id_name_type: {
          user_id: userId,
          name,
          type,
        },
      },
    });
  }

  async findByType(userId: string, type: string, limit = 50): Promise<Concept[]> {
    return this.db.prisma.concept.findMany({
      where: {
        user_id: userId,
        type,
        status: 'active',
      },
      take: limit,
      orderBy: { salience: 'desc' },
    });
  }

  async findByCommunity(communityId: string): Promise<Concept[]> {
    return this.db.prisma.concept.findMany({
      where: {
        community_id: communityId,
        status: 'active',
      },
      orderBy: { salience: 'desc' },
    });
  }

  async update(conceptId: string, data: UpdateConceptData): Promise<Concept> {
    return this.db.prisma.concept.update({
      where: { concept_id: conceptId },
      data,
    });
  }

  async mergeConcept(sourceConceptId: string, targetConceptId: string): Promise<Concept> {
    return this.db.prisma.concept.update({
      where: { concept_id: sourceConceptId },
      data: {
        status: 'merged',
        merged_into_concept_id: targetConceptId,
      },
    });
  }

  async archiveConcept(conceptId: string): Promise<Concept> {
    return this.db.prisma.concept.update({
      where: { concept_id: conceptId },
      data: { status: 'archived' },
    });
  }

  async delete(conceptId: string): Promise<void> {
    await this.db.prisma.concept.delete({
      where: { concept_id: conceptId },
    });
  }

  async findBySalienceRange(
    userId: string,
    minSalience: number,
    maxSalience: number,
    limit = 50
  ): Promise<Concept[]> {
    return this.db.prisma.concept.findMany({
      where: {
        user_id: userId,
        status: 'active',
        salience: {
          gte: minSalience,
          lte: maxSalience,
        },
      },
      take: limit,
      orderBy: { salience: 'desc' },
    });
  }

  async searchByName(userId: string, searchTerm: string, limit = 50): Promise<Concept[]> {
    return this.db.prisma.concept.findMany({
      where: {
        user_id: userId,
        status: 'active',
        name: { contains: searchTerm, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { salience: 'desc' },
    });
  }

  async findMostSalient(userId: string, limit = 10): Promise<Concept[]> {
    return this.db.prisma.concept.findMany({
      where: {
        user_id: userId,
        status: 'active',
        salience: { not: null },
      },
      take: limit,
      orderBy: { salience: 'desc' },
    });
  }

  async count(userId?: string, status?: string): Promise<number> {
    return this.db.prisma.concept.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(status && { status }),
      },
    });
  }

  async findRecentlyUpdated(userId: string, days = 7, limit = 50): Promise<Concept[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.db.prisma.concept.findMany({
      where: {
        user_id: userId,
        status: 'active',
        last_updated_ts: {
          gte: dateThreshold,
        },
      },
      take: limit,
      orderBy: { last_updated_ts: 'desc' },
    });
  }
} 