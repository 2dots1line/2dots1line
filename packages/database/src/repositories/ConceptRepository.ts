/**
 * ConceptRepository.ts
 * V9.7 Repository for Concept operations
 */

import type { concepts } from '@2dots1line/database';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

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
  last_updated_ts?: Date;
}

export class ConceptRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateConceptData): Promise<concepts> {
    const concept = await this.db.prisma.concepts.create({
      data: {
        concept_id: randomUUID(),
        last_updated_ts: new Date(),
        ...data,
      },
    });
    return concept;
  }

  /**
   * Find concept by ID - only returns active concepts
   */
  async findById(conceptId: string): Promise<concepts | null> {
    return this.db.prisma.concepts.findUnique({
      where: { 
        concept_id: conceptId,
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
  async findByIdUnfiltered(conceptId: string): Promise<concepts | null> {
    return this.db.prisma.concepts.findUnique({
      where: { concept_id: conceptId },
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
  async findByIds(conceptIds: string[], userId: string): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
      where: {
        concept_id: { in: conceptIds },
        user_id: userId,
        status: 'active',
      },
      include: {
        communities: true,
        concepts: true,
        other_concepts: true,
      },
      orderBy: { salience: 'desc' },
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
      orderBy: { salience: 'desc' },
    });
  }

  async findByCommunity(communityId: string): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
      where: {
        community_id: communityId,
        status: 'active',
      },
      orderBy: { salience: 'desc' },
    });
  }

  async update(
    conceptId: string,
    data: UpdateConceptData
  ): Promise<concepts> {
    return this.db.prisma.concepts.update({
      where: { concept_id: conceptId },
      data,
    });
  }

  async mergeConcept(
    sourceConceptId: string,
    targetConceptId: string
  ): Promise<concepts> {
    return this.db.prisma.concepts.update({
      where: { concept_id: sourceConceptId },
      data: {
        status: 'merged',
        merged_into_concept_id: targetConceptId,
      },
    });
  }

  async archiveConcept(conceptId: string): Promise<concepts> {
    return this.db.prisma.concepts.update({
      where: { concept_id: conceptId },
      data: { status: 'archived' },
    });
  }

  async delete(conceptId: string): Promise<void> {
    await this.db.prisma.concepts.delete({
      where: { concept_id: conceptId },
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
        salience: {
          gte: minSalience,
          lte: maxSalience,
        },
      },
      take: limit,
      orderBy: { salience: 'desc' },
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
        name: { contains: searchTerm, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { salience: 'desc' },
    });
  }

  async findMostSalient(userId: string, limit = 10): Promise<concepts[]> {
    return this.db.prisma.concepts.findMany({
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
        last_updated_ts: {
          gte: dateThreshold,
        },
      },
      take: limit,
      orderBy: { last_updated_ts: 'desc' },
    });
  }

}