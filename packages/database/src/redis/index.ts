/**
 * Redis Client Wrapper for 2dots1line V7
 * Provides caching, pub/sub, and rate limiting capabilities
 */

import IORedis, { Cluster } from 'ioredis';

export interface RedisConfig {
  uri?: string;
  host?: string;
  port?: number;
  password?: string;
  keyPrefix?: string;
  db?: number;
  useCluster?: boolean;
  clusterNodes?: Array<{ host: string; port: number }>;
  retryStrategy?: (times: number) => number;
  enableTelemetry?: boolean;
}

export interface CacheOptions {
  ttl?: number;
  nx?: boolean; // Only set if key doesn't exist
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface LockOptions {
  retryDelay?: number;
  retryCount?: number;
}

export interface QueueOptions {
  priority?: number;
  delay?: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  error?: string | null;
  latency?: number;
  usedMemory?: string;
  cacheHits?: number;
  cacheMisses?: number;
}

// Default configuration
const DEFAULT_CONFIG: Partial<RedisConfig> = {
  retryStrategy: (times: number) => Math.min(times * 100, 3000), // Max 3 seconds
  keyPrefix: '2dots1linev7:',
  enableTelemetry: true,
};

// Cache TTL defaults (in seconds)
export const TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 1 day
};

export class RedisClientWrapper {
  private static instance: IORedis | Cluster | null = null;
  private static config: RedisConfig | null = null;
  private static isConnected: boolean = false;
  private static lastError: Error | null = null;
  private static connectionPromise: Promise<void> | null = null;

  /**
   * Initialize the Redis client with the provided configuration
   */
  static async initialize(config: RedisConfig): Promise<void> {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    await this.connect();
  }

  /**
   * Connect to Redis
   */
  static async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('Redis client not initialized. Call initialize() first.');
    }

    await this.close();

    try {
      console.info('Connecting to Redis...');
      const startTime = Date.now();

      if (this.config.useCluster && this.config.clusterNodes) {
        this.instance = new Cluster(this.config.clusterNodes, {
          redisOptions: this.config,
        });
        console.info(`Connecting to Redis Cluster with ${this.config.clusterNodes.length} nodes`);
      } else if (this.config.uri) {
        this.instance = new IORedis(this.config.uri, this.config);
        console.info(`Connecting to Redis at ${this.config.uri}`);
      } else {
        this.instance = new IORedis(this.config);
        console.info(`Connecting to Redis at ${this.config.host || 'localhost'}:${this.config.port || 6379}`);
      }

      this.setupEventListeners();
      this.connectionPromise = this.verifyConnection();
      await this.connectionPromise;

      const duration = Date.now() - startTime;
      this.isConnected = true;
      this.lastError = null;
      console.info(`Connected to Redis in ${duration}ms`);
    } catch (error) {
      this.isConnected = false;
      this.lastError = error as Error;
      this.instance = null;
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for telemetry and error handling
   */
  private static setupEventListeners(): void {
    if (!this.instance) return;

    this.instance.on('error', (err: Error) => {
      console.error('Redis client error:', err);
      this.lastError = err;
      this.isConnected = false;
    });

    this.instance.on('ready', () => {
      console.info('Redis client ready');
      this.isConnected = true;
    });

    this.instance.on('reconnecting', () => {
      console.info('Redis client reconnecting...');
      this.isConnected = false;
    });

    this.instance.on('end', () => {
      console.info('Redis connection closed');
      this.isConnected = false;
    });
  }

  /**
   * Verify connection by running a simple command
   */
  private static async verifyConnection(): Promise<void> {
    if (!this.instance) {
      throw new Error('Redis client not initialized');
    }
    await this.instance.ping();
  }

  /**
   * Close the Redis connection
   */
  static async close(): Promise<void> {
    if (this.instance) {
      try {
        await this.instance.quit();
        this.isConnected = false;
        this.instance = null;
        console.info('Redis connection closed');
      } catch (error) {
        console.error('Error closing Redis connection:', error);
        throw error;
      }
    }
  }

  /**
   * Get the Redis client instance
   */
  static getClient(): IORedis | Cluster {
    if (!this.instance) {
      throw new Error('Redis client not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  /**
   * Check the health of the Redis connection
   */
  static async healthCheck(): Promise<HealthCheckResult> {
    if (!this.instance) {
      return { healthy: false, error: 'Redis client not initialized' };
    }

    try {
      const startTime = Date.now();
      await this.instance.ping();
      const latency = Date.now() - startTime;

      let info: string | undefined;
      try {
        info = await this.instance.info();
      } catch (e) {
        // Ignore error, info is optional
      }

      const usedMemory = info ? this.parseInfoValue(info, 'used_memory_human') : undefined;
      const cacheHits = info ? Number(this.parseInfoValue(info, 'keyspace_hits')) : undefined;
      const cacheMisses = info ? Number(this.parseInfoValue(info, 'keyspace_misses')) : undefined;

      return {
        healthy: true,
        error: null,
        latency,
        usedMemory,
        cacheHits,
        cacheMisses,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { healthy: false, error: errorMessage };
    }
  }

  /**
   * Helper to parse info response from Redis
   */
  private static parseInfoValue(info: string, key: string): string | undefined {
    const regex = new RegExp(`^${key}:(.*)$`, 'm');
    const match = info.match(regex);
    return match?.[1]?.trim();
  }

  /**
   * Cache a value with optional TTL
   */
  static async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    if (!this.instance) {
      throw new Error('Redis client not initialized');
    }

    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (options?.ttl) {
      if (options.nx) {
        await this.instance.set(key, serializedValue, 'EX', options.ttl, 'NX');
      } else {
        await this.instance.setex(key, options.ttl, serializedValue);
      }
    } else {
      if (options?.nx) {
        await this.instance.set(key, serializedValue, 'NX');
      } else {
        await this.instance.set(key, serializedValue);
      }
    }
  }

  /**
   * Get a cached value
   */
  static async get<T = any>(key: string, parseJson: boolean = true): Promise<T | null> {
    if (!this.instance) {
      throw new Error('Redis client not initialized');
    }

    const value = await this.instance.get(key);
    if (value === null) return null;

    return parseJson ? JSON.parse(value) : (value as T);
  }

  /**
   * Delete keys
   */
  static async delete(...keys: string[]): Promise<number> {
    if (!this.instance) {
      throw new Error('Redis client not initialized');
    }
    return await this.instance.del(...keys);
  }

  /**
   * Check if keys exist
   */
  static async exists(...keys: string[]): Promise<number> {
    if (!this.instance) {
      throw new Error('Redis client not initialized');
    }
    return await this.instance.exists(...keys);
  }

  /**
   * Get TTL for a key
   */
  static async ttl(key: string): Promise<number> {
    if (!this.instance) {
      throw new Error('Redis client not initialized');
    }
    return await this.instance.ttl(key);
  }

  /**
   * Reset client (for testing)
   */
  static reset(): void {
    this.instance = null;
    this.config = null;
    this.isConnected = false;
    this.lastError = null;
    this.connectionPromise = null;
  }
}

// Export singleton instance
export const redisClient = RedisClientWrapper; 