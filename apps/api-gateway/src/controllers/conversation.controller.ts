/**
 * Conversation Controller - DialogueAgent API Integration
 * V9.7 - Direct integration with DialogueAgent (not forwarding to external service)
 */

import { Request, Response } from 'express';
import { DialogueAgent, type DialogueAgentDependencies, PromptBuilder } from '@2dots1line/dialogue-service';
import { DatabaseService, ConversationRepository, UserRepository } from '@2dots1line/database';
import { ToolRegistry } from '@2dots1line/tool-registry';
import { ConfigService } from '@2dots1line/config-service';
import { 
  LLMChatTool,
  VisionCaptionTool,
  AudioTranscribeTool,
  DocumentExtractTool,
  HybridRetrievalTool
} from '@2dots1line/tools';
import { Redis } from 'ioredis';
import type { 
  TDialogueAgentInput, 
  TDialogueAgentOutput,
  TApiResponse,
  Tool,
  TToolInput,
  TToolOutput
} from '@2dots1line/shared-types';

export interface ConversationMessageRequest {
  message: string;
  conversation_id?: string;
  source_card_id?: string;
  context?: {
    session_id?: string;
    trigger_background_processing?: boolean;
    user_preferences?: any;
  };
}

export class ConversationController {
  private dialogueAgent: DialogueAgent;
  private databaseService: DatabaseService;
  private toolRegistry: ToolRegistry;
  private configService: ConfigService;
  private redis: Redis;

  constructor() {
    console.log('🔧 ConversationController: Initializing...');
    
    this.databaseService = DatabaseService.getInstance();
    this.toolRegistry = new ToolRegistry();
    this.configService = new ConfigService();
    
    // Use the Redis client from DatabaseService instead of creating a separate one
    this.redis = this.databaseService.redis;
    console.log('🔧 ConversationController: Using Redis client from DatabaseService');
    
    // Register required tools with error handling
    this.registerTools();
    
    // Create DialogueAgent with proper dependency injection
    const conversationRepository = new ConversationRepository(this.databaseService);
    const userRepository = new UserRepository(this.databaseService);
    
    const dependencies: DialogueAgentDependencies = {
      configService: this.configService,
      conversationRepository: conversationRepository,
      redisClient: this.redis,
      promptBuilder: new PromptBuilder(this.configService, userRepository, conversationRepository, this.redis),
      llmChatTool: LLMChatTool,
      visionCaptionTool: VisionCaptionTool,
      audioTranscribeTool: AudioTranscribeTool,
      documentExtractTool: DocumentExtractTool,
      hybridRetrievalTool: new HybridRetrievalTool(this.databaseService, this.configService)
    };
    
    this.dialogueAgent = new DialogueAgent(dependencies);
    console.log('✅ ConversationController: Initialized successfully');
  }

  /**
   * Register all tools needed by the DialogueAgent
   */
  private registerTools(): void {
    try {
      console.log('🔧 ConversationController: Starting tool registration...');
      
      // Check if GOOGLE_API_KEY is available
      const hasGoogleApiKey = !!process.env.GOOGLE_API_KEY;
      console.log(hasGoogleApiKey ? '✅ GOOGLE_API_KEY found' : '❌ GOOGLE_API_KEY missing');
      
      if (hasGoogleApiKey) {
        console.log('📦 Tools are available from @2dots1line/tools package');
        console.log('✅ ConversationController: Tools will be used directly by DialogueAgent');
      } else {
        console.log('⚠️ GOOGLE_API_KEY missing - DialogueAgent will handle gracefully');
      }
      
      console.log('✅ ConversationController: Tool setup completed');
      
    } catch (error) {
      console.error('❌ ConversationController: Error in tool setup:', error);
      console.error('❌ Error details:', error);
      // Don't throw - allow the controller to continue
      console.log('⚠️ Continuing with DialogueAgent handling tools directly...');
    }
  }

  /**
   * POST /api/v1/conversations/messages
   * Send a message to the DialogueAgent
   */
  public postMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      console.log('🎯 ConversationController.postMessage - Starting with userId:', userId);
      
      if (!userId) {
        console.log('❌ ConversationController.postMessage - No userId found');
        res.status(401).json({ 
          success: false,
          error: 'Unauthorized - user authentication required' 
        });
        return;
      }

      const { message, conversation_id, source_card_id, context }: ConversationMessageRequest = req.body;
      console.log('🎯 ConversationController.postMessage - Request body:', { 
        message: message?.substring(0, 50), 
        conversation_id, 
        source_card_id,
        context 
      });

      if (!message || message.trim().length === 0) {
        console.log('❌ ConversationController.postMessage - Empty message');
        res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
        return;
      }

      const finalConversationId = conversation_id || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // ENSURE CONVERSATION EXISTS: Create conversation record if it doesn't exist
      console.log('🔍 ConversationController - Ensuring conversation exists...');
      const conversationRepository = new ConversationRepository(this.databaseService);
      
      let existingConversation = null;
      let actualConversationId = finalConversationId;
      
      // If we have a conversation_id, check if it exists
      if (conversation_id) {
        try {
          existingConversation = await conversationRepository.findById(conversation_id);
          if (existingConversation) {
            actualConversationId = conversation_id;
            console.log('✅ ConversationController - Using existing conversation:', actualConversationId);
          }
        } catch (error) {
          console.log('⚠️ ConversationController - Error checking existing conversation:', error);
        }
      }
      
      // If no existing conversation found, create a new one (let Prisma generate UUID)
      if (!existingConversation) {
        console.log('📝 ConversationController - Creating new conversation record...');
        try {
          const newConversation = await conversationRepository.create({
            user_id: userId,
            title: `Conversation ${new Date().toLocaleString()}`,
            source_card_id,
            metadata: {
              session_id: context?.session_id,
              created_from_api: true,
              client_timestamp: new Date().toISOString()
            }
          });
          actualConversationId = newConversation.id; // Use the UUID generated by Prisma
          console.log('✅ ConversationController - Conversation record created with ID:', actualConversationId);
        } catch (error) {
          console.error('❌ ConversationController - Failed to create conversation:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to create conversation record',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
          return;
        }
      }
      
      // RECORD USER MESSAGE: Now that conversation exists, record the user's message
      console.log('📝 ConversationController - Recording user message to database...');
      try {
        await conversationRepository.addMessage({
          conversation_id: actualConversationId, // Use the actual conversation ID from database
          role: 'user',
          content: message.trim(),
          llm_call_metadata: {
            source_card_id,
            session_id: context?.session_id,
            client_timestamp: new Date().toISOString()
          }
        });
        console.log('✅ ConversationController - User message recorded successfully');
      } catch (error) {
        console.error('❌ ConversationController - Failed to record user message:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to record user message',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
      }

      // Prepare DialogueAgent input
      const dialogueInput: TDialogueAgentInput = {
        user_id: userId,
        region: 'us', // TODO: Make this configurable based on user region
        request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        payload: {
          message_text: message.trim(),
          message_id: `msg-${Date.now()}-${userId}`,
          client_timestamp: new Date().toISOString(),
          conversation_id: actualConversationId, // Use the actual conversation ID
          user_preferences: context?.user_preferences
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: context?.session_id || `session-${Date.now()}`,
          trigger_background_processing: context?.trigger_background_processing || false,
          source_card_id: source_card_id // Move source_card_id to metadata
        }
      };

      console.log('🎯 ConversationController.postMessage - DialogueAgent input prepared:', {
        user_id: dialogueInput.user_id,
        request_id: dialogueInput.request_id,
        message_text: dialogueInput.payload.message_text?.substring(0, 50)
      });

      // Process through DialogueAgent
      console.log('🎯 ConversationController.postMessage - Calling DialogueAgent.processDialogue...');
      const result: TDialogueAgentOutput = await this.dialogueAgent.processDialogue(dialogueInput);
      console.log('🎯 ConversationController.postMessage - DialogueAgent result status:', result.status);

      if (result.status !== 'success') {
        console.log('❌ ConversationController.postMessage - DialogueAgent failed:', result.error?.message);
        res.status(500).json({
          success: false,
          error: 'Failed to process message',
          details: result.error?.message || 'Unknown error'
        });
        return;
      }

      console.log('✅ ConversationController.postMessage - DialogueAgent success, preparing response...');
      
      // Return successful response in the format expected by the frontend
      res.json({
        success: true,
        conversation_id: result.result?.conversation_id || actualConversationId,
        response_text: result.result?.response_text,
        message_id: `response-${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: {
          processing_time_ms: result.metadata?.processing_time_ms,
          source_card_id: source_card_id // Include in response metadata for frontend
        }
      });

      console.log('✅ ConversationController.postMessage - Response sent successfully');

    } catch (error) {
      console.error('💥 ConversationController.postMessage - Unhandled error:', error);
      console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * POST /api/v1/conversations/upload
   * Upload a file for analysis by DialogueAgent
   */
  public uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Unauthorized - user authentication required' 
        });
        return;
      }

      // Get file from multer
      const uploadedFile = req.file;
      if (!uploadedFile) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
        return;
      }

      // Get optional message and conversation_id from form data
      const message = req.body.message || `I've uploaded a file: ${uploadedFile.originalname}`;
      const conversation_id = req.body.conversation_id;

      // Prepare DialogueAgent input for file processing
      const dialogueInput: TDialogueAgentInput = {
        user_id: userId,
        region: 'us',
        request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        payload: {
          message_text: message,
          message_id: `msg-${Date.now()}-${userId}`,
          client_timestamp: new Date().toISOString(),
          conversation_id: conversation_id || `conv-${Date.now()}-${userId}`,
          message_media: [{
            type: uploadedFile.mimetype,
            url: uploadedFile.path,
            media_id: uploadedFile.filename
          }]
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: req.body.session_id || `session-${Date.now()}`
        }
      };

      // Process through DialogueAgent
      const result: TDialogueAgentOutput = await this.dialogueAgent.processDialogue(dialogueInput);

      if (result.status !== 'success') {
        res.status(500).json({
          success: false,
          error: 'Failed to process file upload',
          details: result.error?.message || 'Unknown error'
        });
        return;
      }

      // Return successful response
      res.json({
        success: true,
        conversation_id: result.result?.conversation_id,
        response_text: result.result?.response_text,
        message_id: `response-${Date.now()}`,
        timestamp: new Date().toISOString(),
        file_info: {
          filename: uploadedFile.originalname,
          size: uploadedFile.size,
          mimetype: uploadedFile.mimetype
        },
        metadata: {
          processing_time_ms: result.metadata?.processing_time_ms
        }
      });

    } catch (error) {
      console.error('Error in uploadFile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
} 