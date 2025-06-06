/**
 * Card Controller - Sprint 3 Task 3 Implementation
 * API endpoints for card operations and Six-Dimensional Growth Model
 */

import { Request, Response } from 'express';
import { DatabaseService, CardRepository } from '@2dots1line/database';
import { CardService, type Card as CognitiveCard, type GetCardsRequest as CognitiveGetCardsRequest, type GetCardsResponse } from '@2dots1line/cognitive-hub';

// Simplified interfaces for API Gateway
interface ApiCard {
  id: string;
  type: 'memory_unit' | 'concept' | 'derived_artifact';
  title: string;
  preview: string;
  evolutionState: 'seed' | 'sprout' | 'bloom' | 'constellation' | 'supernova';
  importanceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GetCardsRequest {
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

export class CardController {
  private cardService: CardService;
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.cardService = new CardService(this.databaseService);
  }

  /**
   * GET /api/cards
   * Get cards for authenticated user with optional filters
   */
  public getCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID not found in request'
        });
        return;
      }

      // Parse query parameters
      const {
        type: cardType,
        evolutionState,
        growthDimension,
        minImportanceScore,
        limit,
        offset,
        sortBy,
        sortOrder
      } = req.query;

      // Build request object
      const getCardsRequest: GetCardsRequest = {
        userId,
        filters: {
          cardType: cardType as any,
          evolutionState: evolutionState as string,
          growthDimension: growthDimension as string,
          minImportanceScore: minImportanceScore ? parseFloat(minImportanceScore as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any
        }
      };

      console.log(`CardController.getCards: Request for user ${userId} with filters:`, getCardsRequest.filters);

      // Use CardService to get cards
      const response = await this.cardService.getCards(getCardsRequest);

      res.status(200).json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Error in CardController.getCards:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cards'
      });
    }
  };

  /**
   * GET /api/cards/:cardId
   * Get detailed information for a specific card
   */
  public getCardDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { cardId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID not found in request'
        });
        return;
      }

      if (!cardId) {
        res.status(400).json({
          success: false,
          error: 'Card ID is required'
        });
        return;
      }

      console.log(`CardController.getCardDetails: Request for card ${cardId} by user ${userId}`);

      // Stub response for now
      res.status(200).json({
        success: true,
        data: {
          id: cardId,
          type: 'concept',
          title: 'Sample Card',
          preview: 'This is a sample card',
          evolutionState: 'seed',
          importanceScore: 0.5,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        message: 'Card details endpoint ready (implementation pending)'
      });

    } catch (error) {
      console.error('Error in CardController.getCardDetails:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get card details'
      });
    }
  };

  /**
   * GET /api/cards/evolution/:state
   * Get cards by specific evolution state
   */
  public getCardsByEvolutionState = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { state } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID not found in request'
        });
        return;
      }

      const validStates = ['seed', 'sprout', 'bloom', 'constellation', 'supernova'];
      if (!validStates.includes(state)) {
        res.status(400).json({
          success: false,
          error: `Invalid evolution state. Must be one of: ${validStates.join(', ')}`
        });
        return;
      }

      console.log(`CardController.getCardsByEvolutionState: Request for state ${state} by user ${userId}`);

      res.status(200).json({
        success: true,
        data: [],
        message: `Evolution state endpoint ready for ${state} (implementation pending)`
      });

    } catch (error) {
      console.error('Error in CardController.getCardsByEvolutionState:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cards by evolution state'
      });
    }
  };

  /**
   * GET /api/cards/dashboard/evolution
   * Get all cards grouped by evolution state for dashboard
   */
  public getCardsByEvolutionStateDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID not found in request'
        });
        return;
      }

      console.log(`CardController.getCardsByEvolutionStateDashboard: Dashboard request by user ${userId}`);

      const cardsByState = await this.cardService.getCardsByEvolutionState(userId);

      res.status(200).json({
        success: true,
        data: cardsByState,
        message: 'Evolution state dashboard data retrieved successfully'
      });

    } catch (error) {
      console.error('Error in CardController.getCardsByEvolutionStateDashboard:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dashboard data'
      });
    }
  };

  /**
   * GET /api/cards/top-growth
   * Get cards with highest growth activity
   */
  public getTopGrowthCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { limit } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID not found in request'
        });
        return;
      }

      const limitNum = limit ? parseInt(limit as string) : 10;

      console.log(`CardController.getTopGrowthCards: Request for top ${limitNum} growth cards by user ${userId}`);

      // Stub response for now - CardService doesn't have getTopGrowthCards method yet
      res.status(200).json({
        success: true,
        data: [],
        message: `Top growth cards endpoint ready (implementation pending)`
      });

    } catch (error) {
      console.error('Error in CardController.getTopGrowthCards:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get top growth cards'
      });
    }
  };
} 