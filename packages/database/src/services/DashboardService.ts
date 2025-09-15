/**
 * DashboardService.ts
 * V9.7 Service for dynamic dashboard data aggregation and section generation
 * 
 * Implements the simplified 1-to-1 mapping from insight worker outputs to dashboard sections
 */

import { DatabaseService } from '../DatabaseService';
import { UserCycleRepository } from '../repositories/UserCycleRepository';
import { DashboardConfigService } from './DashboardConfigService';

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
  private configService: DashboardConfigService;

  constructor(private db: DatabaseService) {
    this.configService = new DashboardConfigService();
  }

  /**
   * Get dashboard configuration
   */
  async getDashboardConfig(): Promise<any> {
    try {
      return await this.configService.loadConfig();
    } catch (error) {
      console.error('[DashboardService] Error loading dashboard config:', error);
      throw error;
    }
  }

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
    // Load dashboard configuration
    const config = await this.configService.loadConfig();
    
    // Get all derived artifacts for this cycle
    const artifacts = await this.db.prisma.derived_artifacts.findMany({
      where: {
        user_id: userId,
        cycle_id: cycleId
      },
      orderBy: { created_at: 'desc' }
    });

    // DEBUG: Log what we're actually getting from the database
    console.log(`[DashboardService] DEBUG: Querying artifacts for user ${userId}, cycle ${cycleId}`);
    console.log(`[DashboardService] DEBUG: Found ${artifacts.length} total artifacts`);
    console.log(`[DashboardService] DEBUG: Artifact types:`, artifacts.map((a: any) => a.artifact_type));
    console.log(`[DashboardService] DEBUG: Legacy artifacts:`, artifacts.filter((a: any) => ['insight', 'pattern', 'recommendation', 'synthesis'].includes(a.artifact_type)).map((a: any) => ({ type: a.artifact_type, title: a.title, cycle_id: a.cycle_id })));

    // Get all proactive prompts for this cycle
    const prompts = await this.db.prisma.proactive_prompts.findMany({
      where: {
        user_id: userId,
        cycle_id: cycleId
      },
      orderBy: { created_at: 'desc' }
    });

    // Get growth events for this user (not filtered by cycle since growth events are longitudinal)
    const growthEvents = await this.db.prisma.growth_events.findMany({
      where: {
        user_id: userId
      },
      orderBy: { created_at: 'desc' }
    });

    console.log(`[DashboardService] DEBUG: Found ${growthEvents.length} growth events for user ${userId}`);
    console.log(`[DashboardService] DEBUG: Growth events by source:`, growthEvents.reduce((acc: Record<string, number>, event: any) => {
      acc[event.source] = (acc[event.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));

    // Get recent cards for the magazine tab
    const recentCards = await this.db.prisma.cards.findMany({
      where: {
        user_id: userId,
        card_type: {
          in: ['concept', 'memoryunit']
        }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    // Generate sections dynamically based on configuration
    const sections: any = {};
    
    // Process each section defined in configuration
    const sectionPromises = Object.entries(config.dashboard_sections).map(async ([sectionKey, sectionConfig]) => {
      console.log(`[DashboardService] DEBUG: Processing section ${sectionKey} with config:`, sectionConfig);
      
      try {
        // Map section types to data sources
        if (sectionKey === 'recent_cards') {
          return [sectionKey, this.createCardSection(sectionKey, recentCards)];
        } else if (sectionKey === 'growth_dimensions') {
          return [sectionKey, this.createGrowthDimensionsSection(sectionKey, growthEvents)];
        } else if (sectionKey.startsWith('growth_')) {
          // Growth-specific sections
          const artifactType = sectionKey.replace('growth_', '');
          return [sectionKey, await this.createSection(sectionKey, artifacts.filter((a: any) => a.artifact_type === artifactType))];
        } else if (sectionKey.endsWith('_prompts')) {
          // Prompt sections
          const promptType = sectionKey.replace('_prompts', '');
          return [sectionKey, this.createPromptSection(sectionKey, prompts.filter((p: any) => (p.metadata as any)?.prompt_type === promptType))];
        } else {
          // Regular artifact sections - map section keys to singular artifact types
          const artifactType = sectionKey === 'insights' ? 'insight' :
                             sectionKey === 'patterns' ? 'pattern' :
                             sectionKey === 'recommendations' ? 'recommendation' :
                             sectionKey === 'synthesis' ? 'synthesis' :
                             sectionKey === 'identified_patterns' ? 'identified_pattern' : 
                             sectionKey === 'emerging_themes' ? 'emerging_theme' :
                             sectionKey === 'focus_areas' ? 'focus_area' :
                             sectionKey === 'blind_spots' ? 'blind_spot' :
                             sectionKey === 'celebration_moments' ? 'celebration_moment' :
                             sectionKey;
          
          return [sectionKey, await this.createSection(sectionKey, artifacts.filter((a: any) => a.artifact_type === artifactType))];
        }
      } catch (error) {
        console.error(`[DashboardService] ERROR: Failed to create section ${sectionKey}:`, error);
        // Create empty section as fallback
        return [sectionKey, {
          section_type: sectionKey,
          title: sectionConfig?.title || sectionKey,
          items: [],
          total_count: 0,
          last_updated: new Date().toISOString()
        }];
      }
    });

    // Wait for all sections to be created
    const sectionResults = await Promise.all(sectionPromises);
    
    // Convert array of [key, value] pairs back to object
    for (const [sectionKey, sectionData] of sectionResults) {
      sections[sectionKey as string] = sectionData;
    }

    return sections;
  }

  /**
   * Create a dashboard section from derived artifacts
   */
  private async createSection(sectionType: string, artifacts: any[]): Promise<DashboardSectionData> {
    const config = await this.configService.loadConfig();
    const sectionConfig = config.dashboard_sections[sectionType];
    
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
      title: sectionConfig?.title || this.getSectionTitle(sectionType),
      items: items.slice(0, sectionConfig?.max_items || this.getMaxItemsForSection(sectionType)),
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
      creative_expression_prompts: 'Creative Expression Prompts',
      recent_cards: 'Recent Cards',
      growth_dimensions: 'Growth Dimensions',
      growth_insights: 'Growth Insights',
      growth_focus_areas: 'Growth Focus Areas'
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
      creative_expression_prompts: 2,
      recent_cards: 5,
      growth_dimensions: 6,
      growth_insights: 3,
      growth_focus_areas: 3
    };
    return limits[sectionType] || 5;
  }

  /**
   * Create a section for cards
   */
  private createCardSection(sectionType: string, cards: any[]): DashboardSectionData {
    const items = cards.map(card => {
      // Apply the same title generation logic as CardService
      let title = card.title;
      
      // Fallback logic for different card types when title is empty
      if (!title) {
        switch (card.card_type) {
          case 'concept':
            title = card.display_data?.name || 
                   card.display_data?.description || 
                   card.display_data?.concept_id || 
                   `Concept: ${card.card_id}`;
            break;
          case 'proactive_prompt':
            title = card.display_data?.prompt_text || 
                   card.display_data?.prompt_id || 
                   `Proactive Prompt: ${card.card_id}`;
            break;
          case 'derived_artifact':
            title = card.display_data?.title || 
                   card.display_data?.artifact_type || 
                   card.display_data?.artifact_id || 
                   `Derived Artifact: ${card.card_id}`;
            break;
          case 'community':
            title = card.display_data?.name || 
                   card.display_data?.community_id || 
                   `Community: ${card.card_id}`;
            break;
          case 'memoryunit':
            title = card.display_data?.title || 
                   card.display_data?.memory_id || 
                   `Memory Unit: ${card.card_id}`;
            break;
          default:
            title = `${card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1)}: ${card.card_id}`;
        }
      }

      return {
        id: card.card_id,
        title: title,
        content: card.description || card.display_data?.description || card.subtitle || '',
        created_at: card.created_at,
        metadata: {
          card_type: card.card_type,
          background_image_url: card.background_image_url,
          display_data: card.display_data
        }
      };
    });

    return {
      section_type: sectionType,
      title: this.getSectionTitle(sectionType),
      items: items.slice(0, this.getMaxItemsForSection(sectionType)),
      total_count: items.length,
      last_updated: items.length > 0 ? items[0].created_at : new Date().toISOString()
    };
  }

  /**
   * Create a section for growth dimensions
   */
  private createGrowthDimensionsSection(sectionType: string, growthEvents: any[]): DashboardSectionData {
    const dimensions = [
      { key: 'know_self', name: 'Self Knowledge', icon: '🧠' },
      { key: 'act_self', name: 'Self Action', icon: '⚡' },
      { key: 'show_self', name: 'Self Expression', icon: '💬' },
      { key: 'know_world', name: 'World Knowledge', icon: '🌍' },
      { key: 'act_world', name: 'World Action', icon: '🌱' },
      { key: 'show_world', name: 'World Expression', icon: '🎭' }
    ];

    // Create table structure with rows and columns
    const tableData = {
      layout: {
        type: 'table',
        columns: [
          {
            key: 'whats_new',
            title: 'What\'s New',
            icon: '🆕',
            description: 'Recent growth events from IngestionAnalyst'
          },
          {
            key: 'whats_next',
            title: 'What\'s Next', 
            icon: '🔮',
            description: 'Strategic recommendations from InsightWorker'
          }
        ],
        rows: dimensions.map(dimension => {
          // Get "What's New" events (IngestionAnalyst - observant tracker)
          const whatsNewEvents = growthEvents.filter(event => 
            event.dimension_key === dimension.key && 
            event.source === 'IngestionAnalyst'
          ).slice(0, 3); // Show up to 3 recent events

          // Get "What's Next" events (InsightWorker - strategic adviser)
          const whatsNextEvents = growthEvents.filter(event => 
            event.dimension_key === dimension.key && 
            event.source === 'InsightWorker'
          ).slice(0, 3); // Show up to 3 recent events

          return {
            key: dimension.key,
            title: dimension.name,
            icon: dimension.icon,
            cells: {
              whats_new: {
                events: whatsNewEvents.map(event => ({
                  event_id: event.event_id,
                  rationale: event.rationale,
                  delta_value: event.delta_value,
                  created_at: event.created_at,
                  related_concepts: event.related_concepts,
                  related_memory_units: event.related_memory_units
                })),
                count: whatsNewEvents.length,
                display_text: whatsNewEvents.length > 0 
                  ? whatsNewEvents.map(event => `• ${event.rationale}`).join('\n')
                  : 'No recent growth events'
              },
              whats_next: {
                events: whatsNextEvents.map(event => ({
                  event_id: event.event_id,
                  rationale: event.rationale,
                  delta_value: event.delta_value,
                  created_at: event.created_at,
                  related_concepts: event.related_concepts,
                  related_memory_units: event.related_memory_units
                })),
                count: whatsNextEvents.length,
                display_text: whatsNextEvents.length > 0 
                  ? whatsNextEvents.map(event => `• ${event.rationale}`).join('\n')
                  : 'No strategic recommendations'
              }
            }
          };
        })
      }
    };

    return {
      section_type: sectionType,
      title: this.getSectionTitle(sectionType),
      items: [{
        id: 'growth_dimensions_table',
        title: 'Growth Dimensions Table',
        content: 'Growth trajectory across self and world dimensions',
        created_at: new Date().toISOString(),
        metadata: tableData
      }], // Single table item containing the full table structure
      total_count: dimensions.length,
      last_updated: new Date().toISOString()
    };
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
