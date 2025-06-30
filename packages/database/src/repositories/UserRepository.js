"use strict";
/**
 * UserRepository.ts
 * V9.7 Repository for User entity operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
class UserRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.user.create({
            data: {
                ...data,
                account_status: 'active',
            },
        });
    }
    async findById(userId) {
        return this.db.prisma.user.findUnique({
            where: { user_id: userId },
        });
    }
    async findUserByIdWithContext(userId) {
        return this.db.prisma.user.findUnique({
            where: { user_id: userId },
        });
    }
    async findByEmail(email) {
        return this.db.prisma.user.findUnique({
            where: { email },
        });
    }
    async update(userId, data) {
        return this.db.prisma.user.update({
            where: { user_id: userId },
            data,
        });
    }
    async updateLastActive(userId) {
        return this.db.prisma.user.update({
            where: { user_id: userId },
            data: { last_active_at: new Date() },
        });
    }
    async updateMemoryProfile(userId, memoryProfile) {
        return this.db.prisma.user.update({
            where: { user_id: userId },
            data: { memory_profile: memoryProfile },
        });
    }
    async updateKnowledgeGraphSchema(userId, schema) {
        return this.db.prisma.user.update({
            where: { user_id: userId },
            data: { knowledge_graph_schema: schema },
        });
    }
    async updateNextConversationContext(userId, context) {
        return this.db.prisma.user.update({
            where: { user_id: userId },
            data: { next_conversation_context_package: context },
        });
    }
    async startNewCycle(userId) {
        return this.db.prisma.user.update({
            where: { user_id: userId },
            data: {
                last_cycle_started_at: new Date(),
                concepts_created_in_cycle: 0,
            },
        });
    }
    async incrementConceptsInCycle(userId) {
        return this.db.prisma.user.update({
            where: { user_id: userId },
            data: {
                concepts_created_in_cycle: {
                    increment: 1,
                },
            },
        });
    }
    async delete(userId) {
        await this.db.prisma.user.delete({
            where: { user_id: userId },
        });
    }
    async findMany(limit = 50, offset = 0) {
        return this.db.prisma.user.findMany({
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
        });
    }
    async count() {
        return this.db.prisma.user.count();
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map