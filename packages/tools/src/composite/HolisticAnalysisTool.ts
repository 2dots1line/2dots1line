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
// V11.1 FIX: Made schema more flexible to handle LLM response variations
export const HolisticAnalysisOutputSchema = z.object({
  persistence_payload: z.object({
    conversation_title: z.string().min(1).max(50), // Short, descriptive title (3-7 words)
    conversation_summary: z.string().min(1), // Removed max limit to allow comprehensive summaries
    conversation_importance_score: z.number().int().min(1).max(10),
    extracted_memory_units: z.array(z.object({
      temp_id: z.string().regex(/^mem_[a-zA-Z0-9_]+$/, {
        message: "temp_id must start with 'mem_' and contain only alphanumeric characters and underscores"
      }),
      title: z.string().min(1), // Removed max limit
      content: z.string().min(1), // Removed max limit to allow detailed content
      source_type: z.enum(['conversation_extraction', 'journal_entry', 'user_input', 'system_generated']),
      importance_score: z.number().min(1).max(10), // Memory importance on 1-10 scale
      sentiment_score: z.number().min(-1.0).max(1.0), // Sentiment from -1.0 (negative) to 1.0 (positive)
      // creation_ts removed - will be set to current time by the system
    })), // Remove array size limit to allow flexible LLM responses
    
    extracted_concepts: z.array(z.object({
      name: z.string().min(1),
      type: z.string().min(1),
      description: z.string().min(1) // Removed max limit to allow detailed descriptions
    })), // Remove array size limit to allow flexible LLM responses
    
    new_relationships: z.array(z.object({
      source_entity_id_or_name: z.string().min(1),
      target_entity_id_or_name: z.string().min(1),
      relationship_description: z.string().min(1) // Removed max limit to allow detailed descriptions
    })), // Remove array size limit to allow flexible LLM responses
    
    detected_growth_events: z.array(z.object({
      dim_key: z.enum(['know_self', 'know_world', 'act_self', 'act_world', 'show_self', 'show_world']),
      delta: z.number().min(-5.0).max(5.0), // V11.1 FIX: Increased range to prevent validation failures
      rationale: z.string().min(1) // Removed max limit to allow high-quality LLM responses
    })), // Remove array size limit to allow flexible LLM responses
  }),
  
  forward_looking_context: z.object({
    proactive_greeting: z.string().min(1), // Removed max limit
    unresolved_topics_for_next_convo: z.array(z.object({
      topic: z.string().min(1), // Removed max limit
      summary_of_unresolution: z.string().min(1), // Removed max limit to allow detailed summaries
      suggested_question: z.string().min(1) // Removed max limit to allow thoughtful questions
    })), // Remove array size limit to allow flexible LLM responses
    suggested_initial_focus: z.string().min(1) // Removed max limit
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
  userName?: string; // User's display name for LLM reference
  fullConversationTranscript: string;
  userMemoryProfile: any; // Can be null for new users
  knowledgeGraphSchema: any; // Can be null, will use default
  
  // New fields for LLM interaction logging
  workerType?: string;
  workerJobId?: string;
  conversationId?: string;
  messageId?: string;
}

export class HolisticAnalysisTool {
  constructor(
    private configService: ConfigService
  ) {}

  async execute(input: HolisticAnalysisInput): Promise<HolisticAnalysisOutput> {
    console.log(`[HolisticAnalysisTool] Starting holistic analysis for user ${input.userId}`);
    
    try {
      // Force reinitialization of LLMChatTool to ensure it uses the latest model configuration
      LLMChatTool.forceReinitialize();
      
      // Build the comprehensive prompt
      const prompt = await this.buildAnalysisPrompt(input);
      
      // Prepare LLM input
      const llmInput: LLMChatInput = {
        payload: {
          userId: input.userId,
          sessionId: `holistic-analysis-${Date.now()}`,
          workerType: input.workerType || 'ingestion-worker',
          workerJobId: input.workerJobId,
          conversationId: input.conversationId,
          messageId: input.messageId,
          systemPrompt: 'You are an advanced AI analyst. Follow the instructions exactly and return only valid JSON.',
          history: [], // No previous history for analysis tasks
          userMessage: prompt,
          temperature: 0.1, // Low temperature for consistent formatting
          maxTokens: 50000
        }
      };

      // Enhanced LLM call with retry logic
      const llmResult = await this.executeLLMWithRetry(llmInput, 'holistic-analysis');
      
      console.log(`[HolisticAnalysisTool] LLM response received, length: ${llmResult.result.text.length}`);
      
      // Parse and validate the response
      const parsedOutput = this.validateAndParseOutput(llmResult.result.text);
      
      console.log(`[HolisticAnalysisTool] Successfully parsed and validated LLM response`);
      console.log(`[HolisticAnalysisTool] Importance score: ${parsedOutput.persistence_payload.conversation_importance_score}`);
      console.log(`[HolisticAnalysisTool] Memory units: ${parsedOutput.persistence_payload.extracted_memory_units.length}`);
      console.log(`[HolisticAnalysisTool] Concepts: ${parsedOutput.persistence_payload.extracted_concepts.length}`);
      
      return parsedOutput;
      
    } catch (error) {
      console.error(`[HolisticAnalysisTool] Analysis failed:`, error);
      
      // Only return fallback for non-retryable errors
      if (error instanceof HolisticAnalysisError && error.message.includes('(non-retryable)')) {
        console.log(`[HolisticAnalysisTool] Returning fallback response for non-retryable error`);
        const fallbackOutput: HolisticAnalysisOutput = {
          persistence_payload: {
            conversation_title: 'Analysis Failed',
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
      
      // Re-throw retryable errors to trigger job retry
      throw error;
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
    const user_name = input.userName || 'User';
    const personaWithUserName = templates.ingestion_analyst_persona.replace(/\{\{user_name\}\}/g, user_name);
    
    const masterPrompt = `${personaWithUserName}

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
   * V11.1 FIX: Enhanced error logging and more flexible validation
   * V11.1.1 FIX: Updated to expect clean JSON without markers (matching prompt template fixes)
   */
  private validateAndParseOutput(llmJsonResponse: string): HolisticAnalysisOutput {
    // V11.1.1 FIX: Expect clean JSON without markers (matching our prompt template fixes)
    let jsonString: string;
    
    // First, try to parse the response directly as JSON
    try {
      const parsed = JSON.parse(llmJsonResponse.trim());
      // If it parses successfully, use it directly
      jsonString = llmJsonResponse.trim();
      console.log(`[HolisticAnalysisTool] Direct JSON parsing successful, length: ${jsonString.length}`);
    } catch (directParseError) {
      // If direct parsing fails, try to extract JSON from between markers (fallback for old responses)
      const beginMarker = '###==BEGIN_JSON==###';
      const endMarker = '###==END_JSON==###';
      
      const beginIndex = llmJsonResponse.indexOf(beginMarker);
      const endIndex = llmJsonResponse.indexOf(endMarker);
      
      if (beginIndex === -1) {
        console.error(`[HolisticAnalysisTool] Response is not valid JSON and missing BEGIN_JSON marker:`, llmJsonResponse.substring(0, 500));
        throw new JSONParseError(`LLM response is not valid JSON and missing BEGIN_JSON marker. Response: ${llmJsonResponse.substring(0, 500)}...`);
      }
      
      if (endIndex === -1) {
        // End marker is missing, try to extract JSON from after the begin marker
        console.warn(`[HolisticAnalysisTool] Missing END_JSON marker, attempting to extract JSON from truncated response`);
        const afterBeginMarker = llmJsonResponse.substring(beginIndex + beginMarker.length).trim();
        
        // Try to find the end of the JSON by looking for the last closing brace
        const lastBraceIndex = afterBeginMarker.lastIndexOf('}');
        if (lastBraceIndex === -1) {
          console.error(`[HolisticAnalysisTool] No closing brace found in truncated response:`, afterBeginMarker.substring(0, 500));
          throw new JSONParseError(`No valid JSON structure found in truncated response: ${afterBeginMarker.substring(0, 500)}...`);
        }
        
        jsonString = afterBeginMarker.substring(0, lastBraceIndex + 1).trim();
        console.log(`[HolisticAnalysisTool] Extracted JSON from truncated response, length: ${jsonString.length}`);
      } else {
        // Both markers present, extract normally
        jsonString = llmJsonResponse.substring(beginIndex + beginMarker.length, endIndex).trim();
        console.log(`[HolisticAnalysisTool] Extracted JSON string length: ${jsonString.length}`);
      }
    }
    
    let parsed: unknown;
    
    try {
      parsed = JSON.parse(jsonString);
      console.log(`[HolisticAnalysisTool] JSON parsed successfully`);
    } catch (error) {
      console.error(`[HolisticAnalysisTool] JSON parse error:`, error);
      console.error(`[HolisticAnalysisTool] JSON string:`, jsonString.substring(0, 200));
      throw new JSONParseError(`Invalid JSON in LLM response: ${jsonString.substring(0, 200)}...`);
    }
    
    try {
      const validated = HolisticAnalysisOutputSchema.parse(parsed);
      console.log(`[HolisticAnalysisTool] Schema validation successful`);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[HolisticAnalysisTool] Validation errors:');
        error.errors.forEach((err, index) => {
          console.error(`  ${index + 1}. Path: ${err.path.join('.')} - ${err.message}`);
          console.error(`     Code: ${err.code}`);
        });
        console.error('[HolisticAnalysisTool] Full parsed object:', JSON.stringify(parsed, null, 2));
        throw new ValidationError(error);
      }
      throw new HolisticAnalysisError('Unknown validation error', error as Error);
    }
  }

  /**
   * Enhanced LLM execution with automatic retry and fallback model support
   */
  private async executeLLMWithRetry(
    llmInput: any,
    callType: string
  ): Promise<any> {
    let attempts = 0;
    const maxAttempts = 3; // Try primary model + 2 fallback models
    
    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Attempt ${attempts}/${maxAttempts}`);
        
        const llmResult = await LLMChatTool.execute(llmInput);
        
        if (llmResult.status === 'success' && llmResult.result?.text) {
          console.log(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call successful on attempt ${attempts}`);
          return llmResult;
        }
        
        // Check if this is a retryable error
        const errorMessage = llmResult.error?.message || 'Unknown error';
        if (attempts < maxAttempts && this.isRetryableError(errorMessage)) {
          console.log(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Retryable error detected: ${errorMessage}`);
          console.log(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Attempting to switch to fallback model...`);
          
          try {
            // Force reinitialization to try a different model
            if (LLMChatTool.forceReinitialize) {
              LLMChatTool.forceReinitialize();
              console.log(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Switched to fallback model`);
            }
            
            // Add exponential backoff delay before retrying
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000); // Max 10 seconds
            console.log(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            continue; // Try again with the new model
          } catch (modelSwitchError) {
            console.error(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Failed to switch to fallback model:`, modelSwitchError);
            // Continue with the next attempt
          }
        } else {
          // If not retryable or all attempts exhausted, break out of retry loop
          console.error(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Non-retryable error or max attempts reached: ${errorMessage}`);
          throw new Error(`LLM call failed: ${errorMessage}`);
        }
      } catch (error) {
        console.error(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Unexpected error on attempt ${attempts}:`, error);
        
        if (attempts < maxAttempts && this.isRetryableError(error instanceof Error ? error.message : String(error))) {
          console.log(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Retryable error, attempting retry...`);
          
          try {
            // Force reinitialization to try a different model
            if (LLMChatTool.forceReinitialize) {
              LLMChatTool.forceReinitialize();
              console.log(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Switched to fallback model after unexpected error`);
            }
            
            // Add exponential backoff delay before retrying
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
            console.log(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            continue; // Try again with the new model
          } catch (modelSwitchError) {
            console.error(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - Failed to switch to fallback model:`, modelSwitchError);
          }
        } else {
          // If not retryable or all attempts exhausted, re-throw the error
          throw error;
        }
      }
    }

    // If all attempts fail, throw the last error
    console.error(`[HolisticAnalysisTool] ${callType.toUpperCase()} LLM call - All ${maxAttempts} attempts failed`);
    throw new Error(`Failed to get LLM response after ${maxAttempts} attempts. The AI service may be temporarily overloaded. Please try again in a moment.`);
  }

  /**
   * Determine if an error is retryable based on the error message
   */
  private isRetryableError(errorMessage: string): boolean {
    const retryablePatterns = [
      /model is overloaded/i,
      /service unavailable/i,
      /rate limit/i,
      /quota exceeded/i,
      /temporary/i,
      /try again later/i,
      /timeout/i,
      /network error/i,
      /connection error/i,
      /503/i, // Service Unavailable
      /429/i, // Too Many Requests
      /500/i  // Internal Server Error
    ];
    
    return retryablePatterns.some(pattern => pattern.test(errorMessage));
  }
} 