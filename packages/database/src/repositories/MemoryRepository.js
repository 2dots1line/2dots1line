"use strict";
/**
 * MemoryRepository.ts
 * V9.7 Repository for MemoryUnit operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryRepository = void 0;
class MemoryRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.memoryUnit.create({
            data,
        });
    }
    async findById(muid) {
        return this.db.prisma.memoryUnit.findUnique({
            where: { muid },
            include: {
                media_items: true,
                derived_artifacts_as_source: true,
                source_conversation: true,
            },
        });
    }
    /**
     * Batch method for HybridRetrievalTool - find multiple memory units by IDs
     */
    async findByIds(muids, userId) {
        return this.db.prisma.memoryUnit.findMany({
            where: {
                muid: { in: muids },
                user_id: userId
            },
            include: {
                media_items: true,
                derived_artifacts_as_source: true,
                source_conversation: true,
            },
            orderBy: { creation_ts: 'desc' }
        });
    }
    async findByUserId(userId, limit = 50, offset = 0) {
        return this.db.prisma.memoryUnit.findMany({
            where: { user_id: userId },
            take: limit,
            skip: offset,
            orderBy: { creation_ts: 'desc' },
            include: {
                media_items: true,
            },
        });
    }
    async findByConversationId(conversationId) {
        return this.db.prisma.memoryUnit.findMany({
            where: { source_conversation_id: conversationId },
            orderBy: { creation_ts: 'asc' },
        });
    }
    async update(muid, data) {
        return this.db.prisma.memoryUnit.update({
            where: { muid },
            data,
        });
    }
    async delete(muid) {
        await this.db.prisma.memoryUnit.delete({
            where: { muid },
        });
    }
    async findByImportanceRange(userId, minScore, maxScore, limit = 50) {
        return this.db.prisma.memoryUnit.findMany({
            where: {
                user_id: userId,
                importance_score: {
                    gte: minScore,
                    lte: maxScore,
                },
            },
            take: limit,
            orderBy: { importance_score: 'desc' },
        });
    }
    async findRecentByUserId(userId, days = 30, limit = 50) {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);
        return this.db.prisma.memoryUnit.findMany({
            where: {
                user_id: userId,
                creation_ts: {
                    gte: dateThreshold,
                },
            },
            take: limit,
            orderBy: { creation_ts: 'desc' },
        });
    }
    async searchByContent(userId, searchTerm, limit = 50) {
        return this.db.prisma.memoryUnit.findMany({
            where: {
                user_id: userId,
                OR: [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    { content: { contains: searchTerm, mode: 'insensitive' } },
                ],
            },
            take: limit,
            orderBy: { creation_ts: 'desc' },
        });
    }
    async count(userId) {
        return this.db.prisma.memoryUnit.count({
            where: userId ? { user_id: userId } : undefined,
        });
    }
    async getAverageImportanceScore(userId) {
        const result = await this.db.prisma.memoryUnit.aggregate({
            where: { user_id: userId },
            _avg: { importance_score: true },
        });
        return result._avg.importance_score || 0;
    }
}
exports.MemoryRepository = MemoryRepository;
//# sourceMappingURL=MemoryRepository.js.map