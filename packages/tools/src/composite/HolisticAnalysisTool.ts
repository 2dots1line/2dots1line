/**
 * HolisticAnalysisTool.ts
 * Composite tool for holistic conversation analysis combining multiple AI capabilities
 * V9.6 Implementation with Zod validation and real LLM integration
 */

import { z } from 'zod';
import { ConfigService } from '@2dots1line/config-service';
import type { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import { LLMChatTool, type LLMChatInput } from '../ai/LLMChatTool';

// Zod validation schemas as per V9.6 specification
export const HolisticAnalysisOutputSchema = z.object({
  persistence_payload: z.object({
    conversation_summary: z.string().min(10).max(500),
    conversation_importance_score: z.number().int().min(1).max(10),
    extracted_memory_units: z.array(z.object({
      temp_id: z.string().regex(/^mem_[a-zA-Z0-9_]+$/),
      title: z.string().min(5).max(150),
      content: z.string().min(20).max(2000),
      source_type: z.enum(['conversation_extraction', 'journal_entry', 'user_input', 'system_generated']),
      creation_ts: z.string().datetime()
    })).max(10), // Reasonable limit for extracted memories per conversation
    
    extracted_concepts: z.array(z.object({
      name: z.string().min(1).max(100),
      type: z.string().min(1).max(50),
      description: z.string().min(5).max(300)
    })).max(20), // Reasonable limit for extracted concepts per conversation
    
    new_relationships: z.array(z.object({
      source_entity_id_or_name: z.string().min(1),
      target_entity_id_or_name: z.string().min(1),
      relationship_description: z.string().min(1).max(50)
    })).max(30), // Reasonable limit for relationships per conversation
    
    detected_growth_events: z.array(z.object({
      dim_key: z.enum(['know_self', 'know_world', 'act_self', 'act_world', 'show_self', 'show_world']),
      delta: z.number().min(-2.0).max(2.0), // Reasonable range for growth deltas
      rationale: z.string().min(10).max(200)
    })).max(6) // Maximum one event per dimension
  }),
  
  forward_looking_context: z.object({
    proactive_greeting: z.string().min(10).max(300),
    unresolved_topics_for_next_convo: z.array(z.object({
      topic: z.string().min(3).max(100),
      summary_of_unresolution: z.string().min(10).max(200),
      suggested_question: z.string().min(10).max(150)
    })).max(5), // Maximum 5 unresolved topics to avoid overwhelming
    suggested_initial_focus: z.string().min(10).max(200)
  })
});

// Type inference from schema
export type HolisticAnalysisOutput = z.infer<typeof HolisticAnalysisOutputSchema>;

// Custom error types for better error handling
export class HolisticAnalysisError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'HolisticAnalysisError';
  }
}

export class JSONParseError extends HolisticAnalysisError {
  constructor(public rawResponse: string) {
    super('Failed to parse LLM response as JSON');
    this.name = 'JSONParseError';
  }
}

export class ValidationError extends HolisticAnalysisError {
  constructor(public validationErrors: z.ZodError) {
    super(`Validation failed: ${validationErrors.message}`);
    this.name = 'ValidationError';
  }
}

// Input interface
export interface HolisticAnalysisInput {
  userId: string;
  fullConversationTranscript: string;
  userMemoryProfile: any; // Can be null for new users
  knowledgeGraphSchema: any; // Can be null, will use default
}

export class HolisticAnalysisTool {
  constructor(
    private configService: ConfigService
  ) {}

  async execute(input: HolisticAnalysisInput): Promise<HolisticAnalysisOutput> {
    console.log(`[HolisticAnalysisTool] Starting holistic analysis for user ${input.userId}`);
    
    try {
      // Build the comprehensive prompt
      const prompt = await this.buildAnalysisPrompt(input);
      
      // Prepare LLM input
      const llmInput: LLMChatInput = {
        payload: {
          userId: input.userId,
          sessionId: `holistic-analysis-${Date.now()}`,
          systemPrompt: "You are an advanced AI analyst performing holistic conversation analysis. Follow the instructions precisely and return valid JSON between the specified markers.",
          history: [], // No previous history for analysis tasks
          userMessage: prompt,
          temperature: 0.3, // Lower temperature for more structured output
          maxTokens: 4000
        }
      };
      
      // Call LLM
      const llmResult = await LLMChatTool.execute(llmInput);
      
      if (llmResult.status !== 'success' || !llmResult.result?.text) {
        throw new HolisticAnalysisError(`LLM call failed: ${llmResult.error?.message || 'Unknown error'}`);
      }
      
      // Parse and validate the response
      const analysisResult = this.validateAndParseOutput(llmResult.result.text);
      
      console.log(`[HolisticAnalysisTool] Successfully completed analysis for user ${input.userId}`);
      return analysisResult;
      
    } catch (error) {
      console.error(`[HolisticAnalysisTool] Analysis failed for user ${input.userId}:`, error);
      
      // Return a minimal valid response to prevent system failure
      const fallbackOutput: HolisticAnalysisOutput = {
        persistence_payload: {
          conversation_summary: 'Analysis failed - manual review required.',
          conversation_importance_score: 5,
          extracted_memory_units: [],
          extracted_concepts: [],
          new_relationships: [],
          detected_growth_events: [],
        },
        forward_looking_context: {
          proactive_greeting: 'Hello! How can I help you today?',
          unresolved_topics_for_next_convo: [],
          suggested_initial_focus: 'Let\'s continue our conversation.',
        }
      };
      
      return fallbackOutput;
    }
  }

  /**
   * Build the comprehensive analysis prompt according to V9.6 specification
   */
  private async buildAnalysisPrompt(input: HolisticAnalysisInput): Promise<string> {
    // Load prompt templates from config
    const templates = this.configService.getAllTemplates();
    
    // Get the knowledge graph schema or use default
    const knowledgeGraphSchema = input.knowledgeGraphSchema || {
      "description_for_llm": "The schema below represents the potential structure you can help build. Focus on creating :MemoryUnit and :Concept nodes first.",
      "prominent_node_types": [],
      "prominent_relationship_types": [],
      "example_concept_types": ["person", "organization", "location", "project", "goal", "value", "skill", "interest", "emotion", "theme", "event_theme", "role"],
      "relationship_label_guidelines": {
        "description": "Guidelines for generating relationship_description strings for new relationships.",
        "format": "Should be a concise, human-readable, verb-based phrase in the present tense.",
        "style": "Be as specific as the context allows. Describe the connection clearly.",
        "examples": ["is motivated by", "is an obstacle to", "expresses frustration with", "has skill in", "is a core part of", "has symptom"]
      }
    };

    // Build the master prompt following V9.6 specification structure
    const masterPrompt = `${templates.ingestion_analyst_persona}

${templates.ingestion_analyst_rules}

<user_memory_profile>
${input.userMemoryProfile ? JSON.stringify(input.userMemoryProfile, null, 2) : 'No existing memory profile'}
</user_memory_profile>

<knowledge_graph_schema>
${JSON.stringify(knowledgeGraphSchema, null, 2)}
</knowledge_graph_schema>

<conversation_transcript>
${input.fullConversationTranscript}
</conversation_transcript>

${templates.ingestion_analyst_instructions}`;

    return masterPrompt;
  }

  /**
   * Parse and validate LLM output according to V9.6 specification
   */
  private validateAndParseOutput(llmJsonResponse: string): HolisticAnalysisOutput {
    // Extract JSON from between markers
    const beginMarker = '###==BEGIN_JSON==###';
    const endMarker = '###==END_JSON==###';
    
    const beginIndex = llmJsonResponse.indexOf(beginMarker);
    const endIndex = llmJsonResponse.indexOf(endMarker);
    
    if (beginIndex === -1 || endIndex === -1) {
      throw new JSONParseError(`LLM response missing required JSON markers. Response: ${llmJsonResponse.substring(0, 500)}...`);
    }
    
    const jsonString = llmJsonResponse.substring(beginIndex + beginMarker.length, endIndex).trim();
    
    let parsed: unknown;
    
    try {
      parsed = JSON.parse(jsonString);
    } catch (error) {
      throw new JSONParseError(`Invalid JSON in LLM response: ${jsonString.substring(0, 200)}...`);
    }
    
    try {
      return HolisticAnalysisOutputSchema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[HolisticAnalysisTool] Validation errors:', error.errors);
        throw new ValidationError(error);
      }
      throw new HolisticAnalysisError('Unknown validation error', error as Error);
    }
  }
} 