import { DatabaseService, UserRepository } from '@2dots1line/database';
import type { users as User } from '@2dots1line/database';

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

  constructor(databaseService: DatabaseService) {
    this.userRepository = new UserRepository(databaseService);
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
        token: this.generateToken(user), // Simple token generation
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

      // Create new user
      const newUser = await this.userRepository.create({
        email: userData.email,
        name: userData.name,
        // TODO: Hash password when password auth is implemented
      });

      return {
        success: true,
        user: newUser,
        token: this.generateToken(newUser),
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
      // Simple token validation - extract user ID
      // TODO: Implement proper JWT validation in production
      const userId = this.extractUserIdFromToken(token);
      if (!userId) return null;

      return await this.userRepository.findById(userId);
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Generate a simple token (replace with JWT in production)
   */
  private generateToken(user: User): string {
    // Simple token format: "token_<userId>_<timestamp>"
    // TODO: Replace with proper JWT implementation
    return `token_${user.user_id}_${Date.now()}`;
  }

  /**
   * Extract user ID from token
   */
  private extractUserIdFromToken(token: string): string | null {
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