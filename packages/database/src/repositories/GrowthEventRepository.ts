/**
 * GrowthEventRepository.ts
 * V9.7 Repository for GrowthEvent operations
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

// Use the correct type for growth_events
// If you need the type for a growth event record:
type GrowthEvent = Prisma.growth_eventsGetPayload<{}>;

export interface CreateGrowthEventData {
  user_id: string;
  related_memory_units: string[];
  related_concepts: string[];
  growth_dimensions: any;
  source: string;
  details: any;
  dimension_key: string;
  delta_value: number;
  rationale: string;
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

  async create(data: CreateGrowthEventData): Promise<GrowthEvent> {
    const event = await this.db.prisma.growth_events.create({
      data: {
        event_id: randomUUID(),
        ...data,
      },
    });
    return event;
  }

  async findById(eventId: string): Promise<GrowthEvent | null> {
    return this.db.prisma.growth_events.findUnique({
      where: { event_id: eventId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<GrowthEvent[]> {
    return this.db.prisma.growth_events.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByEntity(entityId: string, entityType: 'memory_unit' | 'concept'): Promise<GrowthEvent[]> {
    const whereClause: Prisma.growth_eventsWhereInput = {};
    if (entityType === 'memory_unit') {
      whereClause.related_memory_units = { has: entityId };
    } else {
      whereClause.related_concepts = { has: entityId };
    }
    return this.db.prisma.growth_events.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByDimension(userId: string, dimKey: string, limit = 50): Promise<GrowthEvent[]> {
    return this.db.prisma.growth_events.findMany({
      where: {
        user_id: userId,
        growth_dimensions: {
          path: ['$[*].dim_key'],
          array_contains: dimKey
        }
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySource(userId: string, source: string, limit = 50): Promise<GrowthEvent[]> {
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
    // The underlying schema has changed, and this aggregation is no longer possible in this form.
    // It requires processing the JSON field, which is not directly supported by Prisma aggregate.
    // This will require a more complex query or processing in the application layer.
    console.warn('getGrowthSummaryByDimension is not implemented yet due to schema changes');
    return {
      total_delta: 0,
      event_count: 0,
      avg_delta: 0,
    };
  }

  async getRecentGrowthEvents(userId: string, days = 30, limit = 100): Promise<GrowthEvent[]> {
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
    const where: Prisma.growth_eventsWhereInput = {};
    if (userId) {
      where.user_id = userId;
    }
    if (dimKey) {
      where.growth_dimensions = {
        path: ['$[*].dim_key'],
        array_contains: dimKey,
      };
    }
    return this.db.prisma.growth_events.count({
      where,
    });
  }

  async delete(eventId: string): Promise<void> {
    await this.db.prisma.growth_events.delete({
      where: { event_id: eventId },
    });
  }
}