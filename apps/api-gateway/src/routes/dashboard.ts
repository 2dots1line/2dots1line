/**
 * dashboard.ts
 * V9.7 API Routes for dashboard endpoints
 */

import { Router, type Router as ExpressRouter } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { DatabaseService } from '@2dots1line/database';
import { authMiddleware } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();
const dbService = DatabaseService.getInstance();
const dashboardController = new DashboardController(dbService);

// Apply authentication middleware to all dashboard routes
router.use(authMiddleware);

/**
 * GET /api/v1/dashboard
 * Get dashboard data for the current user's most recent cycle
 */
router.get('/', async (req, res) => {
  await dashboardController.getDashboard(req, res);
});

/**
 * GET /api/v1/dashboard/cycle/:cycleId
 * Get dashboard data for a specific cycle
 */
router.get('/cycle/:cycleId', async (req, res) => {
  await dashboardController.getDashboardForCycle(req, res);
});

/**
 * GET /api/v1/dashboard/cycles
 * Get available cycles for the current user
 */
router.get('/cycles', async (req, res) => {
  await dashboardController.getUserCycles(req, res);
});

/**
 * GET /api/v1/dashboard/stats
 * Get cycle statistics for the current user
 */
router.get('/stats', async (req, res) => {
  await dashboardController.getUserStats(req, res);
});

/**
 * GET /api/v1/dashboard/section/:sectionType
 * Get data for a specific dashboard section
 * Query params:
 * - cycleId: Optional cycle ID (defaults to most recent)
 */
router.get('/section/:sectionType', async (req, res) => {
  await dashboardController.getDashboardSection(req, res);
});

export default router;
