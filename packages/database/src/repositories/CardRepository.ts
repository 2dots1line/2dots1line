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
  type: string;
  source_entity_id: string;
  source_entity_type: string;
  display_order?: number;
  is_selected?: boolean;
  custom_title?: string;
  custom_content?: string;
  background_image_url?: string;
}

export interface UpdateCardData {
  status?: string;
  is_favorited?: boolean;
  is_synced?: boolean;
  background_image_url?: string | null;
  display_order?: number;
  is_selected?: boolean;
  custom_title?: string;
  custom_content?: string;
}

export interface CardData {
  id: string;
  type: 'memory_unit' | 'concept' | 'derived_artifact' | 'memoryunit' | 'growthevent' | 'proactiveprompt' | 'community';
  title: string;
  content: string;
  evolutionState: string;
  importanceScore: number;
  createdAt: Date;
  updatedAt: Date;
  growthDimensions?: GrowthDimensionData[]; // From materialized view
  source_entity_id?: string | null;
  source_entity_type?: string | null;
  background_image_url?: string | null;
  display_order?: number | null;
  is_selected?: boolean;
  custom_title?: string | null;
  custom_content?: string | null;
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

  /**
   * Load entity data from source entity table
   */
  private async loadEntityData(sourceEntityId: string, sourceEntityType: string): Promise<any> {
    try {
      switch (sourceEntityType) {
        case 'MemoryUnit':
          return await this.db.prisma.memory_units.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'Concept':
          return await this.db.prisma.concepts.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'DerivedArtifact':
          return await this.db.prisma.derived_artifacts.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'ProactivePrompt':
          return await this.db.prisma.proactive_prompts.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'Community':
          return await this.db.prisma.communities.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'GrowthEvent':
          return await this.db.prisma.growth_events.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'User':
          return await this.db.prisma.users.findUnique({
            where: { user_id: sourceEntityId }
          });
        default:
          console.warn(`[CardRepository] Unknown entity type: ${sourceEntityType}`);
          return null;
      }
    } catch (error) {
      console.error(`[CardRepository] Error loading entity data for ${sourceEntityType} ${sourceEntityId}:`, error);
      return null;
    }
  }

  /**
   * Batch load entity data for multiple cards to avoid N+1 queries
   */
  private async loadEntityDataBatch(cards: any[]): Promise<CardData[]> {
    if (cards.length === 0) return [];

    // Group cards by entity type for batch loading
    const cardsByType = cards.reduce((acc, card) => {
      const type = card.source_entity_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(card);
      return acc;
    }, {} as Record<string, any[]>);

    // Batch load entity data for each type
    const entityDataMap = new Map<string, any>();
    
    for (const [entityType, typeCards] of Object.entries(cardsByType)) {
      const entityIds = (typeCards as any[]).map((card: any) => card.source_entity_id);
      
      try {
        let entities: any[] = [];
        
        switch (entityType) {
          case 'MemoryUnit':
            entities = await this.db.prisma.memory_units.findMany({
              where: { entity_id: { in: entityIds } }
            });
            break;
          case 'Concept':
            entities = await this.db.prisma.concepts.findMany({
              where: { entity_id: { in: entityIds } }
            });
            break;
          case 'DerivedArtifact':
            entities = await this.db.prisma.derived_artifacts.findMany({
              where: { entity_id: { in: entityIds } }
            });
            break;
          case 'ProactivePrompt':
            entities = await this.db.prisma.proactive_prompts.findMany({
              where: { entity_id: { in: entityIds } }
            });
            break;
          case 'Community':
            entities = await this.db.prisma.communities.findMany({
              where: { entity_id: { in: entityIds } }
            });
            break;
          case 'GrowthEvent':
            entities = await this.db.prisma.growth_events.findMany({
              where: { entity_id: { in: entityIds } }
            });
            break;
          case 'User':
            entities = await this.db.prisma.users.findMany({
              where: { user_id: { in: entityIds } }
            });
            break;
          default:
            console.warn(`[CardRepository] Unknown entity type for batch loading: ${entityType}`);
            continue;
        }
        
        // Map entities by their ID for quick lookup
        entities.forEach(entity => {
          // For User entities, use user_id; for all others, use entity_id
          const id = entityType === 'User' ? entity.user_id : entity.entity_id;
          entityDataMap.set(id, entity);
        });
        
      } catch (error) {
        console.error(`[CardRepository] Error batch loading ${entityType} entities:`, error);
      }
    }

    // Transform cards with their entity data
    return cards.map((card: any) => {
      const entityData = entityDataMap.get(card.source_entity_id);
      
      return {
        id: card.card_id,
        type: card.type as 'memory_unit' | 'concept' | 'derived_artifact' | 'memoryunit' | 'growthevent' | 'proactiveprompt' | 'community',
        title: card.custom_title || entityData?.title || 'Untitled',
        content: card.custom_content || entityData?.content || '',
        evolutionState: 'seed', // Simplified - should calculate based on business logic
        importanceScore: 0.5, // Simplified - should calculate from data
        createdAt: card.created_at,
        updatedAt: card.updated_at,
        background_image_url: card.background_image_url || null,
        display_order: card.display_order,
        is_selected: card.is_selected,
        custom_title: card.custom_title,
        custom_content: card.custom_content,
        // Include source entity information
        source_entity_id: card.source_entity_id,
        source_entity_type: card.source_entity_type,
      };
    });
  }

  /**
   * Get card with entity data loaded
   */
  async getCardWithEntityData(cardId: string): Promise<any> {
    const card = await this.findById(cardId);
    if (!card) return null;

    const entityData = await this.loadEntityData(card.source_entity_id, card.source_entity_type);
    if (!entityData) return card;

    return {
      ...card,
      // Use custom fields if available, otherwise use entity data
      title: card.custom_title || entityData.title || 'Untitled',
      content: card.custom_content || entityData.content || '',
      entity_type: card.source_entity_type,
      entity_id: card.source_entity_id,
    };
  }

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
      data: {
        ...data,
        updated_at: new Date(),
      },
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

  async updateDisplayOrder(cardId: string, displayOrder: number): Promise<any> {
    return this.db.prisma.cards.update({
      where: { card_id: cardId },
      data: { display_order: displayOrder },
    });
  }

  async updateSelection(cardId: string, isSelected: boolean): Promise<any> {
    return this.db.prisma.cards.update({
      where: { card_id: cardId },
      data: { is_selected: isSelected },
    });
  }

  async updateCustomFields(cardId: string, customTitle?: string, customContent?: string): Promise<any> {
    return this.db.prisma.cards.update({
      where: { card_id: cardId },
      data: { 
        custom_title: customTitle,
        custom_content: customContent,
      },
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
        type: cardType,
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
   * Get cards by specific IDs (for random loading)
   */
  async getCardsByIds(cardIds: string[]): Promise<CardData[]> {
    if (cardIds.length === 0) return [];

    const cards = await this.db.prisma.cards.findMany({
      where: { card_id: { in: cardIds } }
    });

    return this.loadEntityDataBatch(cards);
  }

  /**
   * Get all card IDs for a user (for random selection)
   */
  async getAllCardIds(userId: string): Promise<string[]> {
    const cards = await this.db.prisma.cards.findMany({
      where: { user_id: userId },
      select: { card_id: true }
    });
    
    return cards.map(card => card.card_id);
  }

  /**
   * Get cards with advanced filtering and entity data loaded
   */
  async getCards(userId: string, filters: CardFilters): Promise<CardResultWithMeta> {
    // Get cards from database
    const cards = await this.db.prisma.cards.findMany({
      where: {
        user_id: userId,
        ...(filters.cardType && { type: filters.cardType }),
        // Note: evolutionState filtering would need proper implementation with business logic
      },
      take: filters.limit || 200, // Increased default limit for better UX
      skip: filters.offset || 0,
      orderBy: this.buildOrderBy(filters.sortBy, filters.sortOrder),
    });

    const total = await this.db.prisma.cards.count({
      where: {
        user_id: userId,
        ...(filters.cardType && { type: filters.cardType }),
      },
    });

    // Batch load entity data to avoid N+1 queries
    const cardData: CardData[] = await this.loadEntityDataBatch(cards);

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

    const entityData = await this.loadEntityData(card.source_entity_id, card.source_entity_type);

    return {
      id: card.card_id,
      type: card.type as 'memory_unit' | 'concept' | 'derived_artifact',
      title: card.custom_title || entityData?.title || 'Untitled',
      content: card.custom_content || entityData?.content || '',
      evolutionState: 'seed',
      importanceScore: 0.5,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
      background_image_url: card.background_image_url,
      display_order: card.display_order,
      is_selected: card.is_selected,
      custom_title: card.custom_title,
      custom_content: card.custom_content,
      source_entity_id: card.source_entity_id,
      source_entity_type: card.source_entity_type,
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

    return await Promise.all(
      cards.map(async (card: any) => {
        const entityData = await this.loadEntityData(card.source_entity_id, card.source_entity_type);
        
        return {
          id: card.card_id,
          type: card.type as 'memory_unit' | 'concept' | 'derived_artifact',
          title: card.custom_title || entityData?.title || 'Untitled',
          content: card.custom_content || entityData?.content || '',
          evolutionState: state,
          importanceScore: 0.5,
          createdAt: card.created_at,
          updatedAt: card.updated_at,
          background_image_url: card.background_image_url,
          display_order: card.display_order,
          is_selected: card.is_selected,
          custom_title: card.custom_title,
          custom_content: card.custom_content,
          source_entity_id: card.source_entity_id,
          source_entity_type: card.source_entity_type,
        };
      })
    );
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

    return await Promise.all(
      cards.map(async (card: any) => {
        const entityData = await this.loadEntityData(card.source_entity_id, card.source_entity_type);
        
        return {
          id: card.card_id,
          type: card.type as 'memory_unit' | 'concept' | 'derived_artifact',
          title: card.custom_title || entityData?.title || 'Untitled',
          content: card.custom_content || entityData?.content || '',
          evolutionState: 'sprout',
          importanceScore: 0.7,
          createdAt: card.created_at,
          updatedAt: card.updated_at,
          background_image_url: card.background_image_url,
          display_order: card.display_order,
          is_selected: card.is_selected,
          custom_title: card.custom_title,
          custom_content: card.custom_content,
          source_entity_id: card.source_entity_id,
          source_entity_type: card.source_entity_type,
        };
      })
    );
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