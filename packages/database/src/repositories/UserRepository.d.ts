/**
 * UserRepository.ts
 * V9.7 Repository for User entity operations
 */
import { User, Prisma } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';
export interface CreateUserData {
    email: string;
    hashed_password?: string;
    name?: string;
    region?: string;
    timezone?: string;
    language_preference?: string;
    profile_picture_url?: string;
    preferences?: Prisma.InputJsonValue;
}
export interface UpdateUserData {
    name?: string;
    profile_picture_url?: string;
    timezone?: string;
    language_preference?: string;
    preferences?: Prisma.InputJsonValue;
    memory_profile?: Prisma.InputJsonValue;
    knowledge_graph_schema?: Prisma.InputJsonValue;
    next_conversation_context_package?: Prisma.InputJsonValue;
    last_cycle_started_at?: Date;
    concepts_created_in_cycle?: number;
}
export declare class UserRepository {
    private db;
    constructor(db: DatabaseService);
    create(data: CreateUserData): Promise<User>;
    findById(userId: string): Promise<User | null>;
    findUserByIdWithContext(userId: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(userId: string, data: UpdateUserData): Promise<User>;
    updateLastActive(userId: string): Promise<User>;
    updateMemoryProfile(userId: string, memoryProfile: Prisma.InputJsonValue): Promise<User>;
    updateKnowledgeGraphSchema(userId: string, schema: Prisma.InputJsonValue): Promise<User>;
    updateNextConversationContext(userId: string, context: Prisma.InputJsonValue): Promise<User>;
    startNewCycle(userId: string): Promise<User>;
    incrementConceptsInCycle(userId: string): Promise<User>;
    delete(userId: string): Promise<void>;
    findMany(limit?: number, offset?: number): Promise<User[]>;
    count(): Promise<number>;
}
//# sourceMappingURL=UserRepository.d.ts.map