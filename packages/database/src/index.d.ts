/**
 * @2dots1line/database - V9.7 Main Export File
 *
 * This package provides centralized access to all persistence layers:
 * - PostgreSQL (via Prisma)
 * - Neo4j (via neo4j-driver)
 * - Weaviate (via weaviate-ts-client)
 * - Redis (via ioredis)
 */
export { DatabaseService, databaseService } from './DatabaseService';
export { prisma } from './prisma-client';
export * from '@prisma/client';
export * from './repositories';
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
//# sourceMappingURL=index.d.ts.map