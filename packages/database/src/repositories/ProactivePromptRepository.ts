/**
 * ProactivePromptRepository.ts
 * V9.7 Repository for ProactivePrompt operations
 */

// Use any type for now since Prisma types are complex
type proactive_prompts = any;
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

export interface CreateProactivePromptData {
  user_id: string;
  title?: string; // Add title field for proactive prompts
  cycle_id?: string; // For dashboard grouping
  content: string;
  type: string;
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
        entity_id: randomUUID(),
        user_id: data.user_id,
        title: data.title ?? null, // Add title field
        cycle_id: data.cycle_id ?? null,
        content: data.content,
        type: data.type,
        metadata: data.metadata ?? null,
      },
    });
  }

  async findById(entityId: string): Promise<proactive_prompts | null> {
    return this.db.prisma.proactive_prompts.findUnique({
      where: { entity_id: entityId },
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
        type: sourceAgent,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async update(entityId: string, data: UpdateProactivePromptData): Promise<proactive_prompts> {
    return this.db.prisma.proactive_prompts.update({
      where: { entity_id: entityId },
      data,
    });
  }

  async markAsDelivered(entityId: string): Promise<proactive_prompts> {
    return this.db.prisma.proactive_prompts.update({
      where: { entity_id: entityId },
      data: { status: 'delivered' },
    });
  }

  async markAsRead(entityId: string): Promise<proactive_prompts> {
    return this.db.prisma.proactive_prompts.update({
      where: { entity_id: entityId },
      data: { status: 'read' },
    });
  }

  async markAsActioned(entityId: string): Promise<proactive_prompts> {
    return this.db.prisma.proactive_prompts.update({
      where: { entity_id: entityId },
      data: { status: 'actioned' },
    });
  }

  async delete(entityId: string): Promise<void> {
    await this.db.prisma.proactive_prompts.delete({
      where: { entity_id: entityId },
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