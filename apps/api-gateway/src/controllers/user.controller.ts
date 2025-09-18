/**
 * User Controller - V11.0 Headless Architecture
 * Direct service injection, no HTTP calls to other services
 */

import { Request, Response } from 'express';
import type { TApiResponse } from '@2dots1line/shared-types';
import { UserService, DashboardService, type DashboardData } from '@2dots1line/user-service';

export class UserController {
  private userService: UserService;
  private dashboardService: DashboardService;

  constructor(userService: UserService, dashboardService: DashboardService) {
    this.userService = userService;
    this.dashboardService = dashboardService;
  }

  /**
   * GET /api/users/me/profile
   * Returns basic user profile using direct UserService call
   */
  getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // The user ID should be extracted from a validated JWT token by middleware
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized'
          }
        } as TApiResponse<any>);
        return;
      }
      
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        } as TApiResponse<any>);
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          profileImageUrl: user.profile_picture_url,
          preferences: user.preferences,
          createdAt: user.created_at,
          // Note: users table doesn't have updated_at field in current schema
        }
      } as TApiResponse<any>);
    } catch (error) {
      console.error('Error in user controller getUserProfile:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
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
        res.status(401).json({ 
          success: false, 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized'
          }
        } as TApiResponse<any>);
        return;
      }

      const growthProfile = await this.dashboardService.getGrowthProfile(userId);
      
      res.status(200).json({
        success: true,
        data: {
          growthProfile
        }
      } as TApiResponse<any>);
    } catch (error) {
      console.error('Error in user controller getGrowthProfile:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
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
        res.status(401).json({ 
          success: false, 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized'
          }
        } as TApiResponse<any>);
        return;
      }

      const metrics = await this.dashboardService.getDashboardMetrics(userId);
      
      res.status(200).json({
        success: true,
        data: {
          metrics
        }
      } as TApiResponse<any>);
    } catch (error) {
      console.error('Error in user controller getDashboardGrowthSummary:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/users/:userId
   * Returns user data including proactive greeting and conversation context
   */
  getUserData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      if (!userId) {
        res.status(400).json({ 
          success: false, 
          error: {
            code: 'BAD_REQUEST',
            message: 'User ID is required'
          }
        } as TApiResponse<any>);
        return;
      }
      
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        } as TApiResponse<any>);
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          profile_picture_url: user.profile_picture_url,
          preferences: user.preferences,
          created_at: user.created_at,
          next_conversation_context_package: user.next_conversation_context_package,
          memory_profile: user.memory_profile
        }
      } as TApiResponse<any>);
    } catch (error) {
      console.error('Error in user controller getUserData:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/dashboard/insights
   * Returns recent insights for the user
   */
  getRecentInsights = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized'
          }
        } as TApiResponse<any>);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const insights = await this.dashboardService.getRecentInsights(userId, limit);
      
      res.status(200).json({
        success: true,
        data: {
          insights
        }
      } as TApiResponse<any>);
    } catch (error) {
      console.error('Error in user controller getRecentInsights:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/dashboard/recent-events
   * Returns recent activity for the user
   */
  getRecentActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized'
          }
        } as TApiResponse<any>);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const events = await this.dashboardService.getRecentActivity(userId, limit);
      
      res.status(200).json({
        success: true,
        data: {
          events
        }
      } as TApiResponse<any>);
    } catch (error) {
      console.error('Error in user controller getRecentActivity:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/dashboard/data
   * Returns comprehensive dashboard data
   */
  getDashboardData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized'
          }
        } as TApiResponse<any>);
        return;
      }

      const dashboardData = await this.dashboardService.getDashboardData(userId);
      
      res.status(200).json({
        success: true,
        data: dashboardData
      } as TApiResponse<DashboardData>);
    } catch (error) {
      console.error('Error in user controller getDashboardData:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
    }
  };
} 