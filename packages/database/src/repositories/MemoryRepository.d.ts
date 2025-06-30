/**
 * MemoryRepository.ts
 * V9.7 Repository for MemoryUnit operations
 */
import { MemoryUnit } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
export interface CreateMemoryUnitData {
    user_id: string;
    title: string;
    content: string;
    creation_ts: Date;
    importance_score?: number;
    sentiment_score?: number;
    source_conversation_id?: string;
}
export interface UpdateMemoryUnitData {
    title?: string;
    content?: string;
    importance_score?: number;
    sentiment_score?: number;
}
export declare class MemoryRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateMemoryUnitData): Promise<MemoryUnit>;
    findById(muid: string): Promise<MemoryUnit | null>;
    /**
     * Batch method for HybridRetrievalTool - find multiple memory units by IDs
     */
    findByIds(muids: string[], userId: string): Promise<MemoryUnit[]>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<MemoryUnit[]>;
    findByConversationId(conversationId: string): Promise<MemoryUnit[]>;
    update(muid: string, data: UpdateMemoryUnitData): Promise<MemoryUnit>;
    delete(muid: string): Promise<void>;
    findByImportanceRange(userId: string, minScore: number, maxScore: number, limit?: number): Promise<MemoryUnit[]>;
    findRecentByUserId(userId: string, days?: number, limit?: number): Promise<MemoryUnit[]>;
    searchByContent(userId: string, searchTerm: string, limit?: number): Promise<MemoryUnit[]>;
    count(userId?: string): Promise<number>;
    getAverageImportanceScore(userId: string): Promise<number>;
}
//# sourceMappingURL=MemoryRepository.d.ts.map