/**
 * DashboardService.ts
 * V11.0 Streamlined data-driven dashboard service
 * 
 * Data-driven section generation: Groups by actual DB types, no config dependency
 * All sections generated from database queries, ensuring consistency and reliability
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
    entityType: 'DerivedArtifact' | 'ProactivePrompt' | 'GrowthEvent' | 'Card';
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
   * Get dashboard configuration (legacy support - returns minimal config)
   * @deprecated Config is now handled on frontend. Kept for backward compatibility.
   */
  async getDashboardConfig(): Promise<any> {
    // Return minimal structure for frontend layout preferences only
    return {
      dashboard_layout: {
        grid_columns: { default: 3, mobile: 1, tablet: 2 },
        tabs: {
          opening: { title: 'Opening', icon: '📖' },
          dynamic_insights: { title: 'Dynamic Insights', icon: '🧠' },
          growth_trajectory: { title: 'Growth Trajectory', icon: '📈' }
        }
      }
    };
  }

  /**
   * Get dashboard data for a user's most recent completed cycle
   */
  async getDashboardData(userId: string): Promise<DashboardData | null> {
    try {
      console.log(`[DashboardService] Getting dashboard data for user: ${userId}`);
      
      // Get the most recent completed cycle
      const userCycleRepo = new UserCycleRepository(this.db);
      const recentCycles = await userCycleRepo.findCompletedCycles(userId, 1);
      
      if (recentCycles.length === 0) {
        console.log(`[DashboardService] ⚠️  No completed cycles found for user ${userId} - returning null`);
        return null;
      }

      const cycle = recentCycles[0];
      const cycleId = cycle.cycle_id;
      console.log(`[DashboardService] Using most recent cycle: ${cycleId} (status: ${cycle.status})`);

      // Generate all dashboard sections with error handling
      let sections;
      try {
        sections = await this.generateDashboardSections(userId, cycleId);
      } catch (sectionError) {
        console.error(`[DashboardService] ❌ Failed to generate sections for cycle ${cycleId}:`, sectionError);
        throw sectionError;
      }

      const result = {
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
      
      console.log(`[DashboardService] ✅ Successfully generated dashboard data with ${Object.keys(sections).length} sections`);
      return result;
    } catch (error) {
      console.error(`[DashboardService] ❌ ERROR getting dashboard data for user ${userId}:`, error);
      console.error(`[DashboardService] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
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
   * Generate all dashboard sections for a given cycle - DATA-DRIVEN APPROACH
   * Groups by actual database types, no config iteration
   */
  private async generateDashboardSections(userId: string, cycleId: string): Promise<DashboardData['sections']> {
    try {
      // Fetch all data in parallel for consistency
      const [artifacts, prompts, growthEvents, recentCards, openingArtifact] = await Promise.all([
        // Derived artifacts for this cycle
        this.db.prisma.derived_artifacts.findMany({
          where: { user_id: userId, cycle_id: cycleId },
          orderBy: { created_at: 'desc' }
        }),
        // Proactive prompts for this cycle
        this.db.prisma.proactive_prompts.findMany({
          where: { user_id: userId, cycle_id: cycleId },
          orderBy: { created_at: 'desc' }
        }),
        // Growth events (longitudinal - not cycle-scoped)
        this.db.prisma.growth_events.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' }
        }),
        // Recent cards
        this.db.prisma.cards.findMany({
          where: {
            user_id: userId,
            type: { in: ['concept', 'memoryunit'] }
          },
          orderBy: { created_at: 'desc' },
          take: 5
        }),
        // Opening artifact (most recent, regardless of cycle)
        this.db.prisma.derived_artifacts.findFirst({
          where: { user_id: userId, type: 'opening' },
          orderBy: { created_at: 'desc' }
        })
      ]);

      // ✅ Comprehensive data consistency logging
      console.log(`[DashboardService] ========== DATA CONSISTENCY CHECK ==========`);
      console.log(`[DashboardService] User: ${userId}, Cycle: ${cycleId}`);
      console.log(`[DashboardService] Timestamp: ${new Date().toISOString()}`);
      
      // Detailed artifact logging
      const artifactTypeCounts = artifacts.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`[DashboardService] Artifacts: ${artifacts.length} total`);
      console.log(`[DashboardService]   └─ Types: ${Object.entries(artifactTypeCounts).map(([type, count]) => `${type}(${count})`).join(', ') || 'none'}`);
      
      // Detailed prompt logging
      const promptTypeCounts = prompts.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`[DashboardService] Prompts: ${prompts.length} total`);
      console.log(`[DashboardService]   └─ Types: ${Object.entries(promptTypeCounts).map(([type, count]) => `${type}(${count})`).join(', ') || 'none'}`);
      
      // Growth events logging
      const growthEventTypeCounts = growthEvents.reduce((acc, e) => {
        const type = e.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`[DashboardService] Growth Events: ${growthEvents.length} total (longitudinal, not cycle-scoped)`);
      console.log(`[DashboardService]   └─ Types: ${Object.entries(growthEventTypeCounts).map(([type, count]) => `${type}(${count})`).join(', ') || 'none'}`);
      
      // Other data
      console.log(`[DashboardService] Recent Cards: ${recentCards.length}`);
      console.log(`[DashboardService] Opening Artifact: ${openingArtifact ? `Found (${openingArtifact.entity_id})` : 'None'}`);
      
      // Data validation warnings
      const missingCycleIds = artifacts.filter(a => !a.cycle_id);
      if (missingCycleIds.length > 0) {
        console.warn(`[DashboardService] ⚠️  WARNING: ${missingCycleIds.length} artifacts missing cycle_id`);
      }
      
      const missingTypes = [...artifacts.filter(a => !a.type), ...prompts.filter(p => !p.type)];
      if (missingTypes.length > 0) {
        console.warn(`[DashboardService] ⚠️  WARNING: ${missingTypes.length} items missing type field`);
      }
      
      console.log(`[DashboardService] =========================================`);

      const sections: Record<string, DashboardSectionData> = {};

      // GROUP ARTIFACTS BY TYPE - Data-driven section generation
      const artifactsByType = this.groupBy(artifacts, 'type');
      for (const [artifactType, typeArtifacts] of Object.entries(artifactsByType)) {
        const sectionKey = this.mapArtifactTypeToSectionKey(artifactType);
        if (sectionKey && typeArtifacts.length > 0) {
          sections[sectionKey] = await this.createArtifactSection(sectionKey, typeArtifacts as any[]);
        }
      }

      // GROUP PROMPTS BY TYPE - Data-driven section generation
      const promptsByType = this.groupBy(prompts, 'type');
      for (const [promptType, typePrompts] of Object.entries(promptsByType)) {
        const sectionKey = this.mapPromptTypeToSectionKey(promptType);
        if (sectionKey && typePrompts.length > 0) {
          sections[sectionKey] = this.createPromptSection(sectionKey, typePrompts as any[]);
        }
      }

      // SPECIAL SECTIONS (always create, may be empty)
      sections.recent_cards = await this.createCardSection('recent_cards', recentCards);
      sections.opening_words = this.createOpeningWordsSection('opening_words', openingArtifact);
      sections.growth_dimensions = this.createGrowthDimensionsSection('growth_dimensions', growthEvents);
      sections.mobile_growth_events = this.createMobileGrowthEventsSection('mobile_growth_events', growthEvents);

      // Filter out empty sections for cleaner response
      const nonEmptySections: Record<string, DashboardSectionData> = {};
      for (const [key, section] of Object.entries(sections)) {
        if (section.items.length > 0) {
          nonEmptySections[key] = section;
        }
      }

      console.log(`[DashboardService] Generated ${Object.keys(nonEmptySections).length} non-empty sections: ${Object.keys(nonEmptySections).join(', ')}`);
      
      // Section validation
      const sectionsWithItems = Object.entries(nonEmptySections).map(([key, section]) => ({
        sectionKey: key,
        itemCount: section.items.length,
        title: section.title
      }));
      console.log(`[DashboardService] Section breakdown:`, sectionsWithItems);
      
      return nonEmptySections as DashboardData['sections'];
    } catch (error) {
      console.error(`[DashboardService] ❌ ERROR generating dashboard sections for user ${userId}, cycle ${cycleId}:`, error);
      console.error(`[DashboardService] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        cycleId
      });
      // Throw to be handled by calling code
      throw error;
    }
  }

  /**
   * Group array items by a key
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((acc, item) => {
      const group = String(item[key] || 'unknown');
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  /**
   * Map artifact type (from DB) to section key (for API response)
   */
  private mapArtifactTypeToSectionKey(artifactType: string): string | null {
    const mapping: Record<string, string> = {
      'insight': 'insights',
      'pattern': 'patterns',
      'recommendation': 'recommendations',
      'synthesis': 'synthesis',
      'identified_pattern': 'identified_patterns',
      'emerging_theme': 'emerging_themes',
      'focus_area': 'focus_areas',
      'blind_spot': 'blind_spots',
      'celebration_moment': 'celebration_moments',
      'opening': 'opening_words', // Handled separately but mapping exists
      'memory_profile': 'memory_profile',
      'deeper_story': 'deeper_story',
      'hidden_connection': 'hidden_connection',
      'values_revolution': 'values_revolution',
      'mastery_quest': 'mastery_quest',
      'breakthrough_moment': 'breakthrough_moment',
      'synergy_discovery': 'synergy_discovery',
      'authentic_voice': 'authentic_voice',
      'leadership_evolution': 'leadership_evolution',
      'creative_renaissance': 'creative_renaissance',
      'wisdom_integration': 'wisdom_integration',
      'vision_crystallization': 'vision_crystallization',
      'legacy_building': 'legacy_building',
      'horizon_expansion': 'horizon_expansion',
      'transformation_phase': 'transformation_phase'
    };
    return mapping[artifactType] || null;
  }

  /**
   * Map prompt type (from DB) to section key (for API response)
   */
  private mapPromptTypeToSectionKey(promptType: string): string | null {
    const mapping: Record<string, string> = {
      'reflection': 'reflection_prompts',
      'exploration': 'exploration_prompts',
      'goal_setting': 'goal_setting_prompts',
      'skill_development': 'skill_development_prompts',
      'creative_expression': 'creative_expression_prompts',
      'pattern_exploration': 'pattern_exploration_prompts',
      'values_articulation': 'values_articulation_prompts',
      'future_visioning': 'future_visioning_prompts',
      'wisdom_synthesis': 'wisdom_synthesis_prompts',
      'storytelling': 'storytelling_prompts',
      'metaphor_discovery': 'metaphor_discovery_prompts',
      'inspiration_hunting': 'inspiration_hunting_prompts',
      'synergy_building': 'synergy_building_prompts',
      'legacy_planning': 'legacy_planning_prompts',
      'assumption_challenging': 'assumption_challenging_prompts',
      'horizon_expanding': 'horizon_expanding_prompts',
      'meaning_making': 'meaning_making_prompts',
      'identity_integration': 'identity_integration_prompts',
      'gratitude_deepening': 'gratitude_deepening_prompts',
      'wisdom_sharing': 'wisdom_sharing_prompts'
    };
    return mapping[promptType] || null;
  }

  /**
   * Create a dashboard section from derived artifacts - DATA-DRIVEN
   */
  private async createArtifactSection(sectionType: string, artifacts: any[]): Promise<DashboardSectionData> {
    const items = artifacts.map(artifact => ({
      id: artifact.entity_id,
      title: artifact.title,
      content: artifact.content || '',
      entityType: 'DerivedArtifact' as const,
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
      title: this.getSectionTitle(sectionType),
      items: items.slice(0, this.getMaxItemsForSection(sectionType)),
      total_count: items.length,
      last_updated: items.length > 0 ? items[0].created_at : new Date().toISOString()
    };
  }

  /**
   * Create a dashboard section from proactive prompts - DATA-DRIVEN
   */
  private createPromptSection(sectionType: string, prompts: any[]): DashboardSectionData {
    const items = prompts.map(prompt => ({
      id: prompt.entity_id,
      title: prompt.title || prompt.metadata?.title || 'Prompt',
      content: prompt.content,
      entityType: 'ProactivePrompt' as const,
      confidence: prompt.metadata?.priority_level ? prompt.metadata.priority_level / 10 : undefined,
      actionability: prompt.metadata?.timing_suggestion,
      priority: prompt.metadata?.priority_level,
      created_at: prompt.created_at.toISOString(),
      metadata: {
        ...prompt.metadata,
        prompt_type: prompt.type
      }
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
  /**
   * Get display title for a section type - Comprehensive mapping for all artifact and prompt types
   */
  private getSectionTitle(sectionType: string): string {
    const titles: Record<string, string> = {
      // Legacy artifact types
      insights: 'Insights',
      patterns: 'Patterns',
      recommendations: 'Recommendations',
      synthesis: 'Synthesis',
      identified_patterns: 'Identified Patterns',
      emerging_themes: 'Emerging Themes',
      focus_areas: 'Focus Areas',
      blind_spots: 'Blind Spots',
      celebration_moments: 'Celebration Moments',
      // New artifact types
      memory_profile: 'Memory Profile',
      deeper_story: 'The Deeper Story',
      hidden_connection: 'Hidden Connections',
      values_revolution: 'Values Revolution',
      mastery_quest: 'Mastery Quest',
      breakthrough_moment: 'Breakthrough Moments',
      synergy_discovery: 'Synergy Discoveries',
      authentic_voice: 'Authentic Voice',
      leadership_evolution: 'Leadership Evolution',
      creative_renaissance: 'Creative Renaissance',
      wisdom_integration: 'Wisdom Integration',
      vision_crystallization: 'Vision Crystallization',
      legacy_building: 'Legacy Building',
      horizon_expansion: 'Horizon Expansion',
      transformation_phase: 'Transformation Phase',
      // Prompt types
      reflection_prompts: 'Reflection Prompts',
      exploration_prompts: 'Exploration Prompts',
      goal_setting_prompts: 'Goal Setting Prompts',
      skill_development_prompts: 'Skill Development Prompts',
      creative_expression_prompts: 'Creative Expression Prompts',
      pattern_exploration_prompts: 'Pattern Exploration',
      values_articulation_prompts: 'Values Articulation',
      future_visioning_prompts: 'Future Visioning',
      wisdom_synthesis_prompts: 'Wisdom Synthesis',
      storytelling_prompts: 'Storytelling',
      metaphor_discovery_prompts: 'Metaphor Discovery',
      inspiration_hunting_prompts: 'Inspiration Hunting',
      synergy_building_prompts: 'Synergy Building',
      legacy_planning_prompts: 'Legacy Planning',
      assumption_challenging_prompts: 'Assumption Challenging',
      horizon_expanding_prompts: 'Horizon Expanding',
      meaning_making_prompts: 'Meaning Making',
      identity_integration_prompts: 'Identity Integration',
      gratitude_deepening_prompts: 'Gratitude Deepening',
      wisdom_sharing_prompts: 'Wisdom Sharing',
      // Special sections
      recent_cards: 'Recent Cards',
      opening_words: 'Opening Words',
      growth_dimensions: 'Growth Dimensions',
      mobile_growth_events: 'Growth Events',
      growth_insights: 'Growth Insights',
      growth_focus_areas: 'Growth Focus Areas'
    };
    return titles[sectionType] || this.humanizeSectionKey(sectionType);
  }

  /**
   * Humanize section key - converts snake_case to Title Case
   */
  private humanizeSectionKey(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get maximum items to display for a section type
   */
  /**
   * Get maximum items to display - Reasonable defaults for all section types
   */
  private getMaxItemsForSection(sectionType: string): number {
    const limits: Record<string, number> = {
      // Legacy artifact types
      insights: 3,
      patterns: 2,
      recommendations: 2,
      synthesis: 2,
      identified_patterns: 3,
      emerging_themes: 3,
      focus_areas: 3,
      blind_spots: 2,
      celebration_moments: 1,
      // New artifact types - same defaults
      memory_profile: 1,
      deeper_story: 1,
      hidden_connection: 2,
      values_revolution: 1,
      mastery_quest: 1,
      breakthrough_moment: 2,
      synergy_discovery: 2,
      authentic_voice: 1,
      leadership_evolution: 1,
      creative_renaissance: 1,
      wisdom_integration: 1,
      vision_crystallization: 1,
      legacy_building: 1,
      horizon_expansion: 2,
      transformation_phase: 1,
      // Prompt types
      reflection_prompts: 2,
      exploration_prompts: 2,
      goal_setting_prompts: 2,
      skill_development_prompts: 2,
      creative_expression_prompts: 2,
      pattern_exploration_prompts: 2,
      values_articulation_prompts: 2,
      future_visioning_prompts: 2,
      wisdom_synthesis_prompts: 2,
      storytelling_prompts: 2,
      metaphor_discovery_prompts: 2,
      inspiration_hunting_prompts: 2,
      synergy_building_prompts: 2,
      legacy_planning_prompts: 2,
      assumption_challenging_prompts: 2,
      horizon_expanding_prompts: 2,
      meaning_making_prompts: 2,
      identity_integration_prompts: 2,
      gratitude_deepening_prompts: 2,
      wisdom_sharing_prompts: 2,
      // Special sections
      recent_cards: 5,
      opening_words: 1,
      growth_dimensions: 6,
      mobile_growth_events: 6,
      growth_insights: 3,
      growth_focus_areas: 3
    };
    return limits[sectionType] || 5; // Default to 5 if unknown type
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
        entityType: 'Card' as const,
        created_at: card.created_at.toISOString(),
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
      entityType: 'DerivedArtifact' as const,
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
        entityType: 'GrowthEvent' as const,
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

  /**
   * Create a mobile-specific growth events section
   * Returns growth events grouped by dimension for mobile dashboard
   */
  private createMobileGrowthEventsSection(sectionType: string, growthEvents: any[]): DashboardSectionData {
    console.log(`[DashboardService] DEBUG: ===== MOBILE GROWTH EVENTS METHOD CALLED =====`);
    console.log(`[DashboardService] DEBUG: Section type: ${sectionType}`);
    console.log(`[DashboardService] DEBUG: Growth events count: ${growthEvents.length}`);
    
    const dimensions = [
      { key: 'know_self', name: 'Self Knowledge', icon: '🧠' },
      { key: 'act_self', name: 'Self Action', icon: '⚡' },
      { key: 'show_self', name: 'Self Expression', icon: '💬' },
      { key: 'know_world', name: 'World Knowledge', icon: '🌍' },
      { key: 'act_world', name: 'World Action', icon: '🌱' },
      { key: 'show_world', name: 'World Expression', icon: '🎭' }
    ];

    console.log(`[DashboardService] DEBUG: Creating mobile growth events section with ${growthEvents.length} events`);
    console.log(`[DashboardService] DEBUG: Sample event types:`, growthEvents.slice(0, 5).map(e => e.type));

    // Group growth events by dimension
    const eventsByDimension = growthEvents.reduce((acc, event) => {
      const dimension = event.type || 'unknown';
      if (!acc[dimension]) {
        acc[dimension] = [];
      }
      acc[dimension].push(event);
      return acc;
    }, {} as Record<string, any[]>);

    console.log(`[DashboardService] DEBUG: Events grouped by dimension:`, Object.keys(eventsByDimension).map(key => `${key}: ${eventsByDimension[key].length}`));

    // Create items for each dimension
    const items = dimensions.map(dimension => {
      const events = eventsByDimension[dimension.key] || [];
      
      console.log(`[DashboardService] DEBUG: Dimension ${dimension.key} has ${events.length} events`);
      
      return {
        id: `dimension-${dimension.key}`,
        title: dimension.name,
        content: events.length > 0 
          ? events.slice(0, 3).map((event: any) => `• ${event.content}`).join('\n')
          : 'No recent growth events',
        entityType: 'GrowthEvent' as const,
        created_at: events.length > 0 ? events[0].created_at.toISOString() : new Date().toISOString(),
        metadata: {
          dimension: dimension.key,
          dimension_name: dimension.name,
          icon: dimension.icon,
          events_count: events.length,
          events: events.slice(0, 5).map((event: any) => ({
            entity_id: event.entity_id,
            content: event.content,
            delta_value: event.delta_value,
            created_at: event.created_at.toISOString(),
            source: event.source,
            source_concept_ids: event.source_concept_ids,
            source_memory_unit_ids: event.source_memory_unit_ids
          }))
        }
      };
    });

    return {
      section_type: sectionType,
      title: 'Growth Events',
      items: items,
      total_count: growthEvents.length,
      last_updated: growthEvents.length > 0 ? growthEvents[0].created_at.toISOString() : new Date().toISOString()
    };
  }
}
