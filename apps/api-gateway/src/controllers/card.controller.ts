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
        cardType: req.query.card_type as 'memory_unit' | 'concept' | 'derived_artifact' | undefined,
        evolutionState: req.query.evolution_state as string | undefined,
        minImportanceScore: req.query.min_importance_score ? parseFloat(req.query.min_importance_score as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 200, // Increased default limit for better UX
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        sortBy: req.query.sort_by as 'created_at' | 'updated_at' | 'importance_score' | 'growth_activity' | undefined,
        sortOrder: req.query.sort_order as 'asc' | 'desc' | undefined
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
} 