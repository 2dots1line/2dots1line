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
import { LLMRetryHandler } from '@2dots1line/core-utils';

// Output validation schema
export const StrategicSynthesisOutputSchema = z.object({
  ontology_optimizations: z.object({
    concepts_to_merge: z.array(z.object({
      primary_concept_id: z.string(),
      secondary_concept_ids: z.array(z.string()),
      merge_rationale: z.string(),
      new_concept_name: z.string(),
      new_concept_description: z.string()
    })),
    concepts_to_archive: z.array(z.object({
      concept_id: z.string(),
      archive_rationale: z.string(),
      replacement_concept_id: z.string().nullable()
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
      member_concept_ids: z.array(z.string()),
      theme: z.string(),
      strategic_importance: z.number().min(1).max(10)
    })),
    concept_description_synthesis: z.array(z.object({
      concept_id: z.string(),
      synthesized_description: z.string()
    }))
  }),
  derived_artifacts: z.array(z.object({
    artifact_type: z.enum(['insight', 'pattern', 'recommendation', 'synthesis', 'identified_pattern', 'emerging_theme', 'focus_area', 'blind_spot', 'celebration_moment']),
    title: z.string(),
    content: z.string(),
    confidence_score: z.number().min(0).max(1),
    supporting_evidence: z.array(z.string()),
    actionability: z.enum(['immediate', 'short_term', 'long_term', 'aspirational']),
    content_data: z.record(z.any()).optional(),
    source_concept_ids: z.array(z.string()).optional(),
    source_memory_unit_ids: z.array(z.string()).optional()
  })),
  proactive_prompts: z.array(z.object({
    prompt_type: z.enum(['reflection', 'exploration', 'goal_setting', 'skill_development', 'creative_expression']),
    title: z.string(),
    prompt_text: z.string(),
    context_explanation: z.string(),
    timing_suggestion: z.enum(['next_conversation', 'weekly_check_in', 'monthly_review', 'quarterly_planning']),
    priority_level: z.number().min(1).max(10)
  }))
});

export type StrategicSynthesisOutput = z.infer<typeof StrategicSynthesisOutputSchema>;

export interface StrategicSynthesisInput {
  userId: string;
  userName?: string;
  cycleId: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  currentKnowledgeGraph: {
    conversations: Array<{
      context_summary: string;
    }>;
    memoryUnits: Array<{
      id: string;
      content: string;
    }>;
    concepts: Array<{
      id: string;
      name: string;
      description: string;
    }>;
    conceptsNeedingSynthesis: Array<{
      id: string;
      name: string;
      description: string;
    }>;
    // HRT-retrieved strategic context
    strategicContext?: {
      retrievedMemoryUnits?: Array<{
        id: string;
        title: string;
        content: string;
        finalScore: number;
      }>;
      retrievedConcepts?: Array<{
        id: string;
        name: string;
        description: string;
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
  };
  recentGrowthEvents: Array<{
    id: string;
    rationale: string;
  }>;
  userProfile: {
    preferences: any;
    goals: string[];
    interests: string[];
    growth_trajectory: any;
  };
  
  // LLM interaction logging
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
    private configService: ConfigService
  ) {}

  async execute(input: StrategicSynthesisInput): Promise<StrategicSynthesisOutput> {
    console.log(`[StrategicSynthesisTool] Starting strategic synthesis for cycle ${input.cycleId}`);
    console.log(`[StrategicSynthesisTool] Analyzing ${input.currentKnowledgeGraph.memoryUnits.length} memory units`);
    console.log(`[StrategicSynthesisTool] Analyzing ${input.currentKnowledgeGraph.concepts.length} concepts`);
    
    try {
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
      
      // Call LLM with retry logic
      const llmResult = await LLMRetryHandler.executeWithRetry(
        LLMChatTool,
        llmInput,
        { 
          callType: 'strategic-synthesis'
        }
      );
      
      console.log(`[StrategicSynthesisTool] LLM response received, length: ${llmResult.result.text.length}`);
      
      // Parse and validate response
      const synthesisResult = this.validateAndParseOutput(llmResult.result.text);
      
      console.log('[StrategicSynthesisTool] Strategic synthesis completed successfully');
      console.log(`[StrategicSynthesisTool] Generated ${synthesisResult.ontology_optimizations.concepts_to_merge.length} concept merges`);
      console.log(`[StrategicSynthesisTool] Generated ${synthesisResult.derived_artifacts.length} derived artifacts`);
      console.log(`[StrategicSynthesisTool] Generated ${synthesisResult.proactive_prompts.length} proactive prompts`);
      
      return synthesisResult;
      
    } catch (error) {
      console.error(`[StrategicSynthesisTool] Strategic synthesis failed for cycle ${input.cycleId}:`, error);
      
      // Handle parsing vs LLM errors
      if (error instanceof StrategicSynthesisJSONParseError || error instanceof StrategicSynthesisValidationError) {
        console.error(`[StrategicSynthesisTool] CRITICAL: Parsing/validation failed. This indicates the LLM response format is incorrect.`);
        console.error(`[StrategicSynthesisTool] Raw LLM response: ${error instanceof StrategicSynthesisJSONParseError ? error.rawResponse.substring(0, 1000) : 'N/A'}...`);
        console.error(`[StrategicSynthesisTool] This error should be investigated as it prevents downstream processing.`);
        
        // Throw parsing errors as they indicate system issues
        throw error;
      }
      
      // Return fallback for other errors
      console.log(`[StrategicSynthesisTool] Returning fallback output for non-parsing error`);
      
      // Return minimal valid response
      const fallbackOutput: StrategicSynthesisOutput = {
        ontology_optimizations: {
          concepts_to_merge: [],
          concepts_to_archive: [],
          new_strategic_relationships: [],
          community_structures: [],
          concept_description_synthesis: []
        },
        derived_artifacts: [{
          artifact_type: 'insight',
          title: 'Analysis Failed - Manual Review Required',
          content: 'Strategic synthesis encountered an error and requires manual review.',
          confidence_score: 0.1,
          supporting_evidence: ['System error during analysis'],
          actionability: 'immediate'
        }],
        proactive_prompts: []
      };
      
      return fallbackOutput;
    }
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
    const currentAnalysis = templates.insight_worker_current_analysis;
    
    // Consolidate entities
    const consolidatedEntities = this.consolidateEntities(input);
    
    console.log(`[StrategicSynthesisTool] Building KV cache-optimized prompt with ${input.currentKnowledgeGraph.conversations.length} conversations, ${consolidatedEntities.memoryUnits.length} memory units, ${consolidatedEntities.concepts.length} concepts`);
    
    // Replace user name placeholders
    const user_name = input.userName || 'User';
    const coreIdentityWithUserName = coreIdentity.replace(/\{\{user_name\}\}/g, user_name);
    const operationalConfigWithUserName = operationalConfig.replace(/\{\{user_name\}\}/g, user_name);
    const currentAnalysisWithUserName = currentAnalysis.replace(/\{\{user_name\}\}/g, user_name);

    // Build prompt
    const masterPrompt = `${coreIdentityWithUserName}

${operationalConfigWithUserName}

## Analysis Context
- **User**: ${user_name}
- **Cycle ID**: ${input.cycleId}
- **Analysis Timestamp**: ${new Date().toISOString()}
- **Cycle Period**: ${input.cycleStartDate.toISOString()} to ${input.cycleEndDate.toISOString()}

## Consolidated Knowledge Graph
### Concepts (${consolidatedEntities.concepts.length} total)
${consolidatedEntities.concepts.map(c => `- **${c.name}** (${c.id}): ${c.description}`).join('\n')}

### Memory Units (${consolidatedEntities.memoryUnits.length} total)
${consolidatedEntities.memoryUnits.map(mu => `- **${mu.id}**: ${mu.content}`).join('\n')}

### Concepts Needing Description Synthesis (${input.currentKnowledgeGraph.conceptsNeedingSynthesis.length} total)
${input.currentKnowledgeGraph.conceptsNeedingSynthesis.map(c => `- **${c.name}** (${c.id}): ${c.description}`).join('\n')}

## Recent Conversations (${input.currentKnowledgeGraph.conversations.length} total)
${input.currentKnowledgeGraph.conversations.map(conv => `- **${conv.context_summary || 'Untitled Conversation'}** (7/10): ${conv.context_summary || 'No summary available'}`).join('\n')}

${currentAnalysisWithUserName}`;

    console.log(`[StrategicSynthesisTool] Final prompt length: ${masterPrompt.length} characters`);
    return masterPrompt;
  }

  /**
   * Consolidate and deduplicate entities from all sources
   */
  private consolidateEntities(input: StrategicSynthesisInput): {
    concepts: Array<{ id: string; name: string; description: string }>;
    memoryUnits: Array<{ id: string; content: string }>;
  } {
    // Consolidate concepts
    const allConcepts = [
      ...input.currentKnowledgeGraph.concepts,
      // Normalize HRT concepts
      ...(input.currentKnowledgeGraph.strategicContext?.retrievedConcepts?.map(concept => ({
        id: concept.id,
        name: concept.name,
        description: concept.description
        // Drop finalScore field
      })) || [])
    ];
    
    const deduplicatedConcepts = this.deduplicateConcepts(allConcepts);
    
    // Consolidate memory units
    const allMemoryUnits = [
      ...input.currentKnowledgeGraph.memoryUnits,
      // Normalize HRT memory units
      ...(input.currentKnowledgeGraph.strategicContext?.retrievedMemoryUnits?.map(mu => ({
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
   * Deduplicate concepts by name, merging descriptions
   */
  private deduplicateConcepts(concepts: Array<{ id: string; name: string; description: string }>): Array<{ id: string; name: string; description: string }> {
    const seen = new Map<string, { id: string; name: string; description: string }>();
    
    for (const concept of concepts) {
      const key = concept.name.toLowerCase().trim();
      if (seen.has(key)) {
        // Merge descriptions
        const existing = seen.get(key)!;
        if (existing.description !== concept.description && concept.description.trim()) {
          existing.description = `${existing.description} ${concept.description}`.trim();
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
   * Parse and validate LLM output with resilient error handling
   * Designed to work with whatever the LLM sends back, only failing on critical issues
   */
  private validateAndParseOutput(llmJsonResponse: string): StrategicSynthesisOutput {
    console.log(`[StrategicSynthesisTool] Processing LLM response (${llmJsonResponse.length} chars)`);
    
    // Extract JSON from response (handles extra text, markdown, etc.)
    const jsonData = this.extractJSONFromResponse(llmJsonResponse);
    
    // Validate with smart error recovery
    return this.validateWithRecovery(jsonData);
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
   * Validate data with smart error recovery - only fail on critical issues
   */
  private validateWithRecovery(data: any): StrategicSynthesisOutput {
    try {
      // Try validation first
      return StrategicSynthesisOutputSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn(`[StrategicSynthesisTool] Validation issues detected, attempting recovery...`);
        
        // Apply smart fixes for common LLM response issues
        const fixedData = this.applySmartFixes(data, error.errors);
        
        try {
          const result = StrategicSynthesisOutputSchema.parse(fixedData);
          console.log(`[StrategicSynthesisTool] Recovery successful`);
          return result;
        } catch (recoveryError) {
          console.error(`[StrategicSynthesisTool] Recovery failed, falling back to minimal valid response`);
          return this.createMinimalValidResponse(data);
        }
      }
      throw new StrategicSynthesisError('Unexpected validation error', error as Error);
    }
  }

  /**
   * Apply smart fixes for common LLM response issues
   */
  private applySmartFixes(data: any, errors: z.ZodIssue[]): any {
    const fixed = JSON.parse(JSON.stringify(data));
    
    // Ensure required top-level structure exists
    if (!fixed.ontology_optimizations) {
      fixed.ontology_optimizations = {};
    }
    if (!fixed.derived_artifacts) {
      fixed.derived_artifacts = [];
    }
    if (!fixed.proactive_prompts) {
      fixed.proactive_prompts = [];
    }
    
    // Ensure ontology_optimizations has all required arrays
    const requiredOntologyFields = [
      'concepts_to_merge', 'concepts_to_archive', 'new_strategic_relationships',
      'community_structures', 'concept_description_synthesis'
    ];
    
    for (const field of requiredOntologyFields) {
      if (!fixed.ontology_optimizations[field]) {
        fixed.ontology_optimizations[field] = [];
      }
    }
    
    // Clean up arrays (remove null/undefined items)
    const arrayFields = [
      'derived_artifacts', 'proactive_prompts',
      ...requiredOntologyFields.map(field => `ontology_optimizations.${field}`)
    ];
    
    for (const field of arrayFields) {
      const path = field.split('.');
      let current = fixed;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      const arrayField = path[path.length - 1];
      
      if (Array.isArray(current[arrayField])) {
        current[arrayField] = current[arrayField].filter((item: any) => item != null);
      }
    }
    
    return fixed;
  }

  /**
   * Create minimal valid response when all else fails
   */
  private createMinimalValidResponse(originalData: any): StrategicSynthesisOutput {
    console.log(`[StrategicSynthesisTool] Creating minimal valid response from:`, {
      hasOntology: !!originalData?.ontology_optimizations,
      hasArtifacts: !!originalData?.derived_artifacts,
      hasPrompts: !!originalData?.proactive_prompts
    });
    
    return {
      ontology_optimizations: {
        concepts_to_merge: originalData?.ontology_optimizations?.concepts_to_merge || [],
        concepts_to_archive: originalData?.ontology_optimizations?.concepts_to_archive || [],
        new_strategic_relationships: originalData?.ontology_optimizations?.new_strategic_relationships || [],
        community_structures: originalData?.ontology_optimizations?.community_structures || [],
        concept_description_synthesis: originalData?.ontology_optimizations?.concept_description_synthesis || []
      },
      derived_artifacts: originalData?.derived_artifacts || [{
        artifact_type: 'insight',
        title: 'Analysis Completed',
        content: 'Strategic synthesis completed with available data.',
        confidence_score: 0.5,
        supporting_evidence: ['System recovery'],
        actionability: 'immediate'
      }],
      proactive_prompts: originalData?.proactive_prompts || []
    };
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