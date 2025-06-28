/**
 * ProactivePromptRepository.ts
 * V9.7 Repository for ProactivePrompt operations
 */

import { ProactivePrompt, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';

export interface CreateProactivePromptData {
  user_id: string;
  prompt_text: string;
  source_agent: string;
  metadata?: Prisma.InputJsonValue;
}

export interface UpdateProactivePromptData {
  status?: string;
  metadata?: Prisma.InputJsonValue;
}

export class ProactivePromptRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateProactivePromptData): Promise<ProactivePrompt> {
    return this.db.prisma.proactivePrompt.create({
      data,
    });
  }

  async findById(promptId: string): Promise<ProactivePrompt | null> {
    return this.db.prisma.proactivePrompt.findUnique({
      where: { prompt_id: promptId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<ProactivePrompt[]> {
    return this.db.prisma.proactivePrompt.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findPendingByUserId(userId: string, limit = 10): Promise<ProactivePrompt[]> {
    return this.db.prisma.proactivePrompt.findMany({
      where: {
        user_id: userId,
        status: 'pending',
      },
      take: limit,
      orderBy: { created_at: 'asc' },
    });
  }

  async findByStatus(status: string, limit = 50): Promise<ProactivePrompt[]> {
    return this.db.prisma.proactivePrompt.findMany({
      where: { status },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySourceAgent(userId: string, sourceAgent: string, limit = 50): Promise<ProactivePrompt[]> {
    return this.db.prisma.proactivePrompt.findMany({
      where: {
        user_id: userId,
        source_agent: sourceAgent,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async update(promptId: string, data: UpdateProactivePromptData): Promise<ProactivePrompt> {
    return this.db.prisma.proactivePrompt.update({
      where: { prompt_id: promptId },
      data,
    });
  }

  async markAsDelivered(promptId: string): Promise<ProactivePrompt> {
    return this.db.prisma.proactivePrompt.update({
      where: { prompt_id: promptId },
      data: { status: 'delivered' },
    });
  }

  async markAsRead(promptId: string): Promise<ProactivePrompt> {
    return this.db.prisma.proactivePrompt.update({
      where: { prompt_id: promptId },
      data: { status: 'read' },
    });
  }

  async markAsActioned(promptId: string): Promise<ProactivePrompt> {
    return this.db.prisma.proactivePrompt.update({
      where: { prompt_id: promptId },
      data: { status: 'actioned' },
    });
  }

  async delete(promptId: string): Promise<void> {
    await this.db.prisma.proactivePrompt.delete({
      where: { prompt_id: promptId },
    });
  }

  async count(userId?: string, status?: string): Promise<number> {
    return this.db.prisma.proactivePrompt.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(status && { status }),
      },
    });
  }

  async getRecentPrompts(userId: string, days = 7, limit = 50): Promise<ProactivePrompt[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.db.prisma.proactivePrompt.findMany({
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
} 