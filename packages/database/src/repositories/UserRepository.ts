/**
 * UserRepository.ts
 * V9.7 Repository for User entity operations
 */

import { DatabaseService } from '../DatabaseService';
import { randomUUID } from 'crypto';

// Use any type for now since Prisma types are complex
type users = any;

export interface CreateUserData {
  email: string;
  hashed_password?: string;
  name?: string;
  region?: string;
  timezone?: string;
  language_preference?: string;
  profile_picture_url?: string;
  preferences?: any;
}

export interface UpdateUserData {
  name?: string;
  profile_picture_url?: string;
  timezone?: string;
  language_preference?: string;
  preferences?: any;
  memory_profile?: any;
  next_conversation_context_package?: any;
  key_phrases?: any;
  last_cycle_started_at?: Date;
  concepts_created_in_cycle?: number;
  hashed_password?: string;
}

export class UserRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateUserData): Promise<users> {
    const user = await this.db.prisma.users.create({
      data: {
        user_id: randomUUID(),
        account_status: 'active',
        ...data,
      },
    });
    return user;
  }

  async findById(userId: string): Promise<users | null> {
    return this.db.prisma.users.findUnique({
      where: { user_id: userId },
    });
  }

  async findUserByIdWithContext(userId: string): Promise<users | null> {
    return this.db.prisma.users.findUnique({
      where: { user_id: userId },
    });
  }

  async findByEmail(email: string): Promise<users | null> {
    return this.db.prisma.users.findUnique({
      where: { email },
    });
  }

  async update(userId: string, data: UpdateUserData): Promise<users> {
    return this.db.prisma.users.update({
      where: { user_id: userId },
      data,
    });
  }

  async updateLastActive(userId: string): Promise<users> {
    return this.db.prisma.users.update({
      where: { user_id: userId },
      data: { last_active_at: new Date() },
    });
  }

  async updateMemoryProfile(userId: string, memoryProfile: any): Promise<users> {
    return this.db.prisma.users.update({
      where: { user_id: userId },
      data: { memory_profile: memoryProfile },
    });
  }


  async updateNextConversationContext(userId: string, context: any): Promise<users> {
    return this.db.prisma.users.update({
      where: { user_id: userId },
      data: { next_conversation_context_package: context },
    });
  }

  async startNewCycle(userId: string): Promise<users> {
    return this.db.prisma.users.update({
      where: { user_id: userId },
      data: {
        last_cycle_started_at: new Date(),
        concepts_created_in_cycle: 0,
      },
    });
  }

  async incrementConceptsInCycle(userId: string): Promise<users> {
    return this.db.prisma.users.update({
      where: { user_id: userId },
      data: {
        concepts_created_in_cycle: {
          increment: 1,
        },
      },
    });
  }

  async delete(userId: string): Promise<void> {
    await this.db.prisma.users.delete({
      where: { user_id: userId },
    });
  }

  async findMany(limit = 50, offset = 0): Promise<users[]> {
    return this.db.prisma.users.findMany({
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });
  }

  async count(): Promise<number> {
    return this.db.prisma.users.count();
  }
} 