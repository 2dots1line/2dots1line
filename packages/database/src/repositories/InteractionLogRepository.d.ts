/**
 * InteractionLogRepository.ts
 * V9.7 Repository for InteractionLog operations
 */
import { InteractionLog, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
export interface CreateInteractionLogData {
    user_id: string;
    interaction_type: string;
    target_entity_id?: string;
    target_entity_type?: string;
    content_text?: string;
    content_structured?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
}
export declare class InteractionLogRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateInteractionLogData): Promise<InteractionLog>;
    findById(interactionId: string): Promise<InteractionLog | null>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<InteractionLog[]>;
    findByInteractionType(userId: string, interactionType: string, limit?: number): Promise<InteractionLog[]>;
    findByTargetEntity(targetEntityId: string, targetEntityType: string): Promise<InteractionLog[]>;
    findRecentByUserId(userId: string, hours?: number, limit?: number): Promise<InteractionLog[]>;
    count(userId?: string, interactionType?: string): Promise<number>;
    delete(interactionId: string): Promise<void>;
    getInteractionStats(userId: string, days?: number): Promise<{
        total_interactions: number;
        interaction_types: Record<string, number>;
    }>;
}
//# sourceMappingURL=InteractionLogRepository.d.ts.map