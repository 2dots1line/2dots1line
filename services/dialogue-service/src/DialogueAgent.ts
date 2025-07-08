/**
 * DialogueAgent.ts
 * V10.9 - Definitive implementation of the real-time conversational agent.
 * Adheres to the "Single Synthesis Call" architecture.
 */

import { ConfigService } from '../../config-service/src/ConfigService';
import { ConversationRepository, UserRepository, conversation_messages } from '@2dots1line/database';
import { Redis } from 'ioredis';
import { PromptBuilder, PromptBuildInput } from './PromptBuilder';
import { 
  LLMChatTool,
  VisionCaptionTool,
  AudioTranscribeTool,
  DocumentExtractTool,
  HybridRetrievalTool
} from '@2dots1line/tools'; // Assuming tools are exported from a central point

import { 
  AugmentedMemoryContext,
  TAgentInput,
  TAgentOutput,
  TDialogueAgentInputPayload,
  TDialogueAgentResult
} from '@2dots1line/shared-types';

// Re-export PromptBuilder for controller access
export { PromptBuilder } from './PromptBuilder';

// Dependencies to be injected into the agent
export interface DialogueAgentDependencies {
  configService: ConfigService;
  conversationRepository: ConversationRepository;
  redisClient: Redis;
  promptBuilder: PromptBuilder;
  llmChatTool: typeof LLMChatTool;
  visionCaptionTool: typeof VisionCaptionTool;
  audioTranscribeTool: typeof AudioTranscribeTool;
  documentExtractTool: typeof DocumentExtractTool;
  hybridRetrievalTool: HybridRetrievalTool;
}

export class DialogueAgent {
  // Store injected dependencies
  private configService: ConfigService;
  private conversationRepo: ConversationRepository;
  private redis: Redis;
  private promptBuilder: PromptBuilder;
  private llmChatTool: typeof LLMChatTool;
  private visionCaptionTool: typeof VisionCaptionTool;
  private audioTranscribeTool: typeof AudioTranscribeTool;
  private documentExtractTool: typeof DocumentExtractTool;
  private hybridRetrievalTool: HybridRetrievalTool;

  constructor(dependencies: DialogueAgentDependencies) {
    this.configService = dependencies.configService;
    this.conversationRepo = dependencies.conversationRepository;
    this.redis = dependencies.redisClient;
    this.promptBuilder = dependencies.promptBuilder;
    this.llmChatTool = dependencies.llmChatTool;
    this.visionCaptionTool = dependencies.visionCaptionTool;
    this.audioTranscribeTool = dependencies.audioTranscribeTool;
    this.documentExtractTool = dependencies.documentExtractTool;
    this.hybridRetrievalTool = dependencies.hybridRetrievalTool;

    console.log("DialogueAgent V10.9 initialized.");
  }

  /**
   * Main entry point for processing a single conversational turn.
   */
  public async processTurn(input: {
    userId: string;
    conversationId: string;
    currentMessageText?: string;
    currentMessageMedia?: any[]; // Simplified type
  }): Promise<any> { // Should return a structured DTO
    const executionId = `da_${Date.now()}`;
    console.log(`[${executionId}] Starting turn processing for convo: ${input.conversationId}`);

    // --- PHASE I: INPUT PRE-PROCESSING ---
    const finalInputText = await this.processInput(input.currentMessageText, input.currentMessageMedia);

    // --- PHASE II: SINGLE SYNTHESIS LLM CALL ---
    const llmResponse = await this.performSingleSynthesisCall({ ...input, finalInputText });

    // --- PHASE III: CONDITIONAL ORCHESTRATION & FINAL RESPONSE ---
    const { response_plan, turn_context_package, ui_actions } = llmResponse;
    
    // Immediately persist the next turn's context to Redis
    try {
      await this.redis.set(`turn_context:${input.conversationId}`, JSON.stringify(turn_context_package), 'EX', 600); // 10 min TTL
      console.log(`✅ DialogueAgent - Turn context saved to Redis for ${input.conversationId}`);
    } catch (error) {
      console.error(`❌ DialogueAgent - Failed to save turn context to Redis:`, error);
      // Continue processing - Redis failure shouldn't block response
    }

    if (response_plan.decision === 'respond_directly') {
      console.log(`[${executionId}] Decision: Respond Directly. Turn complete.`);
      
      // V11.0 HEADLESS SERVICE: Return pure result, no database side effects
      return { 
        response_text: response_plan.direct_response_text,
        ui_actions,
        metadata: {
          execution_id: executionId,
          decision: response_plan.decision,
          processing_time_ms: Date.now() - parseInt(executionId.split('_')[1])
        }
      };
    } 
    
    if (response_plan.decision === 'query_memory') {
      console.log(`[${executionId}] Decision: Query Memory. Key phrases:`, response_plan.key_phrases_for_retrieval);
      // A. Execute retrieval
      const augmentedContext = await this.hybridRetrievalTool.execute({
        keyPhrasesForRetrieval: response_plan.key_phrases_for_retrieval!,
        userId: input.userId
      });

      // B. Make the second, context-aware LLM call
      const finalLlmResponse = await this.performSingleSynthesisCall({ ...input, finalInputText }, augmentedContext);
      
      console.log(`[${executionId}] Retrieval complete. Generating final response.`);
      
      // V11.0 HEADLESS SERVICE: Return pure result, no database side effects
      return {
        response_text: finalLlmResponse.response_plan.direct_response_text,
        ui_actions: finalLlmResponse.ui_actions,
        metadata: {
          execution_id: executionId,
          decision: response_plan.decision,
          key_phrases_used: response_plan.key_phrases_for_retrieval,
          memory_retrieval_performed: true,
          processing_time_ms: Date.now() - parseInt(executionId.split('_')[1])
        }
      };
    }

    throw new Error("Invalid LLM decision in response_plan.");
  }

  /**
   * Converts any user input into a single text string.
   */
  private async processInput(text?: string, media?: any[]): Promise<string> {
    let mediaText = '';
    if (media && media.length > 0) {
      // In a real implementation, loop and call appropriate tools
      // For now, conceptual placeholder
      mediaText = `[User provided media: ${media[0].type}]`;
    }
    return `${text || ''}\n${mediaText}`.trim();
  }

  /**
   * Builds the prompt and executes the core LLM call.
   */
  private async performSingleSynthesisCall(
    input: { userId: string; conversationId: string; finalInputText: string },
    augmentedMemoryContext?: AugmentedMemoryContext
  ): Promise<any> { // Returns the full parsed JSON from the LLM
    
    // V11.0 STANDARD: Determine if this is a new conversation
    const conversationHistory = await this.conversationRepo.getMostRecentMessages(input.conversationId, 10);
    const isNewConversation = conversationHistory.length === 0;
    
    console.log(`[DialogueAgent] V11.0 - Conversation analysis: isNewConversation=${isNewConversation}, historyLength=${conversationHistory.length}`);

    const promptBuildInput: PromptBuildInput = {
      userId: input.userId,
      conversationId: input.conversationId,
      finalInputText: input.finalInputText,
      augmentedMemoryContext,
      isNewConversation // V11.0: Pass flag to PromptBuilder
    };

    const promptOutput = await this.promptBuilder.buildPrompt(promptBuildInput);

    // V11.0 STANDARD: Handle next_conversation_context_package cleanup here (not in PromptBuilder)
    if (isNewConversation) {
      // TODO: Inject UserRepository to handle next_conversation_context_package cleanup
      // For now, we skip this cleanup - it should be handled by IngestionAnalyst after conversation processing
      console.log(`[DialogueAgent] V11.0 - New conversation detected, context package cleanup should be handled by IngestionAnalyst`);
    }

    // V11.0 STANDARD: Prepare LLM input with separated prompts and proper history
    const llmToolInput = {
      userId: input.userId,
      sessionId: input.conversationId,
      systemPrompt: promptOutput.systemPrompt,        // ✅ Background context only
      userMessage: promptOutput.userPrompt,           // ✅ Current turn context  
      history: this.formatHistoryForLLM(promptOutput.conversationHistory), // ✅ Properly formatted history
      memoryContextBlock: augmentedMemoryContext?.relevant_memories?.join('\n') || '',
      modelConfig: {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9
      }
    };

    console.log(`[DialogueAgent] V11.0 - LLM input prepared:`, {
      systemPromptLength: llmToolInput.systemPrompt.length,
      userMessageLength: llmToolInput.userMessage.length,
      historyCount: llmToolInput.history.length,
      hasMemoryContext: !!llmToolInput.memoryContextBlock
    });

    const llmResult = await this.llmChatTool.execute({ payload: llmToolInput });

    if (llmResult.status !== 'success' || !llmResult.result?.text) {
      throw new Error(`LLM call failed: ${llmResult.error?.message || 'No response text'}`);
    }

    try {
      // Extract JSON from between markers
      const rawText = llmResult.result.text;
      console.log('DialogueAgent - Raw LLM response:', rawText.substring(0, 200) + '...');
      
      let jsonText = '';
      
      // First try: Look for special JSON markers
      const beginMarker = '###==BEGIN_JSON==###';
      const endMarker = '###==END_JSON==###';
      
      const beginIndex = rawText.indexOf(beginMarker);
      const endIndex = rawText.indexOf(endMarker);
      
      if (beginIndex !== -1 && endIndex !== -1) {
        jsonText = rawText.substring(beginIndex + beginMarker.length, endIndex).trim();
        console.log('DialogueAgent - Found special markers, extracted JSON');
      } else {
        // Fallback: Look for markdown code blocks
        const codeBlockStart = rawText.indexOf('```json');
        const codeBlockEnd = rawText.indexOf('```', codeBlockStart + 7);
        
        if (codeBlockStart !== -1 && codeBlockEnd !== -1) {
          jsonText = rawText.substring(codeBlockStart + 7, codeBlockEnd).trim();
          console.log('DialogueAgent - Found markdown code block, extracted JSON');
        } else {
          // Final fallback: Try to find JSON by looking for { and }
          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonText = rawText.substring(firstBrace, lastBrace + 1).trim();
            console.log('DialogueAgent - Found braces, extracted JSON');
          } else {
            console.error('DialogueAgent - No JSON markers or code blocks found in LLM response:', rawText);
            throw new Error("LLM response missing JSON markers or code blocks.");
          }
        }
      }
      
      console.log('DialogueAgent - Extracted JSON:', jsonText.substring(0, 100) + '...');
      
      return JSON.parse(jsonText);
    } catch (e) {
      console.error('DialogueAgent - JSON parsing error:', e);
      console.error('DialogueAgent - Raw LLM response:', llmResult.result.text);
      throw new Error("LLM returned malformed JSON.");
    }
  }

  /**
   * V11.0: Format conversation history for LLM consumption
   */
  private formatHistoryForLLM(messages: conversation_messages[]): Array<{role: "assistant" | "user"; content: string; timestamp?: string}> {
    // Convert conversation_messages to LLM-compatible format
    // Reverse to get chronological order (most recent messages come first from DB)
          return [...messages].reverse().map(msg => ({
        role: msg.role as "assistant" | "user", // Type assertion for valid roles
        content: msg.content,
        timestamp: msg.timestamp?.toISOString()
      }));
  }

  /**
   * Legacy method for backward compatibility with existing tests
   */
  public async processDialogue(
    input: TAgentInput<TDialogueAgentInputPayload>
  ): Promise<TAgentOutput<TDialogueAgentResult>> {
    try {
      const result = await this.processTurn({
        userId: input.user_id,
        conversationId: input.payload.conversation_id || '',
        currentMessageText: input.payload.message_text || undefined,
        currentMessageMedia: input.payload.message_media || undefined
      });

      return {
        status: 'success',
        result: {
          response_text: result.response_text,
          conversation_id: input.payload.conversation_id || ''
        },
        request_id: input.request_id, // Preserve request_id from input
        metadata: {
          processing_time_ms: 0 // TODO: Track timing
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          code: 'DIALOGUE_AGENT_ERROR',
          message: error instanceof Error ? error.message : 'Dialogue processing failed',
          details: {}
        },
        metadata: {
          processing_time_ms: 0
        }
      };
    }
  }
} 