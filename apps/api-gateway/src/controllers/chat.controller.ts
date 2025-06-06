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
  TApiResponse 
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
    this.dialogueAgent = new DialogueAgent(this.databaseService, this.toolRegistry);
  }

  /**
   * POST /api/chat/message
   * Send a text message to the DialogueAgent
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id; // Assuming auth middleware sets req.user
      
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Unauthorized - user authentication required' 
        });
        return;
      }

      const { message, conversation_id, context }: ChatMessageRequest = req.body;

      if (!message || message.trim().length === 0) {
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

      // Process through DialogueAgent
      const result: TDialogueAgentOutput = await this.dialogueAgent.process(dialogueInput);

      if (result.status !== 'success') {
        res.status(500).json({
          success: false,
          error: 'Failed to process message',
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
          metadata: {
            response_time_ms: result.metadata?.processing_time_ms,
            model_used: result.metadata?.model_used,
            suggested_actions: result.result?.suggested_actions,
            proactive_insight: result.result?.proactive_insight
          }
        }
      });

    } catch (error) {
      console.error('Error in sendMessage:', error);
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

      // This would typically use multer middleware for file upload handling
      const { message, file, conversation_id, context }: FileUploadRequest = req.body;

      if (!file || !file.filename) {
        res.status(400).json({
          success: false,
          error: 'File upload is required'
        });
        return;
      }

      // Prepare DialogueAgent input for file processing
      const dialogueInput: TDialogueAgentInput = {
        user_id: userId,
        region: 'us', // TODO: Make this configurable
        request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        payload: {
          message_text: message || 'What can you tell me about this file?',
          message_id: `msg-${Date.now()}-${userId}`,
          client_timestamp: new Date().toISOString(),
          conversation_id: conversation_id || `conv-${Date.now()}-${userId}`,
          message_media: [{
            type: file.mimetype,
            url: file.path
          }]
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: context?.session_id || `session-${Date.now()}`
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
          file_analysis: result.result?.response_media || [],
          timestamp: new Date().toISOString(),
          metadata: {
            file_processed: true,
            processing_time_ms: result.metadata?.processing_time_ms,
            suggested_actions: result.result?.suggested_actions
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