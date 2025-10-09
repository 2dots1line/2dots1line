import { PrismaClient } from '@prisma/client';
import { Driver as Neo4jDriver, driver as neo4jDriver, auth as neo4jAuth } from 'neo4j-driver';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import Redis from 'ioredis';
import { prisma } from './prisma-client';
import { environmentLoader } from '@2dots1line/core-utils';
import { LLMInteractionRepository } from './repositories/LLMInteractionRepository';
import { CommunityRepository } from './repositories/CommunityRepository';
import { ConnectionPoolMonitor } from './services/ConnectionPoolMonitor';

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
  public readonly connectionPoolMonitor: ConnectionPoolMonitor;

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

    // 3. Initialize Weaviate Client with Connection Pooling
    const weaviateUrl = environmentLoader.get('WEAVIATE_URL') || `${environmentLoader.get('WEAVIATE_SCHEME_DOCKER') || 'http'}://${environmentLoader.get('WEAVIATE_HOST_DOCKER') || 'localhost:8080'}`;
    const weaviateScheme = weaviateUrl.startsWith('https') ? 'https' : 'http';
    const weaviateHost = weaviateUrl.replace(/^https?:\/\//, '');
    
    // Enhanced Weaviate client configuration with connection pooling
    this.weaviate = weaviate.client({
      scheme: weaviateScheme as 'http' | 'https',
      host: weaviateHost,
      // Connection pooling and timeout configuration
      headers: {
        'User-Agent': '2dots1line-hrt/1.0'
      }
      // Note: Weaviate client doesn't support timeout/retry config directly
      // Timeout protection is handled at the application level in HRT
    });

    // 4. Initialize Redis Client with Connection Pooling
    const redisUrl = environmentLoader.get('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        // Connection pool configuration to prevent exhaustion
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: true,
        // Connection pool settings
        family: 4, // IPv4
        keepAlive: 30000, // Keep alive timeout in milliseconds
        // Connection timeout settings
        connectTimeout: 10000,
        commandTimeout: 10000, // Increased from 5000ms to 10000ms for stability
        enableOfflineQueue: true
      });
    } else {
      const redisHost = environmentLoader.get('REDIS_HOST') || environmentLoader.get('REDIS_HOST_DOCKER') || 'localhost';
      const redisPort = parseInt(environmentLoader.get('REDIS_PORT') || environmentLoader.get('REDIS_PORT_DOCKER') || '6379');
      this.redis = new Redis({ 
        host: redisHost, 
        port: redisPort,
        // Same connection pool configuration
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: true,
        family: 4,
        keepAlive: 30000, // Keep alive timeout in milliseconds
        connectTimeout: 10000,
        commandTimeout: 10000, // Increased from 5000ms to 10000ms for stability
        enableOfflineQueue: true
      });
    }

    // 5. Initialize Repositories
    this.llmInteractionRepository = new LLMInteractionRepository(this);
    this.communityRepository = new CommunityRepository(this);

    // 6. Initialize Connection Pool Monitor
    this.connectionPoolMonitor = new ConnectionPoolMonitor(this);

    console.log('DatabaseService Redis configured:', 
      redisUrl || `${environmentLoader.get('REDIS_HOST') || 'localhost'}:${environmentLoader.get('REDIS_PORT') || '6379'}`,
      `(NODE_ENV: ${environmentLoader.get('NODE_ENV') || 'development'})`
    );

    console.log('DatabaseService initialized with all clients, repositories, and connection pool monitoring.');
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

  /**
   * Retry wrapper for Redis operations with exponential backoff
   * Protects against transient Redis connection issues during Cosmos Quest streaming
   * 
   * @param operation - The Redis operation to execute
   * @param operationName - Name of the operation for logging
   * @param maxAttempts - Maximum retry attempts (default: 3)
   * @returns Result of the Redis operation
   */
  public async redisWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Redis operation',
    maxAttempts: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          break;
        }
        
        // Exponential backoff: 100ms, 200ms, 400ms
        const delayMs = 100 * Math.pow(2, attempt - 1);
        console.warn(
          `⚠️ DatabaseService.redisWithRetry: ${operationName} failed (attempt ${attempt}/${maxAttempts}). ` +
          `Retrying in ${delayMs}ms. Error: ${lastError.message}`
        );
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // All attempts failed
    console.error(
      `❌ DatabaseService.redisWithRetry: ${operationName} failed after ${maxAttempts} attempts. ` +
      `Last error: ${lastError?.message || 'Unknown error'}`
    );
    throw lastError;
  }

  /**
   * Lightweight KV helpers backed by Redis with retry
   */
  public async kvGet<T = any>(key: string): Promise<T | null> {
    const raw = await this.redisWithRetry(() => this.redis.get(key), `GET ${key}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null as any;
    }
  }

  public async kvSet<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redisWithRetry(() => this.redis.set(key, payload, 'EX', ttlSeconds), `SETEX ${key}`);
    } else {
      await this.redisWithRetry(() => this.redis.set(key, payload), `SET ${key}`);
    }
  }

  public async kvDel(key: string): Promise<void> {
    // Check if key contains wildcards for pattern deletion
    if (key.includes('*')) {
      // Use SCAN to find matching keys and delete them
      const keys = await this.redisWithRetry(async () => {
        const stream = this.redis.scanStream({
          match: key,
          count: 100
        });
        
        const foundKeys: string[] = [];
        return new Promise<string[]>((resolve, reject) => {
          stream.on('data', (resultKeys: string[]) => {
            foundKeys.push(...resultKeys);
          });
          stream.on('end', () => resolve(foundKeys));
          stream.on('error', reject);
        });
      }, `SCAN ${key}`);
      
      if (keys.length > 0) {
        await this.redisWithRetry(() => this.redis.del(...keys), `DEL ${keys.length} keys`);
      }
    } else {
      // Single key deletion
      await this.redisWithRetry(() => this.redis.del(key), `DEL ${key}`);
    }
  }

  /**
   * Get connection pool metrics and health status
   */
  getConnectionPoolMetrics() {
    return this.connectionPoolMonitor.getMetrics();
  }

  /**
   * Get connection pool health status
   */
  getConnectionPoolHealth() {
    return this.connectionPoolMonitor.getHealthStatus();
  }

  /**
   * Log connection pool metrics
   */
  logConnectionPoolMetrics() {
    this.connectionPoolMonitor.logMetrics();
  }

  // Method to gracefully close all connections
  public async closeConnections(): Promise<void> {
    // Log final connection pool metrics
    this.logConnectionPoolMetrics();
    
    await this.prisma.$disconnect();
    await this.neo4j.close();
    // Redis client in ioredis handles connection closing automatically or with .quit()
    this.redis.quit();
    console.log("Database connections closed.");
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance(); 