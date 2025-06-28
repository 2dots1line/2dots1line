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
    
    this.databaseService = new DatabaseService();
    this.toolRegistry = new ToolRegistry();
    this.configService = new ConfigService();
    
    // Initialize Redis with robust error handling
    const redisConfig = {
      host: process.env.NODE_ENV === 'production' ? 
        (process.env.REDIS_HOST || 'redis') : 
        'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 1000,
      commandTimeout: 1000
    };
    
    this.redis = new Redis(redisConfig);
    
    // Handle Redis connection errors gracefully and create mock implementation
    this.redis.on('error', (error) => {
      console.warn('⚠️ Redis connection failed, switching to mock implementation');
      // Prevent further connection attempts
      this.redis.disconnect();
      this.createMockRedis();
    });
    
    // Test connection immediately
    this.testRedisConnection();
    
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
   * Test Redis connection and fallback to mock if needed
   */
  private async testRedisConnection(): Promise<void> {
    try {
      await this.redis.ping();
      console.log('✅ Redis connection successful');
    } catch (error) {
      console.warn('⚠️ Redis connection test failed, using mock implementation');
      this.createMockRedis();
    }
  }

  /**
   * Create a mock Redis implementation when real Redis is unavailable
   */
  private createMockRedis(): void {
    const mockStore = new Map<string, string>();
    
    // Override Redis methods with mock implementations
    this.redis.set = async (key: string, value: string, ...args: any[]) => {
      mockStore.set(key, value);
      return 'OK';
    };
    
    this.redis.get = async (key: string) => {
      return mockStore.get(key) || null;
    };
    
    this.redis.del = async (...keys: string[]) => {
      let count = 0;
      for (const key of keys) {
        if (mockStore.delete(key)) count++;
      }
      return count;
    };
    
    this.redis.ping = async () => 'PONG';
    
    console.log('✅ Redis mock implementation created');
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
        console.log('📦 Using real tools from @2dots1line/tools package');
        
        // Register real tools that are actually available
        this.toolRegistry.registerSimpleTool(LLMChatTool, {
          availableRegions: ['us', 'cn'],
          categories: ['llm', 'chat'],
          capabilities: ['text-generation', 'conversation'],
          performance: { avgLatencyMs: 1000, isAsync: true, isIdempotent: false }
        });
        console.log('✅ LLMChatTool registered');
        
        this.toolRegistry.registerSimpleTool(VisionCaptionTool, {
          availableRegions: ['us', 'cn'],
          categories: ['vision', 'ai'],
          capabilities: ['image-analysis', 'captioning'],
          performance: { avgLatencyMs: 2000, isAsync: true, isIdempotent: true }
        });
        console.log('✅ VisionCaptionTool registered');
        
        this.toolRegistry.registerSimpleTool(DocumentExtractTool, {
          availableRegions: ['us', 'cn'],
          categories: ['data', 'extraction'],
          capabilities: ['document-processing', 'text-extraction'],
          performance: { avgLatencyMs: 1500, isAsync: true, isIdempotent: true }
        });
        console.log('✅ DocumentExtractTool registered');
        
        console.log('✅ ConversationController: Real tools registered successfully');
      } else {
        console.log('⚠️ Using mock tool due to missing GOOGLE_API_KEY');
        // Fallback to mock tool if no API key
        const mockLLMChatTool: Tool<any, any> = {
          name: 'llm.chat',
          description: 'Mock LLM chat tool (GOOGLE_API_KEY missing)',
          version: '1.0.0',
          execute: async (input: TToolInput<any>): Promise<TToolOutput<any>> => {
            return {
              status: 'success',
              result: {
                text: "Hello! I'm Dot, your AI companion. I'm here to support your personal growth and development. Please set GOOGLE_API_KEY to enable full AI functionality.",
                usage: {
                  input_tokens: 50,
                  output_tokens: 30,
                  total_tokens: 80
                },
                model_used: 'mock-model',
                finish_reason: 'stop'
              },
              metadata: {
                processing_time_ms: 100,
                model_used: 'mock-model'
              }
            };
          }
        };

        this.toolRegistry.registerSimpleTool(mockLLMChatTool, {
          availableRegions: ['us', 'cn'],
          categories: ['llm', 'chat'],
          capabilities: ['text-generation', 'conversation'],
          performance: { avgLatencyMs: 100, isAsync: true, isIdempotent: false }
        });
        
        console.log('✅ ConversationController: Mock LLM tool registered successfully');
      }
      
    } catch (error) {
      console.error('❌ ConversationController: Failed to register tools:', error);
      console.error('❌ Error details:', error);
      // Don't throw - allow the controller to continue with limited functionality
      console.log('⚠️ Continuing with limited tool functionality...');
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

      // Prepare DialogueAgent input
      const dialogueInput: TDialogueAgentInput = {
        user_id: userId,
        region: 'us', // TODO: Make this configurable based on user region
        request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        payload: {
          message_text: message.trim(),
          message_id: `msg-${Date.now()}-${userId}`,
          client_timestamp: new Date().toISOString(),
          conversation_id: conversation_id || `conv-${Date.now()}-${userId}`,
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
        conversation_id: result.result?.conversation_id || conversation_id,
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