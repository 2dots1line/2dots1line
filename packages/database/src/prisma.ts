/**
 * Prisma Client Configuration and Management
 * Provides a wrapper around Prisma Client with health checks and connection management
 */

import { PrismaClient } from './prisma-client';

// Global singleton instance
let prismaInstance: PrismaClient | null = null;

/**
 * Get or create the Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      if (prismaInstance) {
        await prismaInstance.$disconnect();
      }
    });
  }

  return prismaInstance;
}

/**
 * Prisma client singleton for direct access
 */
export const prisma = getPrismaClient();

/**
 * Prisma Client Wrapper class for dependency injection
 */
export class PrismaClientWrapper {
  private client: PrismaClient;

  constructor(client?: PrismaClient) {
    this.client = client || getPrismaClient();
  }

  public get prisma(): PrismaClient {
    return this.client;
  }

  /**
   * Execute a database operation with automatic connection management
   */
  public async withConnection<T>(operation: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    try {
      return await operation(this.client);
    } catch (error) {
      console.error('Prisma operation failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple operations in a transaction
   */
  public async withTransaction<T>(operations: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>): Promise<T> {
    return this.client.$transaction(async (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      return operations(prisma);
    });
  }
}

/**
 * Health check function for Prisma connection
 */
export async function prismaHealthCheck(): Promise<{ healthy: boolean; error?: string | null; latency?: number }> {
  const startTime = Date.now();
  
  try {
    const client = getPrismaClient();
    
    // Simple query to test connection
    await client.$queryRaw`SELECT 1`;
    
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency,
    };
  }
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
      console.info('Prisma client disconnected');
    } catch (error) {
      console.error('Error disconnecting Prisma client:', error);
      throw error;
    } finally {
      prismaInstance = null;
    }
  }
}

/**
 * Connect to Prisma (explicit connection)
 */
export async function connectPrisma(): Promise<void> {
  try {
    const client = getPrismaClient();
    await client.$connect();
    console.info('Prisma client connected');
  } catch (error) {
    console.error('Error connecting to Prisma:', error);
    throw error;
  }
} 