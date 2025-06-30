// apps/api-gateway/src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import jwt from 'jsonwebtoken';
import type { TApiResponse, TRegisterRequest, TLoginRequest } from '@2dots1line/shared-types';

export class AuthController {
  private userServiceClient: AxiosInstance;
  private jwtSecret: string;

  constructor() {
    // Default URL for local development. In production, this comes from env vars.
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    this.userServiceClient = axios.create({
      baseURL: userServiceUrl,
      headers: { 'Content-Type': 'application/json' },
    });
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await this.userServiceClient.post<TApiResponse<any>>('/api/v1/auth/register', req.body as TRegisterRequest);
      res.status(response.status).json(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        console.error('Error in api-gateway register proxy:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await this.userServiceClient.post<TApiResponse<any>>('/api/v1/auth/login', req.body as TLoginRequest);
      res.status(response.status).json(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        console.error('Error in api-gateway login proxy:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove the token from your client.'
    });
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ success: false, error: 'Token is required' });
        return;
      }
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const newToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, this.jwtSecret, { expiresIn: '7d' });
      res.status(200).json({ success: true, data: { token: newToken }, message: 'Token refreshed successfully' });
    } catch (error) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  };
}
