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

// New dynamic dashboard interfaces
export interface DashboardSectionItem {
  id: string;
  title: string;
  content: string;
  confidence?: number;
  actionability?: string;
  priority?: number;
  created_at: string;
  metadata?: any;
}

export interface DashboardSection {
  section_type: string;
  title: string;
  items: DashboardSectionItem[];
  total_count: number;
  last_updated: string;
}

export interface DynamicDashboardData {
  user_id: string;
  cycle_id: string;
  generated_at: string;
  sections: {
    insights: DashboardSection;
    patterns: DashboardSection;
    recommendations: DashboardSection;
    synthesis: DashboardSection;
    identified_patterns: DashboardSection;
    emerging_themes: DashboardSection;
    focus_areas: DashboardSection;
    blind_spots: DashboardSection;
    celebration_moments: DashboardSection;
    reflection_prompts: DashboardSection;
    exploration_prompts: DashboardSection;
    goal_setting_prompts: DashboardSection;
    skill_development_prompts: DashboardSection;
    creative_expression_prompts: DashboardSection;
    recent_cards: DashboardSection;
    growth_dimensions: DashboardSection;
    growth_insights: DashboardSection;
    growth_focus_areas: DashboardSection;
  };
  cycle_info: {
    cycle_id: string;
    cycle_start_date: string;
    cycle_end_date: string;
    status: string;
    processing_duration_ms?: number;
    artifacts_created: number;
    prompts_created: number;
  };
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

  // New dynamic dashboard methods

  /**
   * Get dynamic dashboard data for the most recent cycle
   */
  async getDynamicDashboard(): Promise<{ success: boolean; data?: DynamicDashboardData; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dynamic dashboard:', error);
      return {
        success: false,
        error: 'Failed to fetch dynamic dashboard data'
      };
    }
  }

  /**
   * Get dynamic dashboard data for a specific cycle
   */
  async getDynamicDashboardForCycle(cycleId: string): Promise<{ success: boolean; data?: DynamicDashboardData; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/cycle/${cycleId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dynamic dashboard for cycle:', error);
      return {
        success: false,
        error: 'Failed to fetch dynamic dashboard data for cycle'
      };
    }
  }

  /**
   * Get available cycles for the user
   */
  async getUserCycles(limit: number = 10): Promise<{ success: boolean; data?: { cycles: any[]; total: number }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/cycles?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user cycles:', error);
      return {
        success: false,
        error: 'Failed to fetch user cycles'
      };
    }
  }

  /**
   * Get cycle statistics for the user
   */
  async getUserCycleStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user cycle stats:', error);
      return {
        success: false,
        error: 'Failed to fetch user cycle statistics'
      };
    }
  }

  /**
   * Get recent cards for the magazine tab
   */
  async getRecentCards(limit: number = 5): Promise<{ success: boolean; data?: any[]; error?: string }> {
    console.log('🚀 getRecentCards called with limit:', limit);
    try {
      // Fetch concept cards
      const conceptResponse = await fetch(`${API_BASE_URL}/api/v1/cards?limit=${Math.ceil(limit/2)}&sort_by=created_at&sort_order=desc&card_type=concept`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      // Fetch memory unit cards
      const memoryUnitResponse = await fetch(`${API_BASE_URL}/api/v1/cards?limit=${Math.ceil(limit/2)}&sort_by=created_at&sort_order=desc&card_type=memoryunit`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!conceptResponse.ok || !memoryUnitResponse.ok) {
        throw new Error(`HTTP error: concept=${conceptResponse.status}, memoryunit=${memoryUnitResponse.status}`);
      }

      const conceptData = await conceptResponse.json();
      const memoryUnitData = await memoryUnitResponse.json();
      
      // Combine and limit results
      const allCards = [
        ...(conceptData.success && conceptData.data?.cards ? conceptData.data.cards : []),
        ...(memoryUnitData.success && memoryUnitData.data?.cards ? memoryUnitData.data.cards : [])
      ].slice(0, limit);
      
      console.log('getRecentCards - concept cards:', conceptData.data?.cards?.length || 0);
      console.log('getRecentCards - memory unit cards:', memoryUnitData.data?.cards?.length || 0);
      console.log('getRecentCards - combined cards:', allCards.length);
      console.log('getRecentCards - card types:', allCards.map(c => c.type));
      
      return {
        success: true,
        data: allCards
      };
    } catch (error) {
      console.error('Error fetching recent cards:', error);
      return {
        success: false,
        error: `Failed to fetch recent cards: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get growth events for the growth trajectory tab
   */
  async getGrowthEvents(limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // Use existing dashboard endpoint since growth-events endpoint doesn't exist
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Check if growth_events exist in the data
        const growthEvents = data.data.growth_events || [];
        return {
          success: true,
          data: growthEvents.slice(0, limit)
        };
      } else {
        return {
          success: true,
          data: []
        };
      }
    } catch (error) {
      console.error('Error fetching growth events:', error);
      return {
        success: false,
        error: 'Failed to fetch growth events'
      };
    }
  }

  /**
   * Get growth trajectory data with recent events and next steps
   */
  async getGrowthTrajectoryData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Use existing dashboard endpoint since growth-trajectory endpoint doesn't exist
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          success: true,
          data: {
            growth_events: data.data.growth_events || [],
            recommendations: data.data.sections?.recommendations || []
          }
        };
      } else {
        return {
          success: true,
          data: {
            growth_events: [],
            recommendations: []
          }
        };
      }
    } catch (error) {
      console.error('Error fetching growth trajectory data:', error);
      return {
        success: false,
        error: 'Failed to fetch growth trajectory data'
      };
    }
  }

  /**
   * Get dashboard configuration
   */
  async getDashboardConfig(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/config`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard config:', error);
      return {
        success: false,
        error: 'Failed to fetch dashboard config'
      };
    }
  }

  /**
   * Get data for a specific dashboard section
   */
  async getDashboardSection(sectionType: string, cycleId?: string): Promise<{ success: boolean; data?: { section: DashboardSection; cycle_info: any }; error?: string }> {
    try {
      const url = cycleId 
        ? `${API_BASE_URL}/api/v1/dashboard/section/${sectionType}?cycleId=${cycleId}`
        : `${API_BASE_URL}/api/v1/dashboard/section/${sectionType}`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard section:', error);
      return {
        success: false,
        error: 'Failed to fetch dashboard section'
      };
    }
  }

  /**
   * Get proactive greeting from the most recent processed conversation
   */
  async getProactiveGreeting(): Promise<{ success: boolean; data?: { greeting: string | null; conversationTitle?: string; updatedAt?: string; message?: string }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/greeting`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching proactive greeting:', error);
      return {
        success: false,
        error: 'Failed to fetch proactive greeting'
      };
    }
  }
}

export const dashboardService = new DashboardService();
