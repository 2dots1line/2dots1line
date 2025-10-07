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
  enforceJsonMode?: boolean;  // Whether to enforce JSON mode for OpenAI
  enableStreaming?: boolean;  // Whether to enable streaming responses
  onChunk?: (chunk: string) => void;  // Callback for streaming chunks
  
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
  
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private openai: OpenAI | null = null;
  private modelConfigService: EnvironmentModelConfigService | null = null;
  private currentModelName: string | null = null;
  private initialized = false;
  private provider: 'gemini' | 'openai' = 'gemini';

  constructor() {
    // Remove environment variable check from constructor
    // Will be initialized lazily on first execute() call
  }

  private initialize() {
    // Decide provider
    this.provider = (process.env.LLM_PROVIDER as 'gemini' | 'openai') || 'gemini';
    this.modelConfigService = EnvironmentModelConfigService.getInstance();
    const newModelName = this.modelConfigService.getModelForUseCase('chat') || undefined;

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
        this.openai = new OpenAI({ apiKey });
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
  /**
   * Extract JSON from response, handling potential markdown formatting
   */
  private extractJSONFromResponse(response: string): string {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object boundaries
      const startIndex = cleaned.indexOf('{');
      const lastIndex = cleaned.lastIndexOf('}');
      
      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        const jsonString = cleaned.substring(startIndex, lastIndex + 1);
        // Validate it's parseable JSON
        JSON.parse(jsonString);
        return jsonString;
      }
      
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('❌ LLMChatTool - JSON extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract valid JSON from response: ${errorMessage}`);
    }
  }

  async execute(input: LLMChatInput): Promise<LLMChatOutput> {
    const requestStartedAt = new Date();
    let currentMessage = '';
    let attempts = 0;
    const maxAttempts = 2; // Try primary model + 1 fallback model (reduced from 3)
    
    while (attempts < maxAttempts) {
      attempts++;
      try {
        // Initialize on first execution
        this.initialize();

        const startTime = performance.now();
        console.log(`💬 LLMChatTool: Calling ${this.provider.toUpperCase()} API (Attempt ${attempts}/${maxAttempts}) for user ${input.payload.userId}, session ${input.payload.sessionId}`);
        if (this.provider === 'gemini') {
          const history = [
            ...this.formatHistoryForGemini(input.payload.history),
          ];
          if (history.length > 0 && history[0].role !== 'user') {
            console.error('❌ LLMChatTool - Invalid history format: First message must be from user, got:', history[0].role);
            throw new Error('Invalid conversation history: First message must be from user');
          }
          const chat = this.model!.startChat({
            history,
            generationConfig: {
              temperature: input.payload.temperature || 0.7,
              maxOutputTokens: input.payload.maxTokens || 50000,
              responseMimeType: 'application/json',
            },
          });
          
          // Enhanced system prompt for deterministic JSON output
          const enhancedSystemPrompt = `You are a machine that only returns and replies with valid, iterable RFC8259 compliant JSON in your responses.

CRITICAL JSON REQUIREMENTS:
- Return ONLY the JSON object
- Start your response with { and end with }
- No text before or after the JSON
- No markdown formatting (no \`\`\`json)
- No explanations outside the JSON
- Ensure the JSON is complete and valid

CRITICAL DECISION RULE:
- If the prompt contains "augmented_memory_context" or memory retrieval context → ALWAYS use "decision": "respond_directly"
- If no memory context is provided → Use "decision": "query_memory" or "respond_directly" based on context

${input.payload.systemPrompt}`;
          
          currentMessage = `${enhancedSystemPrompt}\n\nRELEVANT CONTEXT FROM USER'S PAST:\n${input.payload.memoryContextBlock || 'No memories provided.'}\n\nCURRENT MESSAGE: ${input.payload.userMessage}`;
          
          let text = '';
          let response: any;
          let providerModel = 'unknown';
          
          if (input.payload.enableStreaming && input.payload.onChunk) {
            // Streaming mode
            console.log(`🌊 LLMChatTool: Using streaming mode for user ${input.payload.userId}`);
            const result = await chat.sendMessageStream(currentMessage);
            const stream = result.stream;
            
            let accumulatedText = '';
            let lastStreamedLength = 0;
            let inDirectResponseText = false;
            let directResponseTextStart = -1;
            let responsePlanStart = -1;
            let hasStreamedAnyContent = false;
            let isRespondDirectlyDecision = false;
            
            for await (const chunk of stream) {
              const chunkText = chunk.text();
              accumulatedText += chunkText;
              
              // Debug: Log the current accumulated text to understand the structure
              console.log(`🌊 LLMChatTool: Current accumulated text length: ${accumulatedText.length}`);
              console.log(`🌊 LLMChatTool: Current chunk: "${chunkText}"`);
              
              // Try to stream only the direct_response_text content to frontend
              try {
                // First, find the response_plan section
                if (responsePlanStart === -1) {
                  const responsePlanMatch = accumulatedText.match(/"response_plan"\s*:\s*{/);
                  if (responsePlanMatch) {
                    responsePlanStart = responsePlanMatch.index! + responsePlanMatch[0].length;
                    console.log(`🌊 LLMChatTool: ✅ Found response_plan at position ${responsePlanStart}`);
                  }
                }
                
                // Check if this is a "respond_directly" decision (bulletproof filtering)
                if (responsePlanStart !== -1 && !isRespondDirectlyDecision) {
                  const responsePlanSection = accumulatedText.substring(responsePlanStart);
                  const decisionMatch = responsePlanSection.match(/"decision"\s*:\s*"respond_directly"/);
                  
                  if (decisionMatch) {
                    isRespondDirectlyDecision = true;
                    console.log(`🌊 LLMChatTool: ✅ Confirmed "respond_directly" decision - will stream content`);
                    // Send decision information to frontend
                    if (input.payload.onChunk) {
                      input.payload.onChunk('DECISION:respond_directly');
                    }
                  } else {
                    // Check if it's a different decision (like "query_memory")
                    const queryMemoryMatch = responsePlanSection.match(/"decision"\s*:\s*"query_memory"/);
                    if (queryMemoryMatch) {
                      console.log(`🌊 LLMChatTool: ⏭️ Detected "query_memory" decision - skipping streaming`);
                      // Send decision information to frontend before skipping
                      if (input.payload.onChunk) {
                        input.payload.onChunk('DECISION:query_memory');
                      }
                      continue; // Skip this chunk and all subsequent chunks for this response
                    }
                  }
                }
                
                // Only proceed with streaming if we have a "respond_directly" decision
                if (isRespondDirectlyDecision && !inDirectResponseText) {
                  // Look for direct_response_text field (now at the root level, not in response_plan)
                  const directResponseMatch = accumulatedText.match(/"direct_response_text"\s*:\s*"/);
                  if (directResponseMatch) {
                    // Calculate the absolute position of the text start (after the opening quote)
                    const textStart = directResponseMatch.index! + directResponseMatch[0].length;
                    inDirectResponseText = true;
                    directResponseTextStart = textStart;
                    console.log(`🌊 LLMChatTool: ✅ Entered direct_response_text field (new structure) at position ${textStart}`);
                    console.log(`🌊 LLMChatTool: Text before direct_response_text: "${accumulatedText.substring(0, textStart)}"`);
                  }
                }
                
                // If we're in the direct_response_text field AND it's a respond_directly decision, extract and stream only that content
                if (isRespondDirectlyDecision && inDirectResponseText) {
                  // Extract everything from the text start to the current position
                  let currentResponseText = accumulatedText.substring(directResponseTextStart);
                  
                  // Check if we've reached the end of the direct_response_text field
                  // Since direct_response_text is now the last field, look for closing quote + closing brace
                  let endPosition = -1;
                  
                  // Look for the closing quote followed by closing brace (end of JSON)
                  const endMatch = currentResponseText.match(/^([^"]*(?:\\.[^"]*)*)"(\s*})/);
                  if (endMatch) {
                    endPosition = endMatch[1].length;
                    console.log(`🌊 LLMChatTool: Found end boundary via closing quote + brace at position ${endPosition}`);
                  } else {
                    // Fallback to character-by-character approach
                    let i = 0;
                    while (i < currentResponseText.length) {
                      if (currentResponseText[i] === '"') {
                        // Check if this quote is escaped
                        let escapeCount = 0;
                        let j = i - 1;
                        while (j >= 0 && currentResponseText[j] === '\\') {
                          escapeCount++;
                          j--;
                        }
                        // If the quote is not escaped (even number of backslashes before it)
                        if (escapeCount % 2 === 0) {
                          // Look ahead to see what comes after this quote
                          let nextIndex = i + 1;
                          // Skip whitespace
                          while (nextIndex < currentResponseText.length && /\s/.test(currentResponseText[nextIndex])) {
                            nextIndex++;
                          }
                          
                          // Check if we have a closing brace after whitespace (end of JSON)
                          if (nextIndex < currentResponseText.length && currentResponseText[nextIndex] === '}') {
                            endPosition = i;
                            console.log(`🌊 LLMChatTool: Found end boundary at position ${endPosition}, next char: "}"`);
                            break;
                          }
                        }
                      }
                      i++;
                    }
                  }
                  
                  if (endPosition !== -1) {
                    // We've reached the end of the direct_response_text field
                    currentResponseText = currentResponseText.substring(0, endPosition);
                    inDirectResponseText = false;
                    console.log(`🌊 LLMChatTool: ✅ Exited direct_response_text field at position ${endPosition}`);
                    console.log(`🌊 LLMChatTool: Final direct_response_text: "${currentResponseText}"`);
                  }
                  
                  // Unescape the response text
                  const unescapedText = currentResponseText.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
                  
                  // Only send new content that hasn't been sent yet
                  if (unescapedText.length > lastStreamedLength) {
                    const newContent = unescapedText.substring(lastStreamedLength);
                    lastStreamedLength = unescapedText.length;
                    text = unescapedText;
                    hasStreamedAnyContent = true;
                    input.payload.onChunk!(newContent);
                    console.log(`🌊 LLMChatTool: ✅ Streamed clean response chunk: "${newContent}"`);
                  }
                } else {
                  // We're not in the direct_response_text field yet, or it's not a respond_directly decision
                  // Don't stream anything to frontend, but continue accumulating for backend processing
                  if (!isRespondDirectlyDecision) {
                    console.log(`🌊 LLMChatTool: ⏭️ Skipping chunk (not respond_directly decision): "${chunkText}"`);
                  } else {
                    console.log(`🌊 LLMChatTool: ⏭️ Skipping chunk (not in direct_response_text): "${chunkText}"`);
                  }
                }
              } catch (error) {
                console.warn(`🌊 LLMChatTool: Error parsing streaming chunk:`, error);
                // If parsing fails and we're not in direct_response_text, don't stream
                if (!inDirectResponseText) {
                  console.log(`🌊 LLMChatTool: ⏭️ Skipping error chunk (not in direct_response_text): "${chunkText}"`);
                }
              }
            }
            
            // If we never streamed any content, log a warning
            if (!hasStreamedAnyContent) {
              if (!isRespondDirectlyDecision) {
                console.log(`🌊 LLMChatTool: ℹ️ No streaming needed - decision was not "respond_directly"`);
              } else {
                console.warn(`🌊 LLMChatTool: ⚠️ Never found "direct_response_text" field in response despite "respond_directly" decision. Full response: "${accumulatedText}"`);
              }
            }
            
            // Get the final response for metadata and parsing
            response = await result.response;
            providerModel = (response as any)?.model || this.currentModelName || 'unknown';
            
            // For streaming mode, we need to return the full accumulated text for parsing
            // The backend gets the complete JSON, frontend only got the clean direct_response_text
            text = accumulatedText; // Use the full JSON for parsing
          } else {
            // Non-streaming mode (existing behavior)
            const result = await chat.sendMessage(currentMessage);
            response = await result.response;
            text = response.text();
            providerModel = (response as any)?.model || this.currentModelName || 'unknown';
          }
          
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
            modelName: providerModel,
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
              model_used: providerModel,
              finish_reason: response.candidates?.[0]?.finishReason || 'stop'
            },
            metadata: {
              processing_time_ms: Math.round(processingTime),
              model_used: providerModel,
              session_id: input.payload.sessionId
            }
          };
        } else if (this.provider === 'openai') {
          const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = this.formatHistoryForOpenAI(input.payload.history);
          if (input.payload.systemPrompt) {
            messages.unshift({ role: 'system', content: input.payload.systemPrompt });
          }
          // CRITICAL: ensure the current user message is included
          if (input.payload.userMessage) {
            messages.push({ role: 'user', content: input.payload.userMessage });
          }
          if (input.payload.memoryContextBlock) {
            messages.push({ role: 'user', content: `RELEVANT CONTEXT FROM USER'S PAST:\n${input.payload.memoryContextBlock}` });
          }
          currentMessage = messages.map((m) => `[${m.role}] ${m.content}`).join('\n');
          const response = await this.openai!.chat.completions.create({
            model: this.currentModelName!,
            messages,
            temperature: input.payload.temperature ?? 0.7,
            max_tokens: input.payload.maxTokens ?? 2048,
            // Only enforce JSON mode for chat conversations, not analysis tools
            ...(input.payload.enforceJsonMode && { response_format: { type: 'json_object' } }),
          });

          const text = response.choices[0]?.message?.content ?? '';
          const usage = response.usage;
          const providerModel = (response as any)?.model || this.currentModelName || 'unknown';
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
            modelName: providerModel,
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
              model_used: providerModel,
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
    const errorName = error.name || '';
    
    // Check for specific error types that should be retryable
    if (errorName === 'TypeError' && errorMessage.includes('fetch failed')) {
      return true;
    }
    
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
      /fetch failed/i, // Added for TypeError: fetch failed
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
      role: msg.role === 'assistant' ? 'assistant' : (msg as any).role === 'system' ? 'system' : 'user',
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