/**
 * Dialogue Agent (Dot/Orb)
 * User-facing conversational interface, drives Orb visuals
 * Implements core functionality from V7 specification
 */

import { BaseAgent } from '@2dots1line/agent-framework';
import { DatabaseService, ConversationRepository, MediaRepository, MemoryRepository } from '@2dots1line/database';
import { ToolRegistry } from '@2dots1line/tool-registry';
import { IngestionAnalyst } from '../ingestion/IngestionAnalyst';
import { OrbStateManager } from '../../services/orb-state.manager';
import fs from 'fs';
import path from 'path';
import { 
  TAgentInput, 
  TAgentOutput, 
  TDialogueAgentInputPayload,
  TDialogueAgentResult,
  TIngestionAnalystInputPayload,
  TIngestionContentItem,
  TToolInput,
  LLMChatInputPayload,
  VisionCaptionInputPayload,
  DocumentExtractInputPayload
} from '@2dots1line/shared-types';

export class DialogueAgent extends BaseAgent<
  TAgentInput<TDialogueAgentInputPayload>,
  TAgentOutput<TDialogueAgentResult>
> {
  private conversationRepo: ConversationRepository;
  private mediaRepo: MediaRepository;
  private memoryRepo: MemoryRepository;
  private ingestionAnalyst: IngestionAnalyst;
  private orbStateManager: OrbStateManager;
  private dotSystemPrompt: string = 'You are Dot, an AI companion focused on supporting personal growth and development.';
  
  constructor(databaseService: DatabaseService, toolRegistry: ToolRegistry) {
    super('DialogueAgent', toolRegistry, databaseService);
    
    // Initialize repositories using factory methods
    this.conversationRepo = databaseService.getConversationRepository();
    this.mediaRepo = databaseService.getMediaRepository();
    this.memoryRepo = databaseService.getMemoryRepository();
    
    // Initialize other agents and services
    this.ingestionAnalyst = new IngestionAnalyst(databaseService, toolRegistry);
    this.orbStateManager = new OrbStateManager();
    
    // Load system prompt
    this.loadSystemPrompt();
    
    this.log('DialogueAgent initialized with all dependencies');
  }

  private loadSystemPrompt(): void {
    try {
      const configPath = path.join(__dirname, '../../../config/dot_system_prompt.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.dotSystemPrompt = config.system_prompt || this.getDefaultSystemPrompt();
    } catch (error) {
      console.warn('Failed to load system prompt, using default:', error);
      this.dotSystemPrompt = this.getDefaultSystemPrompt();
    }
  }

  private getDefaultSystemPrompt(): string {
    return `You are Dot, a warm and empathetic AI companion focused on personal growth and self-discovery. 
You help users explore their thoughts, emotions, and experiences through the lens of the Six-Dimensional Growth Model:
- Self (Know/Act/Show): Inner awareness, personal action, authentic expression
- World (Know/Act/Show): Understanding others, contributing meaningfully, sharing your impact

Always respond with genuine curiosity, emotional intelligence, and growth-oriented insights.`;
  }

  async process(
    input: TAgentInput<TDialogueAgentInputPayload>,
    context?: any
  ): Promise<TAgentOutput<TDialogueAgentResult>> {
    try {
      const startTime = performance.now();
      
      // Get or create conversation using correct method signature
      const conversation = await this.conversationRepo.getOrCreateConversation(
        input.user_id,
        input.payload.conversation_id || undefined,
        'Chat with Dot'
      );

      let result: TDialogueAgentResult;

      // Route based on input type
      if (input.payload.message_media && input.payload.message_media.length > 0) {
        // Add missing name and size properties for media file
        const mediaFile = {
          type: input.payload.message_media[0].type,
          url: input.payload.message_media[0].url,
          name: input.payload.message_media[0].media_id || 'unknown',
          size: 0 // Default size
        };
        
        result = await this.handleFileUpload(
          mediaFile,
          input.user_id,
          conversation.id,
          input.payload.message_text || undefined
        );
      } 
      else if (input.payload.message_text) {
        result = await this.handleTextMessage(
          input.payload.message_text,
          input.user_id,
          conversation.id
        );
      } 
      else {
        throw new Error('No message text or media provided');
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      return {
        status: 'success',
        result,
        metadata: {
          conversation_id: conversation.id,
          processing_time_ms: Math.round(processingTime),
          orb_state: this.orbStateManager.getCurrentState()
        }
      };

    } catch (error) {
      this.orbStateManager.setError(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        status: 'error',
        error: {
          code: 'DIALOGUE_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Dialogue processing failed',
          details: { agent: this.name }
        },
        metadata: {
          processing_time_ms: 0,
          orb_state: this.orbStateManager.getCurrentState()
        }
      };
    }
  }

  /**
   * Handle text message processing
   */
  private async handleTextMessage(
    messageText: string,
    userId: string,
    conversationId: string
  ): Promise<TDialogueAgentResult> {
    
    // Save user message
    await this.conversationRepo.addMessage({
      conversation_id: conversationId,
      user_id: userId,
      sender_type: 'user',
      message_text: messageText
    });

    // Update Orb state to thinking
    this.orbStateManager.setThinking();

    // TODO: Call RetrievalPlanner for context (stub for now)
    const contextBundle = 'No additional context retrieved'; // Placeholder

    // Get recent conversation history - fix the parameter type
    const recentMessages = await this.conversationRepo.getMessages(conversationId, { limit: 10 });
    
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content || '',
      timestamp: msg.timestamp?.toISOString()
    }));

    // Call LLM for response using ToolRegistry - fix the AI namespace
    const llmInput: TToolInput<LLMChatInputPayload> = {
      user_id: userId,
      region: 'us',
      payload: {
        userMessage: messageText,
        history: conversationHistory.slice(0, -1), // Exclude current message
        systemPrompt: this.dotSystemPrompt,
        userId,
        sessionId: conversationId,
        memoryContextBlock: contextBundle
      }
    };

    const llmResponse = await this.toolRegistry.executeTool('llm.chat', llmInput);

    if (llmResponse.status !== 'success' || !llmResponse.result?.text) {
      throw new Error(`LLM processing failed: ${llmResponse.error?.message || 'No response text'}`);
    }

    const responseText = llmResponse.result.text;

    // Save assistant response
    await this.conversationRepo.addMessage({
      conversation_id: conversationId,
      user_id: userId,
      sender_type: 'assistant',
      message_text: responseText
    });

    // Update Orb state to speaking
    this.orbStateManager.setSpeaking();

    // Check if this conversation warrants memory creation
    const shouldCreateMemory = this.assessMemoryWorthiness(messageText, responseText);

    if (shouldCreateMemory) {
      // Trigger memory creation via IngestionAnalyst
      try {
        await this.ingestionAnalyst.process({
          user_id: userId,
          region: 'us',
          payload: {
            batch_id: `dialogue_${conversationId}_${Date.now()}`,
            content_items: [{
              item_id: `msg_${Date.now()}`,
              text_content: `${messageText}\n\n${responseText}`,
              source_type: 'conversation',
              creation_timestamp: new Date().toISOString()
            }],
            processing_tier: 1
          }
        });
      } catch (error) {
        console.warn('Memory creation failed:', error);
      }
    }

    return {
      response_text: responseText,
      conversation_id: conversationId
    };
  }

  /**
   * Handle file upload with optional accompanying message
   */
  private async handleFileUpload(
    mediaFile: { type: string; url: string; name: string; size: number },
    userId: string,
    conversationId: string,
    accompanyingMessage?: string
  ): Promise<TDialogueAgentResult> {

    // Update Orb state to processing file
    this.orbStateManager.setProcessingFile();

    // Record media in database
    const mediaRecord = await this.mediaRepo.createMedia({
      user_id: userId,
      type: mediaFile.type.startsWith('image/') ? 'image' : 'document',
      storage_url: mediaFile.url,
      original_name: mediaFile.name,
      mime_type: mediaFile.type,
      file_size_bytes: mediaFile.size
    });

    let extractedContent = '';
    let extractionError: string | undefined;

    try {
      // Route to appropriate tool based on file type
      if (mediaFile.type.startsWith('image/')) {
        // Use vision tool
        const visionInput: TToolInput<VisionCaptionInputPayload> = {
          user_id: userId,
          region: 'us',
          payload: {
            imageUrl: mediaFile.url,
            imageType: mediaFile.type
          }
        };

        const visionResult = await this.toolRegistry.executeTool('vision_caption', visionInput);
        
        if (visionResult.status === 'success') {
          extractedContent = visionResult.result?.caption || 'Image processed successfully';
        }
      } else {
        // Use document extraction tool
        const docInput: TToolInput<DocumentExtractInputPayload> = {
          user_id: userId,
          region: 'us',
          payload: {
            documentUrl: mediaFile.url,
            documentType: mediaFile.type
          }
        };

        const docResult = await this.toolRegistry.executeTool('document_extract', docInput);
        
        if (docResult.status === 'success') {
          extractedContent = docResult.result?.extractedText || 'Document processed successfully';
        }
      }
    } catch (error) {
      extractionError = error instanceof Error ? error.message : 'Content extraction failed';
    }

    // Create combined message text
    const fullMessageText = accompanyingMessage 
      ? `${accompanyingMessage}\n\n[File uploaded: ${mediaFile.name}]\nExtracted content: ${extractedContent}`
      : `[File uploaded: ${mediaFile.name}]\nExtracted content: ${extractedContent}`;

    // Save user message with file reference
    await this.conversationRepo.addMessage({
      conversation_id: conversationId,
      user_id: userId,
      sender_type: 'user',
      message_text: fullMessageText,
      media_attachments: [{ 
        media_id: mediaRecord.id, 
        type: mediaRecord.type,
        url: mediaRecord.storage_url
      }]
    });

    // Process through normal text flow for LLM response
    const textResult = await this.handleTextMessage(fullMessageText, userId, conversationId);

    // Trigger content ingestion for the uploaded file
    try {
      await this.ingestionAnalyst.process({
        user_id: userId,
        region: 'us',
        payload: {
          batch_id: `upload_${mediaRecord.id}_${Date.now()}`,
          content_items: [{
            item_id: mediaRecord.id,
            text_content: extractedContent,
            source_type: 'file_upload',
            creation_timestamp: new Date().toISOString(),
            media_content: [{ 
              media_type: mediaRecord.type, 
              url: mediaRecord.storage_url 
            }]
          }],
          processing_tier: 2
        }
      });
    } catch (error) {
      console.warn('File ingestion failed:', error);
    }

    return {
      ...textResult,
      response_media: [{
        type: mediaRecord.type,
        url: mediaRecord.storage_url
      }]
    };
  }

  /**
   * Assess whether a conversation is worth creating a memory unit for
   */
  private assessMemoryWorthiness(userMessage: string, assistantResponse: string): boolean {
    const combinedText = `${userMessage} ${assistantResponse}`;
    
    // Length-based criteria
    if (combinedText.length < 50) return false;
    
    // Content-based criteria (simple keyword matching for now)
    const memoryKeywords = [
      'remember', 'important', 'feeling', 'think', 'realize', 'understand',
      'goal', 'plan', 'dream', 'hope', 'worry', 'concern', 'excited',
      'grateful', 'proud', 'disappointed', 'learned', 'discovered'
    ];
    
    const hasMemoryKeywords = memoryKeywords.some(keyword => 
      combinedText.toLowerCase().includes(keyword)
    );
    
    return hasMemoryKeywords;
  }
} 