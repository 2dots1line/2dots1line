/**
 * @2dots1line/database - V9.7 Main Export File
 * 
 * This package provides centralized access to all persistence layers:
 * - PostgreSQL (via Prisma)
 * - Neo4j (via neo4j-driver) 
 * - Weaviate (via weaviate-ts-client)
 * - Redis (via ioredis)
 */

// Core Database Service
export { DatabaseService, databaseService } from './DatabaseService';

// Prisma Client Singleton
export { prisma } from './prisma-client';

// Re-export Prisma types for convenience
export * from '@prisma/client';

// Explicitly re-export commonly used Prisma model types
export type { 
  users, 
  conversations, 
  conversation_messages, 
  cards,
  memory_units,
  concepts,
  communities,
  Prisma 
} from '@prisma/client';

// Repositories
export * from './repositories';

// Services
export { Neo4jService } from './services/Neo4jService';
export { WeaviateService } from './services/WeaviateService';
export { InsightQueryLibrary } from './services/InsightQueryLibrary';
export { GraphProjectionRepository } from './repositories/GraphProjectionRepository';

// Monitoring utilities
export { RedisConnectionMonitor } from './RedisConnectionMonitor';

// Type definitions for database operations
export interface DatabaseConnectionStatus {
  postgres: boolean;
  neo4j: boolean;
  weaviate: boolean;
  redis: boolean;
}

export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
} 