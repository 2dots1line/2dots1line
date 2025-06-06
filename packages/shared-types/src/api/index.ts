/**
 * API-related type definitions
 */

/**
 * Base API request
 */
export interface IApiRequest {
  /** Access token or API key */
  token?: string;
}

/**
 * Base API response
 */
export interface IApiResponse {
  /** Request success status */
  success: boolean;
  /** Error message if success is false */
  error?: string;
  /** Error code if applicable */
  errorCode?: string;
}

// Re-export specific API types (to be added)

/**
 * Export all API types
 */
export * from './common.types';
export * from './user.api.types';
export * from './chat.api.types';
export * from './memory.api.types'; 