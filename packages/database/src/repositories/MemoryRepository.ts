/**
 * MemoryRepository.ts
 * V9.7 Repository for MemoryUnit operations
 */

import type { Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

// Use any type for now since Prisma types are complex
type memory_units = any;

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
        entity_id: randomUUID(),
        created_at: new Date(), // Always set to current time
        updated_at: new Date(),
        ...data,
      },
    });
    return memoryUnit;
  }

  async findById(entityId: string): Promise<memory_units | null> {
    return this.db.prisma.memory_units.findUnique({
      where: { entity_id: entityId },
      include: {
        media_items: true,
        conversations: true,
      },
    });
  }

  /**
   * Batch method for HybridRetrievalTool - find multiple memory units by IDs
   */
  async findByIds(entityIds: string[], userId: string): Promise<memory_units[]> {
    return this.db.prisma.memory_units.findMany({
      where: {
        entity_id: { in: entityIds },
        user_id: userId 
      },
      include: {
        media_items: true,
        conversations: true,
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<memory_units[]> {
    return this.db.prisma.memory_units.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
      include: {
        media_items: true,
      },
    });
  }

  async findByConversationId(conversationId: string): Promise<memory_units[]> {
    return this.db.prisma.memory_units.findMany({
      where: { source_conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
    });
  }

  async update(entityId: string, data: UpdateMemoryUnitData): Promise<memory_units> {
    return this.db.prisma.memory_units.update({
      where: { entity_id: entityId },
      data,
    });
  }

  async delete(entityId: string): Promise<void> {
    await this.db.prisma.memory_units.delete({
      where: { entity_id: entityId },
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
        created_at: {
          gte: dateThreshold,
        },
      },
      take: limit,
      orderBy: { created_at: 'desc' },
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
      orderBy: { created_at: 'desc' },
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