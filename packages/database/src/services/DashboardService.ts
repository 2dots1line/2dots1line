/**
 * DashboardService.ts
 * V9.7 Service for dynamic dashboard data aggregation and section generation
 * 
 * Implements the simplified 1-to-1 mapping from insight worker outputs to dashboard sections
 */

import { DatabaseService } from '../DatabaseService';
import { UserCycleRepository } from '../repositories/UserCycleRepository';

export interface DashboardSectionData {
  section_type: string;
  title: string;
  items: Array<{
    id: string;
    title: string;
    content: string;
    confidence?: number;
    actionability?: string;
    priority?: number;
    created_at: string;
    metadata?: any;
  }>;
  total_count: number;
  last_updated: string;
}

export interface DashboardData {
  user_id: string;
  cycle_id: string;
  generated_at: string;
  sections: {
    insights: DashboardSectionData;
    patterns: DashboardSectionData;
    recommendations: DashboardSectionData;
    synthesis: DashboardSectionData;
    identified_patterns: DashboardSectionData;
    emerging_themes: DashboardSectionData;
    focus_areas: DashboardSectionData;
    blind_spots: DashboardSectionData;
    celebration_moments: DashboardSectionData;
    reflection_prompts: DashboardSectionData;
    exploration_prompts: DashboardSectionData;
    goal_setting_prompts: DashboardSectionData;
    skill_development_prompts: DashboardSectionData;
    creative_expression_prompts: DashboardSectionData;
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

export class DashboardService {
  constructor(private db: DatabaseService) {}

  /**
   * Get dashboard data for a user's most recent completed cycle
   */
  async getDashboardData(userId: string): Promise<DashboardData | null> {
    try {
      // Get the most recent completed cycle
      const userCycleRepo = new UserCycleRepository(this.db);
      const recentCycles = await userCycleRepo.findCompletedCycles(userId, 1);
      
      if (recentCycles.length === 0) {
        console.log(`[DashboardService] No completed cycles found for user ${userId}`);
        return null;
      }

      const cycle = recentCycles[0];
      const cycleId = cycle.cycle_id;

      // Generate all dashboard sections
      const sections = await this.generateDashboardSections(userId, cycleId);

      return {
        user_id: userId,
        cycle_id: cycleId,
        generated_at: new Date().toISOString(),
        sections,
        cycle_info: {
          cycle_id: cycle.cycle_id,
          cycle_start_date: cycle.cycle_start_date.toISOString(),
          cycle_end_date: cycle.cycle_end_date.toISOString(),
          status: cycle.status,
          processing_duration_ms: cycle.processing_duration_ms,
          artifacts_created: cycle.artifacts_created,
          prompts_created: cycle.prompts_created,
        }
      };
    } catch (error) {
      console.error(`[DashboardService] Error getting dashboard data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get dashboard data for a specific cycle
   */
  async getDashboardDataForCycle(userId: string, cycleId: string): Promise<DashboardData | null> {
    try {
      const userCycleRepo = new UserCycleRepository(this.db);
      const cycle = await userCycleRepo.findById(cycleId);
      
      if (!cycle || cycle.user_id !== userId) {
        return null;
      }

      const sections = await this.generateDashboardSections(userId, cycleId);

      return {
        user_id: userId,
        cycle_id: cycleId,
        generated_at: new Date().toISOString(),
        sections,
        cycle_info: {
          cycle_id: cycle.cycle_id,
          cycle_start_date: cycle.cycle_start_date.toISOString(),
          cycle_end_date: cycle.cycle_end_date.toISOString(),
          status: cycle.status,
          processing_duration_ms: cycle.processing_duration_ms,
          artifacts_created: cycle.artifacts_created,
          prompts_created: cycle.prompts_created,
        }
      };
    } catch (error) {
      console.error(`[DashboardService] Error getting dashboard data for cycle ${cycleId}:`, error);
      throw error;
    }
  }

  /**
   * Generate all dashboard sections for a given cycle
   */
  private async generateDashboardSections(userId: string, cycleId: string): Promise<DashboardData['sections']> {
    // Get all derived artifacts for this cycle
    const artifacts = await this.db.prisma.derived_artifacts.findMany({
      where: {
        user_id: userId,
        cycle_id: cycleId
      },
      orderBy: { created_at: 'desc' }
    });

    // Get all proactive prompts for this cycle
    const prompts = await this.db.prisma.proactive_prompts.findMany({
      where: {
        user_id: userId,
        cycle_id: cycleId
      },
      orderBy: { created_at: 'desc' }
    });

    // Generate sections based on artifact types
    const sections = {
      insights: this.createSection('insights', artifacts.filter(a => a.artifact_type === 'insight')),
      patterns: this.createSection('patterns', artifacts.filter(a => a.artifact_type === 'pattern')),
      recommendations: this.createSection('recommendations', artifacts.filter(a => a.artifact_type === 'recommendation')),
      synthesis: this.createSection('synthesis', artifacts.filter(a => a.artifact_type === 'synthesis')),
      identified_patterns: this.createSection('identified_patterns', artifacts.filter(a => a.artifact_type === 'identified_pattern')),
      emerging_themes: this.createSection('emerging_themes', artifacts.filter(a => a.artifact_type === 'emerging_theme')),
      focus_areas: this.createSection('focus_areas', artifacts.filter(a => a.artifact_type === 'focus_area')),
      blind_spots: this.createSection('blind_spots', artifacts.filter(a => a.artifact_type === 'blind_spot')),
      celebration_moments: this.createSection('celebration_moments', artifacts.filter(a => a.artifact_type === 'celebration_moment')),
      
      // Generate sections based on prompt types
      reflection_prompts: this.createPromptSection('reflection_prompts', prompts.filter(p => (p.metadata as any)?.prompt_type === 'reflection')),
      exploration_prompts: this.createPromptSection('exploration_prompts', prompts.filter(p => (p.metadata as any)?.prompt_type === 'exploration')),
      goal_setting_prompts: this.createPromptSection('goal_setting_prompts', prompts.filter(p => (p.metadata as any)?.prompt_type === 'goal_setting')),
      skill_development_prompts: this.createPromptSection('skill_development_prompts', prompts.filter(p => (p.metadata as any)?.prompt_type === 'skill_development')),
      creative_expression_prompts: this.createPromptSection('creative_expression_prompts', prompts.filter(p => (p.metadata as any)?.prompt_type === 'creative_expression')),
    };

    return sections;
  }

  /**
   * Create a dashboard section from derived artifacts
   */
  private createSection(sectionType: string, artifacts: any[]): DashboardSectionData {
    const items = artifacts.map(artifact => ({
      id: artifact.artifact_id,
      title: artifact.title,
      content: artifact.content_narrative || '',
      confidence: artifact.content_data?.confidence_score,
      actionability: artifact.content_data?.actionability,
      priority: artifact.content_data?.priority_level,
      created_at: artifact.created_at.toISOString(),
      metadata: artifact.content_data
    }));

    return {
      section_type: sectionType,
      title: this.getSectionTitle(sectionType),
      items: items.slice(0, this.getMaxItemsForSection(sectionType)),
      total_count: items.length,
      last_updated: items.length > 0 ? items[0].created_at : new Date().toISOString()
    };
  }

  /**
   * Create a dashboard section from proactive prompts
   */
  private createPromptSection(sectionType: string, prompts: any[]): DashboardSectionData {
    const items = prompts.map(prompt => ({
      id: prompt.prompt_id,
      title: prompt.metadata?.title || 'Prompt',
      content: prompt.prompt_text,
      confidence: prompt.metadata?.priority_level ? prompt.metadata.priority_level / 10 : undefined,
      actionability: prompt.metadata?.timing_suggestion,
      priority: prompt.metadata?.priority_level,
      created_at: prompt.created_at.toISOString(),
      metadata: prompt.metadata
    }));

    return {
      section_type: sectionType,
      title: this.getSectionTitle(sectionType),
      items: items.slice(0, this.getMaxItemsForSection(sectionType)),
      total_count: items.length,
      last_updated: items.length > 0 ? items[0].created_at : new Date().toISOString()
    };
  }

  /**
   * Get display title for a section type
   */
  private getSectionTitle(sectionType: string): string {
    const titles: Record<string, string> = {
      insights: 'Insights',
      patterns: 'Patterns',
      recommendations: 'Recommendations',
      synthesis: 'Synthesis',
      identified_patterns: 'Identified Patterns',
      emerging_themes: 'Emerging Themes',
      focus_areas: 'Focus Areas',
      blind_spots: 'Blind Spots',
      celebration_moments: 'Celebration Moments',
      reflection_prompts: 'Reflection Prompts',
      exploration_prompts: 'Exploration Prompts',
      goal_setting_prompts: 'Goal Setting Prompts',
      skill_development_prompts: 'Skill Development Prompts',
      creative_expression_prompts: 'Creative Expression Prompts'
    };
    return titles[sectionType] || sectionType;
  }

  /**
   * Get maximum items to display for a section type
   */
  private getMaxItemsForSection(sectionType: string): number {
    const limits: Record<string, number> = {
      insights: 3,
      patterns: 2,
      recommendations: 2,
      synthesis: 2,
      identified_patterns: 3,
      emerging_themes: 3,
      focus_areas: 3,
      blind_spots: 2,
      celebration_moments: 1,
      reflection_prompts: 2,
      exploration_prompts: 2,
      goal_setting_prompts: 2,
      skill_development_prompts: 2,
      creative_expression_prompts: 2
    };
    return limits[sectionType] || 5;
  }

  /**
   * Get available cycles for a user
   */
  async getUserCycles(userId: string, limit = 10): Promise<any[]> {
    const userCycleRepo = new UserCycleRepository(this.db);
    return userCycleRepo.findCompletedCycles(userId, limit);
  }

  /**
   * Get cycle statistics for a user
   */
  async getUserCycleStats(userId: string): Promise<any> {
    const userCycleRepo = new UserCycleRepository(this.db);
    return userCycleRepo.getCycleStats(userId);
  }
}
