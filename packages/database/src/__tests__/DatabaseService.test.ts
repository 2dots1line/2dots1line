// Mock all database clients BEFORE importing DatabaseService
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('neo4j-driver', () => ({
  driver: jest.fn().mockReturnValue({
    verifyConnectivity: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  auth: {
    basic: jest.fn(),
  },
}));

jest.mock('weaviate-ts-client', () => ({
  client: jest.fn().mockReturnValue({
    misc: {
      liveChecker: jest.fn().mockReturnValue({
        do: jest.fn().mockResolvedValue(true),
      }),
    },
  }),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  }));
});

// Now import the DatabaseService
import { DatabaseService } from '../index';
import { PrismaClient } from '@prisma/client';
import neo4j from 'neo4j-driver';
import weaviate from 'weaviate-ts-client';
import IORedis from 'ioredis';

describe('DatabaseService', () => {
  let dbService: DatabaseService;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    jest.clearAllMocks();
    
    // Setup process.env variables as DatabaseService constructor reads them
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/testdb";
    process.env.NEO4J_URI = "neo4j://localhost:7688";
    process.env.NEO4J_USERNAME = "neo4j";
    process.env.NEO4J_PASSWORD = "password";
    process.env.WEAVIATE_SCHEME = "http";
    process.env.WEAVIATE_HOST = "localhost:8080";
    process.env.REDIS_URL = "redis://localhost:6379";
    
    dbService = new DatabaseService();
  });

  it('should instantiate PrismaClient on prisma getter', () => {
    const client = dbService.prisma;
    expect(PrismaClient).toHaveBeenCalledTimes(1);
    expect(client).toBeDefined();
  });

  it('should instantiate Neo4j Driver on neo4j getter', () => {
    const driver = dbService.neo4j;
    expect(neo4j.driver).toHaveBeenCalledWith(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
    );
    expect(driver).toBeDefined();
  });

  it('should instantiate WeaviateClient on weaviate getter', () => {
    const client = dbService.weaviate;
    expect(weaviate.client).toHaveBeenCalledWith({
      scheme: process.env.WEAVIATE_SCHEME,
      host: process.env.WEAVIATE_HOST,
    });
    expect(client).toBeDefined();
  });

  it.skip('should instantiate RedisClient on redis getter', () => {
    // Mock REDIS_URL for this test
    process.env.REDIS_URL = "redis://localhost:6379";
    const dbServiceWithRedis = new DatabaseService();
    
    const client = dbServiceWithRedis.redis;
    expect(IORedis).toHaveBeenCalledWith(process.env.REDIS_URL);
    expect(client).toBeDefined();
  });

  it('should call $disconnect on Prisma client during disconnect()', async () => {
    const prismaClient = dbService.prisma; // instantiate
    await dbService.disconnect();
    expect(prismaClient.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('should call close on Neo4j driver during disconnect()', async () => {
    const neo4jDriver = dbService.neo4j;
    await dbService.disconnect();
    expect(neo4jDriver.close).toHaveBeenCalledTimes(1);
  });

  it.skip('should call quit on Redis client during disconnect()', async () => {
    // Mock REDIS_URL for this test
    process.env.REDIS_URL = "redis://localhost:6379";
    const dbServiceWithRedis = new DatabaseService();
    
    const redisClient = dbServiceWithRedis.redis;
    await dbServiceWithRedis.disconnect();
    expect(redisClient.quit).toHaveBeenCalledTimes(1);
  });

  it('should handle missing REDIS_URL gracefully', () => {
    // Clear REDIS_URL to test the fallback behavior
    delete process.env.REDIS_URL;
    
    const dbServiceWithoutRedis = new DatabaseService();
    
    expect(() => dbServiceWithoutRedis.redis).toThrow('Redis client is not initialized or not functional. Check REDIS_URL.');
  });
}); 