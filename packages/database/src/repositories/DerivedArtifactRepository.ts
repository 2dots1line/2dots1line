/**
 * DerivedArtifactRepository.ts
 * V9.7 Repository for DerivedArtifact operations
 */

import type { derived_artifacts, Prisma } from '@2dots1line/database';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

export interface CreateDerivedArtifactData {
  user_id: string;
  artifact_type: string;
  title: string;
  content_narrative?: string;
  content_data?: any;
  source_memory_unit_ids?: string[];
  source_concept_ids?: string[];
}

export interface UpdateDerivedArtifactData {
  title?: string;
  content_narrative?: string;
  content_data?: any;
}

export class DerivedArtifactRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateDerivedArtifactData): Promise<derived_artifacts> {
    const artifact = await this.db.prisma.derived_artifacts.create({
      data: {
        artifact_id: randomUUID(),
        user_id: data.user_id,
        artifact_type: data.artifact_type,
        title: data.title,
        content_narrative: data.content_narrative ?? null,
        content_data: data.content_data ?? null,
        source_memory_unit_ids: data.source_memory_unit_ids ?? [],
        source_concept_ids: data.source_concept_ids ?? [],
      },
    });
    return artifact;
  }

  async findById(artifactId: string): Promise<derived_artifacts | null> {
    return this.db.prisma.derived_artifacts.findUnique({
      where: { artifact_id: artifactId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<derived_artifacts[]> {
    return this.db.prisma.derived_artifacts.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByType(userId: string, artifactType: string, limit = 50): Promise<derived_artifacts[]> {
    return this.db.prisma.derived_artifacts.findMany({
      where: {
        user_id: userId,
        artifact_type: artifactType,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySourceMemoryUnit(memoryUnitId: string): Promise<derived_artifacts[]> {
    return this.db.prisma.derived_artifacts.findMany({
      where: { source_memory_unit_ids: { has: memoryUnitId } },
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySourceConcept(conceptId: string): Promise<derived_artifacts[]> {
    return this.db.prisma.derived_artifacts.findMany({
      where: { source_concept_ids: { has: conceptId } },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(artifactId: string, data: UpdateDerivedArtifactData): Promise<derived_artifacts> {
    return this.db.prisma.derived_artifacts.update({
      where: { artifact_id: artifactId },
      data,
    });
  }

  async delete(artifactId: string): Promise<void> {
    await this.db.prisma.derived_artifacts.delete({
      where: { artifact_id: artifactId },
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