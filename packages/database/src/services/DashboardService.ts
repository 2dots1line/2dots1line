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
          cycle_start_date: cycle.created_at.toISOString(),
          cycle_end_date: cycle.ended_at?.toISOString() || null,
          status: cycle.status,
          processing_duration_ms: undefined, // Field removed in migration
          artifacts_created: 0, // Field removed in migration
          prompts_created: 0, // Field removed in migration
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
          cycle_start_date: cycle.created_at.toISOString(),
          cycle_end_date: cycle.ended_at?.toISOString() || null,
          status: cycle.status,
          processing_duration_ms: undefined, // Field removed in migration
          artifacts_created: 0, // Field removed in migration
          prompts_created: 0, // Field removed in migration
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
    console.log(`[DashboardService] DEBUG: Artifact types:`, artifacts.map((a: any) => a.type));
    console.log(`[DashboardService] DEBUG: Legacy artifacts:`, artifacts.filter((a: any) => ['insight', 'pattern', 'recommendation', 'synthesis'].includes(a.type)).map((a: any) => ({ type: a.type, title: a.title, cycle_id: a.cycle_id })));

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
        type: {
          in: ['concept', 'memoryunit']
        }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    // Get the most recent opening artifact (regardless of cycle)
    const openingArtifact = await this.db.prisma.derived_artifacts.findFirst({
      where: {
        user_id: userId,
        type: 'opening'
      },
      orderBy: { created_at: 'desc' }
    });

    console.log(`[DashboardService] DEBUG: Found opening artifact:`, openingArtifact ? {
      id: openingArtifact.entity_id,
      title: openingArtifact.title,
      cycle_id: openingArtifact.cycle_id,
      created_at: openingArtifact.created_at
    } : 'None');

    // Generate sections dynamically based on configuration
    const sections: any = {};
    
    // Process each section defined in configuration
    const sectionPromises = Object.entries(config.dashboard_sections).map(async ([sectionKey, sectionConfig]) => {
      console.log(`[DashboardService] DEBUG: Processing section ${sectionKey} with config:`, sectionConfig);
      
      try {
        // Map section types to data sources
        if (sectionKey === 'recent_cards') {
          return [sectionKey, await this.createCardSection(sectionKey, recentCards)];
        } else if (sectionKey === 'opening_words') {
          return [sectionKey, this.createOpeningWordsSection(sectionKey, openingArtifact)];
        } else if (sectionKey === 'growth_dimensions') {
          return [sectionKey, this.createGrowthDimensionsSection(sectionKey, growthEvents)];
        } else if (sectionKey.startsWith('growth_')) {
          // Growth-specific sections
          const artifactType = sectionKey.replace('growth_', '');
          return [sectionKey, await this.createSection(sectionKey, artifacts.filter((a: any) => a.type === artifactType))];
        } else if (sectionKey.endsWith('_prompts')) {
          // Prompt sections
          const promptType = sectionKey.replace('_prompts', '');
          return [sectionKey, this.createPromptSection(sectionKey, prompts.filter((p: any) => p.type === promptType))];
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
                             sectionKey === 'opening_words' ? 'opening' :
                             // New artifact types - direct mapping (no transformation needed)
                             sectionKey;
          
          return [sectionKey, await this.createSection(sectionKey, artifacts.filter((a: any) => a.type === artifactType))];
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
      id: artifact.entity_id,
      title: artifact.title,
      content: artifact.content || '',
      created_at: artifact.created_at.toISOString(),
      metadata: {
        artifact_type: artifact.type,
        cycle_id: artifact.cycle_id,
        source_concept_ids: artifact.source_concept_ids,
        source_memory_unit_ids: artifact.source_memory_unit_ids
      }
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
      id: prompt.entity_id,
      title: prompt.title || prompt.metadata?.title || 'Prompt',
      content: prompt.content,
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
      opening_words: 'Opening Words',
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
      opening_words: 1,
      growth_dimensions: 6,
      growth_insights: 3,
      growth_focus_areas: 3
    };
    return limits[sectionType] || 5;
  }

  /**
   * Load entity data from source entity table
   */
  private async loadEntityData(sourceEntityId: string, sourceEntityType: string): Promise<any> {
    try {
      switch (sourceEntityType) {
        case 'MemoryUnit':
          return await this.db.prisma.memory_units.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'Concept':
          return await this.db.prisma.concepts.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'DerivedArtifact':
          return await this.db.prisma.derived_artifacts.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'ProactivePrompt':
          return await this.db.prisma.proactive_prompts.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'Community':
          return await this.db.prisma.communities.findUnique({
            where: { entity_id: sourceEntityId }
          });
        case 'GrowthEvent':
          return await this.db.prisma.growth_events.findUnique({
            where: { entity_id: sourceEntityId }
          });
        default:
          console.warn(`[DashboardService] Unknown entity type: ${sourceEntityType}`);
          return null;
      }
    } catch (error) {
      console.error(`[DashboardService] Error loading entity data for ${sourceEntityType}:${sourceEntityId}:`, error);
      return null;
    }
  }

  /**
   * Create a section for cards
   */
  private async createCardSection(sectionType: string, cards: any[]): Promise<DashboardSectionData> {
    const items = await Promise.all(cards.map(async (card) => {
      // Load entity data from source entity table
      const entityData = await this.loadEntityData(card.source_entity_id, card.source_entity_type);
      
      // Use custom title/content if available, otherwise use entity data
      let title = card.custom_title || entityData?.title || '';
      let content = card.custom_content || entityData?.content || '';
      
      // Fallback logic for different card types when title is empty
      if (!title) {
        switch (card.type) {
          case 'concept':
            title = entityData?.title || 
                   entityData?.content || 
                   entityData?.entity_id || 
                   `Concept: ${card.card_id}`;
            break;
          case 'proactive_prompt':
            title = entityData?.prompt_text || 
                   entityData?.entity_id || 
                   `Proactive Prompt: ${card.card_id}`;
            break;
          case 'derived_artifact':
            title = entityData?.title || 
                   entityData?.type || 
                   entityData?.entity_id || 
                   `Derived Artifact: ${card.card_id}`;
            break;
          case 'community':
            title = entityData?.title || 
                   entityData?.entity_id || 
                   `Community: ${card.card_id}`;
            break;
          case 'memoryunit':
            title = entityData?.title || 
                   entityData?.entity_id || 
                   `Memory Unit: ${card.card_id}`;
            break;
          default:
            title = card.type ? `${card.type.charAt(0).toUpperCase() + card.type.slice(1)}: ${card.card_id}` : `Card: ${card.card_id}`;
        }
      }

      // Ensure we have some content
      if (!content) {
        content = entityData?.content || entityData?.description || '';
      }

      return {
        id: card.card_id,
        title: title,
        content: content,
        created_at: card.created_at,
        metadata: {
          card_type: card.type,
          background_image_url: card.background_image_url,
          source_entity_id: card.source_entity_id,
          source_entity_type: card.source_entity_type
        }
      };
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
   * Create a section for opening words
   */
  private createOpeningWordsSection(sectionType: string, openingArtifact: any): DashboardSectionData {
    if (!openingArtifact) {
      return {
        section_type: sectionType,
        title: this.getSectionTitle(sectionType),
        items: [],
        total_count: 0,
        last_updated: new Date().toISOString()
      };
    }

    const item = {
      id: openingArtifact.entity_id,
      title: openingArtifact.title,
      content: openingArtifact.content || '',
      created_at: openingArtifact.created_at.toISOString(),
      metadata: {
        artifact_type: openingArtifact.type,
        cycle_id: openingArtifact.cycle_id,
        source_concept_ids: openingArtifact.source_concept_ids,
        source_memory_unit_ids: openingArtifact.source_memory_unit_ids
      }
    };

    return {
      section_type: sectionType,
      title: this.getSectionTitle(sectionType),
      items: [item],
      total_count: 1,
      last_updated: item.created_at
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
            event.type === dimension.key && 
            event.source === 'IngestionAnalyst'
          ).slice(0, 3); // Show up to 3 recent events

          // Get "What's Next" events (InsightWorker - strategic adviser)
          const whatsNextEvents = growthEvents.filter(event => 
            event.type === dimension.key && 
            event.source === 'InsightWorker'
          ).slice(0, 3); // Show up to 3 recent events

          // Debug logging
          console.log(`[DashboardService] DEBUG: Dimension ${dimension.key}:`);
          console.log(`  - Total growth events: ${growthEvents.length}`);
          console.log(`  - Events with type '${dimension.key}': ${growthEvents.filter(e => e.type === dimension.key).length}`);
          console.log(`  - IngestionAnalyst events for ${dimension.key}: ${whatsNewEvents.length}`);
          console.log(`  - InsightWorker events for ${dimension.key}: ${whatsNextEvents.length}`);
          if (whatsNewEvents.length > 0) {
            console.log(`  - Sample IngestionAnalyst event:`, {
              entity_id: whatsNewEvents[0].entity_id,
              type: whatsNewEvents[0].type,
              source: whatsNewEvents[0].source,
              content: whatsNewEvents[0].content?.substring(0, 100) + '...'
            });
          }

          return {
            key: dimension.key,
            title: dimension.name,
            icon: dimension.icon,
            cells: {
              whats_new: {
                events: whatsNewEvents.map(event => ({
                  entity_id: event.entity_id,
                  content: event.content,
                  delta_value: event.delta_value,
                  created_at: event.created_at,
                  source_concept_ids: event.source_concept_ids,
                  source_memory_unit_ids: event.source_memory_unit_ids
                })),
                count: whatsNewEvents.length,
                display_text: whatsNewEvents.length > 0 
                  ? whatsNewEvents.map(event => `• ${event.content}`).join('\n')
                  : 'No recent growth events'
              },
              whats_next: {
                events: whatsNextEvents.map(event => ({
                  entity_id: event.entity_id,
                  content: event.content,
                  delta_value: event.delta_value,
                  created_at: event.created_at,
                  source_concept_ids: event.source_concept_ids,
                  source_memory_unit_ids: event.source_memory_unit_ids
                })),
                count: whatsNextEvents.length,
                display_text: whatsNextEvents.length > 0 
                  ? whatsNextEvents.map(event => `• ${event.content}`).join('\n')
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

  /**
   * Get user-specific metrics from PostgreSQL database
   */
  async getUserMetrics(userId: string): Promise<{
    memory_units_count: number;
    concepts_count: number;
    growth_events_count: number;
    cards_count: number;
    latest_cycle_date_range: {
      start_date: string | null;
      end_date: string | null;
    };
    total_artifacts: number;
    total_prompts: number;
  }> {
    try {
      // Get counts from various tables
      const [
        memoryUnitsCount,
        conceptsCount,
        growthEventsCount,
        cardsCount,
        artifactsCount,
        promptsCount,
        latestCycle
      ] = await Promise.all([
        // Memory units count
        this.db.prisma.memory_units.count({
          where: { user_id: userId }
        }),
        
        // Concepts count
        this.db.prisma.concepts.count({
          where: { user_id: userId }
        }),
        
        // Growth events count
        this.db.prisma.growth_events.count({
          where: { user_id: userId }
        }),
        
        // Cards count
        this.db.prisma.cards.count({
          where: { user_id: userId }
        }),
        
        // Total artifacts count
        this.db.prisma.derived_artifacts.count({
          where: { user_id: userId }
        }),
        
        // Total prompts count
        this.db.prisma.proactive_prompts.count({
          where: { user_id: userId }
        }),
        
        // Latest cycle date range
        this.db.prisma.user_cycles.findFirst({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          select: {
            created_at: true,
            ended_at: true
          }
        })
      ]);

      return {
        memory_units_count: memoryUnitsCount,
        concepts_count: conceptsCount,
        growth_events_count: growthEventsCount,
        cards_count: cardsCount,
        latest_cycle_date_range: {
          start_date: latestCycle?.created_at?.toISOString() || null,
          end_date: latestCycle?.ended_at?.toISOString() || null
        },
        total_artifacts: artifactsCount,
        total_prompts: promptsCount
      };
    } catch (error) {
      console.error(`[DashboardService] Error getting user metrics for user ${userId}:`, error);
      throw error;
    }
  }
}
