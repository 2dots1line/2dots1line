/**
 * StrategicStageTool - V11.1 Multi-Stage Insight Worker
 * 
 * Handles Stage 3: Strategic Insights Generation - Conditional generation based on foundation results.
 * Generates derived artifacts, proactive prompts, and growth events based on template requests.
 * 
 * Architecture: Focused tool for strategic stage with prompt caching integration.
 */

import { z } from 'zod';
import { ConfigService } from '@2dots1line/config-service';
import type { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import { LLMChatTool, type LLMChatInput } from '../ai/LLMChatTool';
import { LLMRetryHandler, PromptCacheService, MultiStagePromptCacheManager } from '@2dots1line/core-utils';

// Input validation schema - ENHANCED to match original StrategicSynthesisTool
export const StrategicStageInputSchema = z.object({
  // Core identification
  userId: z.string(),
  userName: z.string(),
  userMemoryProfile: z.string().optional(),
  cycleId: z.string(),
  cycleStartDate: z.string(),
  cycleEndDate: z.string(),
  
  // Foundation results from Stage 1
  foundationResults: z.object({
    memory_profile: z.object({
      type: z.literal('memory_profile'),
      content: z.string()
    }),
    opening: z.object({
      type: z.literal('opening'),
      title: z.string(),
      content: z.string()
    }),
    key_phrases: z.object({
      // Strategic key phrases for next cycle's HRT retrieval (no hard quota)
      values_and_goals: z.array(z.string()),
      emotional_drivers: z.array(z.string()),
      important_relationships: z.array(z.string()),
      growth_patterns: z.array(z.string()),
      knowledge_domains: z.array(z.string()),
      life_context: z.array(z.string()),
      hidden_connections: z.array(z.string())
    })
  }),
  templateRequests: z.object({
    derived_artifacts: z.array(z.string()),
    proactive_prompts: z.array(z.string()),
    growth_events: z.array(z.string())
  }),
  
  // Current cycle data - STRUCTURED (matching original StrategicSynthesisTool)
  currentKnowledgeGraph: z.object({
    conversations: z.array(z.object({
      content: z.string().optional()
    })),
    memoryUnits: z.array(z.object({
      id: z.string(),
      content: z.string()
    })),
    concepts: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string()
    })),
    conceptsNeedingSynthesis: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string()
    }))
  }),
  
  // Growth events (recent cycle activity)
  recentGrowthEvents: z.array(z.object({
    id: z.string(),
    content: z.string()
  })),
  
  // HRT-retrieved strategic context (historical data) - CRITICAL FOR RICH CONTENT
  strategicContext: z.object({
    retrievedMemoryUnits: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      finalScore: z.number()
    })).optional(),
    retrievedConcepts: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      finalScore: z.number()
    })).optional(),
    retrievedArtifacts: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      type: z.string(),
      finalScore: z.number()
    })).optional(),
    retrievalSummary: z.string().optional()
  }).optional(),
  
  // Previous cycle continuity
  previousKeyPhrases: z.array(z.object({
    category: z.string(),
    phrases: z.array(z.string())
  })).optional(),
  
  // System metadata
  workerType: z.string().optional(),
  workerJobId: z.string().optional(),
  
  // Legacy fields for backward compatibility
  analysisContext: z.string().optional(),
  consolidatedKnowledgeGraph: z.string().optional(),
  recentConversations: z.string().optional()
});

// Output validation schema
export const StrategicStageOutputSchema = z.object({
  derived_artifacts: z.array(z.object({
    type: z.string(),
    title: z.string().optional(),
    content: z.string(),
    source_concept_ids: z.array(z.string()).nullable().optional().default([]),
    source_memory_unit_ids: z.array(z.string()).nullable().optional().default([]),
    confidence_score: z.number().min(0).max(1).optional(),
    supporting_evidence: z.array(z.string()).optional(),
    actionability: z.enum(['immediate', 'short_term', 'long_term', 'aspirational']).optional()
  })),
  proactive_prompts: z.array(z.object({
    type: z.string(),
    title: z.string().optional(),
    content: z.string(),
    context_explanation: z.string().optional(),
    priority_level: z.number().min(1).max(10),
    timing_suggestion: z.string().optional()
  })),
  growth_events: z.array(z.object({
    type: z.string(),
    title: z.string(),
    delta_value: z.number().min(-5).max(5),
    content: z.string(),
    supporting_concept_ids: z.array(z.string()).nullable().optional().default([]),
    supporting_memory_unit_ids: z.array(z.string()).nullable().optional().default([]),
    confidence_score: z.number().min(0).max(1).optional(),
    actionability: z.enum(['immediate', 'short_term', 'long_term', 'aspirational']).optional()
  }))
});

export type StrategicStageInput = z.infer<typeof StrategicStageInputSchema>;
export type StrategicStageOutput = z.infer<typeof StrategicStageOutputSchema>;

// Error classes
export class StrategicStageError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'StrategicStageError';
  }
}

export class StrategicStageValidationError extends StrategicStageError {
  constructor(message: string, public readonly validationErrors: any[]) {
    super(message);
    this.name = 'StrategicStageValidationError';
  }
}

export class StrategicStageTool {
  private llmChatTool: any;
  private retryHandler: typeof LLMRetryHandler;
  private multiStageCacheManager?: MultiStagePromptCacheManager;

  constructor(
    private configService: ConfigService,
    private promptCacheService?: PromptCacheService // Optional for backward compatibility
  ) {
    this.llmChatTool = LLMChatTool; // Use the exported instance
    this.retryHandler = LLMRetryHandler;
    
    // Initialize multi-stage cache manager if cache service is available
    if (this.promptCacheService) {
      this.multiStageCacheManager = new MultiStagePromptCacheManager(this.promptCacheService, this.configService);
    }
  }

  async execute(input: StrategicStageInput): Promise<StrategicStageOutput> {
    console.log(`[StrategicStageTool] Starting strategic insights generation for user ${input.userId}`);
    
    try {
      // Validate input
      const validatedInput = StrategicStageInputSchema.parse(input);
      
      // Build strategic insights prompt with caching
      const prompt = await this.buildStrategicPrompt(validatedInput);
      
      // Execute LLM call with retry logic
      const llmResult = await this.retryHandler.executeWithRetry(
        this.llmChatTool,
        { 
          payload: { 
            systemPrompt: prompt, 
            userMessage: `Please generate strategic insights for user ${validatedInput.userId} based on the foundation results and template requests.`,
            workerType: 'insight-worker',
            workerJobId: validatedInput.cycleId,
            userId: validatedInput.userId,
            sessionId: `strategic-${validatedInput.cycleId}`,
            conversationId: `strategic-${validatedInput.cycleId}`,
            messageId: `strategic-${validatedInput.cycleId}-${Date.now()}`
          } 
        },
        { maxAttempts: 2, baseDelay: 1000 }
      );
      
      // Parse and validate response
      const parsedOutput = this.parseLLMResponse(llmResult.result.text);
      const validatedOutput = StrategicStageOutputSchema.parse(parsedOutput);
      
      console.log(`[StrategicStageTool] Strategic insights generation completed for user ${input.userId}`);
      return validatedOutput;
      
    } catch (error) {
      console.error(`[StrategicStageTool] Strategic insights generation failed for user ${input.userId}:`, error);
      
      if (error instanceof z.ZodError) {
        throw new StrategicStageValidationError(
          `Strategic stage validation failed: ${error.message}`,
          error.errors
        );
      }
      
      throw new StrategicStageError(
        `Strategic stage execution failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Build strategic insights prompt with OPTIMIZED multi-stage caching
   */
  private async buildStrategicPrompt(input: StrategicStageInput): Promise<string> {
    // Use optimized multi-stage caching if available
    if (this.multiStageCacheManager) {
      return this.buildStrategicPromptOptimized(input);
    }
    
    // Fallback to legacy caching
    return this.buildStrategicPromptLegacy(input);
  }

  /**
   * Build strategic prompt with optimized multi-stage caching (follow-up message)
   */
  private async buildStrategicPromptOptimized(input: StrategicStageInput): Promise<string> {
    const user_name = input.userName || 'User';
    
    // Use new optimized caching strategy for Strategic stage (follow-up message)
    const masterPrompt = await this.multiStageCacheManager!.getStrategicPrompt(
      input.userId,
      user_name,
      input, // strategic context
      input.foundationResults // foundation results as cached input
    );

    console.log(`[StrategicStageTool] Built strategic prompt with optimized caching (${masterPrompt.length} characters)`);
    
    return masterPrompt;
  }

  /**
   * Get template definitions for selected templates
   */
  private getTemplateDefinitions(templateRequests: any): string {
    const derivedArtifactTemplates = this.getDerivedArtifactTemplateDefinitions(templateRequests.derived_artifacts);
    const proactivePromptTemplates = this.getProactivePromptTemplateDefinitions(templateRequests.proactive_prompts);
    const growthEventTemplates = this.getGrowthEventTemplateDefinitions(templateRequests.growth_events);
    
    return `
=== TEMPLATE DEFINITIONS ===

${derivedArtifactTemplates}

${proactivePromptTemplates}

${growthEventTemplates}
`;
  }

  private getDerivedArtifactTemplateDefinitions(artifactTypes: string[]): string {
    const templateDefs: { [key: string]: string } = {
      'deeper_story': 'Cross-dimensional pattern synthesis with narrative flair and historical/literary parallels',
      'hidden_connection': 'Unexpected links between seemingly unrelated experiences, with compelling storytelling',
      'values_revolution': 'How core values are transforming different life areas, with inspiring examples',
      'mastery_quest': 'Current chapter of growth with historical/literary parallels and future vision',
      'breakthrough_moment': 'Significant realizations that change perspective, with celebration and forward momentum',
      'synergy_discovery': 'How different strengths are combining in surprising ways, with actionable insights',
      'authentic_voice': 'How the user is claiming their true self, with empowering language',
      'leadership_evolution': 'Growth in how they influence and inspire others, with specific examples',
      'creative_renaissance': 'Periods of artistic or innovative expression, with creative flair',
      'wisdom_integration': 'How life experiences are becoming personal philosophy, with deep insights',
      'vision_crystallization': 'How long-term goals are becoming clearer, with inspiring forward momentum',
      'legacy_building': 'What they\'re creating that will outlast them, with meaningful context',
      'horizon_expansion': 'New possibilities they\'re discovering, with world knowledge integration',
      'transformation_phase': 'Major life transitions and their meaning, with supportive guidance'
    };

    return `**DERIVED ARTIFACT TEMPLATES:**
${artifactTypes.map(type => `- **${type}**: ${templateDefs[type] || 'Custom artifact type'}`).join('\n')}`;
  }

  private getProactivePromptTemplateDefinitions(promptTypes: string[]): string {
    const templateDefs: { [key: string]: string } = {
      'pattern_exploration': 'Questions that help them discover hidden connections between different life areas',
      'values_articulation': 'Prompts to clarify and express core beliefs with personal relevance',
      'future_visioning': 'Questions about long-term aspirations and dreams with inspiring context',
      'wisdom_synthesis': 'Prompts to integrate life lessons into personal philosophy',
      'creative_expression': 'Invitations to artistic or innovative exploration with specific examples',
      'storytelling': 'Prompts to craft their personal narrative with engaging hooks',
      'metaphor_discovery': 'Questions that help them find their own metaphors and analogies',
      'inspiration_hunting': 'Prompts to seek out new sources of motivation and creativity',
      'synergy_building': 'Questions about connecting different life areas for mutual benefit',
      'legacy_planning': 'Prompts about long-term impact and contribution with meaningful context',
      'assumption_challenging': 'Questions that push them to think differently about their beliefs',
      'horizon_expanding': 'Prompts to explore new possibilities beyond their current experience',
      'meaning_making': 'Questions about the deeper significance of their experiences',
      'identity_integration': 'Prompts to synthesize different aspects of their self',
      'gratitude_deepening': 'Questions that help them appreciate their journey more deeply',
      'wisdom_sharing': 'Prompts about how they can help others with their insights'
    };

    return `**PROACTIVE PROMPT TEMPLATES:**
${promptTypes.map(type => `- **${type}**: ${templateDefs[type] || 'Custom prompt type'}`).join('\n')}`;
  }

  private getGrowthEventTemplateDefinitions(eventTypes: string[]): string {
    const templateDefs: { [key: string]: string } = {
      'know_self': 'Insights about personal identity, values, and self-understanding',
      'act_self': 'Personal actions and behaviors that demonstrate growth',
      'show_self': 'Expressions of authentic self to the world',
      'know_world': 'Understanding of external world and relationships',
      'act_world': 'Actions that impact the external world positively',
      'show_world': 'Contributions and expressions to the broader world'
    };

    return `**GROWTH EVENT TEMPLATES:**
${eventTypes.map(type => `- **${type}**: ${templateDefs[type] || 'Custom growth event type'}`).join('\n')}`;
  }

  /**
   * Build strategic prompt with legacy caching (fallback)
   */
  private async buildStrategicPromptLegacy(input: StrategicStageInput): Promise<string> {
    // Load prompt templates from config
    const templates = this.configService.getAllTemplates();
    
    // Build the strategic prompt with caching
    const user_name = input.userName || 'User';
    
    // Cache the core identity section (95% hit rate)
    const coreIdentity = await this.getCachedSection('core_identity', input.userId, user_name, templates.insight_worker_core_identity);
    
    // Cache the operational config section (70% hit rate)
    const operationalConfig = await this.getCachedSection('operational_config', input.userId, user_name, templates.insight_worker_operational_config);
    
    // Build dynamic context with foundation results
    const dynamicContext = this.buildDynamicContext(input);
    
    // Get strategic stage template
    const strategicTemplate = templates.insight_worker_strategic_stage;
    
    // Get template definitions for selected templates
    const templateDefinitions = this.getTemplateDefinitions(input.templateRequests);
    
    const masterPrompt = `${coreIdentity}

${operationalConfig}

${dynamicContext}

${strategicTemplate}

${templateDefinitions}

=== FOUNDATION RESULTS ===
${JSON.stringify(input.foundationResults, null, 2)}

=== TEMPLATE REQUESTS ===
${JSON.stringify(input.templateRequests, null, 2)}

=== STRATEGIC CONTEXT ===
${JSON.stringify(input.strategicContext, null, 2)}

=== PREVIOUS KEY PHRASES ===
${JSON.stringify(input.previousKeyPhrases, null, 2)}

=== CURRENT KNOWLEDGE GRAPH ===
${JSON.stringify(input.currentKnowledgeGraph, null, 2)}

=== RECENT GROWTH EVENTS ===
${JSON.stringify(input.recentGrowthEvents, null, 2)}`;

    console.log(`[StrategicStageTool] Built strategic prompt with legacy caching (${masterPrompt.length} characters)`);
    return masterPrompt;
  }

  /**
   * Build dynamic context section with RICH CONTEXT (matching original StrategicSynthesisTool)
   */
  private buildDynamicContext(input: StrategicStageInput): string {
    // Build dynamic context data (matching original StrategicSynthesisTool structure)
    const dynamicContextData = {
      analysis_context: {
        user_name: input.userName,
        cycle_id: input.cycleId,
        analysis_timestamp: new Date().toISOString(),
        cycle_period: `${input.cycleStartDate} to ${input.cycleEndDate}`
      },
      user_memory_profile: {
        memory_profile: input.userMemoryProfile || 'No memory profile available'
      },
      consolidated_knowledge_graph: {
        concepts: input.currentKnowledgeGraph?.concepts || [],
        memory_units: input.currentKnowledgeGraph?.memoryUnits || [],
        concepts_needing_synthesis: input.currentKnowledgeGraph?.conceptsNeedingSynthesis || [],
        recent_growth_events: input.recentGrowthEvents || [],
        previous_key_phrases: input.previousKeyPhrases || []
      },
      recent_conversations: {
        conversations: input.currentKnowledgeGraph?.conversations || []
      },
      foundation_results: {
        memory_profile: input.foundationResults?.memory_profile,
        opening: input.foundationResults?.opening,
        key_phrases: input.foundationResults?.key_phrases
      },
      template_requests: input.templateRequests,
      strategic_context: input.strategicContext || {}
    };

    // Process dynamic context template (matching original StrategicSynthesisTool)
    const dynamicContextProcessed = this.buildDynamicContextSimple(dynamicContextData);

    return dynamicContextProcessed;
  }

  /**
   * Build dynamic context simple (matching original StrategicSynthesisTool)
   */
  private buildDynamicContextSimple(data: any): string {
    return `=== SECTION 3: DYNAMIC CONTEXT ===

**3.1 Analysis Context:**
- User: ${data.analysis_context.user_name}
- Cycle ID: ${data.analysis_context.cycle_id}
- Analysis Timestamp: ${data.analysis_context.analysis_timestamp}
- Cycle Period: ${data.analysis_context.cycle_period}

**3.2 User Memory Profile:**
${data.user_memory_profile.memory_profile}

**3.3 Consolidated Knowledge Graph:**
- Concepts (${data.consolidated_knowledge_graph.concepts.length}): ${data.consolidated_knowledge_graph.concepts.map((c: any) => c.title).join(', ')}
- Memory Units (${data.consolidated_knowledge_graph.memory_units.length}): ${data.consolidated_knowledge_graph.memory_units.map((m: any) => m.id).join(', ')}
- Concepts Needing Synthesis (${data.consolidated_knowledge_graph.concepts_needing_synthesis.length}): ${data.consolidated_knowledge_graph.concepts_needing_synthesis.map((c: any) => c.title).join(', ')}
- Recent Growth Events (${data.consolidated_knowledge_graph.recent_growth_events.length}): ${data.consolidated_knowledge_graph.recent_growth_events.map((e: any) => e.id).join(', ')}
- Previous Key Phrases: ${data.consolidated_knowledge_graph.previous_key_phrases.map((kp: any) => `${kp.category}: [${kp.phrases.join(', ')}]`).join('; ')}

**3.4 Recent Conversations:**
${data.recent_conversations.conversations.map((conv: any, index: number) => `Conversation ${index + 1}: ${conv.content?.substring(0, 200)}...`).join('\n\n')}

**3.5 Foundation Results:**
- Memory Profile: ${data.foundation_results.memory_profile?.content?.substring(0, 300)}...
- Opening: ${data.foundation_results.opening?.content?.substring(0, 200)}...
- Key Phrases: ${JSON.stringify(data.foundation_results.key_phrases, null, 2)}

**3.6 Template Requests:**
- Derived Artifacts: ${data.template_requests.derived_artifacts.join(', ')}
- Proactive Prompts: ${data.template_requests.proactive_prompts.join(', ')}
- Growth Events: ${data.template_requests.growth_events.join(', ')}

**3.7 Strategic Context (HRT Retrieved):**
- Retrieved Memory Units (${data.strategic_context.retrievedMemoryUnits?.length || 0}): ${data.strategic_context.retrievedMemoryUnits?.map((m: any) => `${m.title} (score: ${m.finalScore})`).join(', ') || 'None'}
- Retrieved Concepts (${data.strategic_context.retrievedConcepts?.length || 0}): ${data.strategic_context.retrievedConcepts?.map((c: any) => `${c.title} (score: ${c.finalScore})`).join(', ') || 'None'}
- Retrieved Artifacts (${data.strategic_context.retrievedArtifacts?.length || 0}): ${data.strategic_context.retrievedArtifacts?.map((a: any) => `${a.title} (${a.type}, score: ${a.finalScore})`).join(', ') || 'None'}
- Retrieval Summary: ${data.strategic_context.retrievalSummary || 'No summary available'}`;
  }

  /**
   * Get cached section or build and cache it
   */
  private async getCachedSection(
    sectionType: string, 
    userId: string, 
    userName: string, 
    template: string
  ): Promise<string> {
    // If no cache service, fall back to direct rendering
    if (!this.promptCacheService) {
      return template.replace(/\{\{user_name\}\}/g, userName);
    }

    // Try to get from cache
    const cached = await this.promptCacheService.getCachedSection(sectionType, userId);
    if (cached) {
      return cached.content;
    }

    // Build and cache
    const content = template.replace(/\{\{user_name\}\}/g, userName);
    await this.promptCacheService.setCachedSection(sectionType, userId, content);
    
    return content;
  }

  /**
   * Execute LLM call
   */
  private async executeLLMCall(prompt: string, userId: string): Promise<string> {
    const llmInput = {
      payload: {
        userId,
        sessionId: `strategic-${userId}-${Date.now()}`,
        systemPrompt: prompt,
        userMessage: `Please generate strategic insights for user ${userId} based on the foundation results and template requests.`,
        history: [],
        modelOverride: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 16384 // Higher for strategic stage
      }
    };

    const result = await this.llmChatTool.execute(llmInput);
    return result.text;
  }

  /**
   * Parse LLM response and extract JSON
   */
  private parseLLMResponse(response: string): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in LLM response');
      }

      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[StrategicStageTool] JSON parsing failed:', error);
      console.error('[StrategicStageTool] Raw response:', response);
      throw new StrategicStageError(`Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get tool manifest
   */
  getManifest(): { name: string; description: string; version: string } {
    return {
      name: 'StrategicStageTool',
      description: 'Generates strategic insights based on foundation results (derived artifacts, proactive prompts, growth events)',
      version: '11.1.0'
    };
  }
}
