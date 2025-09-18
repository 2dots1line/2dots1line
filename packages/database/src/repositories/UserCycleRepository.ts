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
  job_id?: string;
  cycle_start_date: Date;
  cycle_end_date: Date;
  cycle_type?: string;
  cycle_duration_days?: number;
  trigger_source?: string;
}

export interface UpdateUserCycleData {
  status?: string;
  completed_at?: Date;
  artifacts_created?: number;
  prompts_created?: number;
  concepts_merged?: number;
  relationships_created?: number;
  processing_duration_ms?: number;
  llm_tokens_used?: number;
  error_count?: number;
  validation_score?: number;
  insights_summary?: any;
  growth_metrics?: any;
  dashboard_ready?: boolean;
}

export class UserCycleRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateUserCycleData): Promise<any> {
    const cycleId = data.cycle_id || `cycle_${data.user_id}_${Date.now()}`;
    
    const cycle = await this.db.prisma.user_cycles.create({
      data: {
        cycle_id: cycleId,
        user_id: data.user_id,
        job_id: data.job_id ?? null,
        cycle_start_date: data.cycle_start_date,
        cycle_end_date: data.cycle_end_date,
        cycle_type: data.cycle_type ?? 'strategic_analysis',
        cycle_duration_days: data.cycle_duration_days ?? 2,
        trigger_source: data.trigger_source ?? 'scheduled',
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
    return this.db.prisma.user_cycles.findMany({
      where: { 
        user_id: userId,
        status: 'completed',
        dashboard_ready: true
      },
      take: limit,
      orderBy: { completed_at: 'desc' },
    });
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
    avg_processing_time: number;
    total_artifacts_created: number;
  }> {
    const cycles = await this.db.prisma.user_cycles.findMany({
      where: { user_id: userId },
      select: {
        status: true,
        processing_duration_ms: true,
        artifacts_created: true,
      },
    });

    const totalCycles = cycles.length;
    const completedCycles = cycles.filter(c => c.status === 'completed').length;
    const failedCycles = cycles.filter(c => c.status === 'failed').length;
    
    const completedWithDuration = cycles.filter(c => c.status === 'completed' && c.processing_duration_ms);
    const avgProcessingTime = completedWithDuration.length > 0 
      ? completedWithDuration.reduce((sum, c) => sum + (c.processing_duration_ms || 0), 0) / completedWithDuration.length
      : 0;

    const totalArtifacts = cycles.reduce((sum, c) => sum + (c.artifacts_created || 0), 0);

    return {
      total_cycles: totalCycles,
      completed_cycles: completedCycles,
      failed_cycles: failedCycles,
      avg_processing_time: avgProcessingTime,
      total_artifacts_created: totalArtifacts,
    };
  }
}
