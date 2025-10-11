import { Request, Response } from 'express';
import { CardService } from '@2dots1line/card-service';
import type { TApiResponse } from '@2dots1line/shared-types';

export class CardController {
  private cardService: CardService;

  constructor(cardService: CardService) {
    this.cardService = cardService;
  }
  
  /**
   * GET /api/v1/cards
   * Fetches a list of cards using the CardService (V11.0 architecture)
   */
  public getCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required'
          }
        } as TApiResponse<any>);
        return;
      }

      // Parse query parameters
      const filters = {
        cardType: req.query.type as 'memory_unit' | 'concept' | 'derived_artifact' | undefined,
        evolutionState: req.query.evolution_state as string | undefined,
        minImportanceScore: req.query.min_importance_score ? parseFloat(req.query.min_importance_score as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 200, // Increased default limit for better UX
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        sortBy: req.query.sort_by as 'created_at' | 'updated_at' | 'importance_score' | 'growth_activity' | undefined,
        sortOrder: req.query.sort_order as 'asc' | 'desc' | undefined,
        coverFirst: req.query.cover_first === 'true'
      };

      // Call the CardService
      const serviceResponse = await this.cardService.getCards({
        userId,
        filters
      });

      // Transform the response to match frontend expectations
      res.status(200).json({
        success: true,
        data: {
          cards: serviceResponse.cards,
          total_count: serviceResponse.total,
          has_more: serviceResponse.hasMore,
          summary: serviceResponse.summary
        }
      } as TApiResponse<any>);

    } catch (error: any) {
      console.error('Card controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch cards'
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/v1/cards/:cardId/related
   * Get related cards for a given card based on Neo4j relationships
   */
  public getRelatedCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const cardId = req.params.cardId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required'
          }
        } as TApiResponse<any>);
        return;
      }

      if (!cardId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Card ID is required'
          }
        } as TApiResponse<any>);
        return;
      }

      // Get the card first to find its source entity
      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Card not found'
          }
        } as TApiResponse<any>);
        return;
      }

      // Get related cards based on Neo4j relationships
      const relatedCards = await this.cardService.getRelatedCards(cardId, limit);

      res.status(200).json({
        success: true,
        data: {
          cards: relatedCards,
          total_count: relatedCards.length,
          has_more: false // TODO: Implement pagination
        }
      } as TApiResponse<any>);

    } catch (error: any) {
      console.error('Card controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch related cards'
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/v1/cards/by-source/:entityId
   * TODO: Implement with CardService
   */
  public getCardBySourceEntity = async (req: Request, res: Response): Promise<void> => {
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Endpoint not yet implemented in V11.0 architecture'
      }
    } as TApiResponse<any>);
  };

  // TODO: Implement remaining card endpoints with CardService in V11.0 architecture
  public getCardsByEvolutionStateDashboard = async (req: Request, res: Response): Promise<void> => {
    res.status(501).json({
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Endpoint not yet implemented in V11.0 architecture' }
    } as TApiResponse<any>);
  };

  public getTopGrowthCards = async (req: Request, res: Response): Promise<void> => {
    res.status(501).json({
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Endpoint not yet implemented in V11.0 architecture' }
    } as TApiResponse<any>);
  };

  public getCardsByEvolutionState = async (req: Request, res: Response): Promise<void> => {
    res.status(501).json({
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Endpoint not yet implemented in V11.0 architecture' }
    } as TApiResponse<any>);
  };

  public getCardDetails = async (req: Request, res: Response): Promise<void> => {
    res.status(501).json({
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Endpoint not yet implemented in V11.0 architecture' }
    } as TApiResponse<any>);
  };

  /**
   * PUT /api/v1/cards/:cardId/background
   * Update card background image URL
   */
  public updateCardBackground = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const cardId = req.params.cardId;
      const { background_image_url } = req.body as { background_image_url?: string };

      console.log('[PUT /cards/:cardId/background]', {
        userId,
        cardId,
        hasBackgroundUrl: !!background_image_url
      });

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }
      if (!cardId || !background_image_url) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'cardId and background_image_url are required' }
        } as TApiResponse<any>);
        return;
      }

      const updatedCard = await this.cardService.updateCardBackground(cardId, userId, background_image_url);

      res.status(200).json({
        success: true,
        data: updatedCard
      } as TApiResponse<any>);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to update card background';
      const status = message.includes('Forbidden') ? 403 : message.includes('not found') ? 404 : 500;

      console.error('Card controller update background error:', error);
      res.status(status).json({
        success: false,
        error: { code: 'UPDATE_BACKGROUND_FAILED', message }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/v1/cards/ids
   * Get all card IDs for a user (for random selection)
   */
  public getAllCardIds = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required'
          }
        } as TApiResponse<any>);
        return;
      }

      // Call the CardService to get all card IDs
      const cardIds = await this.cardService.getAllCardIds(userId);

      res.status(200).json({
        success: true,
        data: {
          cardIds
        }
      } as TApiResponse<any>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get card IDs';
      console.error('Card controller get all card IDs error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'GET_CARD_IDS_FAILED', message }
      } as TApiResponse<any>);
    }
  };

  /**
   * POST /api/v1/cards/by-ids
   * Get cards by specific IDs (for random loading)
   */
  public getCardsByIds = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required'
          }
        } as TApiResponse<any>);
        return;
      }

      const { cardIds } = req.body;
      if (!Array.isArray(cardIds) || cardIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'cardIds must be a non-empty array'
          }
        } as TApiResponse<any>);
        return;
      }

      // Call the CardService to get cards by IDs
      const cards = await this.cardService.getCardsByIds(cardIds);

      res.status(200).json({
        success: true,
        data: {
          cards
        }
      } as TApiResponse<any>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get cards by IDs';
      console.error('Card controller get cards by IDs error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'GET_CARDS_BY_IDS_FAILED', message }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/v1/cards/search
   * Search cards by title or content across all entity types
   */
  public searchCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required'
          }
        } as TApiResponse<any>);
        return;
      }

      const { q: query, limit, offset, sort_by, sort_order, type } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Search query (q) is required'
          }
        } as TApiResponse<any>);
        return;
      }

      // Parse query parameters
      const filters = {
        cardType: type as 'memory_unit' | 'concept' | 'derived_artifact' | undefined,
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0,
        sortBy: sort_by as 'created_at' | 'updated_at' | 'importance_score' | 'growth_activity' | undefined,
        sortOrder: sort_order as 'asc' | 'desc' | undefined
      };

      // Call the CardService search method
      const serviceResponse = await this.cardService.searchCards({
        userId,
        query: query.trim(),
        filters
      });

      // Transform the response to match frontend expectations
      res.status(200).json({
        success: true,
        data: {
          cards: serviceResponse.cards,
          total_count: serviceResponse.total,
          has_more: serviceResponse.hasMore,
          summary: serviceResponse.summary
        }
      } as TApiResponse<any>);

    } catch (error: any) {
      console.error('Card controller search error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search cards'
        }
      } as TApiResponse<any>);
    }
  };
}