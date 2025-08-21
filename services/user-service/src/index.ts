/**
 * User Service - V11.0 Headless Service Exports
 * Pure business logic classes without HTTP concerns
 */
export { UserService } from './UserService';
export { AuthService } from './AuthService';
export { DashboardService } from './DashboardService';

// Export types for API Gateway usage
export type { AuthResult, LoginCredentials, RegisterData } from './AuthService';
export type { 
  DashboardData, 
  GrowthDimension, 
  Insight, 
  RecentActivity, 
  DashboardMetrics, 
  GrowthRecommendation 
} from './DashboardService'; 