/**
 * V11.0 - Pure business logic controller using direct DialogueAgent injection
 * No HTTP calls to other services - all logic handled through injected dependencies
 */

import { NextFunction, Request, Response } from 'express';
import type { TApiResponse } from '@2dots1line/shared-types';
import { DialogueAgent } from '@2dots1line/dialogue-service';
import { ConversationRepository, SessionRepository, SessionWithConversations, MediaRepository } from '@2dots1line/database';
// import type { user_sessions } from '@2dots1line/database';
import { REDIS_CONVERSATION_TIMEOUT_PREFIX } from '@2dots1line/core-utils';
import { z } from 'zod';
import { createHash } from 'crypto';

const chatSchema = z.object({
  userId: z.string(),
  conversationId: z.string(),
  message: z.string(),
});

const messageSchema = z.object({
  message: z.string(),
  conversation_id: z.string().optional(),
  message_id: z.string().optional(),
  session_id: z.string().optional(),
  viewContext: z.object({
    currentView: z.enum(['chat', 'cards', 'cosmos', 'dashboard']),
    viewDescription: z.string().optional()
  }).optional(),
  engagementContext: z.object({
    recentEvents: z.array(z.object({
      type: z.enum(['click', 'hover', 'focus', 'scroll', 'navigation']),
      target: z.string(),
      targetType: z.enum(['entity', 'card', 'button', 'modal', 'view']),
      view: z.enum(['chat', 'cards', 'cosmos', 'dashboard']),
      timestamp: z.string(),
      metadata: z.record(z.any()).optional()
    })),
    sessionDuration: z.number().nullable().optional(),
    currentViewDuration: z.number().nullable().optional(),
    interactionSummary: z.object({
      totalClicks: z.number(),
      uniqueTargets: z.number(),
      viewSwitches: z.number()
    }).nullable().optional(),
    enrichedEntities: z.array(z.object({
      entityId: z.string(),
      title: z.string(),
      content: z.string(),
      type: z.string(),
      engagementDuration: z.number()
    })).nullable().optional()
  }).optional(),
  context: z.object({
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
  private mediaRepository: MediaRepository; // RESTORED: Media management
  private redis: any; // Redis client for conversation timeout management

  constructor(
    private dialogueAgent: DialogueAgent,
    conversationRepository: ConversationRepository,
    sessionRepository: SessionRepository, // NEW DEPENDENCY
    mediaRepository: MediaRepository, // RESTORED DEPENDENCY
    redisClient?: any
  ) {
    this.conversationRepository = conversationRepository;
    this.sessionRepository = sessionRepository; // NEW
    this.mediaRepository = mediaRepository; // RESTORED
    this.redis = redisClient;
    console.log(`✅ ConversationController initialized with direct DialogueAgent injection, SessionRepository, and MediaRepository (V11.0)`);
  }

  /**
   * Sets/resets the Redis timeout key for conversation timeout mechanism
   * As per V9.5 specification: conversation-timeout-worker listens for key expiration
   */
  private async setConversationTimeout(userId: string, conversationId: string): Promise<void> {
    if (!this.redis) {
      console.warn('⚠️ Redis client not available - conversation timeout not set');
      return;
    }

    try {
      // Load timeout from config as per V11.0 architecture
      const timeoutSeconds = this.getConversationTimeout();
      const redisKey = `${REDIS_CONVERSATION_TIMEOUT_PREFIX}${userId}:${conversationId}`;
      
      // Set/reset the timeout key - when this expires, conversation-timeout-worker triggers ingestion
      await this.redis.set(redisKey, conversationId, 'EX', timeoutSeconds);
      console.log(`🕐 Set conversation timeout for user ${userId}, conversation ${conversationId} (${timeoutSeconds}s)`);
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
   * POST /api/v1/conversations/messages/stream
   * V11.0: Streaming version of postMessage for real-time response delivery
   */
  public postMessageStream = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
        } as TApiResponse<any>);
        return;
      }

      const { message, message_id, conversation_id, session_id, viewContext, engagementContext } = messageSchema.parse(req.body);
      
      console.log(`🌊 ConversationController.postMessageStream - Starting streaming conversation for user ${userId}`);
      console.log(`🌊 ConversationController.postMessageStream - Received message_id: ${message_id}`);
      console.log(`🌊 ConversationController.postMessageStream - Engagement context:`, engagementContext ? {
        recentEventsCount: engagementContext.recentEvents?.length || 0,
        sessionDuration: engagementContext.sessionDuration,
        hasInteractionSummary: !!engagementContext.interactionSummary,
        hasEnrichedEntities: !!engagementContext.enrichedEntities
      } : 'none');

      // CRITICAL FIX: Disable all timeouts for SSE streaming
      // @ts-ignore - Node.js Socket properties
      req.socket.setTimeout(0); // Disable request timeout
      // @ts-ignore
      req.socket.setKeepAlive(true, 30000); // Enable TCP keep-alive every 30s
      // @ts-ignore
      req.socket.setNoDelay(true); // Disable Nagle's algorithm for immediate chunk delivery

      // Set up Server-Sent Events headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no' // Disable nginx buffering if behind proxy
      });

      // Send initial connection confirmation
      res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Streaming connection established' })}\n\n`);

      // CRITICAL FIX: Start keep-alive heartbeat to prevent connection timeout
      // Send a comment (ignored by SSE parsers) every 15 seconds to keep connection alive
      const keepAliveInterval = setInterval(() => {
        if (!res.writableEnded) {
          res.write(`: keepalive ${Date.now()}\n\n`);
          console.log(`💓 ConversationController: Sent keep-alive heartbeat`);
        }
      }, 15000); // 15 seconds

      // Cleanup function to clear keep-alive when stream ends
      const cleanup = () => {
        clearInterval(keepAliveInterval);
        console.log(`🧹 ConversationController: Cleaned up keep-alive interval`);
      };

      // Handle client disconnect
      req.on('close', () => {
        console.log(`🔌 ConversationController: Client disconnected, cleaning up`);
        cleanup();
      });

      // Handle conversation logic - FIXED to reuse active conversations
      let session: any | null;
      let conversation: any = null;

      if (conversation_id) {
        // Resume existing conversation - use its existing session
        conversation = await this.conversationRepository.findById(conversation_id);
        
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
            error: { code: 'FORBIDDEN', message: 'Conversation does not belong to user' }
          } as TApiResponse<any>);
          return;
        }

        // If conversation is ended, create a new conversation in the same session
        if (conversation.status === 'ended' || conversation.ended_at !== null) {
          console.log(`🔄 Conversation ${conversation_id} is ended, creating new conversation in same session ${conversation.session_id}`);
          
          // Create new conversation in the same session
          const newConversation = await this.conversationRepository.create({
            user_id: userId,
            title: `Conversation: ${new Date().toISOString()}`,
            session_id: conversation.session_id
          });
          
          // Update conversation to the new one
          conversation = newConversation;
          
          console.log(`✅ Created new conversation ${newConversation.conversation_id} in session ${conversation.session_id}`);
        } else {
          console.log(`🔄 Reusing active conversation ${conversation_id} in session ${conversation.session_id}`);
        }

        // Use the conversation's existing session
        session = await this.sessionRepository.getSessionById(conversation.session_id);
        if (!session) {
          res.status(500).json({ 
            success: false, 
            error: { code: 'INTERNAL_ERROR', message: 'Conversation has invalid session' }
          } as TApiResponse<any>);
          return;
        }

        // Update session activity
        await this.sessionRepository.updateSessionActivity(session.session_id);
        console.log(`💖 Updated activity for existing session ${session.session_id}`);

      } else if (session_id) {
        // New conversation in existing session
        session = await this.sessionRepository.getSessionById(session_id);
        if (!session || session.user_id !== userId) {
          res.status(404).json({ 
            success: false, 
            error: { code: 'NOT_FOUND', message: 'Session not found' }
          } as TApiResponse<any>);
          return;
        }

        // Create new conversation in this session
        conversation = await this.conversationRepository.create({
          user_id: userId,
          title: `Conversation: ${new Date().toISOString()}`,
          session_id: session.session_id,
        });
        
        console.log(`🆕 Created new conversation ${conversation.conversation_id} in existing session ${session.session_id}`);

      } else {
        // No conversation_id provided - find or create session and conversation
        session = await this.sessionRepository.findActiveSessionByUserId(userId);

        if (session) {
          // Check if there's an active conversation in this session
          const activeConversation = await this.conversationRepository.findActiveConversationBySessionId(session.session_id);
          
          if (activeConversation) {
            // Reuse existing active conversation
            conversation = activeConversation;
            console.log(`🔄 Reusing active conversation ${conversation.conversation_id} in existing session ${session.session_id}`);
          } else {
            // Create new conversation in existing session
            conversation = await this.conversationRepository.create({
              user_id: userId,
              title: `Conversation: ${new Date().toISOString()}`,
              session_id: session.session_id,
            });
            console.log(`🆕 Created new conversation ${conversation.conversation_id} in existing session ${session.session_id}`);
          }
          
          // Update session activity
          await this.sessionRepository.updateSessionActivity(session.session_id);
          console.log(`💖 Updated activity for existing session ${session.session_id}`);
        } else {
          // New chat - create new session and conversation
          session = await this.sessionRepository.createSession({
            user_id: userId
          });

          conversation = await this.conversationRepository.create({
            user_id: userId,
            title: `Conversation: ${new Date().toISOString()}`,
            session_id: session.session_id,
          });
          console.log(`🆕 Created new session ${session.session_id} and conversation ${conversation.conversation_id}`);
        }
      }

      const actualConversationId = conversation!.conversation_id;

      // Log the USER'S message immediately
      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        type: 'user',
        content: message,
        message_id: message_id, // Use the ID from frontend
      });

      // Set/Reset the Redis heartbeat for the timeout worker
      const heartbeatKey = `${REDIS_CONVERSATION_TIMEOUT_PREFIX}${userId}:${actualConversationId}`;
      const timeoutSeconds = this.getConversationTimeout();
      await this.redis.set(heartbeatKey, 'active', 'EX', timeoutSeconds);

      console.log(`✅ Processing streaming conversation ${actualConversationId} in session ${conversation.session_id}`);

      // Send conversation metadata
      res.write(`data: ${JSON.stringify({ 
        type: 'conversation_metadata',
        conversation_id: conversation.conversation_id,
        session_id: session.session_id,
        conversation_title: conversation?.title || `Conversation: ${new Date().toISOString()}`
      })}\n\n`);

      // Call the streaming DialogueAgent
      let agentResult;
      try {
        agentResult = await this.dialogueAgent.processTurnStreaming({
          userId,
          conversationId: actualConversationId,
          currentMessageText: message,
          viewContext: viewContext ? {
            currentView: viewContext.currentView,
            viewDescription: viewContext.viewDescription
          } : undefined,
          engagementContext: engagementContext ? {
            recentEvents: engagementContext.recentEvents,
            sessionDuration: engagementContext.sessionDuration ?? undefined,
            currentViewDuration: engagementContext.currentViewDuration ?? undefined,
            interactionSummary: engagementContext.interactionSummary ?? undefined,
            enrichedEntities: engagementContext.enrichedEntities ?? undefined
          } : undefined,
          onChunk: (chunk: string) => {
            // Send each chunk to the client
            res.write(`data: ${JSON.stringify({ 
              type: 'response_chunk', 
              content: chunk,
              conversation_id: actualConversationId
            })}\n\n`);
          }
        });
      } finally {
        // Always clean up keep-alive, whether processing succeeded or failed
        cleanup();
      }

      // Log the ASSISTANT'S response
      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        type: 'assistant',
        content: agentResult.response_text,
        metadata: agentResult.metadata || {}
      });

      // Send final response metadata
      console.log('🌊 ConversationController: agentResult.response_text:', agentResult.response_text);
      console.log('🌊 ConversationController: agentResult keys:', Object.keys(agentResult));
      
      res.write(`data: ${JSON.stringify({ 
        type: 'response_complete',
        conversation_id: actualConversationId,
        session_id: session.session_id,
        conversation_title: conversation?.title || `Conversation: ${new Date().toISOString()}`,
        response_text: agentResult.response_text,
        message_id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: agentResult.metadata,
        ui_actions: agentResult.ui_actions
      })}\n\n`);

      // Close the stream
      res.write(`data: ${JSON.stringify({ type: 'stream_end' })}\n\n`);
      res.end();

    } catch (error) {
      console.error('❌ ConversationController.postMessageStream error:', error);
      
      // Send error to client if connection is still open and headers were sent
      try {
        if (!res.writableEnded) {
          if (!res.headersSent) {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Cache-Control'
            });
          }
          res.write(`data: ${JSON.stringify({ 
            type: 'error',
            error: { 
              code: 'INTERNAL_ERROR', 
              message: 'Failed to process streaming message' 
            }
          })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'stream_end' })}\n\n`);
          res.end();
        }
      } catch (writeError) {
        console.error('❌ ConversationController.postMessageStream - Failed to send error to client:', writeError);
      }
    }
  };

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
      const { message, conversation_id, session_id } = messageSchema.parse(req.body);

      if (!message) {
        res.status(400).json({ 
          success: false, 
          error: { code: 'BAD_REQUEST', message: 'Message content is required' }
        } as TApiResponse<any>);
        return;
      }

      // STEP 1: Determine session and conversation based on your correct vision
      let session: any | null;
      let conversation: any = null;

      if (conversation_id) {
        // Resume existing conversation - use its existing session
        conversation = await this.conversationRepository.findById(conversation_id);
        
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
            error: { code: 'FORBIDDEN', message: 'Conversation does not belong to user' }
          } as TApiResponse<any>);
          return;
        }

        // If conversation is ended, create a new conversation in the same session
        if (conversation.status === 'ended' || conversation.ended_at !== null) {
          console.log(`🔄 Conversation ${conversation_id} is ended, creating new conversation in same session ${conversation.session_id}`);
          
          // Create new conversation in the same session
          const newConversation = await this.conversationRepository.create({
            user_id: userId,
            title: `Conversation started at ${new Date().toISOString()}`,
            session_id: conversation.session_id
          });
          
          // Update conversation to the new one
          conversation = newConversation;
          
          console.log(`✅ Created new conversation ${newConversation.conversation_id} in session ${conversation.session_id}`);
        }

        // Use the conversation's existing session
        session = await this.sessionRepository.getSessionById(conversation.session_id);
        if (!session) {
          res.status(500).json({ 
            success: false, 
            error: { code: 'INTERNAL_ERROR', message: 'Conversation has invalid session' }
          } as TApiResponse<any>);
          return;
        }

        // Update session activity
        await this.sessionRepository.updateSessionActivity(session.session_id);
        console.log(`💖 Updated activity for existing session ${session.session_id}`);

      } else if (session_id) {
        // New conversation in existing session
        session = await this.sessionRepository.getSessionById(session_id);
        if (!session || session.user_id !== userId) {
          res.status(404).json({ 
            success: false, 
            error: { code: 'NOT_FOUND', message: 'Session not found' }
          } as TApiResponse<any>);
          return;
        }

        // Create new conversation in this session
        conversation = await this.conversationRepository.create({
          user_id: userId,
          title: `Conversation: ${new Date().toISOString()}`,
          session_id: session.session_id,
        });
        
        console.log(`🆕 Created new conversation ${conversation.conversation_id} in existing session ${session.session_id}`);

      } else {
        // New chat - create new session and conversation
        session = await this.sessionRepository.createSession({
          user_id: userId
        });

        conversation = await this.conversationRepository.create({
          user_id: userId,
          title: `Conversation: ${new Date().toISOString()}`,
          session_id: session.session_id,
        });
        
        console.log(`🆕 Created new session ${session.session_id} and conversation ${conversation.conversation_id}`);
      }
      const actualConversationId = conversation!.conversation_id; // Use non-null assertion since we just created it

      // STEP 2: Log the USER'S message immediately
      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        type: 'user',
        content: message,
      });

      // STEP 3: Set/Reset the Redis heartbeat for the timeout worker
      const heartbeatKey = `${REDIS_CONVERSATION_TIMEOUT_PREFIX}${actualConversationId}`;
      const timeoutSeconds = this.getConversationTimeout();
      await this.redis.set(heartbeatKey, 'active', 'EX', timeoutSeconds);

      // Conversation is guaranteed to have session_id with the new logic
      console.log(`✅ Processing conversation ${actualConversationId} in session ${conversation.session_id}`);

      // STEP 4: Call the pure, headless DialogueAgent to get a response
      const agentResult = await this.dialogueAgent.processTurn({
        userId,
        conversationId: actualConversationId,
        currentMessageText: message,
      });

      // STEP 5: Log the ASSISTANT'S response
      await this.conversationRepository.addMessage({
        conversation_id: actualConversationId,
        type: 'assistant',
        content: agentResult.response_text,
        metadata: agentResult.metadata || {}
      });
      
      // STEP 6: Send the final response to the client
      res.status(200).json({
        success: true,
        conversation_id: conversation.conversation_id, // Use the actual conversation ID (may be new if ended conversation was replaced)
        session_id: session.session_id, // NEW: Include session ID
        conversation_title: conversation?.title || `Conversation: ${new Date().toISOString()}`, // NEW: Include conversation title with null safety
        response_text: agentResult.response_text,
        message_id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: agentResult.metadata,
        ui_actions: agentResult.ui_actions
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

      let conversation: any = null;
      let session: any = null;

      if (conversation_id) {
        // Resume existing conversation - use its existing session
        conversation = await this.conversationRepository.findById(conversation_id);
        
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
            error: { code: 'FORBIDDEN', message: 'Conversation does not belong to user' }
          } as TApiResponse<any>);
          return;
        }

        // If conversation is ended, create a new conversation in the same session
        if (conversation.status === 'ended' || conversation.ended_at !== null) {
          console.log(`🔄 Conversation ${conversation_id} is ended, creating new conversation in same session ${conversation.session_id}`);
          
          // Create new conversation in the same session
          const newConversation = await this.conversationRepository.create({
            user_id: userId,
            title: `File Upload: ${file.originalname}`,
            session_id: conversation.session_id,
            metadata: {
              source: 'file_upload',
              filename: file.originalname,
              mime_type: file.mimetype,
              file_size: file.size
            }
          });
          
          // Update conversation to the new one
          conversation = newConversation;
          
          console.log(`✅ Created new conversation ${newConversation.conversation_id} in session ${conversation.session_id}`);
        }

        // Use the conversation's existing session, or create one if missing
        if (conversation.session_id) {
          session = await this.sessionRepository.getSessionById(conversation.session_id);
          if (!session) {
            res.status(500).json({ 
              success: false, 
              error: { code: 'INTERNAL_ERROR', message: 'Conversation has invalid session' }
            } as TApiResponse<any>);
            return;
          }
        } else {
          // Create a new session for this conversation (legacy conversations without session_id)
          session = await this.sessionRepository.createSession({
            user_id: userId
          });
          
          // Update the conversation with the new session_id
          await this.conversationRepository.update(conversation.conversation_id, {
            session_id: session.session_id
          });
          
          console.log(`🔗 Created new session ${session.session_id} for legacy conversation ${conversation.conversation_id}`);
        }

        console.log(`✅ Using existing conversation ${conversation.conversation_id} in session ${session.session_id}`);

      } else if (session_id) {
        // New conversation in existing session
        session = await this.sessionRepository.getSessionById(session_id);
        if (!session || session.user_id !== userId) {
          res.status(404).json({ 
            success: false, 
            error: { code: 'NOT_FOUND', message: 'Session not found' }
          } as TApiResponse<any>);
          return;
        }

        // Create new conversation in this session
        conversation = await this.conversationRepository.create({
          user_id: userId,
          title: `File Upload: ${file.originalname}`,
          session_id: session.session_id,
          metadata: {
            source: 'file_upload',
            filename: file.originalname,
            mime_type: file.mimetype,
            file_size: file.size
          }
        });
        
        console.log(`🆕 Created new conversation ${conversation.conversation_id} in existing session ${session.session_id}`);

      } else {
        // New chat - create new session and conversation
        session = await this.sessionRepository.createSession({
          user_id: userId
        });

        conversation = await this.conversationRepository.create({
          user_id: userId,
          title: `File Upload: ${file.originalname}`,
          session_id: session.session_id,
          metadata: {
            source: 'file_upload',
            filename: file.originalname,
            mime_type: file.mimetype,
            file_size: file.size
          }
        });
        
        console.log(`🆕 Created new session ${session.session_id} and conversation ${conversation.conversation_id}`);
      }

      const conversationId = conversation.conversation_id;
      
      // Set/reset conversation timeout for background processing trigger
      await this.setConversationTimeout(userId, conversationId);
      
      // RESTORED: Media handling logic from deleted agent.controller.ts
      console.log(`📁 Processing file upload: ${file.originalname} (${file.mimetype})`);
      
      // 1. Determine file type
      const fileType = this.determineFileType(file.mimetype, file.originalname);
      console.log(`🔍 File type determined: ${fileType} (MIME: ${file.mimetype})`);
      
      // 2. Record file in media model with deduplication
      let mediaRecord = null;
      try {
        // Generate hash for deduplication
        const fileHash = createHash('sha256').update(dataUrl).digest('hex');
        
        // Check if file already exists (deduplication)
        const existingMedia = await this.mediaRepository.findByHash(fileHash);
        
        if (existingMedia) {
          console.log(`🔄 File already exists in database: ${existingMedia.media_id}`);
          mediaRecord = existingMedia;
        } else {
          // Create new media record
          const mediaData = {
            user_id: userId,
            type: fileType,
            storage_url: dataUrl, // Store base64 data URL for now
            filename: file.originalname,
            mime_type: file.mimetype,
            size_bytes: file.size,
            hash: fileHash,
            processing_status: 'completed', // Will be updated if processing fails
            metadata: {
              upload_timestamp: new Date().toISOString(),
              conversation_id: conversationId,
              original_filename: file.originalname,
              file_type: fileType,
              analysis_completed: true,
              analysis_timestamp: new Date().toISOString()
            }
          };
          
          mediaRecord = await this.mediaRepository.create(mediaData);
          console.log(`✅ Media record created: ${mediaRecord.media_id} (${file.size} bytes, ${file.mimetype}, type: ${fileType})`);
        }
      } catch (error) {
        console.error('❌ Failed to record media in database:', error);
        // Continue with the flow even if media recording fails
      }
      
      // Process file through DialogueAgent using processTurn with enhanced message
      const enhancedMessage = `${message || 'What can you tell me about this file?'}\n\n[File uploaded: ${file.originalname} (${file.mimetype})]`;
      
      // STEP 1: Save the user's message to the database
      console.log(`💬 Attempting to add message to conversation: ${conversationId}`);
      console.log(`💬 Message content preview: ${enhancedMessage.substring(0, 100)}...`);
      
      try {
        await this.conversationRepository.addMessage({
          conversation_id: conversationId,
          type: 'user',
          content: enhancedMessage,
          media_ids: mediaRecord ? [mediaRecord.media_id] : [] // RESTORED: Link media to message
        });
        console.log(`✅ Successfully added user message to conversation: ${conversationId}${mediaRecord ? ` with media_id: ${mediaRecord.media_id}` : ''}`);
      } catch (addMessageError) {
        console.error(`❌ Failed to add message to conversation ${conversationId}:`, addMessageError);
        throw addMessageError;
      }
      
      // STEP 2: Process file through DialogueAgent to get extracted content
      const result = await this.dialogueAgent.processTurn({
        userId,
        conversationId,
        currentMessageText: enhancedMessage,
        currentMessageMedia: [{
          type: file.mimetype,
          content: dataUrl
        }]
      });

      // STEP 3: Create separate assistant message with file analysis
      // Use the analysis results directly from DialogueAgent result
      if (result.vision_analysis) {
        console.log(`✅ Found vision analysis from DialogueAgent (${result.vision_analysis.length} chars)`);
        
        // Store the vision analysis as a separate message for record keeping
        await this.conversationRepository.addMessage({
          conversation_id: conversationId,
          type: 'assistant',
          content: result.vision_analysis,
          media_ids: mediaRecord ? [mediaRecord.media_id] : []
        });
        console.log(`✅ Created separate assistant message with vision analysis`);
      } else if (result.document_analysis) {
        console.log(`✅ Found document analysis from DialogueAgent (${result.document_analysis.length} chars)`);
        
        // Store the document analysis as a separate message for record keeping
        await this.conversationRepository.addMessage({
          conversation_id: conversationId,
          type: 'assistant',
          content: result.document_analysis,
          media_ids: mediaRecord ? [mediaRecord.media_id] : []
        });
        console.log(`✅ Created separate assistant message with document analysis`);
      } else {
        console.log(`⚠️ No file analysis found in DialogueAgent result`);
      }

      // STEP 4: Save the main assistant's response to the database
      await this.conversationRepository.addMessage({
        conversation_id: conversationId,
        type: 'assistant',
        content: result.response_text,
        metadata: result.metadata || {},
        media_ids: mediaRecord ? [mediaRecord.media_id] : [] // RESTORED: Link media to assistant message
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
      
      // Verify conversation exists before adding messages
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        res.status(404).json({ 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'Conversation not found' }
        } as TApiResponse<any>);
        return;
      }
      
      // Verify conversation belongs to the user
      if (conversation.user_id !== userId) {
        res.status(403).json({ 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'Conversation does not belong to user' }
        } as TApiResponse<any>);
        return;
      }
      
      // Set/reset conversation timeout for background processing trigger
      await this.setConversationTimeout(userId, conversationId);
      
      // STEP 1: Save the user's message to the database
      await this.conversationRepository.addMessage({
        conversation_id: conversationId,
        type: 'user',
        content: message,
      });
      
      const result = await this.dialogueAgent.processTurn({ 
        userId, 
        conversationId, 
        currentMessageText: message
      });

      // STEP 2: Save the assistant's response to the database
      await this.conversationRepository.addMessage({
        conversation_id: conversationId,
        type: 'assistant',
        content: result.response_text,
        metadata: result.metadata || {}
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
      
      // Create new session for this conversation
      const session = await this.sessionRepository.createSession({
        user_id: userId
      });
      console.log(`🆕 Created new session ${session.session_id} for conversation`);
      
      // Create conversation record in database with session_id
      const conversation = await this.conversationRepository.create({
        user_id: userId,
        title: `Conversation started at ${new Date().toISOString()}`,
        session_id: session.session_id
      });
      const conversationId = conversation.conversation_id;
      console.log(`✅ Conversation record created: ${conversationId} in session ${session.session_id}`);
      
      // Set/reset conversation timeout for background processing trigger
      await this.setConversationTimeout(userId, conversationId);
      
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
          sessionId: session.session_id,
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
      const heartbeatKey = `${REDIS_CONVERSATION_TIMEOUT_PREFIX}${userId}:${conversationId}`;
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
        id: conv.conversation_id,
        title: conv.title || `Conversation ${conv.conversation_id.slice(0, 8)}`,
        lastMessage: conv.conversation_messages?.[0]?.content || 'No messages',
        timestamp: conv.conversation_messages?.[0]?.created_at || conv.created_at,
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
        id: msg.message_id,
        type: msg.type === 'user' ? 'user' : 'bot',
        content: msg.content,
        timestamp: msg.created_at,
        conversation_id: msg.conversation_id
      }));

      res.status(200).json({
        success: true,
        data: {
          conversation: {
            id: conversation.conversation_id,
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
            id: conv.conversation_id,
            title: conv.title,
            lastMessage: conv.conversation_messages?.[0]?.content || 'No messages yet',
            timestamp: conv.created_at,
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

      // Don't create a session yet - just return a placeholder
      // Session will be created when the first message is sent
      console.log(`🆕 New chat initiated for user ${userId} - session will be created on first message`);

      res.status(200).json({
        success: true,
        data: {
          session_id: null, // No session created yet
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
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
          sessions: sessions.map(session => {
            // Find the most recent processed conversation for the title
            const processedConversations = (session as any).conversations?.filter((conv: any) => conv.status === 'processed') || [];
            const mostRecentProcessed = processedConversations[0]; // Already ordered by created_at desc
            
            return {
              session_id: (session as any).session_id,
              created_at: (session as any).created_at,
              last_active_at: (session as any).last_active_at,
              most_recent_conversation_title: mostRecentProcessed?.title || 'New Chat',
              conversation_count: (session as any).conversations?.length || 0,
              conversations: (session as any).conversations || []
            };
          })
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

  /**
   * RESTORED: Determine file type from MIME type and filename
   * From deleted agent.controller.ts
   */
  private determineFileType(mimeType: string, filename: string): 'image' | 'document' | 'unknown' {
    // Check MIME type first
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    
    // Check for document MIME types
    const documentMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ];
    
    if (documentMimeTypes.includes(mimeType)) {
      return 'document';
    }
    
    // Fallback to file extension
    const path = require('path');
    const extension = path.extname(filename).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf'];
    
    if (imageExtensions.includes(extension)) {
      return 'image';
    }
    
    if (documentExtensions.includes(extension)) {
      return 'document';
    }
    
    return 'unknown';
  }


  /**
   * Get proactive greeting for a user from the most recent processed conversation
   */
  async getProactiveGreeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      } as TApiResponse<any>);
      return;
    }

    try {
      const recentConversation = await this.conversationRepository.getMostRecentProcessedConversationWithContext(userId);

      if (!recentConversation || !recentConversation.proactive_greeting) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NO_PROACTIVE_GREETING',
            message: 'No proactive greeting found for this user'
          }
        } as TApiResponse<any>);
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          proactive_greeting: recentConversation.proactive_greeting
        }
      } as TApiResponse<any>);

    } catch (error) {
      console.error('Error fetching proactive greeting:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error'
        }
      } as TApiResponse<any>);
    }
  }
} 