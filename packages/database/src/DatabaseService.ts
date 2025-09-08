import { PrismaClient } from '@prisma/client';
import { Driver as Neo4jDriver, driver as neo4jDriver, auth as neo4jAuth } from 'neo4j-driver';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import Redis from 'ioredis';
import { prisma } from './prisma-client';
import { environmentLoader } from '@2dots1line/core-utils';
import { LLMInteractionRepository } from './repositories/LLMInteractionRepository';
import { CommunityRepository } from './repositories/CommunityRepository';

/**
 * V9.7 DatabaseService with EnvironmentLoader Integration
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
  public readonly llmInteractionRepository: LLMInteractionRepository;
  public readonly communityRepository: CommunityRepository;

  private static instance: DatabaseService;

  // Use a private constructor to enforce singleton pattern for the service itself
  private constructor() {
    // CRITICAL: Load environment variables first
    console.log('DatabaseService: Loading environment variables...');
    environmentLoader.load();
    
    // 1. Assign the singleton Prisma client
    this.prisma = prisma;

    // 2. Initialize Neo4j Client
    // Use NEO4J_URI for host connections (PM2 processes) and NEO4J_URI_DOCKER for Docker containers
    const neo4jUri = environmentLoader.get('NEO4J_URI') || environmentLoader.get('NEO4J_URI_DOCKER') || 'bolt://localhost:7687';
    const neo4jUser = environmentLoader.get('NEO4J_USER') || environmentLoader.get('NEO4J_USERNAME') || 'neo4j';
    const neo4jPassword = environmentLoader.getRequired('NEO4J_PASSWORD');
    
    this.neo4j = neo4jDriver(neo4jUri, neo4jAuth.basic(neo4jUser, neo4jPassword));

    // 3. Initialize Weaviate Client
    const weaviateUrl = environmentLoader.get('WEAVIATE_URL') || `${environmentLoader.get('WEAVIATE_SCHEME_DOCKER') || 'http'}://${environmentLoader.get('WEAVIATE_HOST_DOCKER') || 'localhost:8080'}`;
    const weaviateScheme = weaviateUrl.startsWith('https') ? 'https' : 'http';
    const weaviateHost = weaviateUrl.replace(/^https?:\/\//, '');
    
    this.weaviate = weaviate.client({
      scheme: weaviateScheme as 'http' | 'https',
      host: weaviateHost,
    });

    // 4. Initialize Redis Client with Connection Pooling
    const redisUrl = environmentLoader.get('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        // Connection pool configuration to prevent exhaustion
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
        // Connection pool settings
        family: 4, // IPv4
        keepAlive: 30000, // Keep alive timeout in milliseconds
        // Connection timeout settings
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableOfflineQueue: true
      });
    } else {
      const redisHost = environmentLoader.get('REDIS_HOST') || environmentLoader.get('REDIS_HOST_DOCKER') || 'localhost';
      const redisPort = parseInt(environmentLoader.get('REDIS_PORT') || environmentLoader.get('REDIS_PORT_DOCKER') || '6379');
      this.redis = new Redis({ 
        host: redisHost, 
        port: redisPort,
        // Same connection pool configuration
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
        family: 4,
        keepAlive: 30000, // Keep alive timeout in milliseconds
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableOfflineQueue: true
      });
    }

    // 5. Initialize Repositories
    this.llmInteractionRepository = new LLMInteractionRepository(this);
    this.communityRepository = new CommunityRepository(this);

    console.log('DatabaseService Redis configured:', 
      redisUrl || `${environmentLoader.get('REDIS_HOST') || 'localhost'}:${environmentLoader.get('REDIS_PORT') || '6379'}`,
      `(NODE_ENV: ${environmentLoader.get('NODE_ENV') || 'development'})`
    );

    console.log('DatabaseService initialized with all clients and repositories.');
  }

  /**
   * Get the singleton instance of DatabaseService
   * Ensures environment variables are loaded before any database connections
   */
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