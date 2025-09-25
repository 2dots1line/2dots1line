/**
 * DashboardService - Comprehensive dashboard data aggregation
 * V11.0 - Provides all data needed for the dashboard UI
 */

import { DatabaseService, GrowthEventRepository, DerivedArtifactRepository, MemoryRepository, ConceptRepository } from '@2dots1line/database';

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

export class DashboardService {
  private growthEventRepository: GrowthEventRepository;
  private derivedArtifactRepository: DerivedArtifactRepository;
  private memoryRepository: MemoryRepository;
  private conceptRepository: ConceptRepository;

  constructor(databaseService: DatabaseService) {
    this.growthEventRepository = new GrowthEventRepository(databaseService);
    this.derivedArtifactRepository = new DerivedArtifactRepository(databaseService);
    this.memoryRepository = new MemoryRepository(databaseService);
    this.conceptRepository = new ConceptRepository(databaseService);
  }

  /**
   * Get comprehensive dashboard data for a user
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    const [
      metrics,
      growthProfile,
      recentInsights,
      recentActivity
    ] = await Promise.all([
      this.getDashboardMetrics(userId),
      this.getGrowthProfile(userId),
      this.getRecentInsights(userId),
      this.getRecentActivity(userId)
    ]);

    const recommendations = this.generateGrowthRecommendations(growthProfile);

    return {
      metrics,
      growthProfile,
      recentInsights,
      recentActivity,
      recommendations
    };
  }

  /**
   * Get high-level dashboard metrics
   */
  async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    const [totalMemories, activeInsights, growthEvents] = await Promise.all([
      this.memoryRepository.count(userId),
      this.derivedArtifactRepository.count(userId),
      this.growthEventRepository.count(userId)
    ]);

    // Calculate days active (simplified - could be enhanced with actual user activity tracking)
    const daysActive = Math.min(45, Math.floor(growthEvents / 3)); // Rough estimate

    return {
      totalMemories,
      activeInsights,
      growthEvents,
      daysActive
    };
  }

  /**
   * Get six-dimensional growth profile
   */
  async getGrowthProfile(userId: string): Promise<GrowthDimension[]> {
    const dimensions = [
      { key: 'self_know', name: 'Know Self', description: 'Deep reflection and self-awareness', color: 'from-purple-400 to-purple-600' },
      { key: 'self_act', name: 'Act Self', description: 'Personal agency and skill development', color: 'from-blue-400 to-blue-600' },
      { key: 'self_show', name: 'Show Self', description: 'Authentic self-expression', color: 'from-pink-400 to-pink-600' },
      { key: 'world_know', name: 'Know World', description: 'Understanding external knowledge', color: 'from-green-400 to-green-600' },
      { key: 'world_act', name: 'Act World', description: 'Contributing to the world', color: 'from-orange-400 to-orange-600' },
      { key: 'world_show', name: 'Show World', description: 'Sharing wisdom with others', color: 'from-teal-400 to-teal-600' }
    ];

    const growthProfile: GrowthDimension[] = [];

    for (const dimension of dimensions) {
      const events = await this.growthEventRepository.findByDimension(userId, dimension.key, 100);
      
      // Calculate score from growth events
      let score = 0;
      let eventCount = 0;
      
      for (const event of events) {
        if (event.metadata && Array.isArray((event.metadata as any).growth_dimensions)) {
          const dimEvent = (event.metadata as any).growth_dimensions.find((d: any) => d.dim_key === dimension.key);
          if (dimEvent && typeof dimEvent === 'object' && 'delta' in dimEvent && typeof dimEvent.delta === 'number') {
            score += dimEvent.delta;
            eventCount++;
          }
        }
      }

      // Normalize score to 0-1 range and calculate percentage
      const normalizedScore = Math.max(0, Math.min(1, score));
      const percentageOfMax = Math.round(normalizedScore * 100);

      // Determine trend based on recent events
      const recentEvents = events.slice(0, 10);
      const trend = this.calculateTrend(recentEvents, dimension.key);

      growthProfile.push({
        ...dimension,
        score: normalizedScore,
        trend,
        percentageOfMax
      });
    }

    return growthProfile;
  }

  /**
   * Get recent AI-generated insights
   */
  async getRecentInsights(userId: string, limit: number = 10): Promise<Insight[]> {
    const artifacts = await this.derivedArtifactRepository.findByUserId(userId, limit);
    
    return artifacts.map(artifact => ({
      id: artifact.entity_id,
      title: artifact.title,
      description: artifact.content || 'AI-generated insight',
      type: artifact.type,
      createdAt: artifact.created_at.toISOString(),
      relatedEntities: [
        ...(artifact.source_memory_unit_ids || []),
        ...(artifact.source_concept_ids || [])
      ]
    }));
  }

  /**
   * Get recent user activity
   */
  async getRecentActivity(userId: string, limit: number = 20): Promise<RecentActivity[]> {
    const [growthEvents, insights, memories] = await Promise.all([
      this.growthEventRepository.findByUserId(userId, limit / 2),
      this.derivedArtifactRepository.findByUserId(userId, limit / 4),
      this.memoryRepository.findByUserId(userId, limit / 4)
    ]);

    const activities: RecentActivity[] = [];

    // Add growth events
    for (const event of growthEvents) {
      activities.push({
        id: event.entity_id,
        type: 'growth',
        title: `Growth in ${event.source}`,
        description: `Activity in ${event.source}`,
        timestamp: event.created_at.toISOString(),
        dimension: this.extractPrimaryDimension((event.metadata as any)?.growth_dimensions)
      });
    }

    // Add insights
    for (const insight of insights) {
      activities.push({
        id: insight.entity_id,
        type: 'insight',
        title: insight.title,
        description: insight.content || 'New insight discovered',
        timestamp: insight.created_at.toISOString()
      });
    }

    // Add memories
    for (const memory of memories) {
      activities.push({
        id: memory.entity_id,
        type: 'journal',
        title: memory.title,
        description: memory.content.substring(0, 100) + (memory.content.length > 100 ? '...' : ''),
        timestamp: memory.created_at.toISOString()
      });
    }

    // Sort by timestamp and return limited results
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Generate growth recommendations based on current profile
   */
  private generateGrowthRecommendations(growthProfile: GrowthDimension[]): GrowthRecommendation[] {
    const recommendations: GrowthRecommendation[] = [];

    // Find dimensions with lowest scores
    const sortedDimensions = [...growthProfile].sort((a, b) => a.percentageOfMax - b.percentageOfMax);
    const lowestDimensions = sortedDimensions.slice(0, 2);

    for (const dimension of lowestDimensions) {
      if (dimension.percentageOfMax < 50) {
        recommendations.push({
          dimension: dimension.name,
          recommendation: this.getRecommendationForDimension(dimension.key, dimension.percentageOfMax),
          impact: 'High',
          effort: dimension.percentageOfMax < 25 ? 'Low' : 'Medium'
        });
      }
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        dimension: 'General Growth',
        recommendation: 'Continue exploring and reflecting on your experiences to maintain balanced growth across all dimensions.',
        impact: 'Medium',
        effort: 'Low'
      });
    }

    return recommendations;
  }

  /**
   * Calculate trend based on recent events
   */
  private calculateTrend(events: any[], dimensionKey: string): 'increasing' | 'stable' | 'decreasing' {
    if (events.length < 2) return 'stable';

    const recentScores = events
      .map(event => {
        if (event.growth_dimensions && Array.isArray(event.growth_dimensions)) {
          const dimEvent = event.growth_dimensions.find((d: any) => d.dim_key === dimensionKey);
          if (dimEvent && typeof dimEvent === 'object' && 'delta' in dimEvent && typeof dimEvent.delta === 'number') {
            return dimEvent.delta;
          }
        }
        return 0;
      })
      .filter(score => score !== 0);

    if (recentScores.length < 2) return 'stable';

    const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
    const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    
    if (difference > 0.1) return 'increasing';
    if (difference < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Extract primary dimension from growth event
   */
  private extractPrimaryDimension(growthDimensions: any): string | undefined {
    if (!growthDimensions || !Array.isArray(growthDimensions)) return undefined;
    
    const primaryDim = growthDimensions.reduce((max: any, current: any) => {
      return (current.delta || 0) > (max.delta || 0) ? current : max;
    }, { delta: 0, dim_key: undefined });

    return primaryDim.dim_key;
  }

  /**
   * Get specific recommendation for a dimension
   */
  private getRecommendationForDimension(dimensionKey: string, percentage: number): string {
    const recommendations: Record<string, string> = {
      'self_know': 'Consider starting a daily reflection practice or journaling to deepen self-awareness.',
      'self_act': 'Set small, achievable goals and track your progress to build personal agency.',
      'self_show': 'Express your thoughts and feelings more openly through creative outlets or conversations.',
      'world_know': 'Explore new topics, read diverse perspectives, or take courses to expand your knowledge.',
      'world_act': 'Look for opportunities to contribute to your community or help others.',
      'world_show': 'Share your insights and experiences with others through teaching, writing, or mentoring.'
    };

    return recommendations[dimensionKey] || 'Focus on this dimension through regular practice and reflection.';
  }
}
