/**
 * User Controller - V9.7 Simplified User Profile API
 * In V9.7, most user operations will be forwarded to a user-service
 */

import { Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import type { TApiResponse } from '@2dots1line/shared-types';

export class UserController {
  private userServiceClient: AxiosInstance;

  constructor() {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    this.userServiceClient = axios.create({
      baseURL: userServiceUrl
    });
  }

  /**
   * GET /api/users/me/profile
   * Returns basic user profile - in V9.7 this should forward to user-service
   */
  getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // The user ID should be extracted from a validated JWT token by middleware
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const response = await this.userServiceClient.get<TApiResponse<any>>(`/api/v1/users/${userId}/profile`);
      res.status(response.status).json(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        console.error('Error in api-gateway getUserProfile proxy:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
    }
  };

  /**
   * GET /api/users/me/growth-profile
   * Returns user growth profile information
   */
  getGrowthProfile = async (req: Request, res: Response): Promise<void> => {
    res.status(511).json({ success: false, message: 'Not Implemented - Please proxy to user-service' });
  };

  /**
   * GET /api/users/me/dashboard/growth-summary
   * Returns dashboard growth summary
   */
  getDashboardGrowthSummary = async (req: Request, res: Response): Promise<void> => {
    res.status(511).json({ success: false, message: 'Not Implemented - Please proxy to user-service' });
  };
} 