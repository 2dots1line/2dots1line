// apps/api-gateway/src/controllers/auth.controller.ts
// V11.0 Architecture - Direct service injection, no HTTP calls

import { Request, Response } from 'express';
import type { TApiResponse, TRegisterRequest, TLoginRequest } from '@2dots1line/shared-types';
import { AuthService, type AuthResult } from '@2dots1line/user-service';
import jwt from 'jsonwebtoken';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData = req.body as TRegisterRequest;
      const result: AuthResult = await this.authService.register({
        email: registerData.email,
        name: registerData.name,
        password: registerData.password,
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            user: result.user,
            token: result.token
          },
          message: result.message
        } as TApiResponse<any>);
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: result.message || 'Registration failed'
          }
        } as TApiResponse<any>);
      }
    } catch (error) {
      console.error('Error in auth controller register:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData = req.body as TLoginRequest;
      const result: AuthResult = await this.authService.authenticate({
        email: loginData.email,
        password: loginData.password,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            user: result.user,
            token: result.token
          },
          message: result.message
        } as TApiResponse<any>);
      } else {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: result.message || 'Authentication failed'
          }
        } as TApiResponse<any>);
      }
    } catch (error) {
      console.error('Error in auth controller login:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
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
      const user = await this.authService.validateToken(token);
      
      if (user) {
        // Generate new token
        const result = await this.authService.authenticate({ email: user.email });
        res.status(200).json({
          success: true,
          data: {
            user: result.user,
            token: result.token
          },
          message: 'Token refreshed successfully'
        } as TApiResponse<any>);
      } else {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token'
          }
        } as TApiResponse<any>);
      }
    } catch (error) {
      console.error('Error in auth controller refresh token:', error);
      res.status(500).json({ 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
    }
  };

  verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: { code: 'NO_TOKEN', message: 'No token provided' }
        } as TApiResponse<any>);
        return;
      }

      const token = authHeader.substring(7);
      const user = await this.authService.validateToken(token);
      
      if (user) {
        // Token is valid - check if near expiry and auto-refresh
        const decoded = jwt.decode(token) as any;
        const expiresIn = decoded.exp * 1000 - Date.now();
        const shouldRefresh = expiresIn < 2 * 60 * 60 * 1000; // < 2 hours
        
        if (shouldRefresh) {
          const result = await this.authService.authenticate({ email: user.email });
          res.status(200).json({
            success: true,
            data: { user: result.user, token: result.token, refreshed: true }
          } as TApiResponse<any>);
        } else {
          res.status(200).json({
            success: true,
            data: { user, refreshed: false }
          } as TApiResponse<any>);
        }
      } else {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' }
        } as TApiResponse<any>);
      }
    } catch (error) {
      console.error('Error in auth controller verify token:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Token verification failed' }
      } as TApiResponse<any>);
    }
  };
}
