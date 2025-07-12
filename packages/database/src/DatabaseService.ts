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
    // Use NEO4J_URI for host connections (PM2 processes) and NEO4J_URI_DOCKER for Docker containers
    const neo4jUri = process.env.NEO4J_URI || process.env.NEO4J_URI_DOCKER || 'bolt://localhost:7687';
    this.neo4j = neo4jDriver(
      neo4jUri,
      neo4jAuth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
    );

    // 3. Initialize Weaviate Client
    // Use WEAVIATE_URL for host connections (PM2 processes) and WEAVIATE_HOST_DOCKER for Docker containers
    const weaviateUrl = process.env.WEAVIATE_URL || `${process.env.WEAVIATE_SCHEME_DOCKER || 'http'}://${process.env.WEAVIATE_HOST_DOCKER || 'localhost:8080'}`;
    const weaviateScheme = weaviateUrl.startsWith('https') ? 'https' : 'http';
    const weaviateHost = weaviateUrl.replace(/^https?:\/\//, '');
    
    this.weaviate = weaviate.client({
      scheme: weaviateScheme as 'http' | 'https',
      host: weaviateHost,
    });

    // 4. Initialize Redis Client
    // Use REDIS_URL for host connections (PM2 processes) and Docker-specific vars for containers
    const redisUrl = process.env.REDIS_URL;
    let redisHost = 'localhost';
    let redisPort = 6379;
    
    if (redisUrl) {
      const url = new URL(redisUrl);
      redisHost = url.hostname;
      redisPort = parseInt(url.port) || 6379;
    } else if (process.env.NODE_ENV === 'production') {
      redisHost = process.env.REDIS_HOST_DOCKER || 'localhost';
      redisPort = parseInt(process.env.REDIS_PORT_FOR_APP_IN_DOCKER || '6379');
    }
    
    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      connectTimeout: 5000,
      lazyConnect: true,
      maxRetriesPerRequest: 3
    });

    console.log(`DatabaseService Redis configured: ${redisHost}:${redisPort} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
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