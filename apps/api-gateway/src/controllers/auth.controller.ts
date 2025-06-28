/**
 * Auth Controller - Authentication and Authorization
 * Handles user registration, login, logout, and token refresh
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '@2dots1line/database';

export class AuthController {
  private databaseService: DatabaseService;
  private jwtSecret: string;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  }

  /**
   * POST /api/auth/register
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
        return;
      }

      // Check if user already exists
      const existingUser = await this.databaseService.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
        return;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await this.databaseService.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          hashed_password: hashedPassword,
          name: name || null,
          region: 'us',
          timezone: 'UTC',
          language_preference: 'en',
          account_status: 'active'
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: newUser.user_id, 
          email: newUser.email 
        },
        this.jwtSecret,
        { expiresIn: '7d' }
      );

      // Return user data (without password) and token
      const userResponse = {
        user_id: newUser.user_id,
        email: newUser.email,
        name: newUser.name,
        region: newUser.region,
        timezone: newUser.timezone,
        language_preference: newUser.language_preference,
        profile_picture_url: newUser.profile_picture_url,
        created_at: newUser.created_at.toISOString(),
        last_active_at: newUser.last_active_at?.toISOString(),
        account_status: newUser.account_status
      };

      res.status(201).json({
        success: true,
        data: {
          user: userResponse,
          token
        },
        message: 'User registered successfully'
      });
    } catch (error) {
      console.error('Error in register:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
  };

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  login = async (req: Request, res: Response): Promise<void> => {
    console.log('AuthController.login called with body:', req.body);
    
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      // Find user
      const user = await this.databaseService.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user || !user.hashed_password) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      // Update last active timestamp
      await this.databaseService.prisma.user.update({
        where: { user_id: user.user_id },
        data: { last_active_at: new Date() }
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.user_id, 
          email: user.email 
        },
        this.jwtSecret,
        { expiresIn: '7d' }
      );

      // Return user data (without password) and token
      const userResponse = {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        region: user.region,
        timezone: user.timezone,
        language_preference: user.language_preference,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at.toISOString(),
        last_active_at: new Date().toISOString(),
        account_status: user.account_status
      };

      res.status(200).json({
        success: true,
        data: {
          user: userResponse,
          token
        },
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed. Please try again.'
      });
    }
  };

  /**
   * POST /api/auth/logout
   * Logout user (client-side token removal)
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a JWT-based system, logout is typically handled client-side
      // by removing the token from storage. Server-side logout would
      // require token blacklisting, which we're not implementing here.
      
      res.status(200).json({
        success: true,
        message: 'Logout successful. Please remove the token from your client.'
      });
    } catch (error) {
      console.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  };

  /**
   * POST /api/auth/refresh
   * Refresh JWT token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token is required'
        });
        return;
      }

      // Verify the current token
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      // Generate new token
      const newToken = jwt.sign(
        { 
          userId: decoded.userId, 
          email: decoded.email 
        },
        this.jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        data: { token: newToken },
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      console.error('Error in refreshToken:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  };
} 