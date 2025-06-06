/**
 * Database Access Layer for 2dots1line V4
 * Provides client wrappers for PostgreSQL, Neo4j, Weaviate, and Redis
 */

import { PrismaClient } from './prisma-client';
import neo4j, { Driver } from 'neo4j-driver';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import Redis, { Redis as RedisClient } from 'ioredis';

// Export configuration utilities
export { 
  loadDatabaseConfig,
  initializeDatabases,
  checkDatabasesHealth,
  closeDatabases,
  type DatabaseConfig
} from './config';

// Export Prisma client (PostgreSQL)
export { 
  prisma,
  disconnectPrisma,
  prismaHealthCheck,
  PrismaClientWrapper
} from './prisma';

// Export Neo4j client
export {
  neo4jDriver,
  recordToObject,
  type Neo4jConfig
} from './neo4j';

// Export Weaviate client
export {
  weaviateClient,
  type WeaviateConfig,
  type WeaviateSearchResult
} from './weaviate';

// Export Redis client
export {
  redisClient,
  type RedisConfig,
  TTL,
  RedisClientWrapper
} from './redis';

// Export repositories
export { UserRepository, type CreateUserData } from './repositories/user.repository';
export { MemoryRepository, type CreateMemoryUnitData, type CreateChunkData } from './repositories/memory.repository';
export { ConceptRepository, type CreateConceptData, type CreateConceptRelationshipData } from './repositories/concept.repository';
export { GrowthEventRepository, type CreateGrowthEventData } from './repositories/growth-event.repository';
export { CardRepository, type CardData, type CardFilters } from './repositories/card.repository';
export { ConversationRepository, type CreateConversationInput, type AddMessageInput } from './repositories/conversation.repository';
export { MediaRepository, type CreateMediaInput, type UpdateMediaInput } from './repositories/media.repository';

// Ensure these environment variables are set in your .env file
const DATABASE_URL = process.env.DATABASE_URL; // Used by Prisma internally
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7688';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password123'; // Default from docker-compose

const WEAVIATE_SCHEME = process.env.WEAVIATE_SCHEME || 'http';
const WEAVIATE_HOST = process.env.WEAVIATE_HOST || 'localhost:8080'; // Default from docker-compose

const REDIS_URL = process.env.REDIS_URL; // E.g., redis://localhost:6379

export class DatabaseService {
  private prismaClient: PrismaClient;
  private neo4jDriver: Driver;
  private weaviateClient: WeaviateClient;
  private redisClient: RedisClient;

  constructor() {
    console.log('Initializing DatabaseService...');
    console.log('DATABASE_URL:', DATABASE_URL ? `${DATABASE_URL.substring(0, 20)}...` : 'NOT SET');

    this.prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
      // log: ['query', 'info', 'warn', 'error'], // Optional: for detailed logging
    });
    console.log('PrismaClient configured.');

    this.neo4jDriver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
    );
    console.log('Neo4j Driver configured.');

    this.weaviateClient = weaviate.client({
      scheme: WEAVIATE_SCHEME as string,
      host: WEAVIATE_HOST as string,
      // Can add headers for API keys if Weaviate auth is enabled
    });
    console.log('Weaviate Client configured.');

    if (!REDIS_URL) {
      console.warn('REDIS_URL not provided. Redis client will not be initialized.');
      // Assign a non-functional client or handle appropriately
      this.redisClient = {} as RedisClient; // Or throw error, depending on requirements
    } else {
      this.redisClient = new Redis(REDIS_URL);
      console.log('Redis Client configured.');

      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });
      this.redisClient.on('connect', () => {
        console.log('Redis Client connected.');
      });
    }

    this.testConnections().catch(err => {
        console.error("Failed to connect to one or more databases during initial test:", err);
    });
  }

  public get prisma(): PrismaClient {
    return this.prismaClient;
  }

  public get neo4j(): Driver {
    return this.neo4jDriver;
  }

  public get weaviate(): WeaviateClient {
    return this.weaviateClient;
  }

  public get redis(): RedisClient {
    if (!this.redisClient || typeof this.redisClient.ping !== 'function') {
        throw new Error('Redis client is not initialized or not functional. Check REDIS_URL.');
    }
    return this.redisClient;
  }

  public async testConnections(): Promise<void> {
    try {
      await this.prismaClient.$connect();
      console.log('Successfully connected to PostgreSQL (Prisma).');
    } catch (error) {
      console.error('Failed to connect to PostgreSQL (Prisma):', error);
      // throw error; // Optional: rethrow if critical for startup
    }

    try {
      await this.neo4jDriver.verifyConnectivity();
      console.log('Successfully connected to Neo4j.');
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
      // throw error;
    }

    try {
      const isLive = await this.weaviateClient.misc.liveChecker().do();
      console.log('Successfully connected to Weaviate. Live status:', isLive);
    } catch (error) {
      console.error('Failed to connect to Weaviate:', error);
      // throw error;
    }

    if (this.redisClient && typeof this.redisClient.ping === 'function') {
        try {
          const pong = await this.redisClient.ping();
          console.log('Successfully connected to Redis (ping response):', pong);
        } catch (error) {
          console.error('Failed to connect to Redis:', error);
          // throw error;
        }
    } else {
        console.warn('Redis client not initialized, skipping Redis connection test.');
    }
  }

  public async disconnect(): Promise<void> {
    console.log('Disconnecting DatabaseService...');
    await this.prismaClient.$disconnect();
    console.log('PrismaClient disconnected.');
    await this.neo4jDriver.close();
    console.log('Neo4j Driver closed.');
    // Weaviate client does not have an explicit disconnect method
    if (this.redisClient && typeof this.redisClient.quit === 'function') {
      await this.redisClient.quit();
      console.log('Redis Client disconnected.');
    }
    console.log('DatabaseService disconnected.');
  }

  // Repository factory methods
  public getUserRepository() {
    const { UserRepository } = require('./repositories/user.repository');
    return new UserRepository(this);
  }

  public getMemoryRepository() {
    const { MemoryRepository } = require('./repositories/memory.repository');
    return new MemoryRepository(this);
  }

  public getConceptRepository() {
    const { ConceptRepository } = require('./repositories/concept.repository');
    return new ConceptRepository(this);
  }

  public getGrowthEventRepository() {
    const { GrowthEventRepository } = require('./repositories/growth-event.repository');
    return new GrowthEventRepository(this);
  }

  public getCardRepository() {
    const { CardRepository } = require('./repositories/card.repository');
    return new CardRepository(this);
  }

  public getConversationRepository() {
    const { ConversationRepository } = require('./repositories/conversation.repository');
    return new ConversationRepository(this.prismaClient);
  }

  public getMediaRepository() {
    const { MediaRepository } = require('./repositories/media.repository');
    return new MediaRepository(this.prismaClient);
  }

  // Direct client access methods
  public getPrismaClient(): PrismaClient {
    return this.prismaClient;
  }

  public getNeo4j(): Driver {
    return this.neo4jDriver;
  }

  public getWeaviate(): WeaviateClient {
    return this.weaviateClient;
  }

  public getRedis(): RedisClient {
    if (!this.redisClient || typeof this.redisClient.ping !== 'function') {
        throw new Error('Redis client is not initialized or not functional. Check REDIS_URL.');
    }
    return this.redisClient;
  }
}

// Optional: Export a singleton instance
// export const databaseService = new DatabaseService(); 