/**
 * DerivedArtifactRepository.ts
 * V9.7 Repository for DerivedArtifact operations
 */

import type { Prisma } from '@2dots1line/database';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

export interface CreateDerivedArtifactData {
  user_id: string;
  cycle_id?: string; // For dashboard grouping
  type: string;
  title: string;
  content?: string;
  source_memory_unit_ids?: string[];
  source_concept_ids?: string[];
}

export interface UpdateDerivedArtifactData {
  title?: string;
  content?: string;
}

export class DerivedArtifactRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateDerivedArtifactData): Promise<any> {
    const artifact = await this.db.prisma.derived_artifacts.create({
      data: {
        entity_id: randomUUID(),
        user_id: data.user_id,
        cycle_id: data.cycle_id ?? null,
        type: data.type,
        title: data.title,
        content: data.content ?? null,
        source_memory_unit_ids: data.source_memory_unit_ids ?? [],
        source_concept_ids: data.source_concept_ids ?? [],
      },
    });
    return artifact;
  }

  async findById(entityId: string): Promise<any> {
    return this.db.prisma.derived_artifacts.findUnique({
      where: { entity_id: entityId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<any[]> {
    return this.db.prisma.derived_artifacts.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByType(userId: string, type: string, limit = 50): Promise<any[]> {
    return this.db.prisma.derived_artifacts.findMany({
      where: {
        user_id: userId,
        type: type,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySourceMemoryUnit(memoryUnitId: string): Promise<any[]> {
    return this.db.prisma.derived_artifacts.findMany({
      where: { source_memory_unit_ids: { has: memoryUnitId } },
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySourceConcept(conceptId: string): Promise<any[]> {
    return this.db.prisma.derived_artifacts.findMany({
      where: { source_concept_ids: { has: conceptId } },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(entityId: string, data: UpdateDerivedArtifactData): Promise<any> {
    return this.db.prisma.derived_artifacts.update({
      where: { entity_id: entityId },
      data,
    });
  }

  async delete(entityId: string): Promise<void> {
    await this.db.prisma.derived_artifacts.delete({
      where: { entity_id: entityId },
    });
  }

  async count(userId?: string, artifactType?: string): Promise<number> {
    return this.db.prisma.derived_artifacts.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(artifactType && { artifact_type: artifactType }),
      },
    });
  }
}