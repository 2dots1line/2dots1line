/**
 * CardRepository.ts
 * V9.7 Repository for Card operations
 */
import { Card, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
import { GrowthDimensionData } from './GrowthEventRepository';
export interface CreateCardData {
    user_id: string;
    card_type: string;
    source_entity_id: string;
    source_entity_type: string;
    display_data?: Prisma.InputJsonValue;
}
export interface UpdateCardData {
    status?: string;
    is_favorited?: boolean;
    display_data?: Prisma.InputJsonValue;
    is_synced?: boolean;
}
export interface CardData {
    id: string;
    type: 'memory_unit' | 'concept' | 'derived_artifact';
    title: string;
    preview: string;
    evolutionState: string;
    importanceScore: number;
    createdAt: Date;
    updatedAt: Date;
    growthDimensions?: GrowthDimensionData[];
}
export interface CardFilters {
    cardType?: 'memory_unit' | 'concept' | 'derived_artifact';
    evolutionState?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at' | 'importance_score' | 'growth_activity';
    sortOrder?: 'asc' | 'desc';
}
export interface CardResultWithMeta {
    cards: CardData[];
    total: number;
    hasMore: boolean;
}
export declare class CardRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateCardData): Promise<Card>;
    findById(cardId: string): Promise<Card | null>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<Card[]>;
    findActiveByUserId(userId: string, limit?: number): Promise<Card[]>;
    findArchivedByUserId(userId: string, limit?: number): Promise<Card[]>;
    findFavoritedByUserId(userId: string): Promise<Card[]>;
    findBySourceEntity(sourceEntityId: string, sourceEntityType: string): Promise<Card[]>;
    update(cardId: string, data: UpdateCardData): Promise<Card>;
    archive(cardId: string): Promise<Card>;
    complete(cardId: string): Promise<Card>;
    favorite(cardId: string, favorited?: boolean): Promise<Card>;
    markSynced(cardId: string, synced?: boolean): Promise<Card>;
    delete(cardId: string): Promise<void>;
    findByType(userId: string, cardType: string, limit?: number): Promise<Card[]>;
    count(userId?: string, status?: string): Promise<number>;
    findUnsyncedByUserId(userId: string): Promise<Card[]>;
    /**
     * Get cards with advanced filtering and growth data
     */
    getCards(userId: string, filters: CardFilters): Promise<CardResultWithMeta>;
    /**
     * Get detailed card information
     */
    getCardDetails(cardId: string, userId: string): Promise<CardData | null>;
    /**
     * Get cards by evolution state
     */
    getCardsByEvolutionState(userId: string, state: string): Promise<CardData[]>;
    /**
     * Get top growth cards
     */
    getTopGrowthCards(userId: string, limit: number): Promise<CardData[]>;
    private buildOrderBy;
}
//# sourceMappingURL=CardRepository.d.ts.map