import { PrismaClient } from '@prisma/client';
import { Driver as Neo4jDriver, driver as neo4jDriver, auth as neo4jAuth } from 'neo4j-driver';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import Redis from 'ioredis';
import { prisma } from './prisma-client';

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
export class DatabaseService {
  public readonly prisma: PrismaClient;
  public readonly neo4j: Neo4jDriver;
  public readonly weaviate: WeaviateClient;
  public readonly redis: Redis;

  private static instance: DatabaseService;

  // Use a private constructor to enforce singleton pattern for the service itself
  private constructor() {
    // 1. Assign the singleton Prisma client
    this.prisma = prisma;

    // 2. Initialize Neo4j Client
    this.neo4j = neo4jDriver(
      process.env.NEO4J_URI_DOCKER || 'bolt://localhost:7687',
      neo4jAuth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
    );

    // 3. Initialize Weaviate Client
    this.weaviate = weaviate.client({
      scheme: (process.env.WEAVIATE_SCHEME_DOCKER as 'http' | 'https') || 'http',
      host: process.env.WEAVIATE_HOST_DOCKER || 'localhost:8080',
    });

    // 4. Initialize Redis Client
    this.redis = new Redis({
      host: process.env.REDIS_HOST_DOCKER || 'localhost',
      port: parseInt(process.env.REDIS_PORT_FOR_APP_IN_DOCKER || '6379'),
      // Add password if necessary: password: process.env.REDIS_PASSWORD
    });

    console.log("DatabaseService initialized with all clients.");
  }

  // Public method to get the singleton instance of the DatabaseService
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Method to gracefully close all connections
  public async closeConnections(): Promise<void> {
    await this.prisma.$disconnect();
    await this.neo4j.close();
    // Redis client in ioredis handles connection closing automatically or with .quit()
    this.redis.quit();
    console.log("Database connections closed.");
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance(); 