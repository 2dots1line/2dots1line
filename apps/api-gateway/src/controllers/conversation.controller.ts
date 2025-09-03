/**
 * V11.0 - Pure business logic controller using direct DialogueAgent injection
 * No HTTP calls to other services - all logic handled through injected dependencies
 */

import { NextFunction, Request, Response } from 'express';
import type { TApiResponse } from '@2dots1line/shared-types';
import { DialogueAgent } from '@2dots1line/dialogue-service';
import { ConversationRepository, SessionRepository, SessionWithConversations } from '@2dots1line/database';
import type { user_sessions } from '@2dots1line/database';
import { REDIS_CONVERSATION_TIMEOUT_PREFIX } from '@2dots1line/core-utils';
import { z } from 'zod';

const chatSchema = z.object({
  userId: z.string(),
  conversationId: z.string(),
  message: z.string(),
});

const messageSchema = z.object({
  message: z.string(),
  conversation_id: z.string().optional(),
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
  private sessionRepository: SessionRepository; // NEW: Session management
  private redis: any; // Redis client for conversation timeout management

  constructor(
    private dialogueAgent: DialogueAgent,
    conversationRepository: ConversationRepository,
    sessionRepository: SessionRepository, // NEW DEPENDENCY
    redisClient?: any
  ) {
    this.conversationRepository = conversationRepository;
    this.sessionRepository = sessionRepository; // NEW
    this.redis = redisClient;
    console.log(`✅ ConversationController initialized with direct DialogueAgent injection and SessionRepository (V11.0)`);
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
   * V11.1: Correct implementation of conversation lifecycle management per tech lead guidance
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

      // V11.1 FIX: CORRECTLY parse the conversation_id from the request body
      const { message, conversation_id, session_id } = req.body;

      if (!message) {
        res.status(400).json({ 
          success: false, 
          error: { code: 'BAD_REQUEST', message: 'Message content is required' }
        } as TApiResponse<any>);
        return;
      }

      // STEP 1: Session Management
      let session: user_sessions | null;
      
      if (session_id) {
        // Use existing session if provided
        session = await this.sessionRepository.getSessionById(session_id);
        if (!session || session.user_id !== userId) {
          res.status(404).json({ 
            success: false, 
            error: { code: 'NOT_FOUND', message: 'Session not found' }
          } as TApiResponse<any>);
          return;
        }
        // Update session activity
        await this.sessionRepository.updateSessionActivity(session.session_id);
        console.log(`💖 Updated activity for existing session ${session.session_id}`);
      } else {
        // Check if this is a new chat request (no conversation_id and no session_id)
        const isNewChatRequest = !conversation_id;
        
        if (isNewChatRequest) {
          // Always create a new session for new chat requests
          session = await this.sessionRepository.createSession({
            user_id: userId
          });
          console.log(`🆕 Created new session ${session.session_id} for new chat`);
        } else {
          // For existing conversations, try to find the active session
          session = await this.sessionRepository.getActiveSession(userId);
          if (!session) {
            // Create new session if none exists
            session = await this.sessionRepository.createSession({
              user_id: userId
            });
            console.log(`🆕 Created new session ${session.session_id} for user ${userId}`);
          } else {
            // Update session activity
            await this.sessionRepository.updateSessionActivity(session.session_id);
            console.log(`💖 Updated activity for existing session ${session.session_id}`);
          }
        }
      }

      // Ensure we have a valid session
      if (!session) {
        res.status(500).json({ 
          success: false, 
          error: { code: 'INTERNAL_ERROR', message: 'Failed to create or retrieve session' }
        } as TApiResponse<any>);
        return;
      }

      // STEP 2: Find an existing conversation or create a new one
      let conversation = conversation_id 
        ? await this.conversationRepository.findById(conversation_id)
        : null;

      // V11.1 FIX: Check if conversation exists, belongs to user, AND is not ended
      const isConversationEnded = !conversation || 
        conversation.user_id !== userId || 
        conversation.status === 'ended' ||
        conversation.ended_at !== null; // CRITICAL FIX: Check if conversation has ended_at timestamp

      if (isConversationEnded) {
        // Create a new conversation if:
        // - No conversation found
        // - Conversation doesn't belong to this user
        // - Conversation is already ended (CRITICAL FIX)
        // - Conversation has an ended_at timestamp (NEW FIX)
        conversation = await this.conversationRepository.create({
          user_id: userId,
          title: `Conversation: ${new Date().toISOString()}`,
          session_id: session.session_id, // NEW: Pass session_id directly during creation
        });
        
        console.log(`🔄 Created new conversation ${conversation.id} in session ${session.session_id}`);
      } else {
        // Ensure existing conversation is assigned to current session
        if (conversation && conversation.session_id !== session.session_id) {
          await this.conversationRepository.assignToSession(conversation.id, session.session_id);
          console.log(`🔗 Reassigned conversation ${conversation.id} to session ${session.session_id}`);
        }
      }
      const actualConversationId = conversation!.id; // Use non-null assertion since we just created it

      // STEP 2: Log the USER'S message immediately
      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        role: 'user',
        content: message,
      });

      // STEP 3: Set/Reset the Redis heartbeat for the timeout worker
      const heartbeatKey = `${REDIS_CONVERSATION_TIMEOUT_PREFIX}${actualConversationId}`;
      const timeoutSeconds = this.getConversationTimeout();
      await this.redis.set(heartbeatKey, 'active', 'EX', timeoutSeconds);

      // Verify conversation was created with session_id
      if (!conversation?.session_id) {
        console.error(`❌ CRITICAL ERROR: Conversation ${actualConversationId} has no session_id after creation!`);
        throw new Error('Failed to create conversation with session_id');
      }
      console.log(`✅ Verified conversation ${actualConversationId} created with session_id ${conversation.session_id}`);

      // STEP 4: Call the pure, headless DialogueAgent to get a response
      const agentResult = await this.dialogueAgent.processTurn({
        userId,
        conversationId: actualConversationId,
        currentMessageText: message,
      });

      // STEP 5: Log the ASSISTANT'S response
      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        role: 'assistant',
        content: agentResult.response_text,
        llm_call_metadata: agentResult.metadata || {}
      });
      
      // STEP 6: Send the final response to the client
      res.status(200).json({
        success: true,
        conversation_id: actualConversationId, // Ensure the client always gets the correct ID
        session_id: session.session_id, // NEW: Include session ID
        conversation_title: conversation?.title || `Conversation: ${new Date().toISOString()}`, // NEW: Include conversation title with null safety
        response_text: agentResult.response_text,
        message_id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: agentResult.metadata
      });

    } catch (error) {
      console.error('❌ ConversationController.postMessage error:', error);
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
          content: dataUrl
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
        conversation_id: conversationId,
        response_text: result.response_text,
        message_id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: result.metadata,
        file_info: {
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        }
      });

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
   * POST /api/v1/conversations/:conversationId/end
   * V11.1: Explicit conversation ending endpoint
   * Allows frontend to explicitly end conversations and trigger ingestion processing
   */
  public endConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }

      const conversationId = req.params.conversationId;
      
      // Find the conversation and verify ownership
      const conversation = await this.conversationRepository.findById(conversationId);
      
      if (!conversation) {
        res.status(404).json({ 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'Conversation not found' }
        } as TApiResponse<any>);
        return;
      }

      if (conversation.user_id !== userId) {
        res.status(403).json({ 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'Access denied to this conversation' }
        } as TApiResponse<any>);
        return;
      }

      if (conversation.status === 'ended') {
        res.status(200).json({ 
          success: true, 
          data: {
            message: 'Conversation already ended',
            conversation_id: conversationId
          }
        } as TApiResponse<any>);
        return;
      }

      // Update conversation status to ended
      await this.conversationRepository.update(conversationId, {
        status: 'ended',
        ended_at: new Date()
      });

      // Clear the Redis timeout key since conversation is explicitly ended
      const heartbeatKey = `${REDIS_CONVERSATION_TIMEOUT_PREFIX}${conversationId}`;
      await this.redis.del(heartbeatKey);

      console.log(`✅ Conversation ${conversationId} explicitly ended by user ${userId}`);

      // TODO: Add job to ingestion queue for immediate processing
      // This would trigger the IngestionAnalyst to process the conversation

      res.status(200).json({
        success: true,
        data: {
          message: 'Conversation ended successfully',
          conversation_id: conversationId,
          ended_at: new Date().toISOString()
        }
      } as TApiResponse<any>);

    } catch (error) {
      console.error('❌ ConversationController.endConversation error:', error);
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to end conversation' 
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/v1/conversations
   * V11.1: Get conversation history for the authenticated user
   */
  public getConversationHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;

      // Get conversations from repository
      const conversations = await this.conversationRepository.findByUserId(userId, limit, offset);
      
      // Transform to frontend-friendly format
      const conversationHistory = conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.title || `Conversation ${conv.id.slice(0, 8)}`,
        lastMessage: conv.conversation_messages?.[0]?.content || 'No messages',
        timestamp: conv.conversation_messages?.[0]?.timestamp || conv.start_time,
        messageCount: conv.conversation_messages?.length || 0,
        status: conv.status as 'active' | 'ended'
      }));

      res.status(200).json({
        success: true,
        data: {
          conversations: conversationHistory,
          total: await this.conversationRepository.count(userId),
          limit,
          offset
        }
      } as TApiResponse<any>);

    } catch (error) {
      console.error('❌ ConversationController.getConversationHistory error:', error);
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch conversation history' 
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/v1/conversations/:conversationId
   * V11.1: Get specific conversation with messages
   */
  public getConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }

      const conversationId = req.params.conversationId;
      
      // Get conversation with messages
      const conversation = await this.conversationRepository.findById(conversationId);
      
      if (!conversation) {
        res.status(404).json({ 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'Conversation not found' }
        } as TApiResponse<any>);
        return;
      }

      if (conversation.user_id !== userId) {
        res.status(403).json({ 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'Access denied to this conversation' }
        } as TApiResponse<any>);
        return;
      }

      // Transform messages to frontend format
      const messages = ((conversation as any).conversation_messages || []).map((msg: any) => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'bot',
        content: msg.content,
        timestamp: msg.timestamp,
        conversation_id: msg.conversation_id
      }));

      res.status(200).json({
        success: true,
        data: {
          conversation: {
            id: conversation.id,
            title: conversation.title,
            status: conversation.status,
            start_time: conversation.start_time,
            ended_at: conversation.ended_at,
            messageCount: messages.length
          },
          messages
        }
      } as TApiResponse<any>);

    } catch (error) {
      console.error('❌ ConversationController.getConversation error:', error);
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch conversation' 
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * NEW METHOD: Get session information
   */
  public getSessionInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }

      const session = await this.sessionRepository.getSessionById(sessionId);
      if (!session || session.user_id !== userId) {
        res.status(404).json({ 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'Session not found' }
        } as TApiResponse<any>);
        return;
      }

      const conversations = await this.sessionRepository.getConversationsInSession(sessionId);

      res.status(200).json({
        success: true,
        data: {
          session_id: session.session_id,
          created_at: session.created_at,
          last_active_at: session.last_active_at,
          most_recent_conversation_title: conversations[0]?.title || 'New Chat',
          conversation_count: conversations.length,
          conversations: conversations.map((conv: any) => ({
            id: conv.id,
            title: conv.title,
            lastMessage: conv.conversation_messages?.[0]?.content || 'No messages yet',
            timestamp: conv.start_time,
            messageCount: conv.conversation_messages?.length || 0,
            status: conv.status
          }))
        }
      } as TApiResponse<any>);

    } catch (error) {
      console.error('❌ ConversationController.getSessionInfo error:', error);
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to get session information' 
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * NEW METHOD: Start a new chat (creates new session)
   */
  public startNewChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }

      // Create a new session for the new chat
      const session = await this.sessionRepository.createSession({
        user_id: userId
      });

      console.log(`🆕 Created new session ${session.session_id} for new chat`);

      res.status(200).json({
        success: true,
        data: {
          session_id: session.session_id,
          created_at: session.created_at,
          last_active_at: session.last_active_at
        }
      } as TApiResponse<any>);

    } catch (error) {
      console.error('❌ ConversationController.startNewChat error:', error);
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to start new chat' 
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * NEW METHOD: Get all sessions for a user
   */
  public getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }

      const sessions = await this.sessionRepository.getUserSessions(userId);

      res.status(200).json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            session_id: session.session_id,
            created_at: session.created_at,
            last_active_at: session.last_active_at,
            most_recent_conversation_title: (session as any).conversations?.[0]?.title || 'New Chat',
            conversation_count: (session as any).conversations?.length || 0,
            conversations: (session as any).conversations || []
          }))
        }
      } as TApiResponse<any>);

    } catch (error) {
      console.error('❌ ConversationController.getSessions error:', error);
      res.status(500).json({ 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to get user sessions' 
        }
      } as TApiResponse<any>);
    }
  };
} 