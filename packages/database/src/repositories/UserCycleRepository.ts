/**
 * UserCycleRepository.ts
 * V9.7 Repository for UserCycle operations
 */

import type { Prisma } from '@2dots1line/database';
import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

export interface CreateUserCycleData {
  cycle_id?: string; // Optional, will generate if not provided
  user_id: string;
  type?: string;
  created_at: Date;
  ended_at?: Date;
}

export interface UpdateUserCycleData {
  status?: string;
  completed_at?: Date;
  ended_at?: Date;
}

export class UserCycleRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateUserCycleData): Promise<any> {
    const cycleId = data.cycle_id || `cycle_${data.user_id}_${Date.now()}`;
    
    const cycle = await this.db.prisma.user_cycles.create({
      data: {
        cycle_id: cycleId,
        user_id: data.user_id,
        type: data.type ?? 'strategic_analysis',
        created_at: data.created_at,
        ended_at: data.ended_at,
      },
    });
    return cycle;
  }

  async findById(cycleId: string): Promise<any | null> {
    return this.db.prisma.user_cycles.findUnique({
      where: { cycle_id: cycleId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<any[]> {
    return this.db.prisma.user_cycles.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByStatus(status: string, limit = 100): Promise<any[]> {
    return this.db.prisma.user_cycles.findMany({
      where: { status },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findActiveCycles(userId: string): Promise<any[]> {
    return this.db.prisma.user_cycles.findMany({
      where: { 
        user_id: userId,
        status: { in: ['pending', 'processing'] }
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findCompletedCycles(userId: string, limit = 10): Promise<any[]> {
    // Use raw query to ensure proper NULL handling: order by ended_at DESC NULLS LAST, then created_at DESC
    // This ensures the most recently completed cycle (with latest ended_at) comes first
    // Prisma $queryRaw returns snake_case column names matching the database schema
    const cycles = await this.db.prisma.$queryRaw<Array<{
      cycle_id: string;
      user_id: string;
      created_at: Date;
      completed_at: Date | null;
      status: string;
      type: string;
      ended_at: Date | null;
    }>>`
      SELECT * FROM user_cycles
      WHERE user_id = ${userId}::text
        AND status = 'completed'
      ORDER BY ended_at DESC NULLS LAST, created_at DESC
      LIMIT ${limit}
    `;
    return cycles;
  }

  async update(cycleId: string, data: UpdateUserCycleData): Promise<any> {
    return this.db.prisma.user_cycles.update({
      where: { cycle_id: cycleId },
      data,
    });
  }

  async delete(cycleId: string): Promise<void> {
    await this.db.prisma.user_cycles.delete({
      where: { cycle_id: cycleId },
    });
  }

  async getCycleStats(userId: string): Promise<{
    total_cycles: number;
    completed_cycles: number;
    failed_cycles: number;
  }> {
    const cycles = await this.db.prisma.user_cycles.findMany({
      where: { user_id: userId },
      select: {
        status: true,
      },
    });

    const totalCycles = cycles.length;
    const completedCycles = cycles.filter((c: any) => c.status === 'completed').length;
    const failedCycles = cycles.filter((c: any) => c.status === 'failed').length;

    return {
      total_cycles: totalCycles,
      completed_cycles: completedCycles,
      failed_cycles: failedCycles,
    };
  }
}
