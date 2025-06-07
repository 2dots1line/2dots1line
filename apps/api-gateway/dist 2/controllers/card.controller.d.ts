/**
 * Card Controller - Sprint 3 Task 3 Implementation
 * API endpoints for card operations and Six-Dimensional Growth Model
 */
import { Request, Response } from 'express';
export declare class CardController {
    private cardService;
    private databaseService;
    constructor();
    /**
     * GET /api/cards
     * Get cards for authenticated user with optional filters
     */
    getCards: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/cards/:cardId
     * Get detailed information for a specific card
     */
    getCardDetails: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/cards/evolution/:state
     * Get cards by specific evolution state
     */
    getCardsByEvolutionState: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/cards/dashboard/evolution
     * Get all cards grouped by evolution state for dashboard
     */
    getCardsByEvolutionStateDashboard: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/cards/top-growth
     * Get cards with highest growth activity
     */
    getTopGrowthCards: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=card.controller.d.ts.map