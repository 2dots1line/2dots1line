/**
 * User Routes - Implements Directive 2: User Growth Profile API
 * Provides overall user growth summaries for Dashboard display
 */

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router: Router = Router();
const userController = new UserController();

/**
 * GET /api/users/me/growth-profile
 * Returns overall user growth profile for Dashboard display
 * Implements Directive 2: Uses users.growth_profile JSONB field
 */
router.get('/me/growth-profile', userController.getGrowthProfile);

/**
 * GET /api/dashboard/growth-summary  
 * Alternative endpoint for Dashboard growth summary
 * Returns same data as growth-profile but formatted for dashboard widgets
 */
router.get('/me/dashboard/growth-summary', userController.getDashboardGrowthSummary);

/**
 * GET /api/users/me/profile
 * Get complete user profile including growth data
 */
router.get('/me/profile', userController.getUserProfile);

export default router; 