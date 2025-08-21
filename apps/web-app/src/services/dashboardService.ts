/**
 * Dashboard Service - Frontend API client for dashboard data
 * V11.0 - Dashboard data integration with API Gateway
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface GrowthDimension {
  key: string;
  name: string;
  score: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  percentageOfMax: number;
  description: string;
  color: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: string;
  createdAt: string;
  relatedEntities: string[];
}

export interface RecentActivity {
  id: string;
  type: 'journal' | 'conversation' | 'insight' | 'growth';
  title: string;
  description: string;
  timestamp: string;
  dimension?: string;
}

export interface DashboardMetrics {
  totalMemories: number;
  activeInsights: number;
  growthEvents: number;
  daysActive: number;
}

export interface GrowthRecommendation {
  dimension: string;
  recommendation: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'High' | 'Medium' | 'Low';
}

export interface DashboardData {
  metrics: DashboardMetrics;
  growthProfile: GrowthDimension[];
  recentInsights: Insight[];
  recentActivity: RecentActivity[];
  recommendations: GrowthRecommendation[];
}

export interface GetDashboardResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
}

class DashboardService {
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // In development, use dev-token for testing
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      headers['Authorization'] = 'Bearer dev-token';
    } else {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<GetDashboardResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/data`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        success: false,
        error: 'Failed to fetch dashboard data'
      };
    }
  }

  /**
   * Get growth profile data
   */
  async getGrowthProfile(): Promise<GrowthDimension[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/growth-profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.growthProfile || [];
    } catch (error) {
      console.error('Error fetching growth profile:', error);
      return [];
    }
  }

  /**
   * Get recent insights
   */
  async getRecentInsights(limit: number = 10): Promise<Insight[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/insights?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.insights || [];
    } catch (error) {
      console.error('Error fetching recent insights:', error);
      return [];
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/recent-events?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/summary`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.metrics || {
        totalMemories: 0,
        activeInsights: 0,
        growthEvents: 0,
        daysActive: 0
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return {
        totalMemories: 0,
        activeInsights: 0,
        growthEvents: 0,
        daysActive: 0
      };
    }
  }
}

export const dashboardService = new DashboardService();
