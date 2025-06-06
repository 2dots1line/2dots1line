/**
 * Neo4j Client Wrapper for 2dots1line V4
 * Provides connection management and query utilities for Neo4j graph database
 */

import neo4j, {
  Driver,
  Session,
  Result,
  Record,
  QueryResult,
  int,
  Integer,
  Neo4jError,
  AuthToken,
  Config,
  TrustStrategy,
  SessionMode,
  Transaction,
  RecordShape
} from 'neo4j-driver';

interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
  maxTransactionRetryTime?: number;
}

// Default configuration can be overridden at initialization
const DEFAULT_CONFIG: Partial<Neo4jConfig> = {
  maxConnectionPoolSize: 50,
  maxTransactionRetryTime: 30000, // 30 seconds
};

/**
 * Neo4j Driver Wrapper provides a singleton pattern for Neo4j driver access
 * with connection management, session handling, and query utilities.
 */
class Neo4jDriverWrapper {
  private static instance: Driver | null = null;
  private static config: Neo4jConfig | null = null;
  private static connectionPromise: Promise<void> | null = null;
  private static lastError: Error | null = null;
  private static isConnected: boolean = false;
  private static defaultDatabase: string | undefined;

  /**
   * Initialize the Neo4j driver with the provided configuration
   * This must be called before using any other methods
   */
  public static async initialize(config: Neo4jConfig): Promise<void> {
    // Store configuration for potential reconnection
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    
    this.defaultDatabase = config.database;

    // Create and connect driver
    await this.connect();
  }

  /**
   * Connect to Neo4j database
   */
  private static async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('Neo4j driver not initialized. Call initialize() first.');
    }

    // Close any existing connection
    await this.close();

    const { uri, username, password, maxConnectionPoolSize, maxTransactionRetryTime } = this.config;

    try {
      console.info(`Connecting to Neo4j at ${uri}`);
      const startTime = Date.now();

      // Create new driver instance
      this.instance = neo4j.driver(
        uri,
        neo4j.auth.basic(username, password),
        {
          maxConnectionPoolSize,
          maxTransactionRetryTime,
        }
      );

      // Verify connection by running a simple query
      this.connectionPromise = this.verifyConnection();
      await this.connectionPromise;
      
      const duration = Date.now() - startTime;
      this.isConnected = true;
      this.lastError = null;
      
      console.info(`Connected to Neo4j in ${duration}ms`);
    } catch (error) {
      this.isConnected = false;
      this.lastError = error as Error;
      this.instance = null;
      
      console.error('Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  /**
   * Verify connection by running a simple query
   */
  private static async verifyConnection(): Promise<void> {
    if (!this.instance) {
      throw new Error('Neo4j driver not initialized');
    }

    const session = this.instance.session({
      database: this.defaultDatabase,
    });

    try {
      await session.run('RETURN 1 AS test');
    } finally {
      await session.close();
    }
  }

  /**
   * Close the Neo4j driver connection
   */
  public static async close(): Promise<void> {
    if (this.instance) {
      try {
        await this.instance.close();
        this.isConnected = false;
        this.instance = null;
        console.info('Neo4j connection closed');
      } catch (error) {
        console.error('Error closing Neo4j connection:', error);
        throw error;
      }
    }
  }

  /**
   * Get the Neo4j driver instance
   * Will throw if the driver hasn't been initialized
   */
  public static getDriver(): Driver {
    if (!this.instance) {
      throw new Error('Neo4j driver not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  /**
   * Create a new session
   */
  public static getSession(database?: string): Session {
    const driver = this.getDriver();
    return driver.session({
      database: database || this.defaultDatabase,
    });
  }

  /**
   * Execute a read query within an auto-managed session
   */
  public static async executeRead<T extends RecordShape = Record>(
    cypher: string,
    params?: any,
    database?: string
  ): Promise<QueryResult<T>> {
    const session = this.getSession(database);
    
    try {
      const startTime = Date.now();
      const result = await session.executeRead(tx => 
        tx.run(cypher, params) as unknown as Result<T>
      );
      const duration = Date.now() - startTime;
      
      // Log query execution time for telemetry
      if (process.env.NODE_ENV === 'development' || process.env.ENABLE_QUERY_LOGGING === 'true') {
        const queryPreview = cypher.length > 500 ? cypher.substring(0, 500) + '...' : cypher;
        console.debug(`[Neo4j Read] ${queryPreview} (${duration}ms)`);
      }
      
      return result;
    } finally {
      await session.close();
    }
  }

  /**
   * Execute a write query within an auto-managed session
   */
  public static async executeWrite<T extends RecordShape = Record>(
    cypher: string,
    params?: any,
    database?: string
  ): Promise<QueryResult<T>> {
    const session = this.getSession(database);
    
    try {
      const startTime = Date.now();
      const result = await session.executeWrite(tx => 
        tx.run(cypher, params) as unknown as Result<T>
      );
      const duration = Date.now() - startTime;
      
      // Log query execution time for telemetry
      if (process.env.NODE_ENV === 'development' || process.env.ENABLE_QUERY_LOGGING === 'true') {
        const queryPreview = cypher.length > 500 ? cypher.substring(0, 500) + '...' : cypher;
        console.debug(`[Neo4j Write] ${queryPreview} (${duration}ms)`);
      }
      
      return result;
    } finally {
      await session.close();
    }
  }

  /**
   * Check the connection health
   */
  public static async healthCheck(): Promise<{ 
    healthy: boolean;
    error: string | null;
    latency?: number;
  }> {
    if (!this.instance) {
      return { healthy: false, error: 'Neo4j driver not initialized' };
    }
    
    const session = this.getSession();
    
    try {
      const startTime = Date.now();
      await session.run('RETURN 1 AS health');
      const latency = Date.now() - startTime;
      
      return { healthy: true, error: null, latency };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { healthy: false, error: errorMessage };
    } finally {
      await session.close();
    }
  }
  
  /**
   * Helper to convert Neo4j integer to JavaScript number
   */
  public static toNumber(value: any): number {
    return neo4j.isInt(value) ? value.toNumber() : value;
  }
  
  /**
   * Helper to create a Neo4j integer from number
   */
  public static toInt(value: number): Integer {
    return neo4j.int(value);
  }
}

// Utility function to transform Neo4j records to plain JavaScript objects
export function recordToObject<T = any>(record: Record): T {
  const result = {} as any;
  
  for (const key of record.keys) {
    const value = record.get(key);
    
    // Handle Neo4j integers
    if (neo4j.isInt(value)) {
      result[key] = value.toNumber();
    } 
    // Handle Neo4j Node objects
    else if (value && typeof value === 'object' && 'properties' in value) {
      result[key] = {
        ...transformProperties(value.properties),
        _id: Neo4jDriverWrapper.toNumber(value.identity),
        _labels: value.labels,
      };
    } 
    // Handle Neo4j Relationship objects
    else if (value && typeof value === 'object' && 'type' in value && 'start' in value && 'end' in value) {
      result[key] = {
        ...transformProperties(value.properties),
        _id: Neo4jDriverWrapper.toNumber(value.identity),
        _type: value.type,
        _startNodeId: Neo4jDriverWrapper.toNumber(value.start),
        _endNodeId: Neo4jDriverWrapper.toNumber(value.end),
      };
    } 
    // Handle Neo4j Path objects
    else if (value && typeof value === 'object' && 'start' in value && 'end' in value && 'segments' in value) {
      // Path objects have complex structure, just mapping to plain objects
      result[key] = {
        start: recordToObject(value.start),
        end: recordToObject(value.end),
        segments: value.segments.map((seg: any) => ({
          start: recordToObject(seg.start),
          relationship: recordToObject(seg.relationship),
          end: recordToObject(seg.end),
        })),
      };
    } 
    // Handle other properties
    else {
      result[key] = value;
    }
  }
  
  return result as T;
}

// Helper for transforming Neo4j properties
function transformProperties(properties: any): any {
  const result: any = {};
  
  for (const key in properties) {
    const value = properties[key];
    
    if (neo4j.isInt(value)) {
      result[key] = value.toNumber();
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        neo4j.isInt(item) ? item.toNumber() : item
      );
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Export the main wrapper and helper functions
export const neo4jDriver = Neo4jDriverWrapper;
export type { Neo4jConfig }; 