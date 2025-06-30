"use strict";
/**
 * ConversationRepository.ts
 * V9.7 Repository for Conversation and ConversationMessage operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationRepository = void 0;
class ConversationRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.conversation.create({
            data,
        });
    }
    async findById(conversationId) {
        return this.db.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' },
                },
                source_card: true,
                spawned_memory_units: true,
            },
        });
    }
    async findByUserId(userId, limit = 50, offset = 0) {
        return this.db.prisma.conversation.findMany({
            where: { user_id: userId },
            take: limit,
            skip: offset,
            orderBy: { start_time: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { timestamp: 'desc' },
                },
            },
        });
    }
    async findActiveByUserId(userId) {
        return this.db.prisma.conversation.findMany({
            where: {
                user_id: userId,
                status: 'active',
            },
            orderBy: { start_time: 'desc' },
        });
    }
    async update(conversationId, data) {
        return this.db.prisma.conversation.update({
            where: { id: conversationId },
            data,
        });
    }
    async endConversation(conversationId, summary) {
        return this.db.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                status: 'ended',
                ended_at: new Date(),
                context_summary: summary,
            },
        });
    }
    // Message operations
    async addMessage(data) {
        return this.db.prisma.conversationMessage.create({
            data,
        });
    }
    async getMessages(conversationId, limit = 100, offset = 0) {
        return this.db.prisma.conversationMessage.findMany({
            where: { conversation_id: conversationId },
            take: limit,
            skip: offset,
            orderBy: { timestamp: 'asc' },
        });
    }
    async getLastMessage(conversationId) {
        return this.db.prisma.conversationMessage.findFirst({
            where: { conversation_id: conversationId },
            orderBy: { timestamp: 'desc' },
        });
    }
    async getMessageCount(conversationId) {
        return this.db.prisma.conversationMessage.count({
            where: { conversation_id: conversationId },
        });
    }
    // V10.8 PromptBuilder methods
    async getMostRecentMessages(conversationId, limit = 10) {
        return this.db.prisma.conversationMessage.findMany({
            where: { conversation_id: conversationId },
            take: limit,
            orderBy: { timestamp: 'desc' },
        });
    }
    async getRecentImportantConversationSummaries(userId, limit = 5) {
        const conversations = await this.db.prisma.conversation.findMany({
            where: {
                user_id: userId,
                status: 'ended',
                importance_score: {
                    gte: 0.7, // Only conversations with high importance
                },
                context_summary: {
                    not: null, // Only conversations that have summaries
                },
            },
            take: limit,
            orderBy: [
                { importance_score: 'desc' },
                { ended_at: 'desc' },
            ],
            select: {
                context_summary: true,
                importance_score: true,
            },
        });
        return conversations.map(conv => ({
            conversation_summary: conv.context_summary || '',
            conversation_importance_score: conv.importance_score || 0,
        }));
    }
    async delete(conversationId) {
        // Messages will be deleted via cascade
        await this.db.prisma.conversation.delete({
            where: { id: conversationId },
        });
    }
    async findByStatus(status, limit = 50) {
        return this.db.prisma.conversation.findMany({
            where: { status },
            take: limit,
            orderBy: { start_time: 'desc' },
        });
    }
    async count(userId) {
        return this.db.prisma.conversation.count({
            where: userId ? { user_id: userId } : undefined,
        });
    }
}
exports.ConversationRepository = ConversationRepository;
//# sourceMappingURL=ConversationRepository.js.map