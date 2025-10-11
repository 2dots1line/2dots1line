/**
 * CardService - Sprint 3 Task 3 Implementation
 * Business logic for card operations, Six-Dimensional Growth Model integration
 */

import { DatabaseService , CardRepository } from '@2dots1line/database';
import type { CardData, CardFilters } from '@2dots1line/database';

export interface Card {
  id: string;
  type: 'memory_unit' | 'concept' | 'derived_artifact' | 'memoryunit' | 'growthevent' | 'proactiveprompt' | 'community';
  title: string;
  content: string;
  evolutionState: 'seed' | 'sprout' | 'bloom' | 'constellation' | 'supernova';
  growthDimensions: Array<{
    key: string;
    name: string;
    score: number;
    eventCount: number;
    lastEventAt: Date | null;
    trend: 'increasing' | 'stable' | 'decreasing';
    percentageOfMax: number;
  }>;
  importanceScore: number;
  createdAt: Date;
  updatedAt: Date;
  connections: number;
  insights: number;
  tags: string[];
  background_image_url?: string | null; // Pass through background_image_url for frontend use
  source_entity_id?: string | null; // Source entity ID for entity details
  source_entity_type?: string | null; // Source entity type for entity details
  display_order?: number | null; // User-controlled ordering
  is_selected?: boolean; // User selection for physical cards
  custom_title?: string | null; // User can override entity title
  custom_content?: string | null; // User can override entity content
}

export interface GetCardsRequest {
  userId: string;
  filters?: {
    cardType?: 'memory_unit' | 'concept' | 'derived_artifact' | 'memoryunit' | 'growthevent' | 'proactiveprompt' | 'community';
    evolutionState?: string;
    growthDimension?: string;
    minImportanceScore?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at' | 'importance_score' | 'growth_activity';
    sortOrder?: 'asc' | 'desc';
    coverFirst?: boolean;
  };
}

export interface GetCardsResponse {
  cards: Card[];
  total: number;
  hasMore: boolean;
  summary: {
    totalsByState: Record<string, number>;
    totalsByType: Record<string, number>;
    avgGrowthScore: number;
    mostActiveGrowthDimension: string | null;
  };
}

export class CardService {
  private cardRepository: CardRepository;

  constructor(private databaseService: DatabaseService) {
    this.cardRepository = new CardRepository(databaseService);
  }

  /**
   * Get cards with enhanced Six-Dimensional Growth Model data
   * Implements Directive 2: Uses mv_entity_growth_progress for per-entity growth data
   */
  async getCards(request: GetCardsRequest): Promise<GetCardsResponse> {
    const { userId, filters = {} } = request;

    try {
      // Convert API filters to repository filters
      const repoFilters: CardFilters = {
        cardType: filters.cardType,
        evolutionState: filters.evolutionState,
        limit: filters.limit || 200, // Increased default limit for better UX
        offset: filters.offset || 0,
        sortBy: this.mapSortField(filters.sortBy),
        sortOrder: filters.sortOrder || 'desc',
        coverFirst: filters.coverFirst
      };

      // Get base card data from repository with growth data
      const repoResult = await this.cardRepository.getCards(userId, repoFilters);

      // Transform repository data to API format
      const cards: Card[] = await Promise.all(
        repoResult.cards.map(async (cardData: CardData) => this.transformCardData(cardData))
      );

      // Filter by minimum importance score if specified
      const filteredCards = filters.minImportanceScore 
        ? cards.filter(card => card.importanceScore >= filters.minImportanceScore!)
        : cards;

      // Generate summary statistics
      const summary = this.generateCardsSummary(filteredCards);

      return {
        cards: filteredCards,
        total: repoResult.total,
        hasMore: repoResult.hasMore,
        summary
      };

    } catch (error) {
      console.error('Error in CardService.getCards:', error);
      throw new Error(`Failed to get cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search cards by title or content across all entity types
   * Returns user's active entities whose title or content contains the search query
   * where the card status is 'active_canvas'
   */
  async searchCards(request: { userId: string; query: string; filters?: any }): Promise<GetCardsResponse> {
    const { userId, query, filters = {} } = request;

    try {
      // Call the CardRepository search method
      const repoResult = await this.cardRepository.searchCards(userId, query, {
        cardType: filters.cardType,
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        sortBy: this.mapSortField(filters.sortBy),
        sortOrder: filters.sortOrder || 'desc'
      });

      // Transform repository data to API format
      const cards: Card[] = await Promise.all(
        repoResult.cards.map(async (cardData: CardData) => this.transformCardData(cardData))
      );

      // Generate summary statistics
      const summary = this.generateCardsSummary(cards);

      return {
        cards,
        total: repoResult.total,
        hasMore: repoResult.hasMore,
        summary
      };

    } catch (error) {
      console.error('Error in CardService.searchCards:', error);
      throw new Error(`Failed to search cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed information for a specific card with per-entity growth data
   * Implements Directive 2: Fetches from mv_entity_growth_progress for card-specific scores
   */
  async getCardDetails(cardId: string, userId: string): Promise<Card | null> {
    try {
      const cardData = await this.cardRepository.getCardDetails(cardId, userId);
      
      if (!cardData) {
        return null;
      }

      return this.transformCardData(cardData);

    } catch (error) {
      console.error('Error in CardService.getCardDetails:', error);
      throw new Error(`Failed to get card details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cards grouped by evolution state for dashboard view
   */
  async getCardsByEvolutionState(userId: string): Promise<Record<string, Card[]>> {
    try {
      const evolutionStates = ['seed', 'sprout', 'bloom', 'constellation', 'supernova'];
      const result: Record<string, Card[]> = {};

      for (const state of evolutionStates) {
        const repoCards = await this.cardRepository.getCardsByEvolutionState(userId, state);
        result[state] = await Promise.all(
          repoCards.map((cardData: CardData) => this.transformCardData(cardData))
        );
      }

      return result;

    } catch (error) {
      console.error('Error in CardService.getCardsByEvolutionState:', error);
      throw new Error(`Failed to get cards by evolution state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get most active cards based on recent growth events
   */
  async getTopGrowthCards(userId: string, limit: number = 10): Promise<Card[]> {
    try {
      const repoCards = await this.cardRepository.getTopGrowthCards(userId, limit);
      
      return await Promise.all(
        repoCards.map((cardData: CardData) => this.transformCardData(cardData))
      );

    } catch (error) {
      console.error('Error in CardService.getTopGrowthCards:', error);
      throw new Error(`Failed to get top growth cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform repository card data to API card format
   * Uses CardData from CardRepository which includes growthDimensions
   */
  private async transformCardData(cardData: CardData): Promise<Card> {
    // Transform growth dimensions from repository format
    const growthDimensions = cardData.growthDimensions?.map((dimension) => {
      // Calculate trend based on recent event activity
      const trend = dimension.eventCount > 5 ? 'increasing' : 
                   dimension.eventCount > 1 ? 'stable' : 'decreasing';
      
      // Calculate percentage of max score (assuming max is 1.0)
      const percentageOfMax = Math.round(dimension.score * 100);

      return {
        key: dimension.key,
        name: dimension.name,
        score: dimension.score,
        eventCount: dimension.eventCount,
        lastEventAt: dimension.lastEventAt,
        trend: trend as 'increasing' | 'stable' | 'decreasing',
        percentageOfMax
      };
    }) || [];

    return {
      id: cardData.id,
      type: cardData.type,
      title: cardData.title,
      content: cardData.content,
      evolutionState: cardData.evolutionState as 'seed' | 'sprout' | 'bloom' | 'constellation' | 'supernova',
      growthDimensions,
      importanceScore: cardData.importanceScore || 0.5,
      createdAt: cardData.createdAt,
      updatedAt: cardData.updatedAt,
      connections: 0, // Removed connection count calculation for performance
      insights: 0,
      tags: [],
      background_image_url: cardData.background_image_url || '', // Transform NULL to empty string for sorting
      source_entity_id: cardData.source_entity_id || null,
      source_entity_type: cardData.source_entity_type || null,
      display_order: cardData.display_order || null,
      is_selected: cardData.is_selected || false,
      custom_title: cardData.custom_title || null,
      custom_content: cardData.custom_content || null,
    };
  }

  /**
   * Get human-readable dimension name from dimension key
   */
  private getDimensionName(dimKey: string): string {
    const dimensionNames: Record<string, string> = {
      'self_know': 'Self Knowledge',
      'self_act': 'Self Action', 
      'self_show': 'Self Expression',
      'world_know': 'World Knowledge',
      'world_act': 'World Action',
      'world_show': 'World Expression'
    };
    
    return dimensionNames[dimKey] || dimKey;
  }

  /**
   * Generate summary statistics for a set of cards
   */
  private generateCardsSummary(cards: Card[]): GetCardsResponse['summary'] {
    const totalsByState: Record<string, number> = {};
    const totalsByType: Record<string, number> = {};
    const dimensionScores: Record<string, number[]> = {};

    cards.forEach(card => {
      // Count by evolution state
      totalsByState[card.evolutionState] = (totalsByState[card.evolutionState] || 0) + 1;
      
      // Count by type
      totalsByType[card.type] = (totalsByType[card.type] || 0) + 1;
      
      // Collect growth dimension scores
      card.growthDimensions.forEach((dimension: any) => {
        if (!dimensionScores[dimension.key]) {
          dimensionScores[dimension.key] = [];
        }
        dimensionScores[dimension.key].push(dimension.score);
      });
    });

    // Calculate average growth score across all dimensions
    const allScores = Object.values(dimensionScores).flat();
    const avgGrowthScore = allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
      : 0;

    // Find most active growth dimension
    let mostActiveGrowthDimension: string | null = null;
    let maxAvgScore = 0;
    
    Object.entries(dimensionScores).forEach(([dimension, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore > maxAvgScore) {
        maxAvgScore = avgScore;
        mostActiveGrowthDimension = dimension;
      }
    });

    return {
      totalsByState,
      totalsByType,
      avgGrowthScore: Math.round(avgGrowthScore * 100) / 100,
      mostActiveGrowthDimension
    };
  }

  /**
   * Map API sort fields to repository sort fields
   */
  private mapSortField(sortBy?: string): CardFilters['sortBy'] {
    switch (sortBy) {
      case 'growth_activity':
        return 'updated_at'; // Use updated_at as proxy for growth activity
      case 'created_at':
      case 'updated_at':
      case 'importance_score':
        return sortBy;
      default:
        return 'updated_at';
    }
  }

  /**
   * Get a single card by ID with entity data loaded
   */
  async getCardById(cardId: string): Promise<Card | null> {
    try {
      const cardWithEntityData = await this.cardRepository.getCardWithEntityData(cardId);
      if (!cardWithEntityData) {
        return null;
      }

      // Convert to CardData format
      const convertedCardData: CardData = {
        id: cardWithEntityData.card_id,
        type: cardWithEntityData.type as 'memory_unit' | 'concept' | 'derived_artifact',
        title: cardWithEntityData.title || 'Untitled',
        content: cardWithEntityData.content || '',
        evolutionState: 'seed', // Default value
        importanceScore: 0.5, // Default value
        createdAt: cardWithEntityData.created_at,
        updatedAt: cardWithEntityData.updated_at,
        source_entity_id: cardWithEntityData.source_entity_id,
        source_entity_type: cardWithEntityData.source_entity_type,
        background_image_url: cardWithEntityData.background_image_url,
        display_order: cardWithEntityData.display_order,
        is_selected: cardWithEntityData.is_selected,
        custom_title: cardWithEntityData.custom_title,
        custom_content: cardWithEntityData.custom_content,
        growthDimensions: [] // Will be populated by repository if available
      };

      return this.transformCardData(convertedCardData);
    } catch (error) {
      console.error('Error getting card by ID:', error);
      return null;
    }
  }

  /**
   * Create a new card entry for an entity
   * Used when freezing a node (water) into a card (ice)
   */
  async createCard(data: {
    userId: string;
    source_entity_id: string;
    source_entity_type: string;
    status?: string;
    type?: string;
  }): Promise<{ card_id: string; success: boolean }> {
    try {
      const cardData = {
        user_id: data.userId,
        source_entity_id: data.source_entity_id,
        source_entity_type: data.source_entity_type,
        type: data.type || data.source_entity_type,
        status: data.status || 'active_canvas',
      };

      const newCard = await this.cardRepository.create(cardData);
      
      return {
        card_id: newCard.card_id,
        success: true
      };
    } catch (error) {
      console.error('Error creating card:', error);
      throw new Error(`Failed to create card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get related cards based on Neo4j relationships
   */
  async getRelatedCards(cardId: string, limit: number = 10): Promise<Card[]> {
    try {
      // Get the card to find its source entity
      const card = await this.getCardById(cardId);
      if (!card || !card.source_entity_id) {
        return [];
      }

      // Query Neo4j for related entities
      const relatedEntities = await this.getRelatedEntitiesFromNeo4j(card.source_entity_id, limit);
      
      // Convert related entities to cards
      const relatedCards: Card[] = [];
      for (const entity of relatedEntities) {
        const entityCard = await this.findCardBySourceEntity(entity.id, entity.type);
        if (entityCard) {
          relatedCards.push(entityCard);
        }
      }

      return relatedCards;
    } catch (error) {
      console.error('Error getting related cards:', error);
      return [];
    }
  }

  /**
   * Find card by source entity ID and type
   */
  private async findCardBySourceEntity(sourceEntityId: string, sourceEntityType: string): Promise<Card | null> {
    try {
      const cardDataArray = await this.cardRepository.findBySourceEntity(sourceEntityId, sourceEntityType);
      if (!cardDataArray || cardDataArray.length === 0) {
        return null;
      }

      // Get the first card and load its entity data
      const card = cardDataArray[0];
      const cardWithEntityData = await this.cardRepository.getCardWithEntityData(card.card_id);
      if (!cardWithEntityData) {
        return null;
      }

      // Convert to CardData format
      const convertedCardData: CardData = {
        id: cardWithEntityData.card_id,
        type: cardWithEntityData.type as 'memory_unit' | 'concept' | 'derived_artifact',
        title: cardWithEntityData.title || 'Untitled',
        content: cardWithEntityData.content || '',
        evolutionState: 'seed', // Default value
        importanceScore: 0.5, // Default value
        createdAt: cardWithEntityData.created_at,
        updatedAt: cardWithEntityData.updated_at,
        source_entity_id: cardWithEntityData.source_entity_id,
        source_entity_type: cardWithEntityData.source_entity_type,
        background_image_url: cardWithEntityData.background_image_url,
        display_order: cardWithEntityData.display_order,
        is_selected: cardWithEntityData.is_selected,
        custom_title: cardWithEntityData.custom_title,
        custom_content: cardWithEntityData.custom_content,
        growthDimensions: [] // Will be populated by repository if available
      };

      // Return the first card found
      return this.transformCardData(convertedCardData);
    } catch (error) {
      console.error('Error finding card by source entity:', error);
      return null;
    }
  }


  /**
   * Query Neo4j for related entities
   */
  private async getRelatedEntitiesFromNeo4j(sourceEntityId: string, limit: number): Promise<Array<{id: string, type: string}>> {
    try {
      if (!this.databaseService.neo4j) {
        console.warn('Neo4j not available, returning empty related entities');
        return [];
      }

      const session = this.databaseService.neo4j.session();
      
      try {
        // Query for related entities through relationships
        const result = await session.run(`
          MATCH (source)-[r]-(target)
          WHERE source.entity_id = $sourceEntityId OR source.id = $sourceEntityId
          RETURN DISTINCT target.entity_id as id, labels(target)[0] as type, type(r) as relationshipType
          ORDER BY target.importance_score DESC
          LIMIT $limit
        `, { sourceEntityId, limit });

        const entities = result.records.map((record: any) => ({
          id: record.get('id'),
          type: record.get('type')
        }));

        console.log(`Found ${entities.length} related entities for ${sourceEntityId}`);
        return entities;
      } finally {
        session.close();
      }
    } catch (error) {
      console.error('Error querying Neo4j for related entities:', error);
      return [];
    }
  }

  /**
   * Update a card's background image URL with ownership check
   */
  async updateCardBackground(cardId: string, userId: string, backgroundImageUrl: string): Promise<Card> {
    // Fetch the card to verify existence and ownership
    const existing = await this.cardRepository.findById(cardId);
    if (!existing) {
      throw new Error('Card not found');
    }

    // Relax ownership check in development to allow dev-token workflows
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && existing.user_id !== userId) {
      throw new Error('Forbidden: You do not own this card');
    }
    if (isDev && existing.user_id !== userId) {
      console.warn(
        `Dev mode: ownership mismatch (card.user_id=${existing.user_id}, req.user.id=${userId}). Proceeding with update.`
      );
    }

    console.log(
      `Updating background_image_url for card ${cardId} by user ${userId} -> ${backgroundImageUrl?.slice(0, 80)}...`
    );

    // Persist the new background image URL
    await this.cardRepository.update(cardId, {
      background_image_url: backgroundImageUrl,
    });

    // Return the transformed card
    const updated = await this.getCardById(cardId);
    if (!updated) {
      throw new Error('Failed to load updated card');
    }
    console.log(`Update complete. cardId=${cardId} updated_at=${updated.updatedAt.toISOString()}`);
    return updated;
  }

  /**
   * Get all card IDs for a user (for random selection)
   */
  async getAllCardIds(userId: string): Promise<string[]> {
    console.log(`[CardService] Getting all card IDs for user: ${userId}`);
    return this.cardRepository.getAllCardIds(userId);
  }

  /**
   * Get cards by specific IDs (for random loading)
   */
  async getCardsByIds(cardIds: string[]): Promise<Card[]> {
    console.log(`[CardService] Getting cards by IDs: ${cardIds.length} cards`);
    
    const cardData = await this.cardRepository.getCardsByIds(cardIds);
    
    // Transform to Card interface
    const cards = await Promise.all(
      cardData.map(async (data) => this.transformCardData(data))
    );
    
    console.log(`[CardService] Successfully loaded ${cards.length} cards by IDs`);
    return cards;
  }
}