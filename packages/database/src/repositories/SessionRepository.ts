/**
 * SessionRepository.ts
 * V11.0 Repository for managing user sessions and their lifecycle
 * 
 * This repository handles:
 * - Creating new sessions for chat windows
 * - Managing session activity and expiration
 * - Retrieving conversations within sessions
 * - Session-conversation relationships
 */

import { DatabaseService } from '../DatabaseService';
// Use any types for now since Prisma types are complex
type user_sessions = any;
type conversations = any;
import { randomUUID } from 'crypto';

export interface CreateSessionData {
  user_id: string;
}

export interface SessionWithConversations extends user_sessions {
  conversations: conversations[];
}

export class SessionRepository {
  constructor(private db: DatabaseService) {}

  /**
   * Create a new session for a user's chat window
   */
  async createSession(data: CreateSessionData): Promise<user_sessions> {
    const sessionId = randomUUID();
    
    return this.db.prisma.user_sessions.create({
      data: {
        session_id: sessionId,
        user_id: data.user_id,
        expires_at: null, // Sessions don't expire - they persist until explicitly closed
        last_active_at: new Date()
      }
    });
  }


  /**
   * Get a specific session by ID
   */
  async getSessionById(sessionId: string): Promise<user_sessions | null> {
    // Add validation for sessionId
    if (!sessionId || sessionId.trim() === '') {
      console.warn('⚠️ SessionRepository.getSessionById - Invalid sessionId provided:', sessionId);
      return null;
    }
    
    try {
      return this.db.prisma.user_sessions.findUnique({
        where: { session_id: sessionId }
      });
    } catch (error) {
      console.error('❌ SessionRepository.getSessionById error:', error);
      return null;
    }
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.db.prisma.user_sessions.update({
      where: { session_id: sessionId },
      data: { last_active_at: new Date() }
    });
  }

  /**
   * Get all conversations within a session
   */
  async getConversationsInSession(sessionId: string): Promise<conversations[]> {
    return this.db.prisma.conversations.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' },
      include: {
        conversation_messages: {
          orderBy: { created_at: 'desc' },
          take: 5 // Get last 5 messages from each conversation
        }
      }
    });
  }

  /**
   * Get sessions for a user with conversation counts
   */
  async getUserSessions(userId: string, limit = 50): Promise<SessionWithConversations[]> {
    return this.db.prisma.user_sessions.findMany({
      where: { user_id: userId },
      take: limit,
      orderBy: { last_active_at: 'desc' },
      include: {
        conversations: {
          orderBy: { created_at: 'desc' }
          // Get all conversations for the session
        }
      }
    }) as Promise<SessionWithConversations[]>;
  }

  /**
   * Find the most recent active session for a user
   */
  async findActiveSessionByUserId(userId: string): Promise<user_sessions | null> {
    return this.db.prisma.user_sessions.findFirst({
      where: { user_id: userId },
      orderBy: { last_active_at: 'desc' }
    });
  }

  /**
   * Check if a session is still active
   */
  async isSessionActive(sessionId: string): Promise<boolean> {
    const session = await this.db.prisma.user_sessions.findUnique({
      where: { session_id: sessionId }
    });

    return !!session; // Session is active if it exists (no expiration check)
  }

  // Sessions don't expire - they persist until explicitly closed by the user
  // No expiration extension or cleanup methods needed
}
