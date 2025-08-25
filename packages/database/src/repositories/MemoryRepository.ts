/**
 * MemoryRepository.ts
 * V9.7 Repository for MemoryUnit operations
 */

import type { memory_units, Prisma } from '@2dots1line/database';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

export interface CreateMemoryUnitData {
  user_id: string;
  title: string;
  content: string;
  // creation_ts removed - will be set automatically to current time
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

  async create(data: CreateMemoryUnitData): Promise<memory_units> {
    const memoryUnit = await this.db.prisma.memory_units.create({
      data: {
        muid: randomUUID(),
        creation_ts: new Date(), // Always set to current time
        last_modified_ts: new Date(),
        ...data,
      },
    });
    return memoryUnit;
  }

  async findById(muid: string): Promise<memory_units | null> {
    return this.db.prisma.memory_units.findUnique({
      where: { muid },
      include: {
        media_items: true,
        conversations: true,
      },
    });
  }

  /**
   * Batch method for HybridRetrievalTool - find multiple memory units by IDs
   */
  async findByIds(muids: string[], userId: string): Promise<memory_units[]> {
    return this.db.prisma.memory_units.findMany({
      where: { 
        muid: { in: muids },
        user_id: userId 
      },
      include: {
        media_items: true,
        conversations: true,
      },
      orderBy: { creation_ts: 'desc' }
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<memory_units[]> {
    return this.db.prisma.memory_units.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { creation_ts: 'desc' },
      include: {
        media_items: true,
      },
    });
  }

  async findByConversationId(conversationId: string): Promise<memory_units[]> {
    return this.db.prisma.memory_units.findMany({
      where: { source_conversation_id: conversationId },
      orderBy: { creation_ts: 'asc' },
    });
  }

  async update(muid: string, data: UpdateMemoryUnitData): Promise<memory_units> {
    return this.db.prisma.memory_units.update({
      where: { muid },
      data,
    });
  }

  async delete(muid: string): Promise<void> {
    await this.db.prisma.memory_units.delete({
      where: { muid },
    });
  }

  async findByImportanceRange(
    userId: string,
    minScore: number,
    maxScore: number,
    limit = 50
  ): Promise<memory_units[]> {
    return this.db.prisma.memory_units.findMany({
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

  async findRecentByUserId(userId: string, days = 30, limit = 50): Promise<memory_units[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.db.prisma.memory_units.findMany({
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

  async searchByContent(userId: string, searchTerm: string, limit = 50): Promise<memory_units[]> {
    return this.db.prisma.memory_units.findMany({
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
    return this.db.prisma.memory_units.count({
      where: userId ? { user_id: userId } : undefined,
    });
  }

  async getAverageImportanceScore(userId: string): Promise<number> {
    const result = await this.db.prisma.memory_units.aggregate({
      where: { user_id: userId },
      _avg: { importance_score: true },
    });
    return result._avg.importance_score || 0;
  }
}