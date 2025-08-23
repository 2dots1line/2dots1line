/**
 * StrategicSynthesisTool.ts
 * V9.5 Composite Tool for InsightEngine's Strategic Cyclical Analysis
 * 
 * This tool performs strategic analysis of the user's knowledge graph to identify
 * patterns, optimize ontologies, and generate proactive insights. It operates on
 * cycles to continuously refine and enhance the knowledge representation.
 * 
 * ARCHITECTURE: Composite tool built by ToolRegistry, uses injected atomic tools
 * for complex analysis while maintaining strategic focus on user growth.
 */

import { z } from 'zod';
import { ConfigService } from '@2dots1line/config-service';
import type { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import { LLMChatTool, type LLMChatInput } from '../ai/LLMChatTool';

// Zod validation schemas for StrategicSynthesisOutput
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
      replacement_concept_id: z.string().optional()
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
    }))
  }),
  derived_artifacts: z.array(z.object({
    artifact_type: z.enum(['insight', 'pattern', 'recommendation', 'synthesis']),
    title: z.string(),
    content: z.string(),
    confidence_score: z.number().min(0).max(1),
    supporting_evidence: z.array(z.string()),
    actionability: z.enum(['immediate', 'short_term', 'long_term', 'aspirational'])
  })),
  proactive_prompts: z.array(z.object({
    prompt_type: z.enum(['reflection', 'exploration', 'goal_setting', 'skill_development', 'creative_expression']),
    title: z.string(),
    prompt_text: z.string(),
    context_explanation: z.string(),
    timing_suggestion: z.enum(['next_conversation', 'weekly_check_in', 'monthly_review', 'quarterly_planning']),
    priority_level: z.number().min(1).max(10)
  })),
  growth_trajectory_updates: z.object({
    identified_patterns: z.array(z.string()),
    emerging_themes: z.array(z.string()),
    recommended_focus_areas: z.array(z.string()),
    potential_blind_spots: z.array(z.string()),
    celebration_moments: z.array(z.string())
  }),
  cycle_metrics: z.object({
    knowledge_graph_health: z.number().min(0).max(1),
    ontology_coherence: z.number().min(0).max(1),
    growth_momentum: z.number().min(0).max(1),
    strategic_alignment: z.number().min(0).max(1),
    insight_generation_rate: z.number().min(0).max(1)
  })
});

export type StrategicSynthesisOutput = z.infer<typeof StrategicSynthesisOutputSchema>;

export interface StrategicSynthesisInput {
  userId: string;
  cycleId: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  currentKnowledgeGraph: {
    memoryUnits: Array<{
      id: string;
      title: string;
      content: string;
      importance_score: number;
      tags: string[];
      created_at: string;
    }>;
    concepts: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      salience: number;
      created_at: string;
      merged_into_concept_id?: string;
    }>;
    relationships: Array<{
      source_id: string;
      target_id: string;
      relationship_type: string;
      strength: number;
    }>;
  };
  recentGrowthEvents: Array<{
    dim_key: string;
    event_type: string;
    description: string;
    impact_level: number;
    created_at: string;
  }>;
  userProfile: {
    preferences: any;
    goals: string[];
    interests: string[];
    growth_trajectory: any;
  };
  
  // New fields for LLM interaction logging
  workerType?: string;
  workerJobId?: string;
}

// Custom error types for better error handling
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
    console.log(`[StrategicSynthesisTool] Analyzing ${input.currentKnowledgeGraph.relationships.length} relationships`);
    
    try {
      // Build comprehensive analysis prompt using config templates
      const prompt = await this.buildStrategicAnalysisPrompt(input);
      
      // Prepare LLM input following HolisticAnalysisTool pattern
      const llmInput: LLMChatInput = {
        payload: {
          userId: input.userId,
          sessionId: `strategic-synthesis-${input.cycleId}`,
          workerType: input.workerType || 'insight-worker',
          workerJobId: input.workerJobId,
          sourceEntityId: input.cycleId,
          systemPrompt: "You are the InsightEngine component performing strategic cyclical analysis. Follow the instructions precisely and return valid JSON between the specified markers.",
          history: [], // No previous history for analysis tasks
          userMessage: prompt,
          temperature: 0.4, // Balanced creativity and consistency for strategic thinking
          maxTokens: 50000
        }
      };
      
      // Call LLM using static method like HolisticAnalysisTool
      const llmResult = await LLMChatTool.execute(llmInput);
      
      console.log(`[StrategicSynthesisTool] DEBUG: Full prompt sent to LLM:`, prompt.substring(0, 1000) + '...');
      console.log(`[StrategicSynthesisTool] DEBUG: LLM response received:`, llmResult.result?.text?.substring(0, 1000) + '...');
      
      if (llmResult.status !== 'success' || !llmResult.result?.text) {
        console.error(`[StrategicSynthesisTool] LLM call failed with status: ${llmResult.status}`);
        console.error(`[StrategicSynthesisTool] Error details:`, llmResult.error);
        throw new StrategicSynthesisError(`LLM call failed: ${llmResult.error?.message || 'Unknown error'}`);
      }
      
      console.log(`[StrategicSynthesisTool] LLM response received, length: ${llmResult.result.text.length}`);
      
      // Parse and validate the response
      const synthesisResult = this.validateAndParseOutput(llmResult.result.text);
      
      console.log('[StrategicSynthesisTool] Strategic synthesis completed successfully');
      console.log(`[StrategicSynthesisTool] Generated ${synthesisResult.ontology_optimizations.concepts_to_merge.length} concept merges`);
      console.log(`[StrategicSynthesisTool] Generated ${synthesisResult.derived_artifacts.length} derived artifacts`);
      console.log(`[StrategicSynthesisTool] Generated ${synthesisResult.proactive_prompts.length} proactive prompts`);
      
      return synthesisResult;
      
    } catch (error) {
      console.error(`[StrategicSynthesisTool] Strategic synthesis failed for cycle ${input.cycleId}:`, error);
      
      // Return a minimal valid response to prevent system failure
      const fallbackOutput: StrategicSynthesisOutput = {
        ontology_optimizations: {
          concepts_to_merge: [],
          concepts_to_archive: [],
          new_strategic_relationships: [],
          community_structures: []
        },
        derived_artifacts: [{
          artifact_type: 'insight',
          title: 'Analysis Failed - Manual Review Required',
          content: 'Strategic synthesis encountered an error and requires manual review.',
          confidence_score: 0.1,
          supporting_evidence: ['System error during analysis'],
          actionability: 'immediate'
        }],
        proactive_prompts: [],
        growth_trajectory_updates: {
          identified_patterns: [],
          emerging_themes: [],
          recommended_focus_areas: [],
          potential_blind_spots: ['Strategic analysis system failure'],
          celebration_moments: []
        },
        cycle_metrics: {
          knowledge_graph_health: 0.5,
          ontology_coherence: 0.5,
          growth_momentum: 0.5,
          strategic_alignment: 0.5,
          insight_generation_rate: 0.0
        }
      };
      
      return fallbackOutput;
    }
  }

  /**
   * Build the comprehensive strategic analysis prompt using config templates
   */
  private async buildStrategicAnalysisPrompt(input: StrategicSynthesisInput): Promise<string> {
    // Load templates from config service like HolisticAnalysisTool
    const templates = this.configService.getAllTemplates();
    
    // Get strategic synthesis specific templates
    const strategicPersona = templates.strategic_synthesis_persona || '';
    const strategicInstructions = templates.strategic_synthesis_instructions || '';
    const responseFormat = templates.response_format_block || '';
    
    console.log(`[StrategicSynthesisTool] Building prompt with ${input.currentKnowledgeGraph.memoryUnits.length} memory units, ${input.currentKnowledgeGraph.concepts.length} concepts, ${input.currentKnowledgeGraph.relationships.length} relationships`);
    
    // Build the master prompt using all available data
    const masterPrompt = `${strategicPersona}

## Analysis Context
- **User ID**: ${input.userId}
- **Cycle ID**: ${input.cycleId}
- **Analysis Timestamp**: ${new Date().toISOString()}
- **Cycle Period**: ${input.cycleStartDate.toISOString()} to ${input.cycleEndDate.toISOString()}

## Current Knowledge Graph State
### Memory Units (${input.currentKnowledgeGraph.memoryUnits.length} total)
${JSON.stringify(input.currentKnowledgeGraph.memoryUnits, null, 2)}

### Concepts (${input.currentKnowledgeGraph.concepts.length} total)
${JSON.stringify(input.currentKnowledgeGraph.concepts, null, 2)}

### Relationships (${input.currentKnowledgeGraph.relationships.length} total)
${JSON.stringify(input.currentKnowledgeGraph.relationships, null, 2)}

## Recent Growth Events (${input.recentGrowthEvents.length} total)
${JSON.stringify(input.recentGrowthEvents, null, 2)}

## User Profile
${JSON.stringify(input.userProfile, null, 2)}

${strategicInstructions}

${responseFormat}`;

    console.log(`[StrategicSynthesisTool] Final prompt length: ${masterPrompt.length} characters`);
    return masterPrompt;
  }

  /**
   * Parse and validate LLM output using JSON markers like HolisticAnalysisTool
   */
  private validateAndParseOutput(llmJsonResponse: string): StrategicSynthesisOutput {
    // Extract JSON from between markers (same pattern as HolisticAnalysisTool)
    const beginMarker = '###==BEGIN_JSON==###';
    const endMarker = '###==END_JSON==###';
    
    const beginIndex = llmJsonResponse.indexOf(beginMarker);
    const endIndex = llmJsonResponse.indexOf(endMarker);
    
    if (beginIndex === -1 || endIndex === -1) {
      throw new StrategicSynthesisJSONParseError(`LLM response missing required JSON markers. Response: ${llmJsonResponse.substring(0, 500)}...`, llmJsonResponse);
    }
    
    const jsonString = llmJsonResponse.substring(beginIndex + beginMarker.length, endIndex).trim();
    
    let parsed: unknown;
    
    try {
      parsed = JSON.parse(jsonString);
    } catch (error) {
      throw new StrategicSynthesisJSONParseError(`Invalid JSON in LLM response: ${jsonString.substring(0, 200)}...`, jsonString);
    }
    
    try {
      return StrategicSynthesisOutputSchema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[StrategicSynthesisTool] Validation errors:', error.errors);
        throw new StrategicSynthesisValidationError('Validation failed', error.errors);
      }
      throw new StrategicSynthesisError('Unknown validation error', error as Error);
    }
  }

  /**
   * Get tool metadata for ToolRegistry
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