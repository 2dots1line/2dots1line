// apps/api-gateway/src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import type { TApiResponse, TRegisterRequest, TLoginRequest } from '@2dots1line/shared-types';

export class AuthController {
  private userServiceClient: AxiosInstance;

  constructor() {
    // Default URL for local development. In production, this comes from env vars.
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3003';
    this.userServiceClient = axios.create({
      baseURL: userServiceUrl,
      headers: { 'Content-Type': 'application/json' },
    });
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
      const response = await this.userServiceClient.post<TApiResponse<any>>('/api/v1/auth/refresh', req.body);
      res.status(response.status).json(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        console.error('Error in api-gateway refresh token proxy:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
    }
  };
}
