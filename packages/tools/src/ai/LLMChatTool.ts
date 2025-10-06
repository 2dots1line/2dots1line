/**
 * LLM Chat Tool
 * Handles AI conversation through LLM API
 * Adapted from legacy ai.service.js
 */

import { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import type { IToolManifest, IExecutableTool } from '@2dots1line/shared-types';
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { EnvironmentModelConfigService } from '@2dots1line/config-service';
import { DatabaseService } from '@2dots1line/database';
import { OpenAI } from 'openai';

interface LLMInteractionLog {
  workerType: string;
  workerJobId?: string;
  sessionId: string;
  userId: string;
  conversationId?: string;
  messageId?: string;
  sourceEntityId?: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  promptLength: number;
  promptTokens?: number;
  systemPrompt?: string;
  userPrompt: string;
  fullPrompt: string;
  responseLength: number;
  responseTokens?: number;
  rawResponse: string;
  parsedResponse?: any;
  finishReason?: string;
  requestStartedAt: Date;
  requestCompletedAt: Date;
  processingTimeMs: number;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  errorCode?: string;
  metadata?: any;
}

export interface LLMChatInputPayload {
  userId: string;
  sessionId: string;
  systemPrompt: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  userMessage: string;
  memoryContextBlock?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  
  // New fields for LLM interaction logging
  workerType?: string;        // 'insight-worker', 'ingestion-worker', 'dialogue-service'
  workerJobId?: string;       // BullMQ job ID
  conversationId?: string;    // If applicable
  messageId?: string;         // If applicable
  sourceEntityId?: string;    // ID of entity being processed
}

export interface LLMChatResult {
  text: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model_used: string;
  finish_reason?: string;
}

export type LLMChatInput = TToolInput<LLMChatInputPayload>;
export type LLMChatOutput = TToolOutput<LLMChatResult>;

// Tool manifest for registry discovery
const manifest: IToolManifest<LLMChatInputPayload, LLMChatResult> = {
  name: 'llm.chat',
  description: 'AI conversation tool for DialogueAgent',
  version: '1.0.0',
  availableRegions: ['us', 'cn'],
  categories: ['ai', 'llm', 'conversation'],
  capabilities: ['chat', 'conversation', 'text_generation'],
  validateInput: (input: LLMChatInput) => {
    const valid = !!input?.payload?.userId && !!input?.payload?.userMessage && typeof input.payload.userMessage === 'string';
    return { 
      valid, 
      errors: valid ? [] : ['Missing userId or userMessage in payload'] 
    };
  },
  validateOutput: (output: LLMChatOutput) => {
    const valid = !!(output?.result?.text && typeof output.result.text === 'string');
    return { 
      valid, 
      errors: valid ? [] : ['Missing text in result'] 
    };
  },
  performance: {
    avgLatencyMs: 2000,
    isAsync: true,
    isIdempotent: false
  },
  limitations: [
    'Requires GOOGLE_API_KEY or OPENAI_API_KEY environment variable',
    'Rate limited by Google/OpenAI API quotas'
  ]
};

class LLMChatToolImpl implements IExecutableTool<LLMChatInputPayload, LLMChatResult> {
  manifest = manifest;

  // Gemini
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  // OpenAI
  private openai: OpenAI | null = null;

  private modelConfigService: EnvironmentModelConfigService | null = null;
  private currentModelName: string | null = null;
  private initialized = false;
  private provider: 'gemini' | 'openai' = 'gemini';

  private initialize() {
    // Decide provider
    this.provider = (process.env.LLM_PROVIDER as 'gemini' | 'openai') || 'gemini';
    this.modelConfigService = EnvironmentModelConfigService.getInstance();
    const newModelName = this.modelConfigService.getModelForUseCase('chat') ||  undefined;

    if (!this.initialized || this.currentModelName !== newModelName || !this.provider) {
      console.log(`🤖 LLMChatTool: Initializing with provider ${this.provider}, model ${newModelName}`);
      this.modelConfigService.logCurrentConfiguration();
      this.currentModelName = newModelName ?? null;

      if (this.provider === 'gemini') {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error('GOOGLE_API_KEY environment variable is required');
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
          model: this.currentModelName || 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 50000,
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          ],
        });
      } else if (this.provider === 'openai') {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is required');
        const baseUrl = process.env.OPENAI_BASE_URL;
        if (!baseUrl) throw new Error('OPENAI_BASE_URL environment variable is required for OpenAI provider');
        this.openai = new OpenAI({apiKey});
        this.openai.baseURL = baseUrl;
      } else {
        throw new Error('Invalid LLM provider configuration');
      }

      this.initialized = true;
    }
  }

  /**
   * Force reinitialization (useful when model configuration changes)
   */
  public forceReinitialize(): void {
    console.log(`🔄 LLMChatTool: Forcing reinitialization`);
    this.initialized = false;
    this.model = null;
    this.currentModelName = null;
    this.initialize();
  }
  
  
  /**
   * Log LLM interaction to database
   */
  private async logLLMInteraction(logData: LLMInteractionLog): Promise<void> {
    try {
      // Initialize DatabaseService if not already done
      const dbService = DatabaseService.getInstance();
      
      await dbService.prisma.llm_interactions.create({
        data: {
          worker_type: logData.workerType,
          worker_job_id: logData.workerJobId,
          session_id: logData.sessionId,
          user_id: logData.userId,
          conversation_id: logData.conversationId,
          message_id: logData.messageId,
          source_entity_id: logData.sourceEntityId,
          model_name: logData.modelName,
          temperature: logData.temperature,
          max_tokens: logData.maxTokens,
          prompt_length: logData.promptLength,
          prompt_tokens: logData.promptTokens,
          system_prompt: logData.systemPrompt,
          user_prompt: logData.userPrompt,
          full_prompt: logData.fullPrompt,
          response_length: logData.responseLength,
          response_tokens: logData.responseTokens,
          raw_response: logData.rawResponse,
          parsed_response: logData.parsedResponse,
          finish_reason: logData.finishReason,
          request_started_at: logData.requestStartedAt,
          request_completed_at: logData.requestCompletedAt,
          processing_time_ms: logData.processingTimeMs,
          status: logData.status,
          error_message: logData.errorMessage,
          error_code: logData.errorCode,
          metadata: logData.metadata
        }
      });
      
      console.log(`📝 LLMChatTool: Logged interaction to database (ID: ${logData.userId}, Worker: ${logData.workerType}, Status: ${logData.status})`);
    } catch (error) {
      console.error('❌ LLMChatTool: Failed to log LLM interaction to database:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  /**
   * Execute LLM chat conversation
   */
  async execute(input: LLMChatInput): Promise<LLMChatOutput> {
    const requestStartedAt = new Date();
    let currentMessage = '';
    let attempts = 0;
    const maxAttempts = 2; // Try primary model + 1 fallback model (reduced from 3)
    
    while (attempts < maxAttempts) {
      attempts++;
      try {
        this.initialize();
        const startTime = performance.now();

        console.log(`💬 LLMChatTool: Calling ${this.provider.toUpperCase()} API (Attempt ${attempts}/${maxAttempts}) for user ${input.payload.userId}, session ${input.payload.sessionId}`);
        if (this.provider === 'gemini') {
          // --- GEMINI LOGIC (unchanged) ---
          const history = [...this.formatHistoryForGemini(input.payload.history)];
          if (history.length > 0 && history[0].role !== 'user') throw new Error('Invalid conversation history: First message must be from user');
          const chat = this.model!.startChat({
            history,
            generationConfig: {
              temperature: input.payload.temperature || 0.7,
              maxOutputTokens: input.payload.maxTokens || 50000,
              responseMimeType: 'application/json',
            },
          });
          const systemPrompt = input.payload.systemPrompt;
          currentMessage = `${systemPrompt}\n\nRELEVANT CONTEXT FROM USER'S PAST:\n${input.payload.memoryContextBlock || 'No memories provided.'}\n\nCURRENT MESSAGE: ${input.payload.userMessage}`;
          const result = await chat.sendMessage(currentMessage);
          const response = await result.response;
          const text = response.text();
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          const requestCompletedAt = new Date();

          await this.logLLMInteraction({
            workerType: input.payload.workerType || 'unknown',
            workerJobId: input.payload.workerJobId,
            sessionId: input.payload.sessionId,
            userId: input.payload.userId,
            conversationId: input.payload.conversationId,
            messageId: input.payload.messageId,
            sourceEntityId: input.payload.sourceEntityId,
            modelName: this.currentModelName || 'unknown',
            temperature: input.payload.temperature,
            maxTokens: input.payload.maxTokens,
            promptLength: currentMessage.length,
            promptTokens: response.usageMetadata?.promptTokenCount,
            systemPrompt: input.payload.systemPrompt,
            userPrompt: input.payload.userMessage,
            fullPrompt: currentMessage,
            responseLength: text.length,
            responseTokens: response.usageMetadata?.candidatesTokenCount,
            rawResponse: text,
            parsedResponse: null,
            finishReason: response.candidates?.[0]?.finishReason,
            requestStartedAt,
            requestCompletedAt,
            processingTimeMs: Math.round(processingTime),
            status: 'success',
            metadata: {
              memoryContextBlock: input.payload.memoryContextBlock,
              historyLength: input.payload.history?.length || 0
            }
          });

          return {
            status: 'success',
            result: {
              text: text,
              usage: {
                input_tokens: response.usageMetadata?.promptTokenCount || 0,
                output_tokens: response.usageMetadata?.candidatesTokenCount || 0,
                total_tokens: response.usageMetadata?.totalTokenCount || 0
              },
              model_used: this.currentModelName || 'unknown',
              finish_reason: response.candidates?.[0]?.finishReason || 'stop'
            },
            metadata: {
              processing_time_ms: Math.round(processingTime),
              model_used: this.currentModelName || 'unknown',
              session_id: input.payload.sessionId
            }
          };
        } else if (this.provider === 'openai') {
          // --- OPENAI LOGIC ---
          const messages = this.formatHistoryForOpenAI(input.payload.history);
          if (input.payload.systemPrompt) {
            messages.unshift({ role: 'system', content: input.payload.systemPrompt });
          }
          if (input.payload.memoryContextBlock) {
            messages.push({ role: 'user', content: `RELEVANT CONTEXT FROM USER'S PAST:\n${input.payload.memoryContextBlock}` });
          }
          currentMessage = messages.map(m => `[${m.role}] ${m.content}`).join('\n');
          console.log(`📝 LLMChatTool: OpenAI messages:\n${currentMessage}`);

          const response = await this.openai!.chat.completions.create({
            model: this.currentModelName!,
            messages,
            temperature: input.payload.temperature ?? 0.7,
            max_tokens: input.payload.maxTokens ?? 2048,
          });

          const text = response.choices[0]?.message?.content ?? '';
          const usage = response.usage;
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          const requestCompletedAt = new Date();

          await this.logLLMInteraction({
            workerType: input.payload.workerType || 'unknown',
            workerJobId: input.payload.workerJobId,
            sessionId: input.payload.sessionId,
            userId: input.payload.userId,
            conversationId: input.payload.conversationId,
            messageId: input.payload.messageId,
            sourceEntityId: input.payload.sourceEntityId,
            modelName: this.currentModelName || 'unknown',
            temperature: input.payload.temperature,
            maxTokens: input.payload.maxTokens,
            promptLength: currentMessage.length,
            promptTokens: usage?.prompt_tokens,
            systemPrompt: input.payload.systemPrompt,
            userPrompt: input.payload.userMessage,
            fullPrompt: currentMessage,
            responseLength: text.length,
            responseTokens: usage?.completion_tokens,
            rawResponse: text,
            parsedResponse: null,
            finishReason: response.choices[0]?.finish_reason,
            requestStartedAt,
            requestCompletedAt,
            processingTimeMs: Math.round(processingTime),
            status: 'success',
            metadata: {
              memoryContextBlock: input.payload.memoryContextBlock,
              historyLength: input.payload.history?.length || 0
            }
          });

          return {
            status: 'success',
            result: {
              text,
              usage: {
                input_tokens: usage?.prompt_tokens || 0,
                output_tokens: usage?.completion_tokens || 0,
                total_tokens: usage?.total_tokens || 0
              },
              model_used: this.currentModelName || 'unknown',
              finish_reason: response.choices[0]?.finish_reason || 'stop'
            },
            metadata: {
              processing_time_ms: Math.round(processingTime),
              model_used: this.currentModelName || 'unknown',
              session_id: input.payload.sessionId
            }
          };
        } else {
          throw new Error('Unknown LLM provider');
        }
      } catch (error) {
        const requestCompletedAt = new Date();
        const processingTime = requestCompletedAt.getTime() - requestStartedAt.getTime();

        // Log failed interaction
        await this.logLLMInteraction({
          workerType: input.payload.workerType || 'unknown',
          workerJobId: input.payload.workerJobId,
          sessionId: input.payload.sessionId,
          userId: input.payload.userId,
          conversationId: input.payload.conversationId,
          messageId: input.payload.messageId,
          sourceEntityId: input.payload.sourceEntityId,
          modelName: this.currentModelName || 'unknown',
          temperature: input.payload.temperature,
          maxTokens: input.payload.maxTokens,
          promptLength: currentMessage.length,
          systemPrompt: input.payload.systemPrompt,
          userPrompt: input.payload.userMessage,
          fullPrompt: currentMessage,
          responseLength: 0,
          rawResponse: '',
          requestStartedAt,
          requestCompletedAt,
          processingTimeMs: Math.round(processingTime),
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
          metadata: {
            memoryContextBlock: input.payload.memoryContextBlock,
            historyLength: input.payload.history?.length || 0
          }
        });

        console.error(`❌ LLMChatTool - Error calling LLM API on attempt ${attempts}/${maxAttempts}:`, error);
        
        // Check if this is a retryable error and we have more attempts
        if (attempts < maxAttempts && this.isRetryableError(error)) {
          console.log(`🔄 LLMChatTool - Retryable error detected, attempting to switch to fallback model...`);
          
          try {
            // Force reinitialization to try a different model
            this.forceReinitialize();
            console.log(`🔄 LLMChatTool - Switched to fallback model: ${this.currentModelName}`);
            
            // Add exponential backoff delay before retrying
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000); // Max 10 seconds
            console.log(`🔄 LLMChatTool - Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            continue; // Try again with the new model
          } catch (modelSwitchError) {
            console.error(`❌ LLMChatTool - Failed to switch to fallback model:`, modelSwitchError);
            // Continue with the next attempt
          }
        }
        
        // If not retryable or all attempts exhausted, break out of retry loop
        break;
      }
    }

    // If all attempts fail, return an error
    console.error(`❌ LLMChatTool - All ${maxAttempts} attempts failed`);
    return {
      status: 'error',
      error: {
        code: 'LLM_API_ERROR',
        message: `Failed to get a response after ${maxAttempts} attempts.`,
        details: { provider: this.provider, attempts: maxAttempts }
      },
      metadata: {
        processing_time_ms: 0,
        session_id: input.payload.sessionId
      }
    };
  }

  /**
   * Check if an error is retryable (e.g., model overload, rate limit, temporary issues)
   */
  private isRetryableError(error: any): boolean {
    if (!error || typeof error !== 'object') return false;
    
    const errorMessage = error.message || error.toString() || '';
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

  /**
   * Format conversation history for Gemini API
   * Gemini requires the first message to have role 'user'
   */
  private formatHistoryForGemini(history: Array<{ role: string; content: string }>): Array<any> {
    if (!history || history.length === 0) {
      return [];
    }

    // Ensure the first message is always from the user
    // If the first message is from assistant, we need to handle this carefully
    const formattedHistory = [];
    
    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      const role = msg.role === 'assistant' ? 'model' : 'user';
      
      // For the first message, if it's from assistant, we need to skip it
      // or create a placeholder user message to maintain conversation flow
      if (i === 0 && role === 'model') {
        // Skip the first assistant message to avoid Gemini's validation error
        // This is a safety measure - in normal conversation flow, the first message should be from user
        console.warn('LLMChatTool: First message in history is from assistant, skipping to avoid Gemini validation error');
        continue;
      }
      
      formattedHistory.push({
        role,
        parts: [{ text: msg.content }]
      });
    }
    
    return formattedHistory;
  }

  private formatHistoryForOpenAI(
    history: Array<{ role: string; content: string }>
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    if (!history || history.length === 0) return [];
    return history.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
      content: msg.content
    }));
  }

  /**
   * Rough token estimation (4 chars ≈ 1 token for English)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export const LLMChatTool = new LLMChatToolImpl();
export default LLMChatTool;