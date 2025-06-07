"use strict";
/**
 * User Routes - Implements Directive 2: User Growth Profile API
 * Provides overall user growth summaries for Dashboard display
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
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
exports.default = router;
//# sourceMappingURL=user.routes.js.map