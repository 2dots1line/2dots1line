/**
 * InteractionLogRepository.ts
 * V9.7 Repository for InteractionLog operations
 */

import type { Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

// Use any type for now since Prisma types are complex
type interaction_logs = any;

export interface CreateInteractionLogData {
  user_id: string;
  type: string;
  target_entity_id?: string;
  target_entity_type?: string;
  content?: string;
  content_structured?: any;
  metadata?: any;
}

export class InteractionLogRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateInteractionLogData): Promise<interaction_logs> {
    return this.db.prisma.interaction_logs.create({
      data: {
        interaction_id: randomUUID(),
        ...data,
      },
    });
  }

  async findById(interactionId: string): Promise<interaction_logs | null> {
    return this.db.prisma.interaction_logs.findUnique({
      where: { interaction_id: interactionId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<interaction_logs[]> {
    return this.db.prisma.interaction_logs.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByInteractionType(userId: string, interactionType: string, limit = 50): Promise<interaction_logs[]> {
    return this.db.prisma.interaction_logs.findMany({
      where: {
        user_id: userId,
        type: interactionType,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByTargetEntity(targetEntityId: string, targetEntityType: string): Promise<interaction_logs[]> {
    return this.db.prisma.interaction_logs.findMany({
      where: {
        target_entity_id: targetEntityId,
        target_entity_type: targetEntityType,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findRecentByUserId(userId: string, hours = 24, limit = 100): Promise<interaction_logs[]> {
    const dateThreshold = new Date();
    dateThreshold.setHours(dateThreshold.getHours() - hours);

    return this.db.prisma.interaction_logs.findMany({
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

  async count(userId?: string, interactionType?: string): Promise<number> {
    return this.db.prisma.interaction_logs.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(interactionType && { type: interactionType }),
      },
    });
  }

  async delete(interactionId: string): Promise<void> {
    await this.db.prisma.interaction_logs.delete({
      where: { interaction_id: interactionId },
    });
  }

  async getInteractionStats(userId: string, days = 30): Promise<{
    total_interactions: number;
    interaction_types: Record<string, number>;
  }> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const interactions = await this.db.prisma.interaction_logs.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: dateThreshold,
        },
      },
      select: { type: true },
    });

    const interaction_types: Record<string, number> = {};
    interactions.forEach((interaction: any) => {
      interaction_types[interaction.type] = 
        (interaction_types[interaction.type] || 0) + 1;
    });

    return {
      total_interactions: interactions.length,
      interaction_types,
    };
  }
} 