/**
 * ProactivePromptRepository.ts
 * V9.7 Repository for ProactivePrompt operations
 */
import { ProactivePrompt, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
export interface CreateProactivePromptData {
    user_id: string;
    prompt_text: string;
    source_agent: string;
    metadata?: Prisma.InputJsonValue;
}
export interface UpdateProactivePromptData {
    status?: string;
    metadata?: Prisma.InputJsonValue;
}
export declare class ProactivePromptRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateProactivePromptData): Promise<ProactivePrompt>;
    findById(promptId: string): Promise<ProactivePrompt | null>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<ProactivePrompt[]>;
    findPendingByUserId(userId: string, limit?: number): Promise<ProactivePrompt[]>;
    findByStatus(status: string, limit?: number): Promise<ProactivePrompt[]>;
    findBySourceAgent(userId: string, sourceAgent: string, limit?: number): Promise<ProactivePrompt[]>;
    update(promptId: string, data: UpdateProactivePromptData): Promise<ProactivePrompt>;
    markAsDelivered(promptId: string): Promise<ProactivePrompt>;
    markAsRead(promptId: string): Promise<ProactivePrompt>;
    markAsActioned(promptId: string): Promise<ProactivePrompt>;
    delete(promptId: string): Promise<void>;
    count(userId?: string, status?: string): Promise<number>;
    getRecentPrompts(userId: string, days?: number, limit?: number): Promise<ProactivePrompt[]>;
}
//# sourceMappingURL=ProactivePromptRepository.d.ts.map