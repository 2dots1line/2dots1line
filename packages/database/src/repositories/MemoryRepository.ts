/**
 * MemoryRepository.ts
 * V9.7 Repository for MemoryUnit operations
 */

import { MemoryUnit, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';

export interface CreateMemoryUnitData {
  user_id: string;
  title: string;
  content: string;
  creation_ts: Date;
  importance_score?: number;
  sentiment_score?: number;
  source_conversation_id?: string;
}

export interface UpdateMemoryUnitData {
  title?: string;
  content?: string;
  importance_score?: number;
  sentiment_score?: number;
}

export class MemoryRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateMemoryUnitData): Promise<MemoryUnit> {
    return this.db.prisma.memoryUnit.create({
      data,
    });
  }

  async findById(muid: string): Promise<MemoryUnit | null> {
    return this.db.prisma.memoryUnit.findUnique({
      where: { muid },
      include: {
        media_items: true,
        derived_artifacts_as_source: true,
        source_conversation: true,
      },
    });
  }

  /**
   * Batch method for HybridRetrievalTool - find multiple memory units by IDs
   */
  async findByIds(muids: string[], userId: string): Promise<MemoryUnit[]> {
    return this.db.prisma.memoryUnit.findMany({
      where: { 
        muid: { in: muids },
        user_id: userId 
      },
      include: {
        media_items: true,
        derived_artifacts_as_source: true,
        source_conversation: true,
      },
      orderBy: { creation_ts: 'desc' }
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<MemoryUnit[]> {
    return this.db.prisma.memoryUnit.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { creation_ts: 'desc' },
      include: {
        media_items: true,
      },
    });
  }

  async findByConversationId(conversationId: string): Promise<MemoryUnit[]> {
    return this.db.prisma.memoryUnit.findMany({
      where: { source_conversation_id: conversationId },
      orderBy: { creation_ts: 'asc' },
    });
  }

  async update(muid: string, data: UpdateMemoryUnitData): Promise<MemoryUnit> {
    return this.db.prisma.memoryUnit.update({
      where: { muid },
      data,
    });
  }

  async delete(muid: string): Promise<void> {
    await this.db.prisma.memoryUnit.delete({
      where: { muid },
    });
  }

  async findByImportanceRange(
    userId: string,
    minScore: number,
    maxScore: number,
    limit = 50
  ): Promise<MemoryUnit[]> {
    return this.db.prisma.memoryUnit.findMany({
      where: {
        user_id: userId,
        importance_score: {
          gte: minScore,
          lte: maxScore,
        },
      },
      take: limit,
      orderBy: { importance_score: 'desc' },
    });
  }

  async findRecentByUserId(userId: string, days = 30, limit = 50): Promise<MemoryUnit[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.db.prisma.memoryUnit.findMany({
      where: {
        user_id: userId,
        creation_ts: {
          gte: dateThreshold,
        },
      },
      take: limit,
      orderBy: { creation_ts: 'desc' },
    });
  }

  async searchByContent(userId: string, searchTerm: string, limit = 50): Promise<MemoryUnit[]> {
    return this.db.prisma.memoryUnit.findMany({
      where: {
        user_id: userId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { creation_ts: 'desc' },
    });
  }

  async count(userId?: string): Promise<number> {
    return this.db.prisma.memoryUnit.count({
      where: userId ? { user_id: userId } : undefined,
    });
  }

  async getAverageImportanceScore(userId: string): Promise<number> {
    const result = await this.db.prisma.memoryUnit.aggregate({
      where: { user_id: userId },
      _avg: { importance_score: true },
    });
    return result._avg.importance_score || 0;
  }
} 