import { environmentLoader } from '@2dots1line/core-utils';
import { DatabaseService, UserRepository } from '@2dots1line/database';
import type { users as User } from '@2dots1line/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { UserService } from './UserService';

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = environmentLoader.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production';

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string; // For future password-based auth
}

export interface RegisterData {
  email: string;
  name?: string;
  password?: string; // For future password-based auth
}

/**
 * AuthService - Pure authentication business logic
 * V11.0 Headless Service - No HTTP dependencies
 */
export class AuthService {
  private userRepository: UserRepository;
  private userService: UserService;

  constructor(databaseService: DatabaseService) {
    this.userRepository = new UserRepository(databaseService);
    this.userService = new UserService(databaseService);
  }

  /**
   * Authenticate user (simplified for current system)
   * Note: This is a basic implementation - expand for production auth
   */
  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(credentials.email);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // For now, we'll accept any user that exists
      // TODO: Add proper password verification when implemented
      return {
        success: true,
        user,
        token: this.generateToken(user), // Now generates proper JWT
        message: 'Authentication successful'
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      
      if (existingUser) {
        return {
          success: false,
          message: 'User already exists'
        };
      }

      // Hash password if provided
      let hashedPassword: string | undefined = undefined;
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 10);
      }

      // Create new user with automatic concept creation and onboarding
      const newUser = await this.userService.createUser({
        email: userData.email,
        name: userData.name,
        preferences: undefined,
        profileImageUrl: undefined
      });

      // Update the user with hashed password if provided
      if (hashedPassword) {
        await this.userRepository.update(newUser.user_id, {
          hashed_password: hashedPassword
        });
      }

      return {
        success: true,
        user: newUser,
        token: this.generateToken(newUser), // Now generates proper JWT
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }

  /**
   * Validate a token and return user
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      // Development mode - allow special dev token
      if (NODE_ENV === 'development' && token === 'dev-token') {
        return await this.userRepository.findById('dev-user-123');
      }

      // Check if it's a legacy custom token format
      if (token.startsWith('token_')) {
        const userId = this.extractUserIdFromLegacyToken(token);
        if (!userId) return null;
        return await this.userRepository.findById(userId);
      }

      // Try JWT token verification
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return await this.userRepository.findById(decoded.userId);
      } catch (jwtError) {
        console.error('JWT validation failed:', jwtError);
        return null;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Generate a proper JWT token
   */
  private generateToken(user: User): string {
    const payload = {
      userId: user.user_id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, JWT_SECRET);
  }

  /**
   * Extract user ID from legacy token format (for backward compatibility)
   */
  private extractUserIdFromLegacyToken(token: string): string | null {
    try {
      const parts = token.split('_');
      if (parts.length >= 2 && parts[0] === 'token') {
        return parts[1];
      }
      return null;
    } catch {
      return null;
    }
  }
}