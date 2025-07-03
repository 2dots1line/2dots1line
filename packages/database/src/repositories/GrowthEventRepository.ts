/**
 * GrowthEventRepository.ts
 * V9.7 Repository for GrowthEvent operations
 */

import type { growth_events, Prisma } from '@2dots1line/database';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

export interface CreateGrowthEventData {
  user_id: string;
  entity_id: string;
  entity_type: string;
  dim_key: string;
  delta: number;
  source: string;
  details: any;
}

export interface GrowthDimensionData {
    key: string;
    name: string;
    score: number;
    eventCount: number;
    lastEventAt: Date | null;
}

export class GrowthEventRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateGrowthEventData): Promise<growth_events> {
    const event = await this.db.prisma.growth_events.create({
      data: {
        event_id: randomUUID(),
        ...data,
      },
    });
    return event;
  }

  async findById(eventId: string): Promise<growth_events | null> {
    return this.db.prisma.growth_events.findUnique({
      where: { event_id: eventId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<growth_events[]> {
    return this.db.prisma.growth_events.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByEntity(entityId: string, entityType: string): Promise<growth_events[]> {
    return this.db.prisma.growth_events.findMany({
      where: {
        entity_id: entityId,
        entity_type: entityType,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByDimension(userId: string, dimKey: string, limit = 50): Promise<growth_events[]> {
    return this.db.prisma.growth_events.findMany({
      where: {
        user_id: userId,
        dim_key: dimKey,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySource(userId: string, source: string, limit = 50): Promise<growth_events[]> {
    return this.db.prisma.growth_events.findMany({
      where: {
        user_id: userId,
        source,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async getGrowthSummaryByDimension(userId: string, dimKey: string): Promise<{
    total_delta: number;
    event_count: number;
    avg_delta: number;
  }> {
    const result = await this.db.prisma.growth_events.aggregate({
      where: {
        user_id: userId,
        dim_key: dimKey,
      },
      _sum: { delta: true },
      _count: { event_id: true },
      _avg: { delta: true },
    });

    return {
      total_delta: result._sum.delta || 0,
      event_count: result._count.event_id || 0,
      avg_delta: result._avg.delta || 0,
    };
  }

  async getRecentGrowthEvents(userId: string, days = 30, limit = 100): Promise<growth_events[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.db.prisma.growth_events.findMany({
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

  async count(userId?: string, dimKey?: string): Promise<number> {
    return this.db.prisma.growth_events.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(dimKey && { dim_key: dimKey }),
      },
    });
  }

  async delete(eventId: string): Promise<void> {
    await this.db.prisma.growth_events.delete({
      where: { event_id: eventId },
    });
  }
} 