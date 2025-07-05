/**
 * V11.0 - Pure business logic controller using direct DialogueAgent injection
 * No HTTP calls to other services - all logic handled through injected dependencies
 */

import { NextFunction, Request, Response } from 'express';
import type { TApiResponse } from '@2dots1line/shared-types';
import { DialogueAgent } from '@2dots1line/dialogue-service';
import { ConversationRepository } from '@2dots1line/database';
import { REDIS_CONVERSATION_TIMEOUT_PREFIX } from '@2dots1line/core-utils';
import { z } from 'zod';

const chatSchema = z.object({
  userId: z.string(),
  conversationId: z.string(),
  message: z.string(),
});

const messageSchema = z.object({
  message: z.string(),
  context: z.object({
    session_id: z.string().optional(),
    trigger_background_processing: z.boolean().optional()
  }).optional()
});

const startConversationSchema = z.object({
  userId: z.string(),
  initialMessage: z.string(),
});

const uploadSchema = z.object({
  message: z.string().optional(),
  conversation_id: z.string().optional(),
  session_id: z.string().optional()
});

export class ConversationController {
  private conversationRepository: ConversationRepository;
  private redis: any; // Redis client for conversation timeout management

  constructor(
    private dialogueAgent: DialogueAgent,
    conversationRepository: ConversationRepository,
    redisClient?: any
  ) {
    this.conversationRepository = conversationRepository;
    this.redis = redisClient;
    console.log(`✅ ConversationController initialized with direct DialogueAgent injection (V11.0)`);
  }

  /**
   * Sets/resets the Redis timeout key for conversation timeout mechanism
   * As per V9.5 specification: conversation-timeout-worker listens for key expiration
   */
  private async setConversationTimeout(conversationId: string): Promise<void> {
    if (!this.redis) {
      console.warn('⚠️ Redis client not available - conversation timeout not set');
      return;
    }

    try {
      // Load timeout from config as per V11.0 architecture
      const timeoutSeconds = this.getConversationTimeout();
      const redisKey = `${REDIS_CONVERSATION_TIMEOUT_PREFIX}${conversationId}`;
      
      // Set/reset the timeout key - when this expires, conversation-timeout-worker triggers ingestion
      await this.redis.set(redisKey, conversationId, 'EX', timeoutSeconds);
      console.log(`🕐 Set conversation timeout for ${conversationId} (${timeoutSeconds}s)`);
    } catch (error) {
      console.error('❌ Failed to set conversation timeout:', error);
    }
  }

  /**
   * Loads conversation timeout from operational parameters config
   * As per V11.0 refactoring: moved from constants to config file
   */
  private getConversationTimeout(): number {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'config', 'operational_parameters.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.conversation_timeout_seconds || 300; // 5 minutes default
    } catch (error) {
      console.error('❌ Failed to load conversation timeout from config:', error);
      return 300; // 5 minutes fallback
    }
  }

  /**
   * POST /api/v1/conversations/messages
   * V11.0: Direct DialogueAgent processing, no HTTP proxy
   */
  public postMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }

      const { message, context } = messageSchema.parse(req.body);
      
      // Generate conversation ID if not provided
      const conversationId = context?.session_id || `conv_${userId}_${Date.now()}`;
      
      // Set/reset conversation timeout for background processing trigger
      await this.setConversationTimeout(conversationId);
      
      // Process through DialogueAgent directly
      const result = await this.dialogueAgent.processTurn({ 
        userId, 
        conversationId, 
        currentMessageText: message
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Message processed successfully'
      } as TApiResponse<any>);

    } catch (error) {
      console.error('Error in postMessage:', error);
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to process message' 
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * POST /api/v1/conversations/upload
   * V11.0: Direct DialogueAgent file processing, no HTTP proxy
   */
  public uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({ 
          success: false, 
          error: { code: 'BAD_REQUEST', message: 'No file uploaded' }
        } as TApiResponse<any>);
        return;
      }

      const file = req.file as Express.Multer.File;
      const { message, conversation_id, session_id } = uploadSchema.parse(req.body);
      
      // Convert file to base64 for processing
      const fs = await import('fs');
      const fileBuffer = fs.readFileSync(file.path);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      // Generate conversation ID if not provided
      const conversationId = conversation_id || session_id || `conv_${userId}_${Date.now()}`;
      
      // Set/reset conversation timeout for background processing trigger
      await this.setConversationTimeout(conversationId);
      
      // Process file through DialogueAgent using processTurn with enhanced message
      const enhancedMessage = `${message || 'What can you tell me about this file?'}\n\n[File uploaded: ${file.originalname} (${file.mimetype}, ${file.size} bytes)]`;
      
      const result = await this.dialogueAgent.processTurn({
        userId,
        conversationId,
        currentMessageText: enhancedMessage,
        currentMessageMedia: [{
          type: file.mimetype,
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          dataUrl: dataUrl
        }]
      });

      // Clean up uploaded file after processing
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      res.status(200).json({
        success: true,
        data: result,
        message: 'File processed successfully'
      } as TApiResponse<any>);

    } catch (error) {
      console.error('Error in uploadFile:', error);
      
      // Clean up file if upload failed
      if (req.file) {
        try {
          const fs = await import('fs');
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded file after error:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'File upload failed' 
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * POST /api/v1/agent/chat
   * V11.0: Direct DialogueAgent processing
   */
  async handleChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, conversationId, message } = chatSchema.parse(req.body);
      
      // Set/reset conversation timeout for background processing trigger
      await this.setConversationTimeout(conversationId);
      
      const result = await this.dialogueAgent.processTurn({ 
        userId, 
        conversationId, 
        currentMessageText: message
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/agent/start-conversation
   * V11.0: Direct DialogueAgent conversation initialization
   */
  async startConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, initialMessage } = startConversationSchema.parse(req.body);
      
      // Create conversation record in database BEFORE processing
      const conversation = await this.conversationRepository.create({
        user_id: userId,
        title: `Conversation started at ${new Date().toISOString()}`
      });
      const conversationId = conversation.id;
      console.log(`✅ Conversation record created: ${conversationId}`);
      
      // Set/reset conversation timeout for background processing trigger
      await this.setConversationTimeout(conversationId);
      
      // Process initial message through DialogueAgent
      const result = await this.dialogueAgent.processTurn({
        userId,
        conversationId,
        currentMessageText: initialMessage
      });
      
      res.status(201).json({
        success: true,
        data: {
          conversationId,
          initialResponse: result
        },
        message: 'Conversation started successfully'
      } as TApiResponse<any>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/agent/conversation/:id
   * V11.0: Direct conversation retrieval through DialogueAgent
   */
  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.id;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
      }
      
      // TODO: Implement proper conversation retrieval through ConversationRepository
      // For now, return a placeholder response
      const conversation = {
        id: conversationId,
        userId: userId,
        messages: [],
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      if (!conversation) {
        return res.status(404).json({ 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'Conversation not found' }
        } as TApiResponse<any>);
      }
      
      res.json({
        success: true,
        data: conversation,
        message: 'Conversation retrieved successfully'
      } as TApiResponse<any>);
    } catch (error) {
      next(error);
    }
  }
} 