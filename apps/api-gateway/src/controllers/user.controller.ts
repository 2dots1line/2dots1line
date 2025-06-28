/**
 * User Controller - V9.7 Simplified User Profile API
 * In V9.7, most user operations will be forwarded to a user-service
 */

import { Request, Response } from 'express';
import { DatabaseService } from '@2dots1line/database';

export class UserController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  /**
   * GET /api/users/me/profile
   * Returns basic user profile - in V9.7 this should forward to user-service
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
          preferences: true,
          created_at: true,
          last_active_at: true,
          region: true,
          timezone: true,
          language_preference: true,
          profile_picture_url: true
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
          profilePictureUrl: user.profile_picture_url,
          preferences: user.preferences,
          createdAt: user.created_at,
          lastLoginAt: user.last_active_at,
          region: user.region,
          timezone: user.timezone,
          languagePreference: user.language_preference
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

  /**
   * GET /api/users/me/growth-profile
   * Returns user growth profile information
   */
  getGrowthProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // TODO: Implement growth profile logic or forward to user-service
      res.json({
        success: true,
        data: {
          userId: userId,
          growthScore: 75,
          level: 'Intermediate',
          streakDays: 14,
          totalSessions: 42,
          areasOfFocus: ['Mindfulness', 'Goal Setting', 'Productivity'],
          achievements: ['First Week', 'Consistency Champion']
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
   * Returns dashboard growth summary
   */
  getDashboardGrowthSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // TODO: Implement dashboard growth summary logic or forward to user-service
      res.json({
        success: true,
        data: {
          userId: userId,
          summary: {
            weeklyProgress: 85,
            monthlyGoals: 3,
            completedGoals: 1,
            upcomingMilestones: 2,
            recentAchievements: ['Mindful Monday', 'Weekly Reflection']
          }
        }
      });

    } catch (error) {
      console.error('Error in getDashboardGrowthSummary:', error);
      res.status(500).json({ 
        error: 'Failed to get dashboard growth summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
} 