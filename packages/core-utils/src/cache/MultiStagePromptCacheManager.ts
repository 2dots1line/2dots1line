/**
 * MultiStagePromptCacheManager.ts
 * V11.1 - Optimized prompt caching for multi-stage insight workflow
 * 
 * Manages shared prompt sections across Foundation, Ontology, and Strategic stages
 * to maximize cache hit rates and minimize redundant cache operations.
 */

import { PromptCacheService, type CachedSection } from './PromptCacheService';

export interface ConfigServiceInterface {
  getAllTemplates(): any;
}

export interface SharedPromptSections {
  coreIdentity: string;
  operationalConfig: string;
}

export interface StagePromptSections {
  stageTemplate: string;
  dynamicContext: string;
}

export interface FoundationCacheResult {
  shared: SharedPromptSections;
  foundation: StagePromptSections;
}

export interface StrategicCacheResult {
  shared: SharedPromptSections; // Reuse Foundation's shared sections (100% hit rate)
  strategic: StagePromptSections;
  foundationResults: string; // Foundation output as cached input (100% hit rate)
}

export interface MultiStageCacheResult {
  shared: SharedPromptSections;
  foundation: StagePromptSections;
  strategic: StagePromptSections;
  ontology: StagePromptSections;
  cacheMetrics: {
    sharedHits: number;
    sharedMisses: number;
    stageHits: number;
    stageMisses: number;
    totalHits: number;
    totalRequests: number;
    hitRate: number;
  };
}

export class MultiStagePromptCacheManager {
  private cacheMetrics = {
    sharedHits: 0,
    sharedMisses: 0,
    stageHits: 0,
    stageMisses: 0,
    totalHits: 0,
    totalRequests: 0
  };

  constructor(
    private promptCacheService: PromptCacheService,
    private configService: ConfigServiceInterface
  ) {}

  /**
   * Get all prompt sections for multi-stage workflow with optimized caching
   */
  async getMultiStagePrompts(
    userId: string,
    userName: string,
    foundationContext: any,
    strategicContext: any,
    ontologyContext?: any
  ): Promise<MultiStageCacheResult> {
    const templates = this.configService.getAllTemplates();
    
    // 1. Get shared sections (highest cache hit rate - used by all stages)
    const shared = await this.getSharedSections(userId, userName, templates);
    
    // 2. Get stage-specific sections in parallel
    const [foundation, strategic, ontology] = await Promise.all([
      this.getFoundationStageSections(userId, userName, foundationContext, templates),
      this.getStrategicStageSections(userId, userName, strategicContext, templates),
      this.getOntologyStageSections(userId, userName, ontologyContext, templates)
    ]);

    // 3. Calculate cache metrics
    const totalRequests = 8; // 2 shared + 6 stage-specific sections
    const hitRate = this.cacheMetrics.totalHits / totalRequests;

    return {
      shared,
      foundation,
      strategic,
      ontology,
      cacheMetrics: {
        ...this.cacheMetrics,
        totalRequests,
        hitRate
      }
    };
  }

  /**
   * Get Foundation Stage prompt (primary) with maximum cache potential
   */
  async getFoundationPrompt(userId: string, userName: string, context: any): Promise<string> {
    const templates = this.configService.getAllTemplates();
    
    const [shared, foundation] = await Promise.all([
      this.getSharedSections(userId, userName, templates),
      this.getFoundationStageSections(userId, userName, context, templates)
    ]);

    return `${shared.coreIdentity}

${shared.operationalConfig}

${foundation.dynamicContext}

${foundation.stageTemplate}`;
  }

  /**
   * Get Strategic Stage prompt (follow-up) with maximum cache hit rate
   */
  async getStrategicPrompt(userId: string, userName: string, context: any, foundationResults: any): Promise<string> {
    const templates = this.configService.getAllTemplates();
    
    // Reuse Foundation's shared sections (100% cache hit rate)
    const shared = await this.getSharedSections(userId, userName, templates);
    
    const strategic = await this.getStrategicStageSections(userId, userName, context, templates);

    // Format foundation results as cached input
    const foundationResultsText = `=== FOUNDATION RESULTS ===
${JSON.stringify(foundationResults, null, 2)}`;

    return `${shared.coreIdentity}

${shared.operationalConfig}

${foundationResultsText}

${strategic.dynamicContext}

${strategic.stageTemplate}`;
  }

  /**
   * Get shared sections (core_identity, operational_config) - used by all stages
   */
  private async getSharedSections(userId: string, userName: string, templates: any): Promise<SharedPromptSections> {
    const [coreIdentity, operationalConfig] = await Promise.all([
      this.getCachedSection('core_identity', userId, userName, templates.insight_worker_core_identity),
      this.getCachedSection('operational_config', userId, userName, templates.insight_worker_operational_config)
    ]);

    return { coreIdentity, operationalConfig };
  }

  /**
   * Get Foundation Stage sections
   */
  private async getFoundationStageSections(
    userId: string, 
    userName: string, 
    context: any, 
    templates: any
  ): Promise<StagePromptSections> {
    const [stageTemplate, dynamicContext] = await Promise.all([
      this.getCachedSection('foundation_stage', userId, userName, templates.insight_worker_foundation_stage),
      this.getCachedDynamicContext('foundation_dynamic_context', userId, context, this.buildFoundationDynamicContext)
    ]);

    return { stageTemplate, dynamicContext };
  }

  /**
   * Get Strategic Stage sections
   */
  private async getStrategicStageSections(
    userId: string, 
    userName: string, 
    context: any, 
    templates: any
  ): Promise<StagePromptSections> {
    const [stageTemplate, dynamicContext] = await Promise.all([
      this.getCachedSection('strategic_stage', userId, userName, templates.insight_worker_strategic_stage),
      this.getCachedDynamicContext('strategic_dynamic_context', userId, context, this.buildStrategicDynamicContext)
    ]);

    return { stageTemplate, dynamicContext };
  }

  /**
   * Get Ontology Stage sections
   */
  private async getOntologyStageSections(
    userId: string, 
    userName: string, 
    context: any, 
    templates: any
  ): Promise<StagePromptSections> {
    const [stageTemplate, dynamicContext] = await Promise.all([
      this.getCachedSection('ontology_stage', userId, userName, templates.ontology_optimization_stage || ''),
      this.getCachedDynamicContext('ontology_dynamic_context', userId, context, this.buildOntologyDynamicContext)
    ]);

    return { stageTemplate, dynamicContext };
  }

  /**
   * Get cached section with metrics tracking
   */
  private async getCachedSection(
    sectionType: string, 
    userId: string, 
    userName: string, 
    template: string
  ): Promise<string> {
    this.cacheMetrics.totalRequests++;
    
    const cached = await this.promptCacheService.getCachedSection(sectionType, userId);
    if (cached) {
      this.cacheMetrics.totalHits++;
      this.cacheMetrics.sharedHits++;
      return cached.content;
    }

    this.cacheMetrics.sharedMisses++;
    const content = template.replace(/\{\{user_name\}\}/g, userName);
    await this.promptCacheService.setCachedSection(sectionType, userId, content);
    
    return content;
  }

  /**
   * Get cached dynamic context with stage-specific caching
   */
  private async getCachedDynamicContext(
    sectionType: string,
    userId: string,
    context: any,
    builder: (context: any) => string
  ): Promise<string> {
    this.cacheMetrics.totalRequests++;
    
    const cached = await this.promptCacheService.getCachedSection(sectionType, userId);
    if (cached) {
      this.cacheMetrics.totalHits++;
      this.cacheMetrics.stageHits++;
      return cached.content;
    }

    this.cacheMetrics.stageMisses++;
    const content = builder(context);
    await this.promptCacheService.setCachedSection(sectionType, userId, content);
    
    return content;
  }

  /**
   * Build Foundation Stage dynamic context with template placeholders
   */
  private buildFoundationDynamicContext(context: any): string {
    // Use template placeholders for better caching
    const template = `=== SECTION 3: DYNAMIC CONTEXT ===

**3.1 Analysis Context:**
- User: {{user_name}}
- Cycle ID: {{cycle_id}}
- Analysis Timestamp: {{timestamp}}
- Cycle Period: {{cycle_start_date}} to {{cycle_end_date}}

**3.2 User Memory Profile:**
{{user_memory_profile}}

**3.3 Consolidated Knowledge Graph:**
- Concepts ({{concept_count}}): {{concept_titles}}
- Memory Units ({{memory_unit_count}}): {{memory_unit_ids}}
- Recent Growth Events ({{growth_event_count}}): {{growth_event_ids}}

**3.4 Recent Conversations:**
{{recent_conversations}}`;

    // Replace placeholders with actual values
    return template
      .replace(/\{\{user_name\}\}/g, context.userName || 'User')
      .replace(/\{\{cycle_id\}\}/g, context.cycleId || 'Unknown')
      .replace(/\{\{timestamp\}\}/g, new Date().toISOString())
      .replace(/\{\{cycle_start_date\}\}/g, context.cycleStartDate || 'Unknown')
      .replace(/\{\{cycle_end_date\}\}/g, context.cycleEndDate || 'Unknown')
      .replace(/\{\{user_memory_profile\}\}/g, context.userMemoryProfile || 'No memory profile available')
      .replace(/\{\{concept_count\}\}/g, (context.currentKnowledgeGraph?.concepts?.length || 0).toString())
      .replace(/\{\{concept_titles\}\}/g, context.currentKnowledgeGraph?.concepts?.map((c: any) => c.title).join(', ') || 'None')
      .replace(/\{\{memory_unit_count\}\}/g, (context.currentKnowledgeGraph?.memoryUnits?.length || 0).toString())
      .replace(/\{\{memory_unit_ids\}\}/g, context.currentKnowledgeGraph?.memoryUnits?.map((m: any) => m.id).join(', ') || 'None')
      .replace(/\{\{growth_event_count\}\}/g, (context.recentGrowthEvents?.length || 0).toString())
      .replace(/\{\{growth_event_ids\}\}/g, context.recentGrowthEvents?.map((e: any) => e.id).join(', ') || 'None')
      .replace(/\{\{recent_conversations\}\}/g, context.currentKnowledgeGraph?.conversations?.map((conv: any, index: number) => `Conversation ${index + 1}: ${conv.content?.substring(0, 200)}...`).join('\n\n') || 'No recent conversations');
  }

  /**
   * Build Strategic Stage dynamic context
   */
  private buildStrategicDynamicContext(context: any): string {
    // Handle null context
    if (!context) {
      return `=== SECTION 3: DYNAMIC CONTEXT ===
No strategic context available.`;
    }

    return `=== SECTION 3: DYNAMIC CONTEXT ===

**3.1 Analysis Context:**
- User: ${context.userName || 'Unknown'}
- Cycle ID: ${context.cycleId || 'Unknown'}
- Analysis Timestamp: ${new Date().toISOString()}
- Cycle Period: ${context.cycleStartDate || 'Unknown'} to ${context.cycleEndDate || 'Unknown'}

**3.2 User Memory Profile:**
${context.userMemoryProfile || 'No memory profile available'}

**3.3 Foundation Results:**
- Memory Profile: ${context.foundationResults?.memory_profile?.content?.substring(0, 300)}...
- Opening: ${context.foundationResults?.opening?.content?.substring(0, 200)}...
- Key Phrases: ${JSON.stringify(context.foundationResults?.key_phrases, null, 2)}

**3.4 Template Requests:**
- Derived Artifacts: ${context.templateRequests?.derived_artifacts?.join(', ') || 'None'}
- Proactive Prompts: ${context.templateRequests?.proactive_prompts?.join(', ') || 'None'}
- Growth Events: ${context.templateRequests?.growth_events?.join(', ') || 'None'}

**3.5 Strategic Context (HRT Retrieved):**
- Retrieved Memory Units (${context.strategicContext?.retrievedMemoryUnits?.length || 0}): ${context.strategicContext?.retrievedMemoryUnits?.map((m: any) => `${m.title} (score: ${m.finalScore})`).join(', ') || 'None'}
- Retrieved Concepts (${context.strategicContext?.retrievedConcepts?.length || 0}): ${context.strategicContext?.retrievedConcepts?.map((c: any) => `${c.title} (score: ${c.finalScore})`).join(', ') || 'None'}
- Retrieved Artifacts (${context.strategicContext?.retrievedArtifacts?.length || 0}): ${context.strategicContext?.retrievedArtifacts?.map((a: any) => `${a.title} (${a.type}, score: ${a.finalScore})`).join(', ') || 'None'}

**3.6 Previous Key Phrases:**
${context.previousKeyPhrases?.map((kp: any) => `${kp.category}: [${kp.phrases.join(', ')}]`).join('; ') || 'None'}`;
  }

  /**
   * Build Ontology Stage dynamic context
   */
  private buildOntologyDynamicContext(context: any): string {
    // Handle null context
    if (!context) {
      return `=== SECTION 3: DYNAMIC CONTEXT ===
No ontology context available.`;
    }

    return `=== SECTION 3: DYNAMIC CONTEXT ===

**3.1 Analysis Context:**
- User: ${context.userName || 'Unknown'}
- Cycle ID: ${context.cycleId || 'Unknown'}
- Analysis Timestamp: ${new Date().toISOString()}

**3.2 Knowledge Graph Structure:**
- Total Concepts: ${context.totalConcepts || 0}
- Total Memory Units: ${context.totalMemoryUnits || 0}
- Concepts Needing Synthesis: ${context.conceptsNeedingSynthesis?.length || 0}
- Recent Growth Events: ${context.recentGrowthEvents?.length || 0}

**3.3 Ontology Optimization Targets:**
- Concepts to Merge: ${context.conceptsToMerge?.length || 0}
- Concepts to Archive: ${context.conceptsToArchive?.length || 0}
- New Strategic Relationships: ${context.newStrategicRelationships?.length || 0}
- Community Structures: ${context.communityStructures?.length || 0}`;
  }

  /**
   * Get cache metrics for monitoring
   */
  getCacheMetrics() {
    return {
      ...this.cacheMetrics,
      hitRate: this.cacheMetrics.totalRequests > 0 ? this.cacheMetrics.totalHits / this.cacheMetrics.totalRequests : 0
    };
  }

  /**
   * Reset cache metrics
   */
  resetCacheMetrics() {
    this.cacheMetrics = {
      sharedHits: 0,
      sharedMisses: 0,
      stageHits: 0,
      stageMisses: 0,
      totalHits: 0,
      totalRequests: 0
    };
  }
}
