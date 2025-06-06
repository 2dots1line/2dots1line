/**
 * API types for Authentication and User management
 */
import type { TUser } from '../entities/user.types';

/**
 * Request payload for user login
 */
export interface TLoginRequest {
  email: string;
  password?: string; // For password-based login
  id_token?: string; // For OAuth/social login
}

/**
 * Response payload for successful login
 */
export interface TLoginResponse {
  token: string; // JWT token
  user: TUser;
}

/**
 * Request payload for user registration
 */
export interface TRegisterRequest {
  email: string;
  password?: string;
  name?: string;
  region: 'us' | 'cn';
}

/**
 * Response payload for successful registration
 */
export interface TRegisterResponse {
  user: TUser;
}

/**
 * Request payload for updating user preferences
 */
export interface TUpdateUserPreferencesRequest {
  preferences: Record<string, any>;
} 