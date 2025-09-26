/**
 * ConversationRepository.ts
 * V9.7 Repository for Conversation and ConversationMessage operations
 */

import { DatabaseService } from '../DatabaseService';
import type { Prisma } from '@2dots1line/database';
import { randomUUID } from 'crypto';

// Use any for now - the types are complex and the functionality works
type conversations = any;
type conversation_messages = any;

export interface CreateConversationData {
  user_id: string;
  title?: string;
  source_card_id?: string;
  session_id?: string; // NEW: Include session_id for proper linking
  metadata?: any;
  id?: string; // NEW: Allow custom ID to be provided
}

export interface CreateMessageData {
  conversation_id: string;
  type: 'user' | 'assistant';
  content: string;
  metadata?: any;
  media_ids?: string[];
}

export interface UpdateConversationData {
  title?: string;
  status?: string;
  importance_score?: number;
  content?: string;
  metadata?: any;
  ended_at?: Date;
  session_id?: string;
  proactive_greeting?: string;
  forward_looking_context?: any;
}

export interface ConversationSummary {
  conversation_summary: string;
  conversation_importance_score: number;
}

export class ConversationRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateConversationData): Promise<conversations> {
    const { id, ...restData } = data; // Extract id field to avoid conflict
    return this.db.prisma.conversations.create({
      data: {
        conversation_id: id || randomUUID(), // Use provided ID or generate new one
        ...restData,
      },
    });
  }

  async findById(conversationId: string): Promise<conversations | null> {
    return this.db.prisma.conversations.findUnique({
      where: { conversation_id: conversationId },
      include: {
        conversation_messages: {
          orderBy: { created_at: 'asc' },
        },
        cards: true,
        memory_units: true,
      },
    });
  }

  // NEW METHOD: Get conversation with session_id explicitly included
  async findByIdWithSessionId(conversationId: string): Promise<{ conversation_id: string; user_id: string; title: string | null; created_at: Date; ended_at: Date | null; content: string | null; metadata: any; importance_score: number | null; source_card_id: string | null; status: string; session_id: string | null } | null> {
    return this.db.prisma.conversations.findUnique({
      where: { conversation_id: conversationId },
      select: {
        conversation_id: true,
        user_id: true,
        title: true,
        created_at: true,
        ended_at: true,
        content: true,
        metadata: true,
        importance_score: true,
        source_card_id: true,
        status: true,
        session_id: true,
      },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<conversations[]> {
    return this.db.prisma.conversations.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
      include: {
        conversation_messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async findActiveByUserId(userId: string): Promise<conversations[]> {
    return this.db.prisma.conversations.findMany({
      where: {
        user_id: userId,
        status: 'active',
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(conversationId: string, data: UpdateConversationData): Promise<conversations> {
    // First check if the conversation exists
    const existingConversation = await this.db.prisma.conversations.findUnique({
      where: { conversation_id: conversationId }
    });
    
    if (!existingConversation) {
      console.error(`[ConversationRepository] Conversation ${conversationId} not found for update`);
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    console.log(`[ConversationRepository] Updating conversation ${conversationId} with data:`, data);
    
    return this.db.prisma.conversations.update({
      where: { conversation_id: conversationId },
      data,
    });
  }

  async endConversation(conversationId: string, summary?: string): Promise<conversations> {
    return this.db.prisma.conversations.update({
      where: { conversation_id: conversationId },
      data: {
        status: 'ended',
        ended_at: new Date(),
        content: summary,
      },
    });
  }

  // Message operations
  async addMessage(data: CreateMessageData): Promise<conversation_messages> {
    const { conversation_id, ...messageData } = data;
    return this.db.prisma.conversation_messages.create({
      data: {
        message_id: randomUUID(),
        ...messageData,
        conversations: {
          connect: {
            conversation_id: conversation_id
          }
        }
      },
    });
  }

  async getMessages(conversationId: string, limit = 100, offset = 0): Promise<conversation_messages[]> {
    return this.db.prisma.conversation_messages.findMany({
      where: { conversation_id: conversationId },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'asc' },
    });
  }

  async getLastMessage(conversationId: string): Promise<conversation_messages | null> {
    return this.db.prisma.conversation_messages.findFirst({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getMessageCount(conversationId: string): Promise<number> {
    return this.db.prisma.conversation_messages.count({
      where: { conversation_id: conversationId },
    });
  }

  // V10.8 PromptBuilder methods
  async getMostRecentMessages(conversationId: string, limit = 10): Promise<conversation_messages[]> {
    return this.db.prisma.conversation_messages.findMany({
      where: { conversation_id: conversationId },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async getRecentImportantConversationSummaries(userId: string, limit = 5): Promise<ConversationSummary[]> {
    const conversations = await this.db.prisma.conversations.findMany({
      where: {
        user_id: userId,
        status: { in: ['ended', 'processed'] }, // Include both ended (waiting for ingestion) and processed (already ingested)
        importance_score: {
          gte: 0.7, // Only conversations with high importance
        },
        content: {
          not: null, // Only conversations that have summaries
        },
      },
      take: limit,
      orderBy: [
        { importance_score: 'desc' },
        { ended_at: 'desc' },
      ],
      select: {
        content: true,
        importance_score: true,
      },
    });

    return conversations.map((conv: any) => ({
      conversation_summary: conv.content || '',
      conversation_importance_score: conv.importance_score || 0,
    }));
  }

  async delete(conversationId: string): Promise<void> {
    // Messages will be deleted via cascade
    await this.db.prisma.conversations.delete({
      where: { conversation_id: conversationId },
    });
  }

  async findByStatus(status: string, limit = 50): Promise<conversations[]> {
    return this.db.prisma.conversations.findMany({
      where: { status },
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async count(userId?: string): Promise<number> {
    return this.db.prisma.conversations.count({
      where: userId ? { user_id: userId } : undefined,
    });
  }

  /**
   * Get the most recently processed conversation for a user with context fields
   * Used by PromptBuilder to get proactive_greeting for new conversation
   */
  async getMostRecentProcessedConversationWithContext(userId: string): Promise<conversations | null> {
    return this.db.prisma.conversations.findFirst({
      where: {
        user_id: userId,
        status: 'processed',
        proactive_greeting: { not: null }
      },
      orderBy: { updated_at: 'desc' },
      select: {
        conversation_id: true,
        proactive_greeting: true,
        forward_looking_context: true,
        updated_at: true,
        title: true
      }
    });
  }

  // NEW METHOD: Get session context from most recently processed conversation
  async getSessionContext(sessionId: string, currentConversationId: string, limit: number = 3): Promise<conversation_messages[]> {
    console.log(`🔍 ConversationRepository.getSessionContext - Starting for session: ${sessionId}, current conversation: ${currentConversationId}`);
    
    // Get the most recently processed conversation in the same session
    // Look for conversations that are either 'ended' (waiting for ingestion) or 'processed' (already ingested)
    const previousConversation = await this.db.prisma.conversations.findFirst({
      where: {
        session_id: sessionId,
        conversation_id: { not: currentConversationId },
        status: { in: ['ended', 'processed'] }, // Include both ended and processed conversations
        ended_at: { not: null }
      },
      orderBy: { ended_at: 'desc' },
      include: {
        conversation_messages: {
          orderBy: { created_at: 'desc' },
          take: limit
        }
      }
    });

    console.log(`🔍 ConversationRepository.getSessionContext - Previous conversation found:`, {
      sessionId,
      currentConversationId,
      previousConversationId: previousConversation?.conversation_id,
      previousConversationStatus: previousConversation?.status,
      previousConversationEndedAt: previousConversation?.ended_at,
      messageCount: 0
    });

    return [];
  }


  // ENHANCED METHOD: Get conversation with session info
  async findByIdWithSession(conversationId: string): Promise<conversations | null> {
    return this.db.prisma.conversations.findUnique({
      where: { conversation_id: conversationId },
      include: {
        conversation_messages: {
          orderBy: { created_at: 'asc' },
        },
        cards: true,
        memory_units: true,
        user_sessions: true // Include session information
      },
    });
  }

}