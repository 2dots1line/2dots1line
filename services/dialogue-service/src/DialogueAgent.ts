/**
 * DialogueAgent.ts
 * V10.9 - Definitive implementation of the real-time conversational agent.
 * Adheres to the "Single Synthesis Call" architecture.
 */


import { ConversationRepository } from '@2dots1line/database';
import { 
  AugmentedMemoryContext,
  TAgentInput,
  TAgentOutput,
  TDialogueAgentInputPayload,
  TDialogueAgentResult,
  EngagementContext
} from '@2dots1line/shared-types';
import { 
  LLMChatTool, 
  VisionCaptionTool, 
  AudioTranscribeTool, 
  DocumentExtractTool, 
  HybridRetrievalTool 
} from '@2dots1line/tools';
import { IExecutableTool } from '@2dots1line/shared-types';
import { LLMRetryHandler, getEntityTypeMapping, PromptCacheService } from '@2dots1line/core-utils';
import { Redis } from 'ioredis';

import { ConfigService } from '../../config-service/src/ConfigService';

import { PromptBuilder, PromptBuildInput } from './PromptBuilder';

// Re-export PromptBuilder for controller access
export { PromptBuilder } from './PromptBuilder';

// Dependencies to be injected into the agent
export interface DialogueAgentDependencies {
  configService: ConfigService;
  conversationRepository: ConversationRepository;
  redisClient: Redis;
  promptBuilder: PromptBuilder;
  llmChatTool: any;
  visionCaptionTool: any;
  audioTranscribeTool: any;
  documentExtractTool: any;
  hybridRetrievalTool: HybridRetrievalTool;
  promptCacheService?: PromptCacheService; // Optional for backward compatibility
}

export class DialogueAgent {
  // Store injected dependencies
  private configService: ConfigService;
  private conversationRepo: ConversationRepository;
  private redis: Redis;
  private promptBuilder: PromptBuilder;
  private llmChatTool: any;
  private visionCaptionTool: any;
  private audioTranscribeTool: any;
  private documentExtractTool: any;
  private hybridRetrievalTool: HybridRetrievalTool;
  private promptCacheService?: PromptCacheService;

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
    this.promptCacheService = dependencies.promptCacheService;

    console.log("DialogueAgent V10.9 initialized.");
  }

  /**
   * Streaming version of processTurn for real-time response delivery.
   */
  public async processTurnStreaming(input: {
    userId: string;
    conversationId: string;
    currentMessageText?: string;
    currentMessageMedia?: Array<{
      type: string;
      url?: string;
      content?: string;
    }>;
    viewContext?: {
      currentView: 'chat' | 'cards' | 'cosmos' | 'dashboard';
      viewDescription?: string;
    };
    engagementContext?: EngagementContext;
    enableGrounding?: boolean;
    onChunk?: (chunk: string) => void;
    onGroundingSources?: (sources: Array<{web_url: string; title?: string; snippet?: string}>) => void;
  }): Promise<{
    response_text: string;
    ui_actions: Array<{
      action: string;
      label: string;
      payload: Record<string, unknown>;
    }>;
    metadata: {
      execution_id: string;
      decision: string;
      processing_time_ms: number;
      key_phrases_used?: string[];
      memory_retrieval_performed?: boolean;
    };
    vision_analysis?: string;
    document_analysis?: string;
  }> {
    const executionId = `da_stream_${Date.now()}`;
    console.log(`[${executionId}] Starting streaming turn processing for convo: ${input.conversationId}`);

    // --- PHASE I: INPUT PRE-PROCESSING ---
    const { processedText: finalInputText, visionAnalysis, documentAnalysis } = await this.processInput(input.currentMessageText, input.currentMessageMedia);

    // --- PHASE II: GROUNDING-AWARE SYNTHESIS ---
    let llmResponse: any;
    let groundingMetadata: any = null;
    
    if (input.enableGrounding) {
      // TWO-TURN GROUNDING FLOW
      console.log(`🌐 DialogueAgent - Grounding enabled: Starting two-turn flow`);
      
      // Turn 1: Search the web (non-streaming, get raw results)
      console.log(`🔍 DialogueAgent - Turn 1: Performing web search...`);
      const searchResponse = await this.performSingleSynthesisCallStreaming({ 
        userId: input.userId, 
        conversationId: input.conversationId, 
        finalInputText, 
        viewContext: input.viewContext,
        engagementContext: input.engagementContext,
        enableGrounding: true
      }, undefined, 'first', undefined); // No streaming for search turn
      
      // Extract grounding metadata and raw search results
      groundingMetadata = (searchResponse as any).grounding_metadata;
      const searchResults = (searchResponse as any).direct_response_text || (searchResponse as any).response_text;
      
      console.log(`✅ DialogueAgent - Turn 1 complete: Found ${groundingMetadata?.grounding_chunks?.length || 0} sources`);
      
      // Emit sources to frontend for live display
      if (groundingMetadata?.grounding_chunks && input.onGroundingSources) {
        input.onGroundingSources(groundingMetadata.grounding_chunks);
        console.log(`📡 DialogueAgent - Emitted ${groundingMetadata.grounding_chunks.length} sources to frontend`);
      }
      
      // Turn 2: Package results into Dot-styled response (with streaming)
      console.log(`📦 DialogueAgent - Turn 2: Packaging results with Dot's voice...`);
      const refinementPrompt = `Based on the following web search results, provide a natural, conversational response in Dot's voice.

WEB SEARCH RESULTS:
${searchResults}

INSTRUCTIONS:
- Synthesize the information naturally
- Maintain Dot's warm, insightful personality
- Include key facts and figures
- Keep it concise and conversational
- Do NOT include "thought_process" or technical details
- Respond as if you naturally have this knowledge

USER'S ORIGINAL QUESTION: ${finalInputText}`;

      llmResponse = await this.performSingleSynthesisCallStreaming({ 
        userId: input.userId, 
        conversationId: input.conversationId, 
        finalInputText: refinementPrompt, 
        viewContext: input.viewContext,
        engagementContext: input.engagementContext,
        enableGrounding: false // No grounding for refinement turn
      }, undefined, 'second', input.onChunk);
      
      // Attach grounding metadata to final response
      (llmResponse as any).grounding_metadata = groundingMetadata;
      
    } else {
      // STANDARD SINGLE-TURN FLOW
      llmResponse = await this.performSingleSynthesisCallStreaming({ 
        userId: input.userId, 
        conversationId: input.conversationId, 
        finalInputText, 
        viewContext: input.viewContext,
        engagementContext: input.engagementContext,
        enableGrounding: false
      }, undefined, 'first', input.onChunk);
    }

    // --- PHASE III: CONDITIONAL ORCHESTRATION & FINAL RESPONSE ---
    const { response_plan, turn_context_package, ui_actions } = llmResponse;
    
    // Immediately persist the next turn's context to Redis
    try {
      await this.redis.set(`turn_context:${input.userId}:${input.conversationId}`, JSON.stringify(turn_context_package), 'EX', 600); // 10 min TTL
      console.log(`✅ DialogueAgent - Turn context saved to Redis for user ${input.userId}, conversation ${input.conversationId}`);
    } catch (error) {
      console.error(`❌ DialogueAgent - Failed to save turn context to Redis:`, error);
      // Continue processing - Redis failure shouldn't block response
    }

    if (response_plan.decision === 'respond_directly') {
      console.log(`[${executionId}] Decision: Respond Directly. Turn complete.`);
      
      // Handle new JSON structure where direct_response_text is at root level
      let directResponseText = llmResponse.direct_response_text || 'I apologize, but I encountered an issue processing your request.';
      
      // Unescape JSON escape sequences in the final response text
      if (typeof directResponseText === 'string') {
        directResponseText = directResponseText
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');
      }
      
      // Log response text for monitoring
      console.log(`[${executionId}] Response text length: ${directResponseText?.length || 0} characters`);
      
      // Include grounding metadata if present
      const metadata: any = {
        execution_id: executionId,
        decision: response_plan.decision,
        processing_time_ms: Date.now() - parseInt(executionId.split('_')[2])
      };
      
      if ((llmResponse as any).grounding_metadata) {
        metadata.grounding_metadata = (llmResponse as any).grounding_metadata;
        console.log(`[${executionId}] ✅ Including grounding metadata with ${(llmResponse as any).grounding_metadata.grounding_chunks?.length || 0} sources`);
      }
      
      return { 
        response_text: directResponseText,
        ui_actions,
        metadata,
        vision_analysis: visionAnalysis,
        document_analysis: documentAnalysis
      };
    } 
    
    if (response_plan.decision === 'query_memory') {
      console.log(`[${executionId}] Decision: Query Memory. Key phrases:`, response_plan.key_phrases_for_retrieval);
      
      // Fix: Handle both string and array formats from LLM response
      let keyPhrases: string[];
      if (typeof response_plan.key_phrases_for_retrieval === 'string') {
        const phrasesString = response_plan.key_phrases_for_retrieval as string;
        keyPhrases = phrasesString
          .split(',')
          .map((phrase: string) => phrase.trim())
          .filter((phrase: string) => phrase.length > 0);
        console.log(`[${executionId}] Converted string to array:`, keyPhrases);
      } else if (Array.isArray(response_plan.key_phrases_for_retrieval)) {
        keyPhrases = response_plan.key_phrases_for_retrieval;
      } else {
        console.warn(`[${executionId}] Invalid key_phrases_for_retrieval format:`, response_plan.key_phrases_for_retrieval);
        keyPhrases = [];
      }
      
      // A. Execute retrieval
      console.log(`[${executionId}] 🔍 Executing memory retrieval with key phrases:`, keyPhrases);
      
      const userParameters = await this.loadUserHRTParameters(input.userId);
      
      const augmentedContext = await this.hybridRetrievalTool.execute({
        keyPhrasesForRetrieval: keyPhrases,
        userId: input.userId,
        userParameters: userParameters
      });
      
      console.log(`[${executionId}] 📊 Memory retrieval results:`, {
        memoryUnits: augmentedContext.retrievedMemoryUnits?.length || 0,
        concepts: augmentedContext.retrievedConcepts?.length || 0,
        artifacts: augmentedContext.retrievedArtifacts?.length || 0,
        hasContext: !!augmentedContext
      });

      // Check if memory retrieval returned meaningful results
      const hasMemoryContent = (augmentedContext.retrievedMemoryUnits?.length || 0) > 0 || 
                              (augmentedContext.retrievedConcepts?.length || 0) > 0 || 
                              (augmentedContext.retrievedArtifacts?.length || 0) > 0;
      
      if (!hasMemoryContent) {
        console.warn(`[${executionId}] ⚠️ Memory retrieval returned no meaningful results for key phrases:`, keyPhrases);
      }

      // B. Make the second, context-aware LLM call with streaming
      console.log(`[${executionId}] 🤖 Making second LLM call with augmented memory context`);
      const finalLlmResponse = await this.performSingleSynthesisCallStreaming({ 
        userId: input.userId, 
        conversationId: input.conversationId, 
        finalInputText, 
        viewContext: input.viewContext,
        engagementContext: input.engagementContext
      }, augmentedContext, 'second', input.onChunk);
      
      console.log(`[${executionId}] Retrieval complete. Generating final response.`);
      
      // Handle new JSON structure where direct_response_text is at root level
      const finalDirectResponseText = finalLlmResponse.direct_response_text || 'I apologize, but I encountered an issue processing your request.';
      
      return {
        response_text: finalDirectResponseText,
        ui_actions: finalLlmResponse.ui_actions,
        metadata: {
          execution_id: executionId,
          decision: response_plan.decision,
          key_phrases_used: keyPhrases,
          memory_retrieval_performed: true,
          processing_time_ms: Date.now() - parseInt(executionId.split('_')[2])
        },
        vision_analysis: visionAnalysis,
        document_analysis: documentAnalysis
      };
    }

    // Fallback for unknown decisions
    console.warn(`[${executionId}] Unknown decision: ${response_plan.decision}. Using direct response.`);
    
    // Handle new JSON structure where direct_response_text is at root level
    const fallbackDirectResponseText = llmResponse.direct_response_text  || 'I apologize, but I encountered an issue processing your request.';
    
    return {
      response_text: fallbackDirectResponseText,
      ui_actions: [],
      metadata: {
        execution_id: executionId,
        decision: 'fallback',
        processing_time_ms: Date.now() - parseInt(executionId.split('_')[2])
      },
      vision_analysis: visionAnalysis,
      document_analysis: documentAnalysis
    };
  }

  /**
   * Main entry point for processing a single conversational turn.
   */
  public async processTurn(input: {
    userId: string;
    conversationId: string;
    currentMessageText?: string;
    currentMessageMedia?: Array<{
      type: string;
      url?: string;
      content?: string;
    }>;
  }): Promise<{
    response_text: string;
    ui_actions: Array<{
      action: string;
      label: string;
      payload: Record<string, unknown>;
    }>;
    metadata: {
      execution_id: string;
      decision: string;
      processing_time_ms: number;
      key_phrases_used?: string[];
      memory_retrieval_performed?: boolean;
    };
    vision_analysis?: string; // Add vision analysis result for record keeping
    document_analysis?: string; // Add document analysis result for record keeping
  }> {
    const executionId = `da_${Date.now()}`;
    console.log(`[${executionId}] Starting turn processing for convo: ${input.conversationId}`);

    // --- PHASE I: INPUT PRE-PROCESSING ---
    const { processedText: finalInputText, visionAnalysis, documentAnalysis } = await this.processInput(input.currentMessageText, input.currentMessageMedia);

    // --- PHASE II: SINGLE SYNTHESIS LLM CALL ---
    const llmResponse = await this.performSingleSynthesisCall({ ...input, finalInputText }, undefined, 'first');

    // --- PHASE III: CONDITIONAL ORCHESTRATION & FINAL RESPONSE ---
    const { response_plan, turn_context_package, ui_actions } = llmResponse;
    
    // Immediately persist the next turn's context to Redis
    try {
      await this.redis.set(`turn_context:${input.userId}:${input.conversationId}`, JSON.stringify(turn_context_package), 'EX', 600); // 10 min TTL
      console.log(`✅ DialogueAgent - Turn context saved to Redis for user ${input.userId}, conversation ${input.conversationId}`);
    } catch (error) {
      console.error(`❌ DialogueAgent - Failed to save turn context to Redis:`, error);
      // Continue processing - Redis failure shouldn't block response
    }

    if (response_plan.decision === 'respond_directly') {
      console.log(`[${executionId}] Decision: Respond Directly. Turn complete.`);
      
      // Handle new JSON structure where direct_response_text is at root level
      const directResponseText = llmResponse.direct_response_text || 'I apologize, but I encountered an issue processing your request.';
      
      // V11.0 HEADLESS SERVICE: Return pure result, no database side effects
      return { 
        response_text: directResponseText,
        ui_actions,
        metadata: {
          execution_id: executionId,
          decision: response_plan.decision,
          processing_time_ms: Date.now() - parseInt(executionId.split('_')[1])
        },
        vision_analysis: visionAnalysis,
        document_analysis: documentAnalysis
      };
    } 
    
    if (response_plan.decision === 'query_memory') {
      console.log(`[${executionId}] Decision: Query Memory. Key phrases:`, response_plan.key_phrases_for_retrieval);
      
      // Fix: Handle both string and array formats from LLM response
      let keyPhrases: string[];
      if (typeof response_plan.key_phrases_for_retrieval === 'string') {
        // Split comma-separated string into array
        const phrasesString = response_plan.key_phrases_for_retrieval as string;
        keyPhrases = phrasesString
          .split(',')
          .map((phrase: string) => phrase.trim())
          .filter((phrase: string) => phrase.length > 0);
        console.log(`[${executionId}] Converted string to array:`, keyPhrases);
      } else if (Array.isArray(response_plan.key_phrases_for_retrieval)) {
        keyPhrases = response_plan.key_phrases_for_retrieval;
      } else {
        console.warn(`[${executionId}] Invalid key_phrases_for_retrieval format:`, response_plan.key_phrases_for_retrieval);
        keyPhrases = [];
      }
      
      // A. Execute retrieval
      console.log(`[${executionId}] 🔍 Executing memory retrieval with key phrases:`, keyPhrases);
      
      // Load user-specific HRT parameters
      const userParameters = await this.loadUserHRTParameters(input.userId);
      
      const augmentedContext = await this.hybridRetrievalTool.execute({
        keyPhrasesForRetrieval: keyPhrases,
        userId: input.userId,
        userParameters: userParameters
      });
      
      console.log(`[${executionId}] 📊 Memory retrieval results:`, {
        memoryUnits: augmentedContext.retrievedMemoryUnits?.length || 0,
        concepts: augmentedContext.retrievedConcepts?.length || 0,
        artifacts: augmentedContext.retrievedArtifacts?.length || 0,
        hasContext: !!augmentedContext
      });

      // Check if memory retrieval returned meaningful results
      const hasMemoryContent = (augmentedContext.retrievedMemoryUnits?.length || 0) > 0 || 
                              (augmentedContext.retrievedConcepts?.length || 0) > 0 || 
                              (augmentedContext.retrievedArtifacts?.length || 0) > 0;
      
      if (!hasMemoryContent) {
        console.warn(`[${executionId}] ⚠️ Memory retrieval returned no meaningful results for key phrases:`, keyPhrases);
      }

      // B. Make the second, context-aware LLM call
      console.log(`[${executionId}] 🤖 Making second LLM call with augmented memory context`);
      const finalLlmResponse = await this.performSingleSynthesisCall({ ...input, finalInputText }, augmentedContext, 'second');
      
      console.log(`[${executionId}] Retrieval complete. Generating final response.`);
      
      // Handle new JSON structure where direct_response_text is at root level
      const finalDirectResponseText = finalLlmResponse.direct_response_text || 'I apologize, but I encountered an issue processing your request.';
      
      // V11.0 HEADLESS SERVICE: Return pure result, no database side effects
      return {
        response_text: finalDirectResponseText,
        ui_actions: finalLlmResponse.ui_actions,
        metadata: {
          execution_id: executionId,
          decision: response_plan.decision,
          key_phrases_used: keyPhrases,
          memory_retrieval_performed: true,
          processing_time_ms: Date.now() - parseInt(executionId.split('_')[1])
        },
        vision_analysis: visionAnalysis,
        document_analysis: documentAnalysis
      };
    }

    throw new Error("Invalid LLM decision in response_plan.");
  }

  /**
   * Generic method to process different media types
   */
  private async processMediaByType(mediaItem: {
    type: string;
    url?: string;
    content?: string;
  }): Promise<{ text: string; analysis?: string }> {
    const { type, url, content } = mediaItem;
    const mediaData = url || content;
    
    if (type.startsWith('image/') && mediaData) {
      return await this.processImageMedia(mediaData, type);
    } else if (type.startsWith('audio/') && mediaData) {
      return await this.processAudioMedia(mediaData, type);
    } else if (type.startsWith('application/') && mediaData) {
      return await this.processDocumentMedia(mediaData, type);
    } else {
      return { text: `\n[Unsupported media type: ${type}]` };
    }
  }

  /**
   * Process image media using VisionCaptionTool
   */
  private async processImageMedia(imageData: string, imageType: string): Promise<{ text: string; analysis?: string }> {
    try {
      const visionResult = await this.visionCaptionTool.execute({
        payload: {
          imageUrl: imageData,
          imageType: imageType,
          prompt: "Describe what you see in this image in detail, including any people, animals, objects, or scenes."
        }
      });
      
      if (visionResult.status === 'success' && visionResult.result?.caption) {
        const caption = visionResult.result.caption as string;
        return {
          text: `\n[Image Analysis: ${caption}]`,
          analysis: caption
        };
      } else {
        console.warn(`⚠️ DialogueAgent - Vision analysis failed:`, visionResult.error);
        return { text: `\n[Image provided but analysis failed]` };
      }
    } catch (error) {
      console.error(`❌ DialogueAgent - Error processing image:`, error);
      return { text: `\n[Image processing error]` };
    }
  }

  /**
   * Process audio media (placeholder for future implementation)
   */
  private async processAudioMedia(audioData: string, audioType: string): Promise<{ text: string; analysis?: string }> {
    // TODO: Implement audio transcription
    return { text: `\n[Audio file provided - transcription not yet implemented]` };
  }

  /**
   * Process document media using DocumentExtractTool
   */
  private async processDocumentMedia(documentData: string, documentType: string): Promise<{ text: string; analysis?: string }> {
    try {
      // Handle base64 data URL
      let tempFilePath: string | null = null;
      
      if (documentData.startsWith('data:')) {
        tempFilePath = await this.createTempFileFromBase64(documentData, documentType);
      } else {
        tempFilePath = documentData;
      }
      
      if (!tempFilePath) {
        return { text: `\n[Document processing failed - could not create temp file]` };
      }
      
      const documentResult = await this.documentExtractTool.execute({
        payload: {
          documentUrl: tempFilePath,
          documentType: documentType
        }
      });
      
      if (documentResult.status === 'success' && documentResult.result?.extractedText) {
        const extractedText = documentResult.result.extractedText as string;
        return {
          text: `\n[Document Analysis: ${extractedText}]`,
          analysis: extractedText
        };
      } else {
        console.warn(`⚠️ DialogueAgent - Document extraction failed:`, documentResult.error);
        return { text: `\n[Document provided but extraction failed]` };
      }
    } catch (error) {
      console.error(`❌ DialogueAgent - Error processing document:`, error);
      return { text: `\n[Document processing error]` };
    }
  }

  /**
   * Create temporary file from base64 data URL
   */
  private async createTempFileFromBase64(dataUrl: string, mimeType: string): Promise<string | null> {
    try {
      const parts = dataUrl.split(',');
      if (parts.length !== 2) {
        throw new Error('Invalid data URL format');
      }
      
      const base64Data = parts[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      // Determine file extension from MIME type
      const extensionMap: Record<string, string> = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/msword': '.doc',
        'text/plain': '.txt'
      };
      
      const extension = extensionMap[mimeType] || '.pdf';
      const tempDir = os.tmpdir();
      const fileName = `temp_document_${Date.now()}${extension}`;
      const tempFilePath = path.join(tempDir, fileName);
      
      fs.writeFileSync(tempFilePath, buffer);
      return tempFilePath;
    } catch (error) {
      console.error(`❌ DialogueAgent - Error creating temp file:`, error);
      return null;
    }
  }

  /**
   * Converts any user input into a single text string.
   * Processes images using VisionCaptionTool and other media using appropriate tools.
   */
  private async processInput(text?: string, media?: Array<{
    type: string;
    url?: string;
    content?: string;
  }>): Promise<{ processedText: string; visionAnalysis?: string; documentAnalysis?: string }> {
    console.log(`🔍 DialogueAgent - processInput called with text: "${text}", media:`, media);
    let mediaText = '';
    let visionAnalysis: string | undefined;
    let documentAnalysis: string | undefined;
    
    if (media && media.length > 0) {
      console.log(`🔍 DialogueAgent - Processing ${media.length} media items`);
      
      for (const mediaItem of media) {
        try {
          const result = await this.processMediaByType(mediaItem);
          mediaText += result.text;
          
          // Store analysis results for record keeping
          if (result.analysis) {
            if (mediaItem.type.startsWith('image/')) {
              visionAnalysis = result.analysis;
            } else if (mediaItem.type.startsWith('application/')) {
              documentAnalysis = result.analysis;
            }
          }
        } catch (error) {
          console.error(`❌ DialogueAgent - Error processing media item:`, error);
          mediaText += `\n[Media processing error]`;
        }
      }
    }
    
    return {
      processedText: `${text || ''}${mediaText}`.trim(),
      visionAnalysis,
      documentAnalysis
    };
  }

  /**
   * Builds the prompt and executes the core LLM call with enhanced error handling.
   */
  private async performSingleSynthesisCall(
    input: { userId: string; conversationId: string; finalInputText: string },
    augmentedMemoryContext?: AugmentedMemoryContext,
    callType: 'first' | 'second' = 'first'
  ): Promise<{
    response_plan: {
      decision: string;
      key_phrases_for_retrieval?: string[];
    };
    turn_context_package: Record<string, unknown>;
    ui_actions: Array<{
      action: string;
      label: string;
      payload: Record<string, unknown>;
    }>;
    direct_response_text?: string; // New structure: at root level
  }> {
    
    // V11.0 STANDARD: Determine if this is a new conversation
    const conversationHistory = await this.conversationRepo.getMostRecentMessages(input.conversationId, 10);
    const isNewConversation = conversationHistory.length === 0;
    
    console.log(`[DialogueAgent] V11.0 - ${callType.toUpperCase()} LLM call - Conversation analysis: isNewConversation=${isNewConversation}, historyLength=${conversationHistory.length}, hasAugmentedMemory=${!!augmentedMemoryContext}`);
    
    // Debug: Log the raw conversation history to understand the issue
    if (conversationHistory.length > 0) {
      console.log(`[DialogueAgent] Raw conversation history from DB (${conversationHistory.length} messages):`);
      conversationHistory.forEach((msg, index) => {
        console.log(`  [${index}] Role: ${msg.type}, Content: ${msg.content.substring(0, 50)}..., Timestamp: ${msg.created_at}`);
      });
    }

    const promptBuildInput: PromptBuildInput = {
      userId: input.userId,
      conversationId: input.conversationId,
      finalInputText: input.finalInputText,
      augmentedMemoryContext,
      isNewConversation, // V11.0: Pass flag to PromptBuilder
      viewContext: (input as any).viewContext // V11.0: Pass view context to PromptBuilder
    };

    const promptOutput = await this.promptBuilder.buildPrompt(promptBuildInput);

    // V11.0 STANDARD: Handle next_conversation_context_package cleanup here (not in PromptBuilder)
    if (isNewConversation) {
      // TODO: Inject UserRepository to handle next_conversation_context_package cleanup
      // For now, we skip this cleanup - it should be handled by IngestionAnalyst after conversation processing
      console.log(`[DialogueAgent] V11.0 - New conversation detected, context package cleanup should be handled by IngestionAnalyst`);
    }

    // V11.0 STANDARD: Prepare LLM input with separated prompts and proper history
    const formattedHistory = this.formatHistoryForLLM(promptOutput.conversationHistory);
    
    // Debug: Log the formatted history
    console.log(`[DialogueAgent] Formatted history for LLM (${formattedHistory.length} messages):`);
    formattedHistory.forEach((msg, index) => {
      console.log(`  [${index}] Role: ${msg.role}, Content: ${msg.content.substring(0, 50)}...`);
    });
    
    const llmToolInput = {
      payload: {
        userId: input.userId,
        sessionId: input.conversationId,
        workerType: 'dialogue-service',
        workerJobId: `dialogue-${Date.now()}`,
        conversationId: input.conversationId,
        messageId: `msg-${Date.now()}`,
        sourceEntityId: input.conversationId,
        systemPrompt: promptOutput.systemPrompt,        // ✅ Background context only
        userMessage: promptOutput.userPrompt,           // ✅ Current turn context  
        history: formattedHistory, // ✅ Properly formatted history
        memoryContextBlock: augmentedMemoryContext?.relevant_memories?.join('\n') || '',
        temperature: 0.3, // ✅ Lower for consistent formatting
        maxTokens: 50000,
        enforceJsonMode: true // ✅ Enable JSON mode for DialogueAgent
      },
      request_id: `dialogue-${Date.now()}-${callType}`
    };

    console.log(`[DialogueAgent] V11.0 - ${callType.toUpperCase()} LLM call - LLM input prepared:`, {
      systemPromptLength: llmToolInput.payload.systemPrompt.length,
      userMessageLength: llmToolInput.payload.userMessage.length,
      historyCount: llmToolInput.payload.history.length,
      hasMemoryContext: !!llmToolInput.payload.memoryContextBlock,
      memoryContextLength: llmToolInput.payload.memoryContextBlock?.length || 0
    });

    // Enhanced LLM call with retry logic
    const llmResult = await LLMRetryHandler.executeWithRetry(
      this.llmChatTool,
      llmToolInput,
      { 
        maxAttempts: 3, 
        baseDelay: 1000,
        callType: callType
      }
    );

    // Use Gemini's native JSON parsing (pass grounding flag for plain text handling)
    return this.parseLLMResponse(llmResult, (input as any).enableGrounding);
  }

  /**
   * Streaming version of performSingleSynthesisCall for real-time response delivery.
   */
  private async performSingleSynthesisCallStreaming(
    input: { 
      userId: string; 
      conversationId: string; 
      finalInputText: string; 
      viewContext?: { 
        currentView: 'chat' | 'cards' | 'cosmos' | 'dashboard'; 
        viewDescription?: string 
      };
      engagementContext?: EngagementContext;
      enableGrounding?: boolean;
    },
    augmentedMemoryContext?: AugmentedMemoryContext,
    callType: 'first' | 'second' = 'first',
    onChunk?: (chunk: string) => void
  ): Promise<{
    response_plan: {
      decision: string;
      key_phrases_for_retrieval?: string[];
    };
    turn_context_package: Record<string, unknown>;
    ui_actions: Array<{
      action: string;
      label: string;
      payload: Record<string, unknown>;
    }>;
    direct_response_text?: string; // New structure: at root level
  }> {
    
    // V11.0 STANDARD: Determine if this is a new conversation
    const conversationHistory = await this.conversationRepo.getMostRecentMessages(input.conversationId, 10);
    const isNewConversation = conversationHistory.length === 0;
    
    console.log(`[DialogueAgent] V11.0 - ${callType.toUpperCase()} STREAMING LLM call - Conversation analysis: isNewConversation=${isNewConversation}, historyLength=${conversationHistory.length}, hasAugmentedMemory=${!!augmentedMemoryContext}`);

    const promptBuildInput: PromptBuildInput = {
      userId: input.userId,
      conversationId: input.conversationId,
      finalInputText: input.finalInputText,
      augmentedMemoryContext,
      isNewConversation,
      viewContext: (input as any).viewContext, // V11.0: Pass view context to PromptBuilder
      engagementContext: input.engagementContext // V11.0: Pass engagement context to PromptBuilder
    };

    console.log(`[DialogueAgent] V11.0 - ${callType.toUpperCase()} STREAMING LLM call - Engagement context:`, input.engagementContext ? {
      recentEventsCount: input.engagementContext.recentEvents?.length || 0,
      sessionDuration: input.engagementContext.sessionDuration,
      hasInteractionSummary: !!input.engagementContext.interactionSummary,
      hasEnrichedEntities: !!input.engagementContext.enrichedEntities
    } : 'none');

    // Validate engagement context to prevent processing errors
    if (input.engagementContext) {
      try {
        if (!Array.isArray(input.engagementContext.recentEvents)) {
          console.warn('[DialogueAgent] Invalid engagement context: recentEvents is not an array');
          input.engagementContext = undefined;
        }
      } catch (error) {
        console.warn('[DialogueAgent] Error validating engagement context:', error);
        input.engagementContext = undefined;
      }
    }

    const promptOutput = await this.promptBuilder.buildPrompt(promptBuildInput);

    // V11.0 STANDARD: Handle next_conversation_context_package cleanup here (not in PromptBuilder)
    if (isNewConversation) {
      console.log(`[DialogueAgent] V11.0 - New conversation detected, context package cleanup should be handled by IngestionAnalyst`);
    }

    // V11.0 STANDARD: Prepare LLM input with separated prompts and proper history
    const formattedHistory = this.formatHistoryForLLM(promptOutput.conversationHistory);
    
    const llmToolInput = {
      payload: {
        userId: input.userId,
        sessionId: input.conversationId,
        workerType: 'dialogue-service',
        workerJobId: `dialogue-stream-${Date.now()}`,
        conversationId: input.conversationId,
        messageId: `msg-stream-${Date.now()}`,
        sourceEntityId: input.conversationId,
        systemPrompt: promptOutput.systemPrompt,
        userMessage: promptOutput.userPrompt,
        history: formattedHistory,
        memoryContextBlock: augmentedMemoryContext?.relevant_memories?.join('\n') || '',
        temperature: 0.3,
        maxTokens: 50000,
        enforceJsonMode: true,
        enableGrounding: !!input.enableGrounding,
        enableStreaming: true,
        onChunk: onChunk
      },
      request_id: `dialogue-stream-${Date.now()}-${callType}`
    };

    console.log(`[DialogueAgent] V11.0 - ${callType.toUpperCase()} STREAMING LLM call - LLM input prepared:`, {
      systemPromptLength: llmToolInput.payload.systemPrompt.length,
      userMessageLength: llmToolInput.payload.userMessage.length,
      historyCount: llmToolInput.payload.history.length,
      hasMemoryContext: !!llmToolInput.payload.memoryContextBlock,
      memoryContextLength: llmToolInput.payload.memoryContextBlock?.length || 0,
      streamingEnabled: !!llmToolInput.payload.enableStreaming
    });

    // Enhanced LLM call with retry logic and streaming
    const llmResult = await LLMRetryHandler.executeWithRetry(
      this.llmChatTool,
      llmToolInput,
      { 
        maxAttempts: 3, 
        baseDelay: 1000,
        callType: `${callType}-streaming`
      }
    );

    // Use Gemini's native JSON parsing (pass grounding flag for plain text handling)
    return this.parseLLMResponse(llmResult, input.enableGrounding);
  }

  /**
   * Robust LLM response parser with 2025 Gemini best practices.
   * Handles malformed JSON responses and provides intelligent fallbacks.
   */
  private parseLLMResponse(llmResult: any, enableGrounding?: boolean): any {
    const rawText = llmResult.result.text;
    console.log('DialogueAgent - Raw LLM response:', rawText.substring(0, 200) + '...');
    
    
    // GROUNDING MODE: Plain text response, wrap it in expected structure
    if (enableGrounding) {
      console.log('DialogueAgent - Grounding mode: wrapping plain text response');
      const parsed = {
        decision: 'respond_directly',
        response_plan: {
          response_type: 'direct_answer',
          confidence: 'high',
          reasoning: 'Grounding-enabled response with web search results'
        },
        direct_response_text: rawText,
        ui_action_hints: [],
        ui_actions: []
      };
      
      // Attach grounding metadata from tool (if provided by Gemini)
      try {
        if (llmResult && llmResult.metadata && llmResult.metadata.grounding_metadata) {
          (parsed as any).grounding_metadata = llmResult.metadata.grounding_metadata;
          console.log('DialogueAgent - Attached grounding metadata:', llmResult.metadata.grounding_metadata);
        }
      } catch (e) {
        console.warn('DialogueAgent - Failed to attach grounding metadata:', e);
      }
      
      return parsed;
    }
    
    // JSON MODE: Parse structured JSON response with robust error handling
    try {
      // Enhanced JSON extraction with multiple cleaning strategies
      let cleaned = this.cleanJsonResponse(rawText);
      
      // Try multiple parsing strategies
      let parsed = this.tryParseJson(cleaned);
      
      // If parsing failed, try fallback strategies
      if (!parsed) {
        console.warn('DialogueAgent - Primary JSON parsing failed, trying fallback strategies...');
        parsed = this.tryFallbackParsing(rawText);
      }
      
      if (!parsed) {
        throw new Error("All JSON parsing strategies failed");
      }
      
      // Map ui_action_hints to ui_actions with two-button pattern for frontend compatibility
      if (parsed.ui_action_hints && Array.isArray(parsed.ui_action_hints)) {
        parsed.ui_actions = parsed.ui_action_hints.map((hint: any) => {
          // Use hint.payload directly if it exists (V11.0 structure from LLM)
          // This preserves all fields like parameters, target, scenarios, metadata
          const payload = hint.payload || {
            // Fallback for old structure (backward compatibility)
            target: hint.target,
            scenarios: hint.scenarios || {
              on_confirm: {
                transition_message: hint.proactiveGreeting || 'Let\'s go!',
                main_content: hint.proactiveGreeting || ''
              },
              on_dismiss: {
                content: 'No problem!'
              }
            },
            priority: hint.priority || 'medium'
          };
          
          return {
            action: hint.action,
            question: hint.question || '',
            buttons: hint.buttons || [
              {label: 'Yes', value: 'confirm'},
              {label: 'Maybe later', value: 'dismiss'}
            ],
            payload
          };
        });
        
        // Log view switch suggestions for monitoring
        const viewSwitchHints = parsed.ui_action_hints.filter((h: any) => h.action === 'switch_view');
        if (viewSwitchHints.length > 0) {
          console.log('🔀 DialogueAgent - View switch suggestion generated:', viewSwitchHints);
        }
      } else if (!parsed.ui_actions) {
        // Ensure ui_actions array always exists for frontend
        parsed.ui_actions = [];
      }
      
      // Attach grounding metadata from tool (if provided by Gemini)
      try {
        if (llmResult && llmResult.metadata && llmResult.metadata.grounding_metadata) {
          (parsed as any).grounding_metadata = llmResult.metadata.grounding_metadata;
        }
      } catch (e) {
        console.warn('DialogueAgent - Failed to attach grounding metadata:', e);
      }
      return parsed;
      
    } catch (e) {
      console.error('DialogueAgent - JSON parsing error:', e);
      console.error('DialogueAgent - Raw LLM response:', llmResult.result.text);
      throw new Error("LLM returned malformed JSON.");
    }
  }

  /**
   * Clean JSON response using multiple strategies based on 2025 Gemini best practices
   */
  private cleanJsonResponse(rawText: string): string {
    let cleaned = rawText;
    
    // Strategy 1: Remove markdown code fences
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Strategy 2: Remove common Gemini artifacts
    cleaned = cleaned.replace(/Here is the JSON requested:\s*/gi, '');
    cleaned = cleaned.replace(/Here's the JSON:\s*/gi, '');
    cleaned = cleaned.replace(/Here is the response:\s*/gi, '');
    
    
    // Strategy 4: Handle responses that start with field names instead of JSON
    if (cleaned.trim().startsWith('thought_process') && !cleaned.trim().startsWith('{')) {
      // Wrap in JSON structure if it starts with a field name
      cleaned = `{\n${cleaned}\n}`;
    }
    
    // Strategy 5: Remove trailing content after JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      // Extract only the JSON portion
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }

  /**
   * Try to parse JSON with multiple strategies
   */
  private tryParseJson(jsonText: string): any | null {
    try {
      // Strategy 1: Direct parsing
      return JSON.parse(jsonText);
    } catch (e) {
      console.log('DialogueAgent - Direct JSON parsing failed:', e instanceof Error ? e.message : String(e));
    }
    
    try {
      // Strategy 2: Fix common JSON issues
      let fixed = jsonText;
      
      // Fix unescaped quotes in strings
      fixed = fixed.replace(/"([^"]*)"([^"]*)"([^"]*)":/g, '"$1\\"$2\\"$3":');
      
      // Fix missing quotes around field names
      fixed = fixed.replace(/(\w+):/g, '"$1":');
      
      // Fix trailing commas
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      return JSON.parse(fixed);
    } catch (e) {
      console.log('DialogueAgent - Fixed JSON parsing failed:', e instanceof Error ? e.message : String(e));
    }
    
    return null;
  }

  /**
   * Fallback parsing strategies for severely malformed responses
   */
  private tryFallbackParsing(rawText: string): any | null {
    try {
      // If it's just plain text, wrap it properly
      if (!rawText.includes('{') && !rawText.includes('}')) {
        console.log('DialogueAgent - Treating as plain text response');
        return {
          thought_process: "Plain text response detected",
          response_plan: {
            decision: "respond_directly",
            key_phrases_for_retrieval: null
          },
          turn_context_package: {
            suggested_next_focus: "Continue conversation",
            emotional_tone_to_adopt: "Supportive",
            flags_for_ingestion: ["plain_text_response"]
          },
          direct_response_text: rawText.trim(),
          ui_action_hints: [],
          ui_actions: []
        };
      }

      // For malformed JSON, this should rarely happen now since LLMChatTool
      // returns structured responses for query_memory decisions
      console.log('DialogueAgent - Malformed JSON detected, attempting basic extraction');
      
      // Try to extract the decision from the raw text
      const decisionMatch = rawText.match(/"decision"\s*:\s*"([^"]*)"/);
      if (decisionMatch) {
        const extractedDecision = decisionMatch[1];
        console.log(`DialogueAgent - Extracted decision from malformed JSON: ${extractedDecision}`);
        
        // If it's query_memory, this shouldn't happen with our fix, but handle gracefully
        if (extractedDecision === "query_memory") {
          console.warn('DialogueAgent - Unexpected: query_memory decision in malformed JSON (should be handled by LLMChatTool)');
          return null; // Let the system handle it as query_memory
        }
        
        // For respond_directly, provide minimal fallback
        return {
          thought_process: "Malformed JSON response detected",
          response_plan: {
            decision: extractedDecision,
            key_phrases_for_retrieval: null
          },
          turn_context_package: {
            suggested_next_focus: "Continue conversation",
            emotional_tone_to_adopt: "Supportive",
            flags_for_ingestion: ["malformed_json_fallback"]
          },
          direct_response_text: "I apologize, but I encountered an issue processing your request. Could you please try rephrasing your question?",
          ui_action_hints: [],
          ui_actions: []
        };
      }
      
    } catch (e) {
      console.error('DialogueAgent - Fallback parsing failed:', e);
    }
    
    return null;
  }


  /**
   * V11.0: Format conversation history for LLM consumption
   * Ensures proper chronological order and validates message roles
   */
  private formatHistoryForLLM(messages: Array<{
    type: string;
    content: string;
    created_at?: Date;
  }>): Array<{role: "assistant" | "user"; content: string; timestamp?: string}> {
    if (!messages || messages.length === 0) {
      return [];
    }

    // The database returns messages in descending order (most recent first)
    // We want chronological order (oldest first) for the LLM
    // So we reverse the array to get proper chronological order
    const chronologicalMessages = [...messages].reverse();
    
    // Validate that the first message is from user
    if (chronologicalMessages.length > 0 && chronologicalMessages[0].type !== 'user') {
      console.warn(`DialogueAgent: First message in chronological order has type '${chronologicalMessages[0].type}', expected 'user'. This may cause LLM issues.`);
      
      // If the first message is not from user, try to find the first user message
      const firstUserMessageIndex = chronologicalMessages.findIndex(msg => msg.type === 'user');
      if (firstUserMessageIndex !== -1) {
        // Start from the first user message
        const validMessages = chronologicalMessages.slice(firstUserMessageIndex);
        console.log(`DialogueAgent: Starting conversation history from first user message at index ${firstUserMessageIndex}`);
        return validMessages.map(msg => ({
          role: msg.type as "assistant" | "user",
          content: msg.content,
          timestamp: msg.created_at?.toISOString()
        }));
      } else {
        // No user messages found, this is a problem
        console.error('DialogueAgent: No user messages found in conversation history');
        throw new Error('Invalid conversation history: No user messages found');
      }
    }
    
    // Normal case: first message is from user
    return chronologicalMessages.map(msg => ({
      role: msg.type as "assistant" | "user",
      content: msg.content,
      timestamp: msg.created_at?.toISOString()
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

  /**
   * Load user-specific HRT parameters from Redis
   */
  private async loadUserHRTParameters(userId: string): Promise<any> {
    try {
      const key = `hrt_parameters:${userId}`;
      const storedParams = await this.redis.get(key);

      if (!storedParams) {
        // Return default parameters if none found
        return this.getDefaultHRTParameters();
      }

      const parameters = JSON.parse(storedParams);
      
      // Validate the loaded parameters
      this.validateHRTParameters(parameters);
      
      return parameters;
    } catch (error) {
      console.error('Failed to load HRT parameters for user:', userId, error);
      // Return default parameters on error
      return this.getDefaultHRTParameters();
    }
  }

  /**
   * Get default HRT parameters
   */
  private getDefaultHRTParameters(): any {
    return {
      weaviate: {
        resultsPerPhrase: 3,
        similarityThreshold: 0.1,
        timeoutMs: 5000,
      },
      neo4j: {
        maxResultLimit: 100,
        maxGraphHops: 3,
        maxSeedEntities: 10,
        queryTimeoutMs: 10000,
      },
      scoring: {
        topNCandidatesForHydration: 10,
        recencyDecayRate: 0.1,
        diversityThreshold: 0.3,
      },
      scoringWeights: {
        alphaSemanticSimilarity: 0.5,
        betaRecency: 0.3,
        gammaImportanceScore: 0.2,
      },
      performance: {
        maxRetrievalTimeMs: 5000,
        enableParallelProcessing: true,
        cacheResults: true,
      },
      qualityFilters: {
        minimumRelevanceScore: 0.1,
        dedupeSimilarResults: true,
        boostRecentContent: true,
      },
    };
  }

  /**
   * Validate HRT parameters
   */
  private validateHRTParameters(parameters: any): void {
    // Basic validation - ensure required fields exist
    if (!parameters.weaviate || !parameters.neo4j || !parameters.scoring || !parameters.scoringWeights) {
      throw new Error('Invalid HRT parameters: missing required sections');
    }

    // Validate scoring weights sum to 1.0
    const { alphaSemanticSimilarity, betaRecency, gammaImportanceScore } = parameters.scoringWeights;
    const total = alphaSemanticSimilarity + betaRecency + gammaImportanceScore;
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Invalid scoring weights: must sum to 1.0 (current: ${total.toFixed(3)})`);
    }
  }

} 