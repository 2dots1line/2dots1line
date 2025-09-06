/**
 * ConversationRepository.ts
 * V9.7 Repository for Conversation and ConversationMessage operations
 */

import { DatabaseService } from '../DatabaseService';
import type { conversations, conversation_messages, Prisma } from '@2dots1line/database';
import { randomUUID } from 'crypto';

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
  role: 'user' | 'assistant';
  content: string;
  llm_call_metadata?: any;
  media_ids?: string[];
}

export interface UpdateConversationData {
  title?: string;
  status?: string;
  importance_score?: number;
  context_summary?: string;
  metadata?: any;
  ended_at?: Date;
}

export interface ConversationSummary {
  conversation_summary: string;
  conversation_importance_score: number;
}

export class ConversationRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateConversationData): Promise<conversations> {
    return this.db.prisma.conversations.create({
      data: {
        id: data.id || randomUUID(), // Use provided ID or generate new one
        ...data,
      },
    });
  }

  async findById(conversationId: string): Promise<conversations | null> {
    return this.db.prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        conversation_messages: {
          orderBy: { timestamp: 'asc' },
        },
        cards: true,
        memory_units: true,
      },
    });
  }

  // NEW METHOD: Get conversation with session_id explicitly included
  async findByIdWithSessionId(conversationId: string): Promise<{ id: string; user_id: string; title: string | null; start_time: Date; ended_at: Date | null; context_summary: string | null; metadata: any; importance_score: number | null; source_card_id: string | null; status: string; session_id: string | null } | null> {
    return this.db.prisma.conversations.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        user_id: true,
        title: true,
        start_time: true,
        ended_at: true,
        context_summary: true,
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
      orderBy: { start_time: 'desc' },
      include: {
        conversation_messages: {
          take: 1,
          orderBy: { timestamp: 'desc' },
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
      orderBy: { start_time: 'desc' },
    });
  }

  async update(conversationId: string, data: UpdateConversationData): Promise<conversations> {
    return this.db.prisma.conversations.update({
      where: { id: conversationId },
      data,
    });
  }

  async endConversation(conversationId: string, summary?: string): Promise<conversations> {
    return this.db.prisma.conversations.update({
      where: { id: conversationId },
      data: {
        status: 'ended',
        ended_at: new Date(),
        context_summary: summary,
      },
    });
  }

  // Message operations
  async addMessage(data: CreateMessageData): Promise<conversation_messages> {
    return this.db.prisma.conversation_messages.create({
      data: {
        id: randomUUID(),
        ...data,
      },
    });
  }

  async getMessages(conversationId: string, limit = 100, offset = 0): Promise<conversation_messages[]> {
    return this.db.prisma.conversation_messages.findMany({
      where: { conversation_id: conversationId },
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'asc' },
    });
  }

  async getLastMessage(conversationId: string): Promise<conversation_messages | null> {
    return this.db.prisma.conversation_messages.findFirst({
      where: { conversation_id: conversationId },
      orderBy: { timestamp: 'desc' },
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
      orderBy: { timestamp: 'desc' },
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
        context_summary: {
          not: null, // Only conversations that have summaries
        },
      },
      take: limit,
      orderBy: [
        { importance_score: 'desc' },
        { ended_at: 'desc' },
      ],
      select: {
        context_summary: true,
        importance_score: true,
      },
    });

    return conversations.map(conv => ({
      conversation_summary: conv.context_summary || '',
      conversation_importance_score: conv.importance_score || 0,
    }));
  }

  async delete(conversationId: string): Promise<void> {
    // Messages will be deleted via cascade
    await this.db.prisma.conversations.delete({
      where: { id: conversationId },
    });
  }

  async findByStatus(status: string, limit = 50): Promise<conversations[]> {
    return this.db.prisma.conversations.findMany({
      where: { status },
      take: limit,
      orderBy: { start_time: 'desc' },
    });
  }

  async count(userId?: string): Promise<number> {
    return this.db.prisma.conversations.count({
      where: userId ? { user_id: userId } : undefined,
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
        id: { not: currentConversationId },
        status: { in: ['ended', 'processed'] }, // Include both ended and processed conversations
        ended_at: { not: null }
      },
      orderBy: { ended_at: 'desc' },
      include: {
        conversation_messages: {
          orderBy: { timestamp: 'desc' },
          take: limit
        }
      }
    });

    console.log(`🔍 ConversationRepository.getSessionContext - Previous conversation found:`, {
      sessionId,
      currentConversationId,
      previousConversationId: previousConversation?.id,
      previousConversationStatus: previousConversation?.status,
      previousConversationEndedAt: previousConversation?.ended_at,
      messageCount: previousConversation?.conversation_messages?.length || 0
    });

    return previousConversation?.conversation_messages || [];
  }

  // NEW METHOD: Assign conversation to session
  async assignToSession(conversationId: string, sessionId: string): Promise<void> {
    await this.db.prisma.conversations.update({
      where: { id: conversationId },
      data: { session_id: sessionId }
    });
  }

  // ENHANCED METHOD: Get conversation with session info
  async findByIdWithSession(conversationId: string): Promise<conversations | null> {
    return this.db.prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        conversation_messages: {
          orderBy: { timestamp: 'asc' },
        },
        cards: true,
        memory_units: true,
        user_sessions: true // Include session information
      },
    });
  }

} 