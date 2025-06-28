/**
 * InteractionLogRepository.ts
 * V9.7 Repository for InteractionLog operations
 */

import { InteractionLog, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';

export interface CreateInteractionLogData {
  user_id: string;
  interaction_type: string;
  target_entity_id?: string;
  target_entity_type?: string;
  content_text?: string;
  content_structured?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}

export class InteractionLogRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateInteractionLogData): Promise<InteractionLog> {
    return this.db.prisma.interactionLog.create({
      data,
    });
  }

  async findById(interactionId: string): Promise<InteractionLog | null> {
    return this.db.prisma.interactionLog.findUnique({
      where: { interaction_id: interactionId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<InteractionLog[]> {
    return this.db.prisma.interactionLog.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByInteractionType(userId: string, interactionType: string, limit = 50): Promise<InteractionLog[]> {
    return this.db.prisma.interactionLog.findMany({
      where: {
        user_id: userId,
        interaction_type: interactionType,
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByTargetEntity(targetEntityId: string, targetEntityType: string): Promise<InteractionLog[]> {
    return this.db.prisma.interactionLog.findMany({
      where: {
        target_entity_id: targetEntityId,
        target_entity_type: targetEntityType,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findRecentByUserId(userId: string, hours = 24, limit = 100): Promise<InteractionLog[]> {
    const dateThreshold = new Date();
    dateThreshold.setHours(dateThreshold.getHours() - hours);

    return this.db.prisma.interactionLog.findMany({
      where: {
        user_id: userId,
        timestamp: {
          gte: dateThreshold,
        },
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
  }

  async count(userId?: string, interactionType?: string): Promise<number> {
    return this.db.prisma.interactionLog.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(interactionType && { interaction_type: interactionType }),
      },
    });
  }

  async delete(interactionId: string): Promise<void> {
    await this.db.prisma.interactionLog.delete({
      where: { interaction_id: interactionId },
    });
  }

  async getInteractionStats(userId: string, days = 30): Promise<{
    total_interactions: number;
    interaction_types: Record<string, number>;
  }> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const interactions = await this.db.prisma.interactionLog.findMany({
      where: {
        user_id: userId,
        timestamp: {
          gte: dateThreshold,
        },
      },
      select: { interaction_type: true },
    });

    const interaction_types: Record<string, number> = {};
    interactions.forEach(interaction => {
      interaction_types[interaction.interaction_type] = 
        (interaction_types[interaction.interaction_type] || 0) + 1;
    });

    return {
      total_interactions: interactions.length,
      interaction_types,
    };
  }
} 