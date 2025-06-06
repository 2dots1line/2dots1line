/**
 * CardService - Sprint 3 Task 3 Implementation
 * Business logic for card operations, Six-Dimensional Growth Model integration
 */

import { DatabaseService } from '@2dots1line/database';
import { CardRepository } from '@2dots1line/database';
import type { CardData, CardFilters } from '@2dots1line/database';

export interface Card {
  id: string;
  type: 'memory_unit' | 'concept' | 'derived_artifact';
  title: string;
  preview: string;
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
}

export interface GetCardsRequest {
  userId: string;
  filters?: {
    cardType?: 'memory_unit' | 'concept' | 'derived_artifact';
    evolutionState?: string;
    growthDimension?: string;
    minImportanceScore?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at' | 'importance_score' | 'growth_activity';
    sortOrder?: 'asc' | 'desc';
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
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        sortBy: this.mapSortField(filters.sortBy),
        sortOrder: filters.sortOrder || 'desc'
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
  private transformCardData(cardData: CardData): Card {
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
      preview: cardData.preview || cardData.title,
      evolutionState: cardData.evolutionState,
      growthDimensions,
      importanceScore: cardData.importanceScore || 0.5,
      createdAt: cardData.createdAt,
      updatedAt: cardData.updatedAt,
      connections: 0, // Default values since CardData doesn't have these
      insights: 0,
      tags: []
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
} 