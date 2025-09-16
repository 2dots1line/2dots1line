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
import { LLMRetryHandler } from '@2dots1line/core-utils';

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
    content_data: z.record(z.any()).optional(), // Structured data for the artifact
    source_concept_ids: z.array(z.string()).optional(), // IDs of concepts that informed this artifact
    source_memory_unit_ids: z.array(z.string()).optional() // IDs of memory units that informed this artifact
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
  userName?: string; // User's display name for LLM reference
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
    // NEW: HRT-retrieved strategic context
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
          systemPrompt: "You are the InsightEngine component performing strategic cyclical analysis. Follow the instructions precisely and return valid JSON without any markers or additional text.",
          history: [], // No previous history for analysis tasks
          userMessage: prompt,
          temperature: 0.4, // Balanced creativity and consistency for strategic thinking
          maxTokens: 50000
        }
      };
      
      // Enhanced LLM call with retry logic
      const llmResult = await LLMRetryHandler.executeWithRetry(
        LLMChatTool,
        llmInput,
        { 
          callType: 'strategic-synthesis'
        }
      );
      
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
      
      // Check if this is a parsing error vs LLM call error
      if (error instanceof StrategicSynthesisJSONParseError || error instanceof StrategicSynthesisValidationError) {
        console.error(`[StrategicSynthesisTool] CRITICAL: Parsing/validation failed. This indicates the LLM response format is incorrect.`);
        console.error(`[StrategicSynthesisTool] Raw LLM response: ${error instanceof StrategicSynthesisJSONParseError ? error.rawResponse.substring(0, 1000) : 'N/A'}...`);
        console.error(`[StrategicSynthesisTool] This error should be investigated as it prevents downstream processing.`);
        
        // For parsing errors, we should throw rather than return fallback data
        // as this indicates a system issue that needs fixing
        throw error;
      }
      
      // For other errors (LLM service issues, etc.), return fallback
      console.log(`[StrategicSynthesisTool] Returning fallback output for non-parsing error`);
      
      // Return a minimal valid response to prevent system failure
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
   * Build the comprehensive strategic analysis prompt using config templates
   */
  private async buildStrategicAnalysisPrompt(input: StrategicSynthesisInput): Promise<string> {
    // Load templates from config service like HolisticAnalysisTool
    const templates = this.configService.getAllTemplates();
    
    // Get strategic synthesis specific templates
    const strategicPersona = templates.strategic_synthesis_persona || '';
    const strategicInstructions = templates.strategic_synthesis_instructions || '';
    const responseFormat = templates.response_format_block || '';
    
    console.log(`[StrategicSynthesisTool] Building prompt with ${input.currentKnowledgeGraph.conversations.length} conversations, ${input.currentKnowledgeGraph.memoryUnits.length} memory units, ${input.currentKnowledgeGraph.concepts.length} concepts`);
    
    // Replace user name placeholders in templates
    const user_name = input.userName || 'User';
    const strategicPersonaWithUserName = strategicPersona.replace(/\{\{user_name\}\}/g, user_name);
    const strategicInstructionsWithUserName = strategicInstructions.replace(/\{\{user_name\}\}/g, user_name);
    
    // NEW: Add strategic context section from HRT retrieval
    const strategicContextSection = input.currentKnowledgeGraph.strategicContext ? `
## Strategic Context from Key Phrase Retrieval
**Note**: This context was retrieved using strategic key phrases to provide broader, more relevant context beyond the current cycle.

### Retrieved Memory Units (${input.currentKnowledgeGraph.strategicContext.retrievedMemoryUnits?.length || 0})
${JSON.stringify(input.currentKnowledgeGraph.strategicContext.retrievedMemoryUnits?.map(mu => ({
  id: mu.id,
  title: mu.title,
  content: mu.content?.substring(0, 200) + '...',
  relevance_score: mu.finalScore
})) || [], null, 2)}

### Retrieved Concepts (${input.currentKnowledgeGraph.strategicContext.retrievedConcepts?.length || 0})
${JSON.stringify(input.currentKnowledgeGraph.strategicContext.retrievedConcepts?.map(concept => ({
  id: concept.id,
  name: concept.name,
  description: concept.description,
  relevance_score: concept.finalScore
})) || [], null, 2)}

### Retrieved Artifacts (${input.currentKnowledgeGraph.strategicContext.retrievedArtifacts?.length || 0})
${JSON.stringify(input.currentKnowledgeGraph.strategicContext.retrievedArtifacts?.map(artifact => ({
  id: artifact.id,
  title: artifact.title,
  content: artifact.content?.substring(0, 200) + '...',
  type: artifact.type,
  relevance_score: artifact.finalScore
})) || [], null, 2)}

### Retrieval Summary
${input.currentKnowledgeGraph.strategicContext.retrievalSummary || 'No retrieval summary available'}
` : '';

    // Build the master prompt using simplified data
    const masterPrompt = `${strategicPersonaWithUserName}

## Analysis Context
- **User ID**: ${input.userId}
- **Cycle ID**: ${input.cycleId}
- **Analysis Timestamp**: ${new Date().toISOString()}
- **Cycle Period**: ${input.cycleStartDate.toISOString()} to ${input.cycleEndDate.toISOString()}

${strategicContextSection}

## Current Knowledge Graph State
### Recent Conversations (${input.currentKnowledgeGraph.conversations.length} total)
**Note**: These are pre-filtered high-importance conversations from the analysis period.
${JSON.stringify(input.currentKnowledgeGraph.conversations, null, 2)}

### Memory Units (${input.currentKnowledgeGraph.memoryUnits.length} total)
**Note**: These are pre-filtered high-importance memory units from the analysis period.
${JSON.stringify(input.currentKnowledgeGraph.memoryUnits, null, 2)}

### Concepts (${input.currentKnowledgeGraph.concepts.length} total)
**Note**: These are pre-filtered active concepts (excluding already merged ones) from the analysis period.
${JSON.stringify(input.currentKnowledgeGraph.concepts, null, 2)}

### Concepts Needing Synthesis (${input.currentKnowledgeGraph.conceptsNeedingSynthesis.length} total)
**Note**: These concepts have been identified as needing description synthesis.
${JSON.stringify(input.currentKnowledgeGraph.conceptsNeedingSynthesis, null, 2)}

## Recent Growth Events (${input.recentGrowthEvents.length} total)
**Note**: These are pre-filtered recent growth events from the analysis period.
${JSON.stringify(input.recentGrowthEvents, null, 2)}

## User Profile
${JSON.stringify(input.userProfile, null, 2)}

${strategicInstructionsWithUserName}

${responseFormat}`;

    console.log(`[StrategicSynthesisTool] Final prompt length: ${masterPrompt.length} characters`);
    return masterPrompt;
  }

  /**
   * Parse and validate LLM output with Gemini-native JSON support
   * V11.2 FIX: Simplified parsing like DialogueAgent, more forgiving validation
   */
  private validateAndParseOutput(llmJsonResponse: string): StrategicSynthesisOutput {
    console.log(`[StrategicSynthesisTool] LLM response received, length: ${llmJsonResponse.length}`);
    
    let parsed: unknown;
    
    // Strategy 1: Try direct JSON parsing first (Gemini native mode)
    try {
      parsed = JSON.parse(llmJsonResponse.trim());
      console.log(`[StrategicSynthesisTool] Direct JSON parsing successful (Gemini native mode)`);
    } catch (directParseError) {
      console.log(`[StrategicSynthesisTool] Direct JSON parsing failed, attempting simple JSON extraction`);
      
      // Strategy 2: Simple JSON extraction like DialogueAgent (more forgiving)
      const firstBrace = llmJsonResponse.indexOf('{');
      const lastBrace = llmJsonResponse.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        console.error(`[StrategicSynthesisTool] No valid JSON found in LLM response`);
        console.error(`[StrategicSynthesisTool] Response preview: ${llmJsonResponse.substring(0, 500)}...`);
        throw new StrategicSynthesisJSONParseError(`No valid JSON found in LLM response. Response: ${llmJsonResponse.substring(0, 500)}...`, llmJsonResponse);
      }
      
      const jsonString = llmJsonResponse.substring(firstBrace, lastBrace + 1).trim();
      console.log(`[StrategicSynthesisTool] Extracted JSON, length: ${jsonString.length}`);
      
      try {
        parsed = JSON.parse(jsonString);
        console.log(`[StrategicSynthesisTool] JSON extraction successful`);
      } catch (error) {
        console.error(`[StrategicSynthesisTool] JSON parsing failed:`, error);
        console.error(`[StrategicSynthesisTool] Failed JSON string: ${jsonString.substring(0, 500)}...`);
        throw new StrategicSynthesisJSONParseError(`Invalid JSON in LLM response: ${jsonString.substring(0, 200)}...`, jsonString);
      }
    }
    
    // More forgiving validation - try to fix common issues
    try {
      const validatedResult = StrategicSynthesisOutputSchema.parse(parsed);
      console.log(`[StrategicSynthesisTool] Validation successful. Parsed data:`, {
        concepts_to_merge: validatedResult.ontology_optimizations.concepts_to_merge.length,
        new_strategic_relationships: validatedResult.ontology_optimizations.new_strategic_relationships.length,
        derived_artifacts: validatedResult.derived_artifacts.length,
        proactive_prompts: validatedResult.proactive_prompts.length
      });
      return validatedResult;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn(`[StrategicSynthesisTool] Validation failed, attempting to fix common issues...`);
        
        // Try to fix common validation issues
        const fixedData = this.attemptValidationFixes(parsed, error.errors);
        if (fixedData) {
          try {
            const validatedResult = StrategicSynthesisOutputSchema.parse(fixedData);
            console.log(`[StrategicSynthesisTool] Validation successful after fixes. Parsed data:`, {
              concepts_to_merge: validatedResult.ontology_optimizations.concepts_to_merge.length,
              new_strategic_relationships: validatedResult.ontology_optimizations.new_strategic_relationships.length,
              derived_artifacts: validatedResult.derived_artifacts.length,
              proactive_prompts: validatedResult.proactive_prompts.length
            });
            return validatedResult;
          } catch (fixError) {
            console.error(`[StrategicSynthesisTool] Validation still failed after fixes:`, fixError);
          }
        }
        
        console.error('[StrategicSynthesisTool] Validation errors:', error.errors);
        console.error('[StrategicSynthesisTool] Raw parsed data:', JSON.stringify(parsed, null, 2).substring(0, 1000));
        throw new StrategicSynthesisValidationError('Validation failed', error.errors);
      }
      throw new StrategicSynthesisError('Unknown validation error', error as Error);
    }
  }

  /**
   * Attempt to fix common validation issues to make validation more forgiving
   */
  private attemptValidationFixes(data: any, errors: z.ZodIssue[]): any | null {
    try {
      const fixedData = JSON.parse(JSON.stringify(data)); // Deep clone
      
      // Fix missing required fields by adding empty defaults
      if (!fixedData.ontology_optimizations) {
        fixedData.ontology_optimizations = {
          concepts_to_merge: [],
          new_strategic_relationships: []
        };
      }
      
      if (!fixedData.ontology_optimizations.concepts_to_merge) {
        fixedData.ontology_optimizations.concepts_to_merge = [];
      }
      
      if (!fixedData.ontology_optimizations.new_strategic_relationships) {
        fixedData.ontology_optimizations.new_strategic_relationships = [];
      }
      
      if (!fixedData.derived_artifacts) {
        fixedData.derived_artifacts = [];
      }
      
      if (!fixedData.proactive_prompts) {
        fixedData.proactive_prompts = [];
      }
      
      // Fix array items that might be null or undefined
      if (Array.isArray(fixedData.ontology_optimizations.concepts_to_merge)) {
        fixedData.ontology_optimizations.concepts_to_merge = fixedData.ontology_optimizations.concepts_to_merge.filter((item: any) => item != null);
      }
      
      if (Array.isArray(fixedData.ontology_optimizations.new_strategic_relationships)) {
        fixedData.ontology_optimizations.new_strategic_relationships = fixedData.ontology_optimizations.new_strategic_relationships.filter((item: any) => item != null);
      }
      
      if (Array.isArray(fixedData.derived_artifacts)) {
        fixedData.derived_artifacts = fixedData.derived_artifacts.filter((item: any) => item != null);
      }
      
      if (Array.isArray(fixedData.proactive_prompts)) {
        fixedData.proactive_prompts = fixedData.proactive_prompts.filter((item: any) => item != null);
      }
      
      console.log(`[StrategicSynthesisTool] Applied validation fixes`);
      return fixedData;
    } catch (error) {
      console.error(`[StrategicSynthesisTool] Failed to apply validation fixes:`, error);
      return null;
    }
  }



  /**
   * Get tool metadata for ToolRegistry
   */
  static getMetadata() {
    return {
      name: 'StrategicSynthesisTool',
      description: ' Composite tool for strategic knowledge graph analysis and optimization',
      version: '1.0.0',
      requiredAtomicTools: ['LLMChatTool'],
      inputSchema: 'StrategicSynthesisInput',
      outputSchema: 'StrategicSynthesisOutput'
    };
  }
} 