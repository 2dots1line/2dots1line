/**
 * Error-related type definitions
 */

/**
 * Base error interface
 */
export interface IBaseError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Error categories
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  SERVER = 'server',
  EXTERNAL = 'external'
}

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Validation errors
  INVALID_INPUT = 'invalid_input',
  MISSING_FIELD = 'missing_field',
  MALFORMED_DATA = 'malformed_data',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'invalid_credentials',
  EXPIRED_TOKEN = 'expired_token',
  INVALID_TOKEN = 'invalid_token',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  FORBIDDEN = 'forbidden',
  
  // Not found errors
  RESOURCE_NOT_FOUND = 'resource_not_found',
  
  // Conflict errors
  DUPLICATE_RESOURCE = 'duplicate_resource',
  RESOURCE_LOCKED = 'resource_locked',
  
  // Server errors
  INTERNAL_ERROR = 'internal_error',
  DATABASE_ERROR = 'database_error',
  
  // External errors
  SERVICE_UNAVAILABLE = 'service_unavailable',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  EXTERNAL_SERVICE_ERROR = 'external_service_error'
} 