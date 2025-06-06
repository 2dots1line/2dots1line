/**
 * Weaviate Client Wrapper for 2dots1line V4
 * Provides vector database operations with error handling and retry capabilities
 */

import weaviate, { WeaviateClient, ApiKey, ConnectionParams } from 'weaviate-ts-client';

// Configuration options for Weaviate client
interface WeaviateConfig {
  scheme: string;
  host: string;
  apiKey?: string;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

// Defaults
const DEFAULT_CONFIG: Partial<WeaviateConfig> = {
  scheme: 'http',
  retries: 5,
  retryDelay: 1000, // 1 second initial delay, exponential backoff
};

// Query response type
export interface WeaviateSearchResult<T> {
  data: {
    Get: {
      [className: string]: T[];
    };
  };
}

class WeaviateClientWrapper {
  private static instance: WeaviateClient | null = null;
  private static config: WeaviateConfig | null = null;
  private static isConnected: boolean = false;
  private static lastError: Error | null = null;

  /**
   * Initialize the Weaviate client with configuration
   * Must be called before using any client methods
   */
  public static initialize(config: WeaviateConfig): void {
    // Store configuration for potential reconnection
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    
    try {
      console.info(`Initializing Weaviate client with ${config.scheme}://${config.host}`);
      
      // Build connection parameters for apiKey and headers
      const clientOptions: { apiKey?: ApiKey; headers?: Record<string, string> } = {};
      
      // Add API key if provided
      if (config.apiKey) {
        clientOptions.apiKey = new ApiKey(config.apiKey);
        console.info('Using Weaviate API Key authentication');
      } else {
        console.info('No Weaviate API Key provided. Using anonymous access.');
      }
      
      // Add custom headers if provided
      if (config.headers) {
        clientOptions.headers = config.headers;
      }
      
      // Create client instance
      this.instance = weaviate.client({
        scheme: config.scheme,
        host: config.host,
        ...clientOptions,
      });
      
      console.info('Weaviate client instance created');
    } catch (error) {
      this.isConnected = false;
      this.lastError = error as Error;
      this.instance = null;
      
      console.error('Failed to initialize Weaviate client:', error);
      throw error;
    }
  }

  /**
   * Get the Weaviate client instance
   * Will throw if the client hasn't been initialized
   */
  public static getClient(): WeaviateClient {
    if (!this.instance) {
      throw new Error('Weaviate client not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  // NOTE: Weaviate clients (like weaviate-ts-client) often manage underlying HTTP connections
  // automatically and don't typically require an explicit disconnect/close method for cleanup
  // like traditional database drivers. Connection health is checked via healthCheck or checkConnection.

  /**
   * Check the connection to Weaviate with retries
   */
  public static async checkConnection(
    retries?: number,
    delay?: number
  ): Promise<boolean> {
    if (!this.instance) {
      console.error('Weaviate client not initialized');
      return false;
    }

    const retryCount = retries ?? this.config?.retries ?? DEFAULT_CONFIG.retries!;
    const retryDelay = delay ?? this.config?.retryDelay ?? DEFAULT_CONFIG.retryDelay!;
    
    for (let i = 0; i < retryCount; i++) {
      try {
        const startTime = Date.now();
        // metaGetter is a lightweight way to check connection
        const meta = await this.instance.misc.metaGetter().do();
        const duration = Date.now() - startTime;
        
        if (meta && meta.version) {
          console.info(`Successfully connected to Weaviate v${meta.version} after ${i} retries. Response time: ${duration}ms`);
          this.isConnected = true;
          this.lastError = null;
          return true;
        } else {
          console.warn(`Connected to Weaviate, but received unexpected meta response (attempt ${i + 1}/${retryCount})`);
        }
      } catch (error) {
        const isLastRetry = i === retryCount - 1;
        
        if (isLastRetry) {
          console.error(`Failed to connect to Weaviate after ${retryCount} attempts:`, error);
          this.isConnected = false;
          this.lastError = error as Error;
          return false;
        } else {
          console.warn(`Weaviate connection attempt ${i + 1}/${retryCount} failed:`, error);
          // Exponential backoff for retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)));
        }
      }
    }
    
    console.error('Connection check failed after all retries');
    return false;
  }

  /**
   * Check the health of the Weaviate connection
   */
  public static async healthCheck(): Promise<{ 
    healthy: boolean;
    error: string | null;
    latency?: number;
    version?: string;
  }> {
    if (!this.instance) {
      return { healthy: false, error: 'Weaviate client not initialized' };
    }
    
    try {
      const startTime = Date.now();
      const meta = await this.instance.misc.metaGetter().do();
      const latency = Date.now() - startTime;
      
      if (meta && meta.version) {
        return { 
          healthy: true, 
          error: null, 
          latency,
          version: meta.version
        };
      } else {
        return { 
          healthy: false, 
          error: 'Unexpected response from Weaviate health check' 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { healthy: false, error: errorMessage };
    }
  }

  /**
   * Helper to perform vector search with automatic retries
   */
  public static async vectorSearch<T = any>(
    className: string, 
    vectorQuery: number[],
    options: {
      limit?: number;
      offset?: number;
      fields?: string[];
      where?: Record<string, any>;
      withDistance?: boolean;
      nearVector?: {
        vector: number[];
        certainty?: number;
      };
      nearText?: {
        concepts: string | string[];
        certainty?: number;
      };
      retries?: number;
    } = {}
  ): Promise<T[]> {
    const client = this.getClient();
    const retries = options.retries ?? this.config?.retries ?? DEFAULT_CONFIG.retries!;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const startTime = Date.now();
        
        // Build query
        let query = client.graphql
          .get()
          .withClassName(className);
        
        // Add fields to return
        let fieldStr = options.fields ? options.fields.join(' ') : '';
        if (options.withDistance) {
          if (!fieldStr.includes('_additional { distance }')) {
            fieldStr = fieldStr ? fieldStr + ' _additional { distance }' : '_additional { distance }';
          }
        }
        if (fieldStr) {
          query = query.withFields(fieldStr);
        }
        
        // Add nearVector if provided
        if (vectorQuery) {
          query = query.withNearVector({
            vector: vectorQuery,
          });
        } else if (options.nearVector) {
          query = query.withNearVector(options.nearVector);
        } else if (options.nearText) {
          const conceptsArray = Array.isArray(options.nearText.concepts) 
            ? options.nearText.concepts 
            : [options.nearText.concepts];
          query = query.withNearText({ ...options.nearText, concepts: conceptsArray });
        }
        
        // Add limit if provided
        if (options.limit) {
          query = query.withLimit(options.limit);
        }
        
        // Add offset if provided
        if (options.offset) {
          query = query.withOffset(options.offset);
        }
        
        // Add where filter if provided
        if (options.where) {
          query = query.withWhere(options.where);
        }
        
        // Execute query
        const result = await query.do() as WeaviateSearchResult<T>;
        const duration = Date.now() - startTime;
        
        // Log telemetry
        if (process.env.NODE_ENV === 'development' || process.env.ENABLE_QUERY_LOGGING === 'true') {
          console.debug(`[Weaviate Search] ${className} (${duration}ms)`);
        }
        
        // Extract and return results
        return result.data.Get[className] || [];
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries - 1) {
          console.warn(`Weaviate query attempt ${attempt + 1}/${retries} failed:`, error);
          // Exponential backoff for retry
          await new Promise(resolve => 
            setTimeout(resolve, (this.config?.retryDelay || DEFAULT_CONFIG.retryDelay!) * Math.pow(2, attempt))
          );
        } else {
          console.error(`Weaviate query failed after ${retries} attempts:`, error);
          throw error;
        }
      }
    }
    
    // This should not be reached if retries > 0, but TypeScript doesn't know that
    throw lastError || new Error('Unknown error in vector search');
  }

  /**
   * Reset the client instance (useful for testing)
   */
  public static reset(): void {
    this.instance = null;
    this.config = null;
    this.isConnected = false;
    this.lastError = null;
  }
  
  /**
   * Create a schema class in Weaviate
   */
  public static async createSchemaClass(classConfig: any): Promise<void> {
    const client = this.getClient();
    
    try {
      await client.schema.classCreator().withClass(classConfig).do();
      console.info(`Created Weaviate schema class: ${classConfig.class}`);
    } catch (error) {
      // Check if error is about class already existing
      if (error instanceof Error && error.message.includes('already exists')) {
        console.info(`Weaviate schema class ${classConfig.class} already exists`);
      } else {
        console.error(`Failed to create Weaviate schema class ${classConfig.class}:`, error);
        throw error;
      }
    }
  }
  
  /**
   * Batch import objects into Weaviate with automatic batching
   */
  public static async batchImport<T extends Record<string, any>>(
    className: string,
    objects: T[],
    options: {
      batchSize?: number;
      retries?: number;
      vectorizer?: string;
    } = {}
  ): Promise<void> {
    const client = this.getClient();
    const batchSize = options.batchSize || 100;
    const retries = options.retries ?? this.config?.retries ?? DEFAULT_CONFIG.retries!;
    
    console.info(`Starting batch import of ${objects.length} objects to ${className}`);
    
    // Process in batches
    for (let i = 0; i < objects.length; i += batchSize) {
      const batch = objects.slice(i, i + batchSize);
      const batcher = client.batch.objectsBatcher();
      
      // Add objects to batch
      for (const obj of batch) {
        const weaviateObject: any = {
          class: className,
          properties: obj,
        };

        // The _vectorizer property on individual objects during import is not standard.
        // Vectorizer is typically defined at the class schema level.
        // If options.vectorizer is meant to be the vector itself, logic needs to change.
        // Commenting out for now as it's likely an error from an older API version or misunderstanding.
        // if (options.vectorizer && typeof (weaviateObject.properties as any) === 'object') {
        //   // This assumes properties is an object and allows dynamic assignment
        //   (weaviateObject.properties as any)._vectorizer = options.vectorizer;
        // }

        // If the source object `obj` has a precomputed vector, add it to the Weaviate object
        if (typeof obj === 'object' && obj !== null && 'vector' in obj && Array.isArray((obj as any).vector)) {
          weaviateObject.vector = (obj as any).vector;
        }
        
        batcher.withObject(weaviateObject);
      }
      
      // Execute batch with retries
      let success = false;
      let attempt = 0;
      
      while (!success && attempt < retries) {
        try {
          await batcher.do();
          success = true;
          console.info(`Successfully imported batch ${i / batchSize + 1}/${Math.ceil(objects.length / batchSize)}`);
        } catch (error) {
          attempt++;
          if (attempt >= retries) {
            console.error(`Failed to import batch after ${retries} attempts:`, error);
            throw error;
          }
          
          console.warn(`Batch import attempt ${attempt}/${retries} failed:`, error);
          await new Promise(resolve => 
            setTimeout(resolve, (this.config?.retryDelay || DEFAULT_CONFIG.retryDelay!) * Math.pow(2, attempt))
          );
        }
      }
    }
    
    console.info(`Batch import of ${objects.length} objects to ${className} completed successfully`);
  }
}

// Export the client wrapper
export const weaviateClient = WeaviateClientWrapper;
export type { WeaviateConfig }; 