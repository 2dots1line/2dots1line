/**
 * LLM Chat Tool
 * Handles AI conversation through Gemini API
 * Adapted from legacy ai.service.js
 */

import { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import type { IToolManifest, IExecutableTool } from '@2dots1line/shared-types';
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { EnvironmentModelConfigService } from '@2dots1line/config-service';
import { DatabaseService } from '@2dots1line/database';

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
  description: 'AI conversation tool using Gemini for DialogueAgent',
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
    'Requires GOOGLE_API_KEY environment variable',
    'Uses Gemini 1.5 Flash model',
    'Rate limited by Google API quotas'
  ]
};

class LLMChatToolImpl implements IExecutableTool<LLMChatInputPayload, LLMChatResult> {
  manifest = manifest;
  
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private modelConfigService: EnvironmentModelConfigService | null = null;
  private currentModelName: string | null = null;
  private initialized = false;

  constructor() {
    // Remove environment variable check from constructor
    // Will be initialized lazily on first execute() call
  }

  private initialize() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelConfigService = EnvironmentModelConfigService.getInstance();
    
    // Get the appropriate model from environment-first configuration
    const newModelName = this.modelConfigService.getModelForUseCase('chat');
    
    // Check if model has changed or if this is first initialization
    if (!this.initialized || this.currentModelName !== newModelName) {
      console.log(`🤖 LLMChatTool: ${this.initialized ? 'Reinitializing' : 'Initializing'} with model ${newModelName}${this.currentModelName ? ` (was: ${this.currentModelName})` : ''}`);
      this.modelConfigService.logCurrentConfiguration();
      
      this.currentModelName = newModelName;
      this.model = this.genAI.getGenerativeModel({ 
        model: this.currentModelName,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 50000, // Override for chat use case
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });
      
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
    
    try {
      // Initialize on first execution
      this.initialize();

      const startTime = performance.now();

      const history = [
        ...this.formatHistoryForGemini(input.payload.history),
      ];

      // Start chat session with history
      const chat = this.model!.startChat({
        history,
        generationConfig: {
          temperature: input.payload.temperature || 0.7,
          maxOutputTokens: input.payload.maxTokens || 50000,
          responseMimeType: 'application/json', // ✅ Enable Gemini's JSON mode
        },
      });
      
      // Build the conversation prompt
      const systemPrompt = input.payload.systemPrompt;
      currentMessage = `${systemPrompt}\n\nRELEVANT CONTEXT FROM USER'S PAST:\n${input.payload.memoryContextBlock || 'No memories provided.'}\n\nCURRENT MESSAGE: ${input.payload.userMessage}`;
      
      console.log('\n🤖 LLMChatTool - FINAL ASSEMBLED PROMPT SENT TO LLM:');
      console.log('🔸'.repeat(80));
      console.log(currentMessage);
      console.log('🔸'.repeat(80));
      console.log(`📏 LLMChatTool - Final prompt length: ${currentMessage.length} characters\n`);

      console.log('🚀 LLMChatTool - Sending request to Google Gemini...');
      const result = await chat.sendMessage(currentMessage);
      const response = await result.response;
      const text = response.text();
      
      console.log('\n🎯 LLMChatTool - RAW LLM RESPONSE RECEIVED:');
      console.log('🔹'.repeat(80));
      console.log('Response text length:', text.length);
      console.log('Raw response:');
      console.log(text);
      console.log('🔹'.repeat(80));
      
      // Log usage information if available
      if (response.usageMetadata) {
        console.log('📊 LLMChatTool - Usage stats:', {
          promptTokens: response.usageMetadata.promptTokenCount,
          candidateTokens: response.usageMetadata.candidatesTokenCount,
          totalTokens: response.usageMetadata.totalTokenCount
        });
      }
      console.log('');

      const endTime = performance.now();
      const processingTime = endTime - startTime;
      const requestCompletedAt = new Date();

      // Log successful interaction
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
        parsedResponse: null, // Will be set by calling tool if needed
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

      console.error('❌ LLMChatTool - Error calling Gemini API:', error);
      return {
        status: 'error',
        error: {
          code: 'LLM_API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown LLM error',
          details: { provider: 'google-gemini' }
        },
        metadata: {
          processing_time_ms: 0,
          session_id: input.payload.sessionId
        }
      };
    }
  }

  /**
   * Format conversation history for Gemini API
   */
  private formatHistoryForGemini(history: Array<{ role: string; content: string }>): Array<any> {
    return history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
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