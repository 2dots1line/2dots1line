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

// Re-export Prisma types (all model types are available via the wildcard export above)
// Common model types are: users, conversations, conversation_messages, cards, memory_units, concepts, communities, etc.

// Repositories
export * from './repositories';

// Services
export { Neo4jService } from './services/Neo4jService';
export { WeaviateService } from './services/WeaviateService';
export { InsightQueryLibrary } from './services/InsightQueryLibrary';
export { DashboardService } from './services/DashboardService';
export { DashboardConfigService } from './services/DashboardConfigService';
export { GraphProjectionRepository } from './repositories/GraphProjectionRepository';
export { UnifiedPersistenceService } from './services/UnifiedPersistenceService';
export type { StandardizedEntity, EntityType, PersistenceOptions, PersistenceResult, BatchPersistenceResult } from './services/UnifiedPersistenceService';

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