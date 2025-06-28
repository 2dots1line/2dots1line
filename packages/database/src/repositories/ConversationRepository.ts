/**
 * ConversationRepository.ts
 * V9.7 Repository for Conversation and ConversationMessage operations
 */

import { Conversation, ConversationMessage, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';

export interface CreateConversationData {
  user_id: string;
  title?: string;
  source_card_id?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface CreateMessageData {
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  llm_call_metadata?: Prisma.InputJsonValue;
  media_ids?: string[];
}

export interface UpdateConversationData {
  title?: string;
  status?: string;
  importance_score?: number;
  context_summary?: string;
  metadata?: Prisma.InputJsonValue;
  ended_at?: Date;
}

export interface ConversationSummary {
  conversation_summary: string;
  conversation_importance_score: number;
}

export class ConversationRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateConversationData): Promise<Conversation> {
    return this.db.prisma.conversation.create({
      data,
    });
  }

  async findById(conversationId: string): Promise<Conversation | null> {
    return this.db.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        source_card: true,
        spawned_memory_units: true,
      },
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Conversation[]> {
    return this.db.prisma.conversation.findMany({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      orderBy: { start_time: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }

  async findActiveByUserId(userId: string): Promise<Conversation[]> {
    return this.db.prisma.conversation.findMany({
      where: {
        user_id: userId,
        status: 'active',
      },
      orderBy: { start_time: 'desc' },
    });
  }

  async update(conversationId: string, data: UpdateConversationData): Promise<Conversation> {
    return this.db.prisma.conversation.update({
      where: { id: conversationId },
      data,
    });
  }

  async endConversation(conversationId: string, summary?: string): Promise<Conversation> {
    return this.db.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'ended',
        ended_at: new Date(),
        context_summary: summary,
      },
    });
  }

  // Message operations
  async addMessage(data: CreateMessageData): Promise<ConversationMessage> {
    return this.db.prisma.conversationMessage.create({
      data,
    });
  }

  async getMessages(conversationId: string, limit = 100, offset = 0): Promise<ConversationMessage[]> {
    return this.db.prisma.conversationMessage.findMany({
      where: { conversation_id: conversationId },
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'asc' },
    });
  }

  async getLastMessage(conversationId: string): Promise<ConversationMessage | null> {
    return this.db.prisma.conversationMessage.findFirst({
      where: { conversation_id: conversationId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getMessageCount(conversationId: string): Promise<number> {
    return this.db.prisma.conversationMessage.count({
      where: { conversation_id: conversationId },
    });
  }

  // V10.8 PromptBuilder methods
  async getMostRecentMessages(conversationId: string, limit = 10): Promise<ConversationMessage[]> {
    return this.db.prisma.conversationMessage.findMany({
      where: { conversation_id: conversationId },
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
  }

  async getRecentImportantConversationSummaries(userId: string, limit = 5): Promise<ConversationSummary[]> {
    const conversations = await this.db.prisma.conversation.findMany({
      where: {
        user_id: userId,
        status: 'ended',
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
    await this.db.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  async findByStatus(status: string, limit = 50): Promise<Conversation[]> {
    return this.db.prisma.conversation.findMany({
      where: { status },
      take: limit,
      orderBy: { start_time: 'desc' },
    });
  }

  async count(userId?: string): Promise<number> {
    return this.db.prisma.conversation.count({
      where: userId ? { user_id: userId } : undefined,
    });
  }
} 