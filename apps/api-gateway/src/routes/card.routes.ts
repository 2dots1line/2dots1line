/**
 * Card Routes - Sprint 3 Task 3 Implementation
 * API routes for card operations and Six-Dimensional Growth Model
 */

import { Router } from 'express';
import { CardController } from '../controllers/card.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: Router = Router();
const cardController = new CardController();

// Apply authentication middleware to all card routes
router.use(authMiddleware);

/**
 * GET /api/cards
 * Get cards for authenticated user with optional filters
 * Query parameters:
 * - type: 'memory_unit' | 'concept' | 'derived_artifact'
 * - evolutionState: 'seed' | 'sprout' | 'bloom' | 'constellation' | 'supernova'
 * - growthDimension: string
 * - minImportanceScore: number
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 * - sortBy: 'created_at' | 'updated_at' | 'importance_score' | 'growth_activity'
 * - sortOrder: 'asc' | 'desc'
 */
router.get('/', cardController.getCards);

/**
 * GET /api/cards/dashboard/evolution
 * Get all cards grouped by evolution state for dashboard
 */
router.get('/dashboard/evolution', cardController.getCardsByEvolutionStateDashboard);

/**
 * GET /api/cards/top-growth
 * Get cards with highest growth activity
 * Query parameters:
 * - limit: number (default: 10)
 */
router.get('/top-growth', cardController.getTopGrowthCards);

/**
 * GET /api/cards/evolution/:state
 * Get cards by specific evolution state
 * Path parameters:
 * - state: 'seed' | 'sprout' | 'bloom' | 'constellation' | 'supernova'
 */
router.get('/evolution/:state', cardController.getCardsByEvolutionState);

/**
 * GET /api/cards/:cardId
 * Get detailed information for a specific card
 * Path parameters:
 * - cardId: string
 */
router.get('/:cardId', cardController.getCardDetails);

export { router as cardRoutes }; 