/**
 * User Service - V11.0 Headless Service Exports
 * Pure business logic classes without HTTP concerns
 */
export { UserService } from './UserService';
export { AuthService } from './AuthService';

// Export types for API Gateway usage
export type { AuthResult, LoginCredentials, RegisterData } from './AuthService'; 