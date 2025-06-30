"use strict";
/**
 * ProactivePromptRepository.ts
 * V9.7 Repository for ProactivePrompt operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProactivePromptRepository = void 0;
class ProactivePromptRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.proactivePrompt.create({
            data,
        });
    }
    async findById(promptId) {
        return this.db.prisma.proactivePrompt.findUnique({
            where: { prompt_id: promptId },
        });
    }
    async findByUserId(userId, limit = 50, offset = 0) {
        return this.db.prisma.proactivePrompt.findMany({
            where: { user_id: userId },
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
        });
    }
    async findPendingByUserId(userId, limit = 10) {
        return this.db.prisma.proactivePrompt.findMany({
            where: {
                user_id: userId,
                status: 'pending',
            },
            take: limit,
            orderBy: { created_at: 'asc' },
        });
    }
    async findByStatus(status, limit = 50) {
        return this.db.prisma.proactivePrompt.findMany({
            where: { status },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    async findBySourceAgent(userId, sourceAgent, limit = 50) {
        return this.db.prisma.proactivePrompt.findMany({
            where: {
                user_id: userId,
                source_agent: sourceAgent,
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    async update(promptId, data) {
        return this.db.prisma.proactivePrompt.update({
            where: { prompt_id: promptId },
            data,
        });
    }
    async markAsDelivered(promptId) {
        return this.db.prisma.proactivePrompt.update({
            where: { prompt_id: promptId },
            data: { status: 'delivered' },
        });
    }
    async markAsRead(promptId) {
        return this.db.prisma.proactivePrompt.update({
            where: { prompt_id: promptId },
            data: { status: 'read' },
        });
    }
    async markAsActioned(promptId) {
        return this.db.prisma.proactivePrompt.update({
            where: { prompt_id: promptId },
            data: { status: 'actioned' },
        });
    }
    async delete(promptId) {
        await this.db.prisma.proactivePrompt.delete({
            where: { prompt_id: promptId },
        });
    }
    async count(userId, status) {
        return this.db.prisma.proactivePrompt.count({
            where: {
                ...(userId && { user_id: userId }),
                ...(status && { status }),
            },
        });
    }
    async getRecentPrompts(userId, days = 7, limit = 50) {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);
        return this.db.prisma.proactivePrompt.findMany({
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
exports.ProactivePromptRepository = ProactivePromptRepository;
//# sourceMappingURL=ProactivePromptRepository.js.map