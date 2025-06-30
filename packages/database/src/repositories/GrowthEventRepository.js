"use strict";
/**
 * GrowthEventRepository.ts
 * V9.7 Repository for GrowthEvent operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthEventRepository = void 0;
class GrowthEventRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.growthEvent.create({
            data,
        });
    }
    async findById(eventId) {
        return this.db.prisma.growthEvent.findUnique({
            where: { event_id: eventId },
        });
    }
    async findByUserId(userId, limit = 50, offset = 0) {
        return this.db.prisma.growthEvent.findMany({
            where: { user_id: userId },
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
        });
    }
    async findByEntity(entityId, entityType) {
        return this.db.prisma.growthEvent.findMany({
            where: {
                entity_id: entityId,
                entity_type: entityType,
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async findByDimension(userId, dimKey, limit = 50) {
        return this.db.prisma.growthEvent.findMany({
            where: {
                user_id: userId,
                dim_key: dimKey,
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    async findBySource(userId, source, limit = 50) {
        return this.db.prisma.growthEvent.findMany({
            where: {
                user_id: userId,
                source,
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    async getGrowthSummaryByDimension(userId, dimKey) {
        const result = await this.db.prisma.growthEvent.aggregate({
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
    async getRecentGrowthEvents(userId, days = 30, limit = 100) {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);
        return this.db.prisma.growthEvent.findMany({
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
    async count(userId, dimKey) {
        return this.db.prisma.growthEvent.count({
            where: {
                ...(userId && { user_id: userId }),
                ...(dimKey && { dim_key: dimKey }),
            },
        });
    }
    async delete(eventId) {
        await this.db.prisma.growthEvent.delete({
            where: { event_id: eventId },
        });
    }
}
exports.GrowthEventRepository = GrowthEventRepository;
//# sourceMappingURL=GrowthEventRepository.js.map