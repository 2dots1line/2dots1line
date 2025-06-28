/**
 * LLM Chat Tool
 * Handles AI conversation through Gemini API
 * Adapted from legacy ai.service.js
 */

import { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import type { IToolManifest, IExecutableTool } from '@2dots1line/tool-registry';
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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
  
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
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
  }

  /**
   * Execute LLM chat conversation
   */
  async execute(input: LLMChatInput): Promise<LLMChatOutput> {
    try {
      const startTime = performance.now();

      const history = [
        ...this.formatHistoryForGemini(input.payload.history),
      ];

      // Start chat session with history
      const chat = this.model.startChat({
        history,
        generationConfig: {
          temperature: input.payload.temperature || 0.7,
          maxOutputTokens: input.payload.maxTokens || 2048,
        },
      });
      
      const systemPrompt = input.payload.systemPrompt;
      let currentMessage = `${systemPrompt}\n\nRELEVANT CONTEXT FROM USER'S PAST:\n${input.payload.memoryContextBlock || 'No memories provided.'}\n\nCURRENT MESSAGE: ${input.payload.userMessage}`;

      // Send the current message
      const result = await chat.sendMessage(currentMessage);
      const response = await result.response;
      const text = response.text();

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      return {
        status: 'success',
        result: {
          text,
          usage: {
            input_tokens: this.estimateTokens(currentMessage),
            output_tokens: this.estimateTokens(text),
            total_tokens: this.estimateTokens(currentMessage + text)
          },
          model_used: 'gemini-1.5-flash',
          finish_reason: response.candidates?.[0]?.finishReason || 'stop'
        },
        metadata: {
          processing_time_ms: Math.round(processingTime),
          model_used: 'gemini-1.5-flash'
        }
      };

    } catch (error) {
      console.error('LLMChatTool execution error:', error);
      
      return {
        status: 'error',
        error: {
          code: 'LLM_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown LLM error',
          details: { tool: this.manifest.name }
        },
        metadata: {
          processing_time_ms: 0,
          model_used: 'gemini-1.5-flash'
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