/**
 * DashboardController.ts
 * V9.7 API Controller for dynamic dashboard endpoints
 */

import { Request, Response } from 'express';
import { DashboardService } from '@2dots1line/database';
import { DatabaseService } from '@2dots1line/database';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor(private dbService: DatabaseService) {
    this.dashboardService = new DashboardService(dbService);
  }

  /**
   * GET /api/v1/dashboard
   * Get dashboard data for the current user's most recent cycle
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const dashboardData = await this.dashboardService.getDashboardData(userId);
      
      if (!dashboardData) {
        res.status(404).json({ 
          error: 'No dashboard data available',
          message: 'No completed cycles found for this user'
        });
        return;
      }

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('[DashboardController] Error getting dashboard:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to retrieve dashboard data'
      });
    }
  }

  /**
   * GET /api/v1/dashboard/cycle/:cycleId
   * Get dashboard data for a specific cycle
   */
  async getDashboardForCycle(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { cycleId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!cycleId) {
        res.status(400).json({ error: 'Cycle ID is required' });
        return;
      }

      const dashboardData = await this.dashboardService.getDashboardDataForCycle(userId, cycleId);
      
      if (!dashboardData) {
        res.status(404).json({ 
          error: 'Dashboard data not found',
          message: 'Cycle not found or does not belong to this user'
        });
        return;
      }

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('[DashboardController] Error getting dashboard for cycle:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to retrieve dashboard data for cycle'
      });
    }
  }

  /**
   * GET /api/v1/dashboard/cycles
   * Get available cycles for the current user
   */
  async getUserCycles(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const cycles = await this.dashboardService.getUserCycles(userId, limit);

      res.json({
        success: true,
        data: {
          cycles,
          total: cycles.length
        }
      });
    } catch (error) {
      console.error('[DashboardController] Error getting user cycles:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to retrieve user cycles'
      });
    }
  }

  /**
   * GET /api/v1/dashboard/stats
   * Get cycle statistics for the current user
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const stats = await this.dashboardService.getUserCycleStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[DashboardController] Error getting user stats:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to retrieve user statistics'
      });
    }
  }

  /**
   * GET /api/v1/dashboard/section/:sectionType
   * Get data for a specific dashboard section
   */
  async getDashboardSection(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { sectionType } = req.params;
      const cycleId = req.query.cycleId as string;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!sectionType) {
        res.status(400).json({ error: 'Section type is required' });
        return;
      }

      // Get dashboard data (either for specific cycle or most recent)
      const dashboardData = cycleId 
        ? await this.dashboardService.getDashboardDataForCycle(userId, cycleId)
        : await this.dashboardService.getDashboardData(userId);

      if (!dashboardData) {
        res.status(404).json({ 
          error: 'Dashboard data not found',
          message: 'No data available for the specified cycle'
        });
        return;
      }

      const section = dashboardData.sections[sectionType as keyof typeof dashboardData.sections];
      
      if (!section) {
        res.status(404).json({ 
          error: 'Section not found',
          message: `Section type '${sectionType}' does not exist`
        });
        return;
      }

      res.json({
        success: true,
        data: {
          section,
          cycle_info: dashboardData.cycle_info
        }
      });
    } catch (error) {
      console.error('[DashboardController] Error getting dashboard section:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to retrieve dashboard section'
      });
    }
  }

  /**
   * GET /api/v1/dashboard/config
   * Get dashboard configuration
   */
  async getDashboardConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await this.dashboardService.getDashboardConfig();
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('[DashboardController] Error getting dashboard config:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to retrieve dashboard configuration'
      });
    }
  }
}
