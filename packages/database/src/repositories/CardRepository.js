"use strict";
/**
 * CardRepository.ts
 * V9.7 Repository for Card operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardRepository = void 0;
class CardRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.prisma.card.create({
            data,
        });
    }
    async findById(cardId) {
        return this.db.prisma.card.findUnique({
            where: { card_id: cardId },
        });
    }
    async findByUserId(userId, limit = 50, offset = 0) {
        return this.db.prisma.card.findMany({
            where: { user_id: userId },
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
        });
    }
    async findActiveByUserId(userId, limit = 50) {
        return this.db.prisma.card.findMany({
            where: {
                user_id: userId,
                status: 'active_canvas',
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    async findArchivedByUserId(userId, limit = 50) {
        return this.db.prisma.card.findMany({
            where: {
                user_id: userId,
                status: 'active_archive',
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    async findFavoritedByUserId(userId) {
        return this.db.prisma.card.findMany({
            where: {
                user_id: userId,
                is_favorited: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async findBySourceEntity(sourceEntityId, sourceEntityType) {
        return this.db.prisma.card.findMany({
            where: {
                source_entity_id: sourceEntityId,
                source_entity_type: sourceEntityType,
            },
        });
    }
    async update(cardId, data) {
        return this.db.prisma.card.update({
            where: { card_id: cardId },
            data,
        });
    }
    async archive(cardId) {
        return this.db.prisma.card.update({
            where: { card_id: cardId },
            data: { status: 'active_archive' },
        });
    }
    async complete(cardId) {
        return this.db.prisma.card.update({
            where: { card_id: cardId },
            data: { status: 'completed' },
        });
    }
    async favorite(cardId, favorited = true) {
        return this.db.prisma.card.update({
            where: { card_id: cardId },
            data: { is_favorited: favorited },
        });
    }
    async markSynced(cardId, synced = true) {
        return this.db.prisma.card.update({
            where: { card_id: cardId },
            data: { is_synced: synced },
        });
    }
    async delete(cardId) {
        await this.db.prisma.card.delete({
            where: { card_id: cardId },
        });
    }
    async findByType(userId, cardType, limit = 50) {
        return this.db.prisma.card.findMany({
            where: {
                user_id: userId,
                card_type: cardType,
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    async count(userId, status) {
        return this.db.prisma.card.count({
            where: {
                ...(userId && { user_id: userId }),
                ...(status && { status }),
            },
        });
    }
    async findUnsyncedByUserId(userId) {
        return this.db.prisma.card.findMany({
            where: {
                user_id: userId,
                is_synced: false,
            },
            orderBy: { created_at: 'asc' },
        });
    }
    /**
     * Get cards with advanced filtering and growth data
     */
    async getCards(userId, filters) {
        // For now, use simplified logic. The proper implementation should join with growth data.
        const cards = await this.db.prisma.card.findMany({
            where: {
                user_id: userId,
                ...(filters.cardType && { card_type: filters.cardType }),
                // Note: evolutionState filtering would need proper implementation with business logic
            },
            take: filters.limit || 20,
            skip: filters.offset || 0,
            orderBy: this.buildOrderBy(filters.sortBy, filters.sortOrder),
        });
        const total = await this.db.prisma.card.count({
            where: {
                user_id: userId,
                ...(filters.cardType && { card_type: filters.cardType }),
            },
        });
        // Transform to CardData format
        const cardData = cards.map(card => ({
            id: card.card_id,
            type: card.card_type,
            title: `Card ${card.card_id}`, // Simplified - should derive from source entity
            preview: `Preview for ${card.card_id}`,
            evolutionState: 'seed', // Simplified - should calculate based on business logic
            importanceScore: 0.5, // Simplified - should calculate from data
            createdAt: card.created_at,
            updatedAt: card.updated_at,
        }));
        return {
            cards: cardData,
            total,
            hasMore: (filters.offset || 0) + cardData.length < total,
        };
    }
    /**
     * Get detailed card information
     */
    async getCardDetails(cardId, userId) {
        const card = await this.db.prisma.card.findFirst({
            where: {
                card_id: cardId,
                user_id: userId,
            },
        });
        if (!card)
            return null;
        return {
            id: card.card_id,
            type: card.card_type,
            title: `Card ${card.card_id}`,
            preview: `Preview for ${card.card_id}`,
            evolutionState: 'seed',
            importanceScore: 0.5,
            createdAt: card.created_at,
            updatedAt: card.updated_at,
        };
    }
    /**
     * Get cards by evolution state
     */
    async getCardsByEvolutionState(userId, state) {
        // Simplified implementation - proper logic would filter by calculated evolution state
        const cards = await this.db.prisma.card.findMany({
            where: { user_id: userId },
            take: 10,
            orderBy: { created_at: 'desc' },
        });
        return cards.map(card => ({
            id: card.card_id,
            type: card.card_type,
            title: `Card ${card.card_id}`,
            preview: `Preview for ${card.card_id}`,
            evolutionState: state,
            importanceScore: 0.5,
            createdAt: card.created_at,
            updatedAt: card.updated_at,
        }));
    }
    /**
     * Get top growth cards
     */
    async getTopGrowthCards(userId, limit) {
        // Simplified implementation - proper logic would order by growth activity
        const cards = await this.db.prisma.card.findMany({
            where: { user_id: userId },
            take: limit,
            orderBy: { updated_at: 'desc' },
        });
        return cards.map(card => ({
            id: card.card_id,
            type: card.card_type,
            title: `Card ${card.card_id}`,
            preview: `Preview for ${card.card_id}`,
            evolutionState: 'sprout',
            importanceScore: 0.7,
            createdAt: card.created_at,
            updatedAt: card.updated_at,
        }));
    }
    buildOrderBy(sortBy, sortOrder = 'desc') {
        switch (sortBy) {
            case 'created_at':
                return { created_at: sortOrder };
            case 'updated_at':
                return { updated_at: sortOrder };
            case 'importance_score':
            case 'growth_activity':
                // For now, fallback to updated_at
                return { updated_at: sortOrder };
            default:
                return { created_at: sortOrder };
        }
    }
}
exports.CardRepository = CardRepository;
//# sourceMappingURL=CardRepository.js.map