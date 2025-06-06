/**
 * User Controller - Implements Directive 2: User Growth Profile API
 * Handles overall user growth summaries vs per-entity growth data
 */

import { Request, Response } from 'express';
import { DatabaseService } from '@2dots1line/database';

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
    self_know: { score: number; trend: 'up' | 'down' | 'stable' };
    self_act: { score: number; trend: 'up' | 'down' | 'stable' };
    self_show: { score: number; trend: 'up' | 'down' | 'stable' };
    world_know: { score: number; trend: 'up' | 'down' | 'stable' };
    world_act: { score: number; trend: 'up' | 'down' | 'stable' };
    world_show: { score: number; trend: 'up' | 'down' | 'stable' };
  };
  recentActivity: {
    totalEvents: number;
    lastWeekEvents: number;
    mostActiveGrowthDimension: string;
  };
}

export class UserController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * GET /api/users/me/growth-profile
   * Returns overall user growth profile from users.growth_profile JSONB field
   * Implements Directive 2: Dashboard uses this for overall growth summaries
   */
  getGrowthProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id; // Assuming auth middleware sets req.user
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Use Prisma to query users table
      const user = await this.databaseService.prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          growth_profile: true,
          created_at: true,
          last_active_at: true
        }
      });
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const growthProfile: UserGrowthProfile = (user.growth_profile as any) || {
        self_know: 0,
        self_act: 0,
        self_show: 0,
        world_know: 0,
        world_act: 0,
        world_show: 0,
        last_updated: new Date().toISOString(),
        total_entities: 0,
        active_dimensions: 0
      };

      res.json({
        success: true,
        data: growthProfile,
        metadata: {
          user_since: user.created_at,
          last_active: user.last_active_at
        }
      });

    } catch (error) {
      console.error('Error in getGrowthProfile:', error);
      res.status(500).json({ 
        error: 'Failed to get growth profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/users/me/dashboard/growth-summary
   * Returns growth data formatted specifically for Dashboard widgets
   * Implements Directive 2: Dashboard-optimized format
   */
  getDashboardGrowthSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get growth profile and additional dashboard metrics using Prisma
      const [user, conceptCount, constellationCount, activityStats] = await Promise.all([
        this.databaseService.prisma.user.findUnique({
          where: { user_id: userId },
          select: { growth_profile: true }
        }),
        this.databaseService.prisma.concept.count({
          where: { user_id: userId }
        }),
        this.databaseService.prisma.derivedArtifact.count({
          where: { 
            user_id: userId,
            artifact_type: 'constellation'
          }
        }),
        this.databaseService.prisma.growth_events.groupBy({
          by: ['dim_key'],
          where: { user_id: userId },
          _count: { dim_key: true },
          orderBy: { _count: { dim_key: 'desc' } },
          take: 1
        })
      ]);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const growthProfile = (user.growth_profile as any) || {};
      const mostActiveActivity = activityStats[0] || { dim_key: 'self_know', _count: { dim_key: 0 } };

      // Calculate total growth score
      const totalGrowthScore = Object.values(growthProfile)
        .filter((value): value is number => typeof value === 'number')
        .reduce((sum: number, score: number) => sum + score, 0);

      // Format for dashboard
      const dashboardSummary: DashboardGrowthSummary = {
        cosmicMetrics: {
          starCount: conceptCount || 0,
          constellationCount: constellationCount || 0,
          totalGrowthScore: Math.round(totalGrowthScore * 100) / 100
        },
        dimensionalBalance: {
          self_know: { score: growthProfile.self_know || 0, trend: 'stable' },
          self_act: { score: growthProfile.self_act || 0, trend: 'stable' },
          self_show: { score: growthProfile.self_show || 0, trend: 'stable' },
          world_know: { score: growthProfile.world_know || 0, trend: 'stable' },
          world_act: { score: growthProfile.world_act || 0, trend: 'stable' },
          world_show: { score: growthProfile.world_show || 0, trend: 'stable' }
        },
        recentActivity: {
          totalEvents: mostActiveActivity._count.dim_key,
          lastWeekEvents: 0, // TODO: Add date filtering
          mostActiveGrowthDimension: mostActiveActivity.dim_key
        }
      };

      res.json({
        success: true,
        data: dashboardSummary
      });

    } catch (error) {
      console.error('Error in getDashboardGrowthSummary:', error);
      res.status(500).json({ 
        error: 'Failed to get dashboard growth summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/users/me/profile
   * Returns complete user profile including growth data
   */
  getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await this.databaseService.prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          name: true,
          email: true,
          growth_profile: true,
          preferences: true,
          created_at: true,
          last_active_at: true,
          region: true
        }
      });
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.user_id,
          username: user.name,
          email: user.email,
          displayName: user.name,
          profilePictureUrl: null, // Field not available in V7 schema, return null for now
          growthProfile: user.growth_profile,
          preferences: user.preferences,
          createdAt: user.created_at,
          lastLoginAt: user.last_active_at,
          region: user.region
        }
      });

    } catch (error) {
      console.error('Error in getUserProfile:', error);
      res.status(500).json({ 
        error: 'Failed to get user profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
} 