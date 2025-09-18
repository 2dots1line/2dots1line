/**
 * CardRepository.ts
 * V9.7 Repository for Card operations
 */

import { randomUUID } from 'crypto';
import type { Prisma } from '@2dots1line/database';
import { DatabaseService } from '../DatabaseService';
import { GrowthDimensionData } from './GrowthEventRepository';

export interface CreateCardData {
  user_id: string;
  card_type: string;
  source_entity_id: string;
  source_entity_type: string;
  display_data?: any;
}

export interface UpdateCardData {
  status?: string;
  is_favorited?: boolean;
  display_data?: any;
  is_synced?: boolean;
}

export interface CardData {
  id: string;
  type: 'memory_unit' | 'concept' | 'derived_artifact' | 'memoryunit' | 'growthevent' | 'proactiveprompt' | 'community';
  title: string;
  preview: string;
  evolutionState: string;
  importanceScore: number;
  createdAt: Date;
  updatedAt: Date;
  growthDimensions?: GrowthDimensionData[]; // From materialized view
  source_entity_id?: string | null;
  source_entity_type?: string | null;
}

export interface CardFilters {
  cardType?: 'memory_unit' | 'concept' | 'derived_artifact' | 'memoryunit' | 'growthevent' | 'proactiveprompt' | 'community';
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

export class CardRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateCardData): Promise<any> {
    return this.db.prisma.cards.create({
      data: {
        ...data,
        card_id: randomUUID(),
        updated_at: new Date(),
      },
    });
  }

  async findById(cardId: string): Promise<any | null> {
    return this.db.prisma.cards.findUnique({
      where: { card_id: cardId },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<any[]> {
    return this.db.prisma.cards.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async findActiveByUserId(userId: string, limit = 50): Promise<any[]> {
    return this.db.prisma.cards.findMany({
      where: {
        user_id: userId,
        status: 'active_canvas',
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findArchivedByUserId(userId: string, limit = 50): Promise<any[]> {
    return this.db.prisma.cards.findMany({
      where: {
        user_id: userId,
        status: 'active_archive',
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async findFavoritedByUserId(userId: string): Promise<any[]> {
    return this.db.prisma.cards.findMany({
      where: {
        user_id: userId,
        is_favorited: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySourceEntity(sourceEntityId: string, sourceEntityType: string): Promise<any[]> {
    return this.db.prisma.cards.findMany({
      where: {
        source_entity_id: sourceEntityId,
        source_entity_type: sourceEntityType,
      },
    });
  }

  async update(cardId: string, data: UpdateCardData): Promise<any> {
    return this.db.prisma.cards.update({
      where: { card_id: cardId },
      data,
    });
  }

  async archive(cardId: string): Promise<any> {
    return this.db.prisma.cards.update({
      where: { card_id: cardId },
      data: { status: 'active_archive' },
    });
  }

  async complete(cardId: string): Promise<any> {
    return this.db.prisma.cards.update({
      where: { card_id: cardId },
      data: { status: 'completed' },
    });
  }

  async favorite(cardId: string, favorited = true): Promise<any> {
    return this.db.prisma.cards.update({
      where: { card_id: cardId },
      data: { is_favorited: favorited },
    });
  }

  async markSynced(cardId: string, synced = true): Promise<any> {
    return this.db.prisma.cards.update({
      where: { card_id: cardId },
      data: { is_synced: synced },
    });
  }

  async delete(cardId: string): Promise<void> {
    await this.db.prisma.cards.delete({
      where: { card_id: cardId },
    });
  }

  async findByType(userId: string, cardType: string, limit = 50): Promise<any[]> {
    return this.db.prisma.cards.findMany({
      where: {
        user_id: userId,
        card_type: cardType,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async count(userId?: string, status?: string): Promise<number> {
    return this.db.prisma.cards.count({
      where: {
        ...(userId && { user_id: userId }),
        ...(status && { status }),
      },
    });
  }

  async findUnsyncedByUserId(userId: string): Promise<any[]> {
    return this.db.prisma.cards.findMany({
      where: {
        user_id: userId,
        is_synced: false,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Get any with advanced filtering and growth data
   */
  async getCards(userId: string, filters: CardFilters): Promise<CardResultWithMeta> {
    // For now, use simplified logic. The proper implementation should join with growth data.
    const cards = await this.db.prisma.cards.findMany({
      where: {
        user_id: userId,
        ...(filters.cardType && { card_type: filters.cardType }),
        // Note: evolutionState filtering would need proper implementation with business logic
      },
      take: filters.limit || 200, // Increased default limit for better UX
      skip: filters.offset || 0,
      orderBy: this.buildOrderBy(filters.sortBy, filters.sortOrder),
    });

    const total = await this.db.prisma.cards.count({
      where: {
        user_id: userId,
        ...(filters.cardType && { card_type: filters.cardType }),
      },
    });

    // Transform to CardData format
    const cardData: CardData[] = cards.map((card: any) => {
      // Parse display_data if present
      let displayData: any = {};
      if (card.display_data) {
        try {
          displayData = typeof card.display_data === 'string' ? JSON.parse(card.display_data) : card.display_data;
        } catch (e) {
          displayData = {};
        }
      }
      return {
        id: card.card_id,
        type: card.card_type as 'memory_unit' | 'concept' | 'derived_artifact' | 'memoryunit' | 'growthevent' | 'proactiveprompt' | 'community',
        title: displayData.title || displayData.name || '',
        preview: displayData.preview || displayData.previewText || displayData.description || '',
        evolutionState: 'seed', // Simplified - should calculate based on business logic
        importanceScore: 0.5, // Simplified - should calculate from data
        createdAt: card.created_at,
        updatedAt: card.updated_at,
        // Pass through display_data and background_image_url for downstream use
        display_data: displayData,
        background_image_url: card.background_image_url || null,
        // Include source entity information
        source_entity_id: card.source_entity_id,
        source_entity_type: card.source_entity_type,
      };
    });

    return {
      cards: cardData,
      total,
      hasMore: (filters.offset || 0) + cardData.length < total,
    };
  }

  /**
   * Get detailed card information
   */
  async getCardDetails(cardId: string, userId: string): Promise<CardData | null> {
    const card = await this.db.prisma.cards.findFirst({
      where: {
        card_id: cardId,
        user_id: userId,
      },
    });

    if (!card) return null;

    return {
      id: card.card_id,
      type: card.card_type as 'memory_unit' | 'concept' | 'derived_artifact',
      title: `Card ${card.card_id}`,
      preview: `Preview for ${card.card_id}`,
      evolutionState: 'seed',
      importanceScore: 0.5,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
    };
  }

  /**
   * Get any by evolution state
   */
  async getCardsByEvolutionState(userId: string, state: string): Promise<CardData[]> {
    // Simplified implementation - proper logic would filter by calculated evolution state
    const cards = await this.db.prisma.cards.findMany({
      where: { user_id: userId },
      take: 10,
      orderBy: { created_at: 'desc' },
    });

    return cards.map((card: any) => ({
      id: card.card_id,
      type: card.card_type as 'memory_unit' | 'concept' | 'derived_artifact',
      title: `Card ${card.card_id}`,
      preview: `Preview for ${card.card_id}`,
      evolutionState: state,
      importanceScore: 0.5,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
    }));
  }

  /**
   * Get top growth any
   */
  async getTopGrowthCards(userId: string, limit: number): Promise<CardData[]> {
    // Simplified implementation - proper logic would order by growth activity
    const cards = await this.db.prisma.cards.findMany({
      where: { user_id: userId },
      take: limit,
      orderBy: { updated_at: 'desc' },
    });

    return cards.map((card: any) => ({
      id: card.card_id,
      type: card.card_type as 'memory_unit' | 'concept' | 'derived_artifact',
      title: `Card ${card.card_id}`,
      preview: `Preview for ${card.card_id}`,
      evolutionState: 'sprout',
      importanceScore: 0.7,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
    }));
  }

  private buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
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