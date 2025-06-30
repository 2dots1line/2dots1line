"use strict";
/**
 * InteractionLogRepository.ts
 * V9.7 Repository for InteractionLog operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionLogRepository = void 0;
class InteractionLogRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.interactionLog.create({
            data,
        });
    }
    async findById(interactionId) {
        return this.db.prisma.interactionLog.findUnique({
            where: { interaction_id: interactionId },
        });
    }
    async findByUserId(userId, limit = 50, offset = 0) {
        return this.db.prisma.interactionLog.findMany({
            where: { user_id: userId },
            take: limit,
            skip: offset,
            orderBy: { timestamp: 'desc' },
        });
    }
    async findByInteractionType(userId, interactionType, limit = 50) {
        return this.db.prisma.interactionLog.findMany({
            where: {
                user_id: userId,
                interaction_type: interactionType,
            },
            take: limit,
            orderBy: { timestamp: 'desc' },
        });
    }
    async findByTargetEntity(targetEntityId, targetEntityType) {
        return this.db.prisma.interactionLog.findMany({
            where: {
                target_entity_id: targetEntityId,
                target_entity_type: targetEntityType,
            },
            orderBy: { timestamp: 'desc' },
        });
    }
    async findRecentByUserId(userId, hours = 24, limit = 100) {
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
    async count(userId, interactionType) {
        return this.db.prisma.interactionLog.count({
            where: {
                ...(userId && { user_id: userId }),
                ...(interactionType && { interaction_type: interactionType }),
            },
        });
    }
    async delete(interactionId) {
        await this.db.prisma.interactionLog.delete({
            where: { interaction_id: interactionId },
        });
    }
    async getInteractionStats(userId, days = 30) {
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
        const interaction_types = {};
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
exports.InteractionLogRepository = InteractionLogRepository;
//# sourceMappingURL=InteractionLogRepository.js.map