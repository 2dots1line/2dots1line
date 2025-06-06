/**
 * Card Repository - Sprint 3 Task 3 Implementation
 * Fetches card data from PostgreSQL including growth dimensions and evolution states
 */

import { DatabaseService } from '../index';
import type { Prisma } from '../prisma-client';

export interface CardData {
  id: string;
  type: 'memory_unit' | 'concept' | 'derived_artifact';
  title: string;
  preview: string;
  userId: string;
  evolutionState: 'seed' | 'sprout' | 'bloom' | 'constellation' | 'supernova';
  growthDimensions: Array<{
    key: string;
    name: string;
    score: number;
    eventCount: number;
    lastEventAt: Date | null;
  }>;
  importanceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardFilters {
  cardType?: 'memory_unit' | 'concept' | 'derived_artifact';
  evolutionState?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'importance_score';
  sortOrder?: 'asc' | 'desc';
}

export class CardRepository {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Fetch cards for a user with growth data from database views
   * Implements S3.T3 and S3.T6 requirements
   */
  async getCards(userId: string, filters: CardFilters = {}): Promise<{
    cards: CardData[];
    total: number;
    hasMore: boolean;
  }> {
    const prisma = this.databaseService.getPrismaClient();
    
    const {
      cardType,
      evolutionState,
      limit = 20,
      offset = 0,
      sortBy = 'updated_at',
      sortOrder = 'desc'
    } = filters;

    try {
      // Build base WHERE clause for evolution state view
      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (cardType) {
        whereClause += ` AND entity_type = $${paramIndex}`;
        params.push(cardType);
        paramIndex++;
      }

      if (evolutionState) {
        whereClause += ` AND evolution_state = $${paramIndex}`;
        params.push(evolutionState);
        paramIndex++;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM v_card_evolution_state 
        ${whereClause}
      `;
      
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
      const total = parseInt((countResult as any)[0].total);

      // Get card data with evolution state
      const cardsQuery = `
        SELECT 
          entity_id,
          entity_type,
          card_title,
          evolution_state,
          engaged_dimensions_count,
          connection_count
        FROM v_card_evolution_state 
        ${whereClause}
        ORDER BY ${sortBy === 'created_at' ? 'entity_id' : sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      const cardResults = await prisma.$queryRawUnsafe(cardsQuery, ...params) as any[];

      // Fetch detailed data for each card from source tables
      const cards: CardData[] = [];

      for (const cardResult of cardResults) {
        const { entity_id, entity_type, card_title, evolution_state } = cardResult;

        // Get growth dimensions for this entity
        const growthQuery = `
          SELECT 
            dim_key,
            score,
            event_count,
            last_event_at
          FROM mv_entity_growth
          WHERE user_id = $1 AND entity_id = $2 AND entity_type = $3
          ORDER BY score DESC
        `;
        
        const growthResults = await prisma.$queryRawUnsafe(
          growthQuery, 
          userId, 
          entity_id, 
          entity_type
        ) as any[];

        // Map dimension keys to readable names
        const dimensionNames: Record<string, string> = {
          'self_know': 'Self-Knowing',
          'self_act': 'Self-Acting', 
          'self_show': 'Self-Showing',
          'world_know': 'World-Knowing',
          'world_act': 'World-Acting',
          'world_show': 'World-Showing'
        };

        const growthDimensions = growthResults.map(result => ({
          key: result.dim_key,
          name: dimensionNames[result.dim_key] || result.dim_key,
          score: parseFloat(result.score) || 0,
          eventCount: parseInt(result.event_count) || 0,
          lastEventAt: result.last_event_at ? new Date(result.last_event_at) : null
        }));

        // Get detailed entity data based on type
        let entityData: any = null;
        let preview = '';
        let importanceScore = 0.5;
        let createdAt = new Date();
        let updatedAt = new Date();

        switch (entity_type) {
          case 'memory_unit':
            entityData = await prisma.memoryUnit.findUnique({
              where: { muid: entity_id, user_id: userId }
            });
            if (entityData) {
              preview = entityData.content?.substring(0, 150) + '...' || '';
              importanceScore = entityData.importance_score || 0.5;
              createdAt = entityData.created_at;
              updatedAt = entityData.updated_at;
            }
            break;

          case 'concept':
            entityData = await prisma.concept.findUnique({
              where: { concept_id: entity_id, user_id: userId }
            });
            if (entityData) {
              preview = entityData.description?.substring(0, 150) + '...' || `${entityData.type} concept`;
              importanceScore = entityData.confidence || 0.5;
              createdAt = entityData.created_at;
              updatedAt = entityData.updated_at;
            }
            break;

          case 'derived_artifact':
            entityData = await prisma.derivedArtifact.findUnique({
              where: { artifact_id: entity_id, user_id: userId }
            });
            if (entityData) {
              preview = entityData.summary?.substring(0, 150) + '...' || '';
              importanceScore = 0.8; // Derived artifacts typically higher importance
              createdAt = entityData.created_at;
              updatedAt = entityData.updated_at;
            }
            break;
        }

        if (entityData) {
          cards.push({
            id: entity_id,
            type: entity_type as 'memory_unit' | 'concept' | 'derived_artifact',
            title: card_title || entityData.title || entityData.name || 'Untitled',
            preview,
            userId,
            evolutionState: evolution_state as any,
            growthDimensions,
            importanceScore,
            createdAt,
            updatedAt
          });
        }
      }

      const hasMore = offset + limit < total;

      console.info(`CardRepository.getCards: Retrieved ${cards.length} cards for user ${userId}`);
      
      return {
        cards,
        total,
        hasMore
      };

    } catch (error) {
      console.error('Error fetching cards:', error);
      throw new Error(`Failed to fetch cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed data for a specific card
   */
  async getCardDetails(cardId: string, userId: string): Promise<CardData | null> {
    try {
      // First get basic card info from evolution state view
      const prisma = this.databaseService.getPrismaClient();
      
      const cardQuery = `
        SELECT 
          entity_id,
          entity_type,
          card_title,
          evolution_state,
          engaged_dimensions_count,
          connection_count
        FROM v_card_evolution_state 
        WHERE entity_id = $1 AND user_id = $2
      `;
      
      const cardResults = await prisma.$queryRawUnsafe(cardQuery, cardId, userId) as any[];
      
      if (cardResults.length === 0) {
        return null;
      }

      const cardResult = cardResults[0];
      
      // Use the existing getCards logic but for a single card
      const cardsData = await this.getCards(userId, { 
        limit: 1, 
        offset: 0 
      });
      
      return cardsData.cards.find(card => card.id === cardId) || null;

    } catch (error) {
      console.error('Error fetching card details:', error);
      throw new Error(`Failed to fetch card details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cards by evolution state for dashboard views
   */
  async getCardsByEvolutionState(userId: string, state: string): Promise<CardData[]> {
    const result = await this.getCards(userId, {
      evolutionState: state,
      limit: 50,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    });
    
    return result.cards;
  }

  /**
   * Get cards with highest growth activity
   */
  async getTopGrowthCards(userId: string, limit: number = 10): Promise<CardData[]> {
    const prisma = this.databaseService.getPrismaClient();
    
    try {
      // Get entities with most recent growth activity
      const recentGrowthQuery = `
        SELECT 
          entity_id,
          entity_type,
          SUM(score) as total_score,
          COUNT(DISTINCT dim_key) as active_dimensions,
          MAX(last_event_at) as latest_activity
        FROM mv_entity_growth
        WHERE user_id = $1 AND score > 0
        GROUP BY entity_id, entity_type
        ORDER BY latest_activity DESC, total_score DESC
        LIMIT $2
      `;
      
      const growthResults = await prisma.$queryRawUnsafe(
        recentGrowthQuery, 
        userId, 
        limit
      ) as any[];

      const cards: CardData[] = [];
      
      for (const result of growthResults) {
        const cardData = await this.getCardDetails(result.entity_id, userId);
        if (cardData) {
          cards.push(cardData);
        }
      }

      return cards;

    } catch (error) {
      console.error('Error fetching top growth cards:', error);
      throw new Error(`Failed to fetch top growth cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 