/**
 * UserRepository.ts
 * V9.7 Repository for User entity operations
 */

import { PrismaClient, User, Prisma } from '@prisma/client';
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

export class UserRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateUserData): Promise<User> {
    return this.db.prisma.user.create({
      data: {
        ...data,
        account_status: 'active',
      },
    });
  }

  async findById(userId: string): Promise<User | null> {
    return this.db.prisma.user.findUnique({
      where: { user_id: userId },
    });
  }

  async findUserByIdWithContext(userId: string): Promise<User | null> {
    return this.db.prisma.user.findUnique({
      where: { user_id: userId },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(userId: string, data: UpdateUserData): Promise<User> {
    return this.db.prisma.user.update({
      where: { user_id: userId },
      data,
    });
  }

  async updateLastActive(userId: string): Promise<User> {
    return this.db.prisma.user.update({
      where: { user_id: userId },
      data: { last_active_at: new Date() },
    });
  }

  async updateMemoryProfile(userId: string, memoryProfile: Prisma.InputJsonValue): Promise<User> {
    return this.db.prisma.user.update({
      where: { user_id: userId },
      data: { memory_profile: memoryProfile },
    });
  }

  async updateKnowledgeGraphSchema(userId: string, schema: Prisma.InputJsonValue): Promise<User> {
    return this.db.prisma.user.update({
      where: { user_id: userId },
      data: { knowledge_graph_schema: schema },
    });
  }

  async updateNextConversationContext(userId: string, context: Prisma.InputJsonValue): Promise<User> {
    return this.db.prisma.user.update({
      where: { user_id: userId },
      data: { next_conversation_context_package: context },
    });
  }

  async startNewCycle(userId: string): Promise<User> {
    return this.db.prisma.user.update({
      where: { user_id: userId },
      data: {
        last_cycle_started_at: new Date(),
        concepts_created_in_cycle: 0,
      },
    });
  }

  async incrementConceptsInCycle(userId: string): Promise<User> {
    return this.db.prisma.user.update({
      where: { user_id: userId },
      data: {
        concepts_created_in_cycle: {
          increment: 1,
        },
      },
    });
  }

  async delete(userId: string): Promise<void> {
    await this.db.prisma.user.delete({
      where: { user_id: userId },
    });
  }

  async findMany(limit = 50, offset = 0): Promise<User[]> {
    return this.db.prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async count(): Promise<number> {
    return this.db.prisma.user.count();
  }
} 