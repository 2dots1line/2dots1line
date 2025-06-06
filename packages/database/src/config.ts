/**
 * Database Configuration Loader for 2dots1line V4
 * Loads database configuration from environment variables
 */

import { RedisConfig } from './redis';
import { Neo4jConfig } from './neo4j';
import { WeaviateConfig } from './weaviate';

interface DatabaseConfig {
  prisma: {
    url: string;
    logLevel?: 'info' | 'query' | 'warn' | 'error';
  };
  neo4j: Neo4jConfig;
  weaviate: WeaviateConfig;
  redis: RedisConfig;
}

/**
 * Load database configuration from environment variables
 */
export function loadDatabaseConfig(): DatabaseConfig {
  const config: DatabaseConfig = {
    prisma: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/2dots1linev4',
      logLevel: (process.env.PRISMA_LOG_LEVEL || 'info') as 'info' | 'query' | 'warn' | 'error',
    },
    neo4j: {
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      username: process.env.NEO4J_USERNAME || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password',
      database: process.env.NEO4J_DATABASE || '2dots1linev4',
    },
    weaviate: {
      scheme: process.env.WEAVIATE_SCHEME || 'http',
      host: process.env.WEAVIATE_HOST || 'localhost:8080',
      apiKey: process.env.WEAVIATE_API_KEY,
    },
    redis: {
      uri: process.env.REDIS_URI,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
      password: process.env.REDIS_PASSWORD,
      keyPrefix: process.env.REDIS_KEY_PREFIX || '2dots1linev4:',
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
    },
  };

  // Configure cluster mode for Redis if nodes are specified
  if (process.env.REDIS_CLUSTER_NODES) {
    // Format: host1:port1,host2:port2
    const clusterNodesStr = process.env.REDIS_CLUSTER_NODES;
    const nodeEntries = clusterNodesStr.split(',');
    
    config.redis.useCluster = true;
    config.redis.clusterNodes = nodeEntries.map(nodeEntry => {
      const [host, portStr] = nodeEntry.split(':');
      return {
        host,
        port: parseInt(portStr, 10),
      };
    });
  }

  return config;
}

/**
 * Initialize all database clients with the provided configuration
 */
export async function initializeDatabases(config: DatabaseConfig = loadDatabaseConfig()): Promise<void> {
  try {
    // Import clients dynamically to avoid circular dependencies
    const { PrismaClientWrapper } = await import('./prisma');
    const { neo4jDriver } = await import('./neo4j');
    const { weaviateClient } = await import('./weaviate');
    const { redisClient } = await import('./redis');
    
    // No explicit initialization needed for Prisma - it initializes on first use
    console.info('PrismaClient will initialize on first use');
    
    // Initialize Neo4j
    await neo4jDriver.initialize(config.neo4j);
    console.info('Neo4j connection initialized');
    
    // Initialize Weaviate
    weaviateClient.initialize(config.weaviate);
    await weaviateClient.checkConnection();
    console.info('Weaviate connection initialized');
    
    // Initialize Redis
    await redisClient.initialize(config.redis);
    console.info('Redis connection initialized');
  } catch (error) {
    console.error('Failed to initialize database connections:', error);
    throw error;
  }
}

/**
 * Check the health of all database connections
 */
export async function checkDatabasesHealth(): Promise<Record<string, { healthy: boolean; error?: string | null; latency?: number }>> {
  try {
    // Import clients dynamically to avoid circular dependencies
    const { prismaHealthCheck } = await import('./prisma');
    const { neo4jDriver } = await import('./neo4j');
    const { weaviateClient } = await import('./weaviate');
    const { redisClient } = await import('./redis');
    
    // Run health checks in parallel
    const [prismaHealth, neo4jHealth, weaviateHealth, redisHealth] = await Promise.all([
      prismaHealthCheck(),
      neo4jDriver.healthCheck(),
      weaviateClient.healthCheck(),
      redisClient.healthCheck(),
    ]);
    
    return {
      prisma: prismaHealth,
      neo4j: neo4jHealth,
      weaviate: weaviateHealth,
      redis: redisHealth,
    };
  } catch (error) {
    console.error('Error checking database health:', error);
    throw error;
  }
}

/**
 * Close all database connections
 */
export async function closeDatabases(): Promise<void> {
  try {
    // Import clients dynamically to avoid circular dependencies
    const { disconnectPrisma } = await import('./prisma');
    const { neo4jDriver } = await import('./neo4j');
    const { redisClient } = await import('./redis');
    
    // Close connections in parallel
    await Promise.all([
      disconnectPrisma(),
      neo4jDriver.close(),
      redisClient.close(),
    ]);
    
    console.info('All database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
}

export type { DatabaseConfig }; 