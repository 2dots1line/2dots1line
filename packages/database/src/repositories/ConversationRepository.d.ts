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
export declare class ConversationRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateConversationData): Promise<Conversation>;
    findById(conversationId: string): Promise<Conversation | null>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<Conversation[]>;
    findActiveByUserId(userId: string): Promise<Conversation[]>;
    update(conversationId: string, data: UpdateConversationData): Promise<Conversation>;
    endConversation(conversationId: string, summary?: string): Promise<Conversation>;
    addMessage(data: CreateMessageData): Promise<ConversationMessage>;
    getMessages(conversationId: string, limit?: number, offset?: number): Promise<ConversationMessage[]>;
    getLastMessage(conversationId: string): Promise<ConversationMessage | null>;
    getMessageCount(conversationId: string): Promise<number>;
    getMostRecentMessages(conversationId: string, limit?: number): Promise<ConversationMessage[]>;
    getRecentImportantConversationSummaries(userId: string, limit?: number): Promise<ConversationSummary[]>;
    delete(conversationId: string): Promise<void>;
    findByStatus(status: string, limit?: number): Promise<Conversation[]>;
    count(userId?: string): Promise<number>;
}
//# sourceMappingURL=ConversationRepository.d.ts.map