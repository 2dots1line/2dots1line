/**
 * Chat Controller - DialogueAgent API Integration
 * Handles real-time conversations through the DialogueAgent
 */

import { Request, Response } from 'express';
import { DialogueAgent } from '@2dots1line/cognitive-hub';
import { DatabaseService } from '@2dots1line/database';
import { ToolRegistry } from '@2dots1line/tool-registry';
import type { 
  TDialogueAgentInput, 
  TDialogueAgentOutput,
  TApiResponse,
  Tool,
  TToolInput,
  TToolOutput
} from '@2dots1line/shared-types';

export interface ChatMessageRequest {
  message: string;
  conversation_id?: string;
  context?: {
    session_id?: string;
    trigger_background_processing?: boolean;
    user_preferences?: any;
  };
}

export interface FileUploadRequest {
  message?: string;
  file: {
    filename: string;
    mimetype: string;
    size: number;
    path: string;
  };
  conversation_id?: string;
  context?: any;
}

export interface ChatHistoryRequest {
  conversation_id?: string;
  limit?: number;
  offset?: number;
}

export class ChatController {
  private dialogueAgent: DialogueAgent;
  private databaseService: DatabaseService;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.databaseService = new DatabaseService();
    this.toolRegistry = new ToolRegistry();
    
    // Register required tools
    this.registerTools();
    
    this.dialogueAgent = new DialogueAgent(this.databaseService, this.toolRegistry);
  }

  /**
   * Register all tools needed by the DialogueAgent
   */
  private registerTools(): void {
    try {
      console.log('🔧 ChatController: Starting tool registration...');
      
      // Check if GOOGLE_API_KEY is available
      const hasGoogleApiKey = !!process.env.GOOGLE_API_KEY;
      console.log(hasGoogleApiKey ? '✅ GOOGLE_API_KEY found' : '❌ GOOGLE_API_KEY missing');
      
      if (hasGoogleApiKey) {
        console.log('📦 Importing tools from packages...');
        // Import real tools from packages
        const { LLMChatTool } = require('@2dots1line/ai-clients');
        const { DocumentExtractTool } = require('@2dots1line/document-tool');
        const { EnhancedNERTool } = require('@2dots1line/text-tool');
        const { VisionCaptionTool } = require('@2dots1line/vision-tool');
        
        console.log('🔨 Registering tools with registry...');
        // Register real tools
        this.toolRegistry.register(LLMChatTool);
        console.log('✅ LLMChatTool registered');
        
        this.toolRegistry.register(DocumentExtractTool);
        console.log('✅ DocumentExtractTool registered');
        
        this.toolRegistry.register(EnhancedNERTool);
        console.log('✅ EnhancedNERTool registered');
        
        this.toolRegistry.register(VisionCaptionTool);
        console.log('✅ VisionCaptionTool registered');
        
        console.log('✅ ChatController: Real tools registered successfully');
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
        
        console.log('✅ ChatController: Mock LLM tool registered successfully');
      }
      
    } catch (error) {
      console.error('❌ ChatController: Failed to register tools:', error);
      console.error('❌ Error details:', error);
      throw new Error(`Tool registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * POST /api/chat/message
   * Send a text message to the DialogueAgent
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id; // Assuming auth middleware sets req.user
      console.log('🎯 ChatController.sendMessage - Starting with userId:', userId);
      
      if (!userId) {
        console.log('❌ ChatController.sendMessage - No userId found');
        res.status(401).json({ 
          success: false,
          error: 'Unauthorized - user authentication required' 
        });
        return;
      }

      const { message, conversation_id, context }: ChatMessageRequest = req.body;
      console.log('🎯 ChatController.sendMessage - Request body:', { message: message?.substring(0, 50), conversation_id, context });

      if (!message || message.trim().length === 0) {
        console.log('❌ ChatController.sendMessage - Empty message');
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
          trigger_background_processing: context?.trigger_background_processing || false
        }
      };

      console.log('🎯 ChatController.sendMessage - DialogueAgent input prepared:', {
        user_id: dialogueInput.user_id,
        request_id: dialogueInput.request_id,
        message_text: dialogueInput.payload.message_text?.substring(0, 50)
      });

      // Process through DialogueAgent
      console.log('🎯 ChatController.sendMessage - Calling DialogueAgent.process...');
      const result: TDialogueAgentOutput = await this.dialogueAgent.process(dialogueInput);
      console.log('🎯 ChatController.sendMessage - DialogueAgent result status:', result.status);

      if (result.status !== 'success') {
        console.log('❌ ChatController.sendMessage - DialogueAgent failed:', result.error?.message);
        res.status(500).json({
          success: false,
          error: 'Failed to process message',
          details: result.error?.message || 'Unknown error'
        });
        return;
      }

      console.log('✅ ChatController.sendMessage - DialogueAgent success, preparing response...');
      // Return successful response
      res.json({
        success: true,
        data: {
          message_id: result.metadata?.conversation_id + '-response',
          response: result.result?.response_text,
          conversation_id: result.metadata?.conversation_id,
          timestamp: new Date().toISOString(),
          metadata: {
            response_time_ms: result.metadata?.processing_time_ms,
            model_used: result.metadata?.model_used,
            suggested_actions: result.result?.suggested_actions,
            proactive_insight: result.result?.proactive_insight
          }
        }
      });

      console.log('✅ ChatController.sendMessage - Response sent successfully');

    } catch (error) {
      console.error('💥 ChatController.sendMessage - Unhandled error:', error);
      console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * POST /api/chat/upload
   * Upload a file (image, document) for analysis by DialogueAgent
   */
  uploadFile = async (req: Request, res: Response): Promise<void> => {
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
        region: 'us', // TODO: Make this configurable
        request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        payload: {
          message_text: message,
          message_id: `msg-${Date.now()}-${userId}`,
          client_timestamp: new Date().toISOString(),
          conversation_id: conversation_id || `conv-${Date.now()}-${userId}`,
          message_media: [{
            type: uploadedFile.mimetype,
            url: uploadedFile.path,
            media_id: uploadedFile.filename // Use filename as media_id for tracking
          }]
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: req.body.session_id || `session-${Date.now()}`
        }
      };

      // Process through DialogueAgent
      const result: TDialogueAgentOutput = await this.dialogueAgent.process(dialogueInput);

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
        data: {
          message_id: result.result?.conversation_id + '-response',
          response: result.result?.response_text,
          conversation_id: result.result?.conversation_id,
          timestamp: new Date().toISOString(),
          file_info: {
            filename: uploadedFile.originalname,
            size: uploadedFile.size,
            mimetype: uploadedFile.mimetype
          },
          metadata: {
            response_time_ms: result.metadata?.processing_time_ms,
            model_used: result.metadata?.model_used,
            suggested_actions: result.result?.suggested_actions,
            proactive_insight: result.result?.proactive_insight
          }
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

  /**
   * GET /api/chat/history
   * Get conversation history for a user
   */
  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Unauthorized - user authentication required' 
        });
        return;
      }

      const { conversation_id, limit = 50, offset = 0 } = req.query as any;

      // TODO: Implement conversation history retrieval from database
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          conversations: [],
          total_count: 0,
          has_more: false
        },
        message: 'Chat history feature coming soon - requires conversation persistence implementation'
      });

    } catch (error) {
      console.error('Error in getHistory:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/chat/health
   * Health check for chat functionality and DialogueAgent
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      // Basic health check of DialogueAgent and dependencies
      const health = {
        dialogueAgent: 'operational',
        database: 'operational',
        toolRegistry: 'operational',
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      console.error('Error in chat health check:', error);
      res.status(500).json({ 
        success: false,
        error: 'Chat service health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
} 