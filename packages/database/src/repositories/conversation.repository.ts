/**
 * Conversation Repository
 * Handles conversation and message persistence
 */

import { PrismaClient } from '../prisma-client';

// Type for conversation operations  
type ConversationType = Awaited<ReturnType<PrismaClient['conversation']['findFirst']>>;
type ConversationMessageType = Awaited<ReturnType<PrismaClient['conversationMessage']['findFirst']>>;

export interface CreateConversationInput {
  user_id: string;
  session_id?: string;
  title?: string;
  context?: any;
}

export interface AddMessageInput {
  conversation_id: string;
  user_id: string;
  sender_type: 'user' | 'assistant';
  message_text: string;
  media_attachments?: any;
  metadata?: any;
}

export interface GetMessagesOptions {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

export class ConversationRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get or create a conversation for a user and session
   */
  async getOrCreateConversation(
    userId: string, 
    sessionId?: string,
    title?: string
  ): Promise<NonNullable<ConversationType>> {
    // Try to find existing conversation by session_id if provided
    if (sessionId) {
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          user_id: userId,
          metadata: {
            path: ["session_id"],
            equals: sessionId
          }
        },
        orderBy: { last_active_time: 'desc' }
      });

      if (existingConversation) {
        return existingConversation;
      }
    }

    // Create new conversation
    return await this.prisma.conversation.create({
      data: {
        user_id: userId,
        title: title || 'New Conversation',
        start_time: new Date(),
        last_active_time: new Date(),
        context_summary: null,
        metadata: {
          session_id: sessionId || `session-${Date.now()}-${userId}`
        }
      }
    });
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(input: AddMessageInput): Promise<NonNullable<ConversationMessageType>> {
    const message = await this.prisma.conversationMessage.create({
      data: {
        conversation_id: input.conversation_id,
        user_id: input.user_id,
        role: input.sender_type,
        content: input.message_text,
        message_type: 'text',
        media_ids: [],
        timestamp: new Date(),
        processing_status: 'processed',
        metadata: input.metadata || {}
      }
    });

    // Update conversation's last_active_time timestamp
    await this.prisma.conversation.update({
      where: { id: input.conversation_id },
      data: { last_active_time: new Date() }
    });

    return message;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string, 
    options: GetMessagesOptions = {}
  ): Promise<NonNullable<ConversationMessageType>[]> {
    const { limit = 50, offset = 0, order = 'asc' } = options;

    return await this.prisma.conversationMessage.findMany({
      where: { conversation_id: conversationId },
      orderBy: { timestamp: order },
      take: limit,
      skip: offset
    });
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<ConversationType> {
    return await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });
  }

  /**
   * Get conversations for a user
   */
  async getUserConversations(
    userId: string, 
    options: GetMessagesOptions = {}
  ): Promise<NonNullable<ConversationType>[]> {
    const { limit = 20, offset = 0 } = options;

    return await this.prisma.conversation.findMany({
      where: { user_id: userId },
      orderBy: { last_active_time: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * End a conversation
   */
  async endConversation(conversationId: string): Promise<NonNullable<ConversationType>> {
    return await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        last_active_time: new Date(),
        metadata: {
          ended_at: new Date().toISOString()
        }
      }
    });
  }
} 