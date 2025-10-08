/**
 * StrategicSynthesisTool - V9.5 Composite Tool for InsightEngine
 * 
 * Performs strategic analysis of knowledge graphs to identify patterns, optimize
 * ontologies, and generate proactive insights through cyclical analysis.
 * 
 * Architecture: Composite tool using injected atomic tools for strategic analysis.
 */

import { z } from 'zod';
import { ConfigService } from '@2dots1line/config-service';
import type { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import { LLMChatTool, type LLMChatInput } from '../ai/LLMChatTool';
import { LLMRetryHandler, PromptCacheService } from '@2dots1line/core-utils';

// Output validation schema
export const StrategicSynthesisOutputSchema = z.object({
  ontology_optimizations: z.object({
    concepts_to_merge: z.array(z.object({
      primary_entity_id: z.string(),
      secondary_entity_ids: z.array(z.string()),
      merge_rationale: z.string(),
      new_concept_title: z.string(),
      new_concept_content: z.string()
    })),
    concepts_to_archive: z.array(z.object({
      entity_id: z.string(),
      archive_rationale: z.string(),
      replacement_entity_id: z.string().nullable()
    })),
    new_strategic_relationships: z.array(z.object({
      source_id: z.string(),
      target_id: z.string(),
      relationship_type: z.enum(['STRATEGIC_ALIGNMENT', 'GROWTH_CATALYST', 'KNOWLEDGE_BRIDGE', 'SYNERGY_POTENTIAL']),
      strength: z.number().min(0).max(1),
      strategic_value: z.string()
    })),
    community_structures: z.array(z.object({
      community_id: z.string(),
      member_entity_ids: z.array(z.string()),
      theme: z.string(),
      strategic_importance: z.number().min(1).max(10)
    })),
    concept_description_synthesis: z.array(z.object({
      entity_id: z.string(),
      synthesized_content: z.string()
    }))
  }),
  derived_artifacts: z.array(z.object({
    type: z.enum(['opening', 'deeper_story', 'hidden_connection', 'values_revolution', 'mastery_quest', 'breakthrough_moment', 'synergy_discovery', 'authentic_voice', 'leadership_evolution', 'creative_renaissance', 'wisdom_integration', 'vision_crystallization', 'legacy_building', 'horizon_expansion', 'transformation_phase', 'insight', 'pattern', 'recommendation', 'synthesis', 'identified_pattern', 'emerging_theme', 'focus_area', 'blind_spot', 'celebration_moment', 'memory_profile']),
    title: z.string(),
    content: z.string(),
    confidence_score: z.number().min(0).max(1),
    supporting_evidence: z.array(z.string()),
    actionability: z.enum(['immediate', 'short_term', 'long_term', 'aspirational']),
    source_concept_ids: z.array(z.string()).nullable().optional().default([]),
    source_memory_unit_ids: z.array(z.string()).nullable().optional().default([])
  })),
  proactive_prompts: z.array(z.object({
    type: z.enum(['pattern_exploration', 'values_articulation', 'future_visioning', 'wisdom_synthesis', 'creative_expression', 'storytelling', 'metaphor_discovery', 'inspiration_hunting', 'synergy_building', 'legacy_planning', 'assumption_challenging', 'horizon_expanding', 'meaning_making', 'identity_integration', 'gratitude_deepening', 'wisdom_sharing', 'reflection', 'exploration', 'goal_setting', 'skill_development']),
    title: z.string(),
    content: z.string(),
    context_explanation: z.string(),
    timing_suggestion: z.enum(['next_conversation', 'weekly_check_in', 'monthly_review', 'quarterly_planning']),
    priority_level: z.number().min(1).max(10)
  })),
  growth_events: z.array(z.object({
    type: z.enum(['know_self', 'act_self', 'show_self', 'know_world', 'act_world', 'show_world']),
    title: z.string().min(1), // Removed max limit to allow descriptive titles
    delta_value: z.number().min(-5.0).max(5.0),
    content: z.string(),
    source_concept_ids: z.array(z.string()).nullable().optional().default([]),
    source_memory_unit_ids: z.array(z.string()).nullable().optional().default([]),
    confidence_score: z.number().min(0).max(1),
    actionability: z.enum(['immediate', 'short_term', 'long_term', 'aspirational'])
  })),
  key_phrases: z.object({
    values_and_goals: z.array(z.string()),
    emotional_drivers: z.array(z.string()),
    important_relationships: z.array(z.string()),
    growth_patterns: z.array(z.string()),
    knowledge_domains: z.array(z.string()),
    life_context: z.array(z.string()),
    hidden_connections: z.array(z.string())
  })
});

export type StrategicSynthesisOutput = z.infer<typeof StrategicSynthesisOutputSchema>;

export interface StrategicSynthesisInput {
  // Core identification
  userId: string;
  userName?: string;
  userMemoryProfile?: string;
  cycleId: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  
  // Current cycle data
  currentKnowledgeGraph: {
    conversations: Array<{
      content?: string;
    }>;
    memoryUnits: Array<{
      id: string;
      content: string;
    }>;
    concepts: Array<{
      id: string;
      title: string;
      content: string;
    }>;
    conceptsNeedingSynthesis: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  };
  
  // Growth events (recent cycle activity)
  recentGrowthEvents: Array<{
    id: string;
    content: string;
  }>;
  
  // HRT-retrieved strategic context (historical data)
  strategicContext?: {
    retrievedMemoryUnits?: Array<{
      id: string;
      title: string;
      content: string;
      finalScore: number;
    }>;
    retrievedConcepts?: Array<{
      id: string;
      title: string;
      content: string;
      finalScore: number;
    }>;
    retrievedArtifacts?: Array<{
      id: string;
      title: string;
      content: string;
      type: string;
      finalScore: number;
    }>;
    retrievalSummary?: string;
  };
  
  // Previous cycle continuity
  previousKeyPhrases?: Array<{
    category: string;
    phrases: string[];
  }>;
  
  // System metadata
  workerType?: string;
  workerJobId?: string;
}

// Error types
export class StrategicSynthesisError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StrategicSynthesisError';
  }
}

export class StrategicSynthesisJSONParseError extends StrategicSynthesisError {
  constructor(message: string, public readonly rawResponse: string) {
    super(message);
    this.name = 'StrategicSynthesisJSONParseError';
  }
}

export class StrategicSynthesisValidationError extends StrategicSynthesisError {
  constructor(message: string, public readonly validationErrors: any[]) {
    super(message);
    this.name = 'StrategicSynthesisValidationError';
  }
}

export class StrategicSynthesisTool {
  constructor(
    private configService: ConfigService,
    private promptCacheService?: PromptCacheService // Optional for backward compatibility
  ) {}

  async execute(input: StrategicSynthesisInput): Promise<StrategicSynthesisOutput> {
    console.log(`[StrategicSynthesisTool] Starting strategic synthesis for cycle ${input.cycleId}`);
    console.log(`[StrategicSynthesisTool] Analyzing ${input.currentKnowledgeGraph.memoryUnits.length} memory units`);
    console.log(`[StrategicSynthesisTool] Analyzing ${input.currentKnowledgeGraph.concepts.length} concepts`);
    
    // Build analysis prompt
    const prompt = await this.buildStrategicAnalysisPrompt(input);
    
    // Prepare LLM input
    const llmInput: LLMChatInput = {
      payload: {
        userId: input.userId,
        sessionId: `strategic-synthesis-${input.cycleId}`,
        workerType: input.workerType || 'insight-worker',
        workerJobId: input.workerJobId,
        sourceEntityId: input.cycleId,
        systemPrompt: "You are the InsightEngine component performing strategic cyclical analysis. Follow the instructions precisely and return valid JSON without any markers or additional text.",
        history: [],
        userMessage: prompt,
        temperature: 0.4,
        maxTokens: 50000
      }
    };
    
    // Call LLM with retry logic - LLMRetryHandler handles LLM service failures
    const llmResult = await LLMRetryHandler.executeWithRetry(
      LLMChatTool,
      llmInput,
      { 
        callType: 'strategic-synthesis'
      }
    );
    
    console.log(`[StrategicSynthesisTool] LLM response received, length: ${llmResult.result.text.length}`);
    
    // If we get here, LLM service succeeded - work with whatever response we got
    // No fallback responses - work with the actual LLM response
    const synthesisResult = this.validateAndParseOutput(llmResult.result.text);
    
    console.log('[StrategicSynthesisTool] Strategic synthesis completed successfully');
    console.log(`[StrategicSynthesisTool] Generated ${synthesisResult.ontology_optimizations.concepts_to_merge.length} concept merges`);
    console.log(`[StrategicSynthesisTool] Generated ${synthesisResult.derived_artifacts.length} derived artifacts`);
    console.log(`[StrategicSynthesisTool] Generated ${synthesisResult.proactive_prompts.length} proactive prompts`);
    
    return synthesisResult;
  }

  /**
   * Build strategic analysis prompt using KV cache-optimized templates
   */
  private async buildStrategicAnalysisPrompt(input: StrategicSynthesisInput): Promise<string> {
    // Load templates
    const templates = this.configService.getAllTemplates();
    
    // Get templates
    const coreIdentity = templates.insight_worker_core_identity;
    const operationalConfig = templates.insight_worker_operational_config;
    const dynamicContext = templates.insight_worker_dynamic_context;
    const currentAnalysis = templates.insight_worker_current_analysis;
    
    // Consolidate entities
    const consolidatedEntities = this.consolidateEntities(input);
    
    console.log(`[StrategicSynthesisTool] Building KV cache-optimized prompt with ${input.currentKnowledgeGraph.conversations.length} conversations, ${consolidatedEntities.memoryUnits.length} memory units, ${consolidatedEntities.concepts.length} concepts`);
    
    // Replace user name placeholders with caching
    const user_name = input.userName || 'User';
    const coreIdentityWithUserName = await this.getCachedSection('ontology_optimization', input.userId, user_name, coreIdentity);
    const operationalConfigWithUserName = await this.getCachedSection('artifact_generation', input.userId, user_name, operationalConfig);
    const currentAnalysisWithUserName = currentAnalysis.replace(/\{\{user_name\}\}/g, user_name); // Don't cache current analysis

    // Build dynamic context data
    const dynamicContextData = {
      analysis_context: {
        user_name: user_name,
        cycle_id: input.cycleId,
        analysis_timestamp: new Date().toISOString(),
        cycle_period: `${input.cycleStartDate.toISOString()} to ${input.cycleEndDate.toISOString()}`
      },
      user_memory_profile: {
        memory_profile: input.userMemoryProfile || 'No memory profile available'
      },
      consolidated_knowledge_graph: {
        concepts: consolidatedEntities.concepts,
        memory_units: consolidatedEntities.memoryUnits,
        concepts_needing_synthesis: input.currentKnowledgeGraph.conceptsNeedingSynthesis,
        recent_growth_events: input.recentGrowthEvents || [],
        previous_key_phrases: input.previousKeyPhrases || []
      },
      recent_conversations: {
        conversations: input.currentKnowledgeGraph.conversations.map(conv => ({
          content: conv.content || 'No content available'
        }))
      }
    };

    // Process dynamic context template
    const dynamicContextProcessed = this.buildDynamicContextSimple(dynamicContextData);

    // Build prompt
    const masterPrompt = `${coreIdentityWithUserName}

${operationalConfigWithUserName}

${dynamicContextProcessed}

${currentAnalysisWithUserName}`;

    console.log(`[StrategicSynthesisTool] Final prompt length: ${masterPrompt.length} characters`);
    return masterPrompt;
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
   * Process Mustache template with data
   */
  private processMustacheTemplate(template: string, data: any): string {
    let result = template;
    
    // Process sections with arrays and objects (supports underscore-separated names)
    result = result.replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, sectionName, content) => {
      const sectionData = this.getNestedValue(data, sectionName);
      if (!sectionData) return '';
      
      if (Array.isArray(sectionData)) {
        return sectionData.map(item => {
          let itemContent = content;
          // Replace item properties
          Object.keys(item).forEach(key => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            itemContent = itemContent.replace(regex, this.formatValue(item[key]) || '');
          });
          return itemContent;
        }).join('');
      } else {
        // For objects, process the content with the object as context
        let processedContent = content;
        Object.keys(sectionData).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          processedContent = processedContent.replace(regex, this.formatValue(sectionData[key]) || '');
        });
        return processedContent;
      }
    });
    
    // Process remaining variables (including object properties like .length)
    result = this.processVariables(result, data);
    
    return result;
  }

  /**
   * Get nested value from object using dot notation or underscore notation
   */
  private getNestedValue(obj: any, path: string): any {
    // Handle both dot notation (nested.properties) and underscore notation (section_names)
    const keys = path.includes('.') ? path.split('.') : [path];
    return keys.reduce((current, key) => current?.[key], obj);
  }

  /**
   * Process simple variables and object properties in template
   */
  private processVariables(template: string, data: any): string {
    let result = template;
    
    // Process all variables in the template
    const variableRegex = /\{\{([^}]+)\}\}/g;
    let match;
    
    while ((match = variableRegex.exec(result)) !== null) {
      const fullMatch = match[0]; // {{variable}}
      const variablePath = match[1]; // variable
      
      const value = this.getNestedValue(data, variablePath);
      const formattedValue = this.formatValue(value) || '';
      
      result = result.replace(fullMatch, formattedValue);
    }
    
    return result;
  }

  /**
   * Format value for template replacement
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.length.toString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }


  /**
   * Consolidate and deduplicate entities from all sources
   */
  private consolidateEntities(input: StrategicSynthesisInput): {
    concepts: Array<{ id: string; title: string; content: string }>;
    memoryUnits: Array<{ id: string; content: string }>;
  } {
    // Consolidate concepts
    const allConcepts = [
      ...input.currentKnowledgeGraph.concepts,
      // Normalize HRT concepts
      ...(input.strategicContext?.retrievedConcepts?.map((concept: any) => ({
        id: concept.id,
        title: concept.title,
        content: concept.content
        // Drop finalScore field
      })) || [])
    ];
    
    const deduplicatedConcepts = this.deduplicateConcepts(allConcepts);
    
    // Consolidate memory units
    const allMemoryUnits = [
      ...input.currentKnowledgeGraph.memoryUnits,
      // Normalize HRT memory units
      ...(input.strategicContext?.retrievedMemoryUnits?.map((mu: any) => ({
        id: mu.id,
        content: mu.content
        // Drop title and finalScore fields
      })) || [])
    ];
    
    const deduplicatedMemoryUnits = this.deduplicateMemoryUnits(allMemoryUnits);
    
    return {
      concepts: deduplicatedConcepts,
      memoryUnits: deduplicatedMemoryUnits
    };
  }

  /**
   * Deduplicate concepts by title, merging content
   */
  private deduplicateConcepts(concepts: Array<{ id: string; title: string; content: string }>): Array<{ id: string; title: string; content: string }> {
    const seen = new Map<string, { id: string; title: string; content: string }>();
    
    for (const concept of concepts) {
      const key = concept.title.toLowerCase().trim();
      if (seen.has(key)) {
        // Merge content
        const existing = seen.get(key)!;
        if (existing.content !== concept.content && concept.content.trim()) {
          existing.content = `${existing.content} ${concept.content}`.trim();
        }
      } else {
        seen.set(key, { ...concept });
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Deduplicate memory units by content
   */
  private deduplicateMemoryUnits(memoryUnits: Array<{ id: string; content: string }>): Array<{ id: string; content: string }> {
    const seen = new Map<string, { id: string; content: string }>();
    
    for (const memoryUnit of memoryUnits) {
      const key = memoryUnit.content.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, { ...memoryUnit });
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Build dynamic context using simple string interpolation (surgical fix for template processing)
   */
  private buildDynamicContextSimple(data: any): string {
    const analysis_context = data?.analysis_context || {};
    const kg = data?.consolidated_knowledge_graph || {};
    const consolidated_knowledge_graph = {
      concepts: Array.isArray(kg.concepts) ? kg.concepts : [],
      memory_units: Array.isArray(kg.memory_units) ? kg.memory_units : [],
      concepts_needing_synthesis: Array.isArray(kg.concepts_needing_synthesis) ? kg.concepts_needing_synthesis : [],
      recent_growth_events: Array.isArray(kg.recent_growth_events) ? kg.recent_growth_events : [],
      previous_key_phrases: Array.isArray(kg.previous_key_phrases) ? kg.previous_key_phrases : []
    };
    const rc = data?.recent_conversations || {};
    const recent_conversations = {
      conversations: Array.isArray(rc.conversations) ? rc.conversations : []
    };
    
    return `=== SECTION 3: DYNAMIC CONTEXT ===

## 3.1 ANALYSIS CONTEXT (High Cacheability: 80-90%)
User: ${analysis_context.user_name}
Cycle ID: ${analysis_context.cycle_id}
Analysis Timestamp: ${analysis_context.analysis_timestamp}
Cycle Period: ${analysis_context.cycle_period}

## 3.2 CONSOLIDATED KNOWLEDGE GRAPH (Medium Cacheability: 50-70%)
### Concepts (${consolidated_knowledge_graph.concepts.length} total)
${consolidated_knowledge_graph.concepts.map((concept: any) => 
  `- **${concept.title}** (${concept.id}): ${concept.content}`
).join('\n')}

### Memory Units (${consolidated_knowledge_graph.memory_units.length} total)
${consolidated_knowledge_graph.memory_units.map((mu: any) => 
  `- **${mu.id}**: ${mu.content}`
).join('\n')}

### Concepts Needing Synthesis (${consolidated_knowledge_graph.concepts_needing_synthesis.length} total)
${consolidated_knowledge_graph.concepts_needing_synthesis.map((concept: any) => 
  `- **${concept.title}** (${concept.id}): ${concept.content}`
).join('\n')}

### Recent Growth Events (${consolidated_knowledge_graph.recent_growth_events.length} total)
${consolidated_knowledge_graph.recent_growth_events.map((event: any) => 
  `- **${event.id}**: ${event.content}`
).join('\n')}

### Previous Cycle Key Phrases (${consolidated_knowledge_graph.previous_key_phrases.length} total)
${consolidated_knowledge_graph.previous_key_phrases.map((kp: any) => 
  `- **${kp.category ?? ''}**: ${(Array.isArray(kp.phrases) ? kp.phrases : []).join(', ')}`
).join('\n')}

## 3.3 RECENT CONVERSATIONS (Low Cacheability: 10-30%)
${recent_conversations.conversations.map((conv: any) => 
  `- **${conv.title ?? ''}** (${conv.importance_score ?? 0}/10): ${conv.summary ?? (conv.content ?? '')}`
).join('\n')}`;
  }

  /**
   * Parse and validate LLM output with resilient error handling
   * Works with whatever the LLM sends back, only failing on critical issues
   * Never hides LLM response failures - works with actual response
   */
  private validateAndParseOutput(llmJsonResponse: string): StrategicSynthesisOutput {
    console.log(`[StrategicSynthesisTool] Processing LLM response (${llmJsonResponse.length} chars)`);
    
    // Extract JSON from response (handles extra text, markdown, etc.)
    const jsonData = this.extractJSONFromResponse(llmJsonResponse);
    
    // Check if LLM returned schema template instead of actual data
    this.detectSchemaResponse(jsonData);
    
    // Validate with smart error recovery - work with actual LLM response
    return this.validateWithRecovery(jsonData);
  }

  /**
   * Detect if LLM returned schema template instead of actual data
   */
  private detectSchemaResponse(data: any): void {
    if (!data || typeof data !== 'object') return;
    
    // Check for schema syntax patterns
    const schemaPatterns = [
      /\|/g,  // Pipe separators like "opening" | "deeper_story"
      /<[^>]+>/g,  // Angle brackets like <artifact_title>
      /<number_between_[^>]+>/g,  // Number placeholders
      /<string>/g,  // String placeholders
    ];
    
    const dataString = JSON.stringify(data);
    const foundPatterns = schemaPatterns.filter(pattern => pattern.test(dataString));
    
    if (foundPatterns.length > 0) {
      console.error(`[StrategicSynthesisTool] 🚨 SCHEMA DETECTION: LLM returned schema template instead of actual data!`);
      console.error(`[StrategicSynthesisTool] Found schema patterns: ${foundPatterns.length}`);
      console.error(`[StrategicSynthesisTool] This indicates a prompt engineering issue - LLM is confused by schema examples`);
      
      // Throw a specific error that can be caught and handled
      throw new StrategicSynthesisValidationError(
        'LLM response format is critically invalid - returned schema template instead of actual data. This indicates a prompt engineering issue where the LLM is confused by schema examples in the prompt.',
        [{ 
          code: 'schema_template_detected', 
          message: 'LLM returned schema template instead of actual data',
          data: dataString 
        }]
      );
    }
  }

  /**
   * Extract JSON from LLM response, handling various response formats
   */
  private extractJSONFromResponse(response: string): any {
    // Try direct parsing first (most common case)
    try {
      return JSON.parse(response.trim());
    } catch {
      // Extract JSON from response with extra text
      const firstBrace = response.indexOf('{');
      const lastBrace = response.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new StrategicSynthesisJSONParseError('No valid JSON found in LLM response', response);
      }
      
      const jsonString = response.substring(firstBrace, lastBrace + 1).trim();
      return JSON.parse(jsonString);
    }
  }

  /**
   * Validate data with smart error recovery - work with actual LLM response
   * Only applies minor fixes for formatting issues, never hides LLM response content
   */
  private validateWithRecovery(data: any): StrategicSynthesisOutput {
    try {
      // Try validation first
      return StrategicSynthesisOutputSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn(`[StrategicSynthesisTool] Validation issues detected, attempting minor fixes...`);
        
        // Apply only minor fixes for common formatting issues
        const fixedData = this.applyMinorFixes(data, error.errors);
        
        try {
          const result = StrategicSynthesisOutputSchema.parse(fixedData);
          console.log(`[StrategicSynthesisTool] Minor fixes successful`);
          return result;
        } catch (recoveryError) {
          console.error(`[StrategicSynthesisTool] Minor fixes failed - LLM response has critical issues`);
          console.error(`[StrategicSynthesisTool] This indicates a problem with the LLM response format that needs investigation`);
          throw new StrategicSynthesisValidationError('LLM response format is critically invalid', error.errors);
        }
      }
      throw new StrategicSynthesisError('Unexpected validation error', error as Error);
    }
  }

  /**
   * Apply minor fixes for common LLM response formatting issues
   * Only fixes minor formatting problems, never adds content
   */
  private applyMinorFixes(data: any, errors: z.ZodIssue[]): any {
    const fixed = JSON.parse(JSON.stringify(data));
    
    // Only fix minor formatting issues - don't add missing content
    this.cleanupArrays(fixed);
    this.coerceNullableArrays(fixed);
    
    return fixed;
  }


  /**
   * Clean up arrays by removing null/undefined items
   */
  private cleanupArrays(data: any): void {
    const arrayFields = [
      'derived_artifacts', 'proactive_prompts',
      'ontology_optimizations.concepts_to_merge',
      'ontology_optimizations.concepts_to_archive',
      'ontology_optimizations.new_strategic_relationships',
      'ontology_optimizations.community_structures',
      'ontology_optimizations.concept_description_synthesis'
    ];
    
    for (const field of arrayFields) {
      this.filterArrayField(data, field);
    }
  }

  /**
   * Coerce nullable array fields to [] when null is provided by LLM
   */
  private coerceNullableArrays(data: any): void {
    const nullableArrayPaths = [
      'derived_artifacts',
      'proactive_prompts',
      'growth_events',
      // Per-item nullable arrays
      'growth_events.*.source_concept_ids',
      'growth_events.*.source_memory_unit_ids',
      'derived_artifacts.*.source_concept_ids',
      'derived_artifacts.*.source_memory_unit_ids'
    ];
    
    for (const path of nullableArrayPaths) {
      if (path.includes('*.')) {
        const [arrayPath, itemField] = path.split('*.');
        const arr = this.getNestedValue(data, arrayPath);
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (item && item[itemField] === null) item[itemField] = [];
          }
        }
      } else {
        const arr = this.getNestedValue(data, path);
        if (arr === null) {
          const keys = path.split('.');
          let current = data;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) return;
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = [];
        }
      }
    }
  }

  /**
   * Filter null/undefined items from a specific array field
   */
  private filterArrayField(data: any, fieldPath: string): void {
    const path = fieldPath.split('.');
    let current = data;
    
    // Navigate to the parent object
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) return; // Field doesn't exist
      current = current[path[i]];
    }
    
    const arrayField = path[path.length - 1];
    if (Array.isArray(current[arrayField])) {
      current[arrayField] = current[arrayField].filter((item: any) => item != null);
    }
  }




  /**
   * Get tool metadata
   */
  static getMetadata() {
    return {
      name: 'StrategicSynthesisTool',
      description: 'Composite tool for strategic knowledge graph analysis and optimization',
      version: '1.0.0',
      requiredAtomicTools: ['LLMChatTool'],
      inputSchema: 'StrategicSynthesisInput',
      outputSchema: 'StrategicSynthesisOutput'
    };
  }
} 