/**
 * User Controller - Implements Directive 2: User Growth Profile API
 * Handles overall user growth summaries vs per-entity growth data
 */
import { Request, Response } from 'express';
export interface UserGrowthProfile {
    self_know: number;
    self_act: number;
    self_show: number;
    world_know: number;
    world_act: number;
    world_show: number;
    last_updated: string;
    total_entities: number;
    active_dimensions: number;
}
export interface DashboardGrowthSummary {
    cosmicMetrics: {
        starCount: number;
        constellationCount: number;
        totalGrowthScore: number;
    };
    dimensionalBalance: {
        self_know: {
            score: number;
            trend: 'up' | 'down' | 'stable';
        };
        self_act: {
            score: number;
            trend: 'up' | 'down' | 'stable';
        };
        self_show: {
            score: number;
            trend: 'up' | 'down' | 'stable';
        };
        world_know: {
            score: number;
            trend: 'up' | 'down' | 'stable';
        };
        world_act: {
            score: number;
            trend: 'up' | 'down' | 'stable';
        };
        world_show: {
            score: number;
            trend: 'up' | 'down' | 'stable';
        };
    };
    recentActivity: {
        totalEvents: number;
        lastWeekEvents: number;
        mostActiveGrowthDimension: string;
    };
}
export declare class UserController {
    private databaseService;
    constructor();
    /**
     * GET /api/users/me/growth-profile
     * Returns overall user growth profile from users.growth_profile JSONB field
     * Implements Directive 2: Dashboard uses this for overall growth summaries
     */
    getGrowthProfile: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/users/me/dashboard/growth-summary
     * Returns growth data formatted specifically for Dashboard widgets
     * Implements Directive 2: Dashboard-optimized format
     */
    getDashboardGrowthSummary: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/users/me/profile
     * Returns complete user profile including growth data
     */
    getUserProfile: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=user.controller.d.ts.map