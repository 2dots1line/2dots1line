/**
 * GrowthEventRepository.ts
 * V9.7 Repository for GrowthEvent operations
 */
import { GrowthEvent, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
export interface CreateGrowthEventData {
    user_id: string;
    entity_id: string;
    entity_type: string;
    dim_key: string;
    delta: number;
    source: string;
    details: Prisma.InputJsonValue;
}
export interface GrowthDimensionData {
    key: string;
    name: string;
    score: number;
    eventCount: number;
    lastEventAt: Date | null;
}
export declare class GrowthEventRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateGrowthEventData): Promise<GrowthEvent>;
    findById(eventId: string): Promise<GrowthEvent | null>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<GrowthEvent[]>;
    findByEntity(entityId: string, entityType: string): Promise<GrowthEvent[]>;
    findByDimension(userId: string, dimKey: string, limit?: number): Promise<GrowthEvent[]>;
    findBySource(userId: string, source: string, limit?: number): Promise<GrowthEvent[]>;
    getGrowthSummaryByDimension(userId: string, dimKey: string): Promise<{
        total_delta: number;
        event_count: number;
        avg_delta: number;
    }>;
    getRecentGrowthEvents(userId: string, days?: number, limit?: number): Promise<GrowthEvent[]>;
    count(userId?: string, dimKey?: string): Promise<number>;
    delete(eventId: string): Promise<void>;
}
//# sourceMappingURL=GrowthEventRepository.d.ts.map