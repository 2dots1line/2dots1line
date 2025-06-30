import { PrismaClient } from '@prisma/client';
import { Driver as Neo4jDriver } from 'neo4j-driver';
import { WeaviateClient } from 'weaviate-ts-client';
import Redis from 'ioredis';
/**
 * V9.7 DatabaseService
 *
 * Centralized service for managing all database client connections.
 * This service provides a single point of access to all persistence layers:
 * - PostgreSQL (via Prisma)
 * - Neo4j (via neo4j-driver)
 * - Weaviate (via weaviate-ts-client)
 * - Redis (via ioredis)
 */
export declare class DatabaseService {
    readonly prisma: PrismaClient;
    readonly neo4j: Neo4jDriver;
    readonly weaviate: WeaviateClient;
    readonly redis: Redis;
    private static instance;
    private constructor();
    static getInstance(): DatabaseService;
    closeConnections(): Promise<void>;
}
export declare const databaseService: DatabaseService;
//# sourceMappingURL=DatabaseService.d.ts.map