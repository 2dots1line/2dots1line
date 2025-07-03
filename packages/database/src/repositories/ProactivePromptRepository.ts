/**
 * ProactivePromptRepository.ts
 * V9.7 Repository for ProactivePrompt operations
 */

import type { proactive_prompts, Prisma } from '@2dots1line/database';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

export interface CreateProactivePromptData {
  user_id: string;
  prompt_text: string;
  source_agent: string;
  metadata?: any;
}

export interface UpdateProactivePromptData {
  status?: string;
  metadata?: any;
}

export class ProactivePromptRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateProactivePromptData): Promise<proactive_prompts> {
    return this.db.prisma.proactive_prompts.create({
      data: {
        prompt_id: randomUUID(),
        ...data,
      },
    });
  }

  async findById(promptId: string): Promise<proactive_prompts | null> {
    return this.db.prisma.proactive_prompts.findUnique({
      where: { prompt_id: promptId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<proactive_prompts[]> {
    return this.db.prisma.proactive_prompts.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findPendingByUserId(userId: string, limit = 10): Promise<proactive_prompts[]> {
    return this.db.prisma.proactive_prompts.findMany({
      where: {
        user_id: userId,
        status: 'pending',
      },
      take: limit,
      orderBy: { created_at: 'asc' },
    });
  }

  async findByStatus(status: string, limit = 50): Promise<proactive_prompts[]> {
    return this.db.prisma.proactive_prompts.findMany({
      where: { status },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySourceAgent(userId: string, sourceAgent: string, limit = 50): Promise<proactive_prompts[]> {
    return this.db.prisma.proactive_prompts.findMany({
      where: {
        user_id: userId,
        source_agent: sourceAgent,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async update(promptId: string, data: UpdateProactivePromptData): Promise<proactive_prompts> {
    return this.db.prisma.proactive_prompts.update({
      where: { prompt_id: promptId },
      data,
    });
  }

  async markAsDelivered(promptId: string): Promise<proactive_prompts> {
    return this.db.prisma.proactive_prompts.update({
      where: { prompt_id: promptId },
      data: { status: 'delivered' },
    });
  }

  async markAsRead(promptId: string): Promise<proactive_prompts> {
    return this.db.prisma.proactive_prompts.update({
      where: { prompt_id: promptId },
      data: { status: 'read' },
    });
  }

  async markAsActioned(promptId: string): Promise<proactive_prompts> {
    return this.db.prisma.proactive_prompts.update({
      where: { prompt_id: promptId },
      data: { status: 'actioned' },
    });
  }

  async delete(promptId: string): Promise<void> {
    await this.db.prisma.proactive_prompts.delete({
      where: { prompt_id: promptId },
    });
  }

  async count(userId?: string, status?: string): Promise<number> {
    return this.db.prisma.proactive_prompts.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(status && { status }),
      },
    });
  }

  async getRecentPrompts(userId: string, days = 7, limit = 50): Promise<proactive_prompts[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.db.prisma.proactive_prompts.findMany({
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