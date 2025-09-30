/**
 * V11.0 Spatial Query Worker
 * Handles async processing of spatial queries for interactive cosmos navigation
 * Located in workers/spatial-query-worker/ per V9.5 monorepo architecture
 * 
 * This worker processes spatial queries asynchronously to avoid blocking the main API.
 * It can be triggered by viewport changes, time-travel requests, or filtered queries.
 */

import { Worker, Job, Queue } from 'bullmq';
import { DatabaseService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils';
import type { 
  SpatialQueryJob, 
  CosmosQuery, 
  CosmosQueryResponse, 
  SpatialQueryType,
  ViewportBounds 
} from '@2dots1line/shared-types';

export interface SpatialQueryWorkerConfig {
  queueName?: string;
  concurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class SpatialQueryWorker {
  private worker: Worker;
  private queue: Queue<SpatialQueryJob>;
  private config: SpatialQueryWorkerConfig;

  constructor(
    private databaseService: DatabaseService,
    config: SpatialQueryWorkerConfig = {}
  ) {
    // CRITICAL: Load environment variables first
    console.log('🌌 [SpatialQueryWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('✅ [SpatialQueryWorker] Environment variables loaded');

    this.config = {
      queueName: 'spatial-query-queue',
      concurrency: 5,
      retryAttempts: 3,
      retryDelay: 2000,
      ...config
    };

    // Initialize Redis connection
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    };

    // Create queue for adding jobs
    this.queue = new Queue(this.config.queueName!, {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: this.config.retryAttempts,
        backoff: {
          type: 'exponential',
          delay: this.config.retryDelay,
        },
      },
    });
    
    // Create worker for processing jobs
    this.worker = new Worker(
      this.config.queueName!,
      async (job: Job<SpatialQueryJob>) => {
        const { query, userId, queryType, requestId } = job.data;
        
        console.log('🌌 SpatialQueryWorker - Processing job:', {
          requestId,
          queryType,
          userId,
          hasAttributeFilters: !!query.attributeFilters,
          hasSpatialFilters: !!query.spatialFilters,
          hasSetFilters: !!query.setFilters,
          hasTimeTravel: !!query.timeTravel
        });

        try {
          let result: CosmosQueryResponse;
          
          switch (queryType) {
            case 'viewport':
              result = await this.handleViewportQuery(query, userId);
              break;
            case 'time-travel':
              result = await this.handleTimeTravelQuery(query, userId);
              break;
            case 'filtered':
              result = await this.handleFilteredQuery(query, userId);
              break;
            default:
              throw new Error(`Unknown query type: ${queryType}`);
          }

          console.log('🌌 SpatialQueryWorker - Job completed:', {
            requestId,
            queryType,
            nodeCount: result.data?.nodes.length || 0,
            edgeCount: result.data?.edges?.length || 0,
            queryTime: result.data?.metadata.queryTime || 0
          });

          return result;
        } catch (error) {
          console.error('🌌 SpatialQueryWorker - Job failed:', {
            requestId,
            queryType,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          return {
            success: false,
            error: {
              code: 'WORKER_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error occurred'
            }
          };
        }
      },
      {
        connection: redisConnection,
        concurrency: this.config.concurrency,
      }
    );

    this.worker.on('completed', (job) => {
      console.log('🌌 SpatialQueryWorker - Job completed:', job.id);
    });

    this.worker.on('failed', (job, err) => {
      console.error('🌌 SpatialQueryWorker - Job failed:', job?.id, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('🌌 SpatialQueryWorker - Worker error:', err);
    });
  }

  /**
   * Handle viewport queries - camera frustum culling
   */
  private async handleViewportQuery(query: CosmosQuery, userId: string): Promise<CosmosQueryResponse> {
    const startTime = Date.now();
    
    if (!query.spatialFilters?.viewport) {
      throw new Error('Viewport query requires spatialFilters.viewport');
    }

    const { viewport } = query.spatialFilters;
    console.log('🌌 SpatialQueryWorker.handleViewportQuery - Viewport bounds:', viewport);

    // Execute the spatial query
    const result = await this.executeSpatialQuery(query, userId);
    const queryTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        ...result,
        metadata: {
          ...result.metadata,
          queryTime,
          viewportBounds: viewport
        }
      }
    };
  }

  /**
   * Handle time-travel queries - chronological navigation
   */
  private async handleTimeTravelQuery(query: CosmosQuery, userId: string): Promise<CosmosQueryResponse> {
    const startTime = Date.now();
    
    if (!query.timeTravel) {
      throw new Error('Time-travel query requires timeTravel parameters');
    }

    const { timestamp, direction = 'backward' } = query.timeTravel;
    console.log('🌌 SpatialQueryWorker.handleTimeTravelQuery - Time travel:', {
      timestamp,
      direction
    });

    // Execute the spatial query with time constraints
    const result = await this.executeSpatialQuery(query, userId);
    const queryTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        ...result,
        metadata: {
          ...result.metadata,
          queryTime
        }
      }
    };
  }

  /**
   * Handle filtered queries - attribute-based filtering
   */
  private async handleFilteredQuery(query: CosmosQuery, userId: string): Promise<CosmosQueryResponse> {
    const startTime = Date.now();
    
    console.log('🌌 SpatialQueryWorker.handleFilteredQuery - Filters:', {
      attributeFilters: query.attributeFilters,
      setFilters: query.setFilters
    });

    // Execute the spatial query with filters
    const result = await this.executeSpatialQuery(query, userId);
    const queryTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        ...result,
        metadata: {
          ...result.metadata,
          queryTime
        }
      }
    };
  }

  /**
   * Execute spatial query with all filter types
   * This is a simplified version of the GraphController logic for worker use
   */
  private async executeSpatialQuery(query: CosmosQuery, userId: string): Promise<{
    nodes: any[];
    edges?: any[];
    metadata: {
      totalNodes: number;
      totalEdges?: number;
    };
  }> {
    // Build base SQL query with UNION wrapped in subquery
    let sql = `SELECT * FROM (${this.buildBaseQuery()}) AS combined_entities WHERE 1=1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    // Apply attribute filters
    if (query.attributeFilters) {
      const { attributeSql, attributeParams } = this.buildAttributeFilters(query.attributeFilters, paramIndex);
      sql += attributeSql;
      params.push(...attributeParams);
      paramIndex += attributeParams.length;
    }

    // Apply spatial filters
    if (query.spatialFilters) {
      const { spatialSql, spatialParams } = this.buildSpatialFilters(query.spatialFilters, paramIndex);
      sql += spatialSql;
      params.push(...spatialParams);
      paramIndex += spatialParams.length;
    }

    // Apply set-based filters
    if (query.setFilters) {
      const { setSql, setParams } = this.buildSetFilters(query.setFilters, paramIndex);
      sql += setSql;
      params.push(...setParams);
      paramIndex += setParams.length;
    }

    // Apply time travel filters
    if (query.timeTravel) {
      const { timeSql, timeParams } = this.buildTimeTravelFilters(query.timeTravel, paramIndex);
      sql += timeSql;
      params.push(...timeParams);
      paramIndex += timeParams.length;
    }

    // Apply sorting and limits
    const { sortLimitSql, sortLimitParams } = this.buildSortAndLimit(query.options, paramIndex);
    sql += sortLimitSql;
    params.push(...sortLimitParams);

    // Execute query
    const result = await this.databaseService.prisma.$queryRawUnsafe(sql, ...params);
    const nodes = this.transformToCosmosNodes(result as any[]);

    // Get edges if requested
    let edges: any[] | undefined;
    if (query.options?.includeEdges) {
      edges = await this.getEdgesForNodes(nodes.map((n: any) => n.entity_id), userId);
    }

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges?.length
      }
    };
  }

  /**
   * Build base SQL query for all entity types
   */
  private buildBaseQuery(): string {
    return `
      SELECT 
        entity_id,
        'concept' as entity_type,
        title,
        content,
        type,
        status,
        created_at,
        updated_at,
        importance_score,
        position_x,
        position_y,
        position_z
      FROM concepts 
      WHERE user_id = $1 
        AND position_x IS NOT NULL 
        AND position_y IS NOT NULL 
        AND position_z IS NOT NULL
      
      UNION ALL
      
      SELECT 
        entity_id,
        'memory_unit' as entity_type,
        title,
        content,
        type,
        status,
        created_at,
        updated_at,
        importance_score,
        position_x,
        position_y,
        position_z
      FROM memory_units 
      WHERE user_id = $1 
        AND position_x IS NOT NULL 
        AND position_y IS NOT NULL 
        AND position_z IS NOT NULL
      
      UNION ALL
      
      SELECT 
        entity_id,
        'derived_artifact' as entity_type,
        title,
        content,
        type,
        status,
        created_at,
        updated_at,
        NULL as importance_score,
        position_x,
        position_y,
        position_z
      FROM derived_artifacts 
      WHERE user_id = $1 
        AND position_x IS NOT NULL 
        AND position_y IS NOT NULL 
        AND position_z IS NOT NULL
      
      UNION ALL
      
      SELECT 
        entity_id,
        'community' as entity_type,
        title,
        content,
        type,
        status,
        created_at,
        updated_at,
        NULL as importance_score,
        position_x,
        position_y,
        position_z
      FROM communities 
      WHERE user_id = $1 
        AND position_x IS NOT NULL 
        AND position_y IS NOT NULL 
        AND position_z IS NOT NULL
      
      UNION ALL
      
      SELECT 
        entity_id,
        'growth_event' as entity_type,
        title,
        content,
        type,
        status,
        created_at,
        updated_at,
        NULL as importance_score,
        position_x,
        position_y,
        position_z
      FROM growth_events 
      WHERE user_id = $1 
        AND position_x IS NOT NULL 
        AND position_y IS NOT NULL 
        AND position_z IS NOT NULL
    `;
  }

  /**
   * Build attribute-based filters
   */
  private buildAttributeFilters(filters: NonNullable<CosmosQuery['attributeFilters']>, paramIndex: number): {
    attributeSql: string;
    attributeParams: any[];
  } {
    let sql = '';
    const params: any[] = [];

    if (filters.entityTypes && filters.entityTypes.length > 0) {
      sql += ` AND entity_type = ANY($${paramIndex})`;
      params.push(filters.entityTypes);
      paramIndex++;
    }

    if (filters.dateRange) {
      sql += ` AND created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(filters.dateRange.start, filters.dateRange.end);
      paramIndex += 2;
    }

    if (filters.importanceRange) {
      sql += ` AND importance_score BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(filters.importanceRange.min, filters.importanceRange.max);
      paramIndex += 2;
    }

    if (filters.status && filters.status.length > 0) {
      sql += ` AND status = ANY($${paramIndex})`;
      params.push(filters.status);
    }

    return { attributeSql: sql, attributeParams: params };
  }

  /**
   * Build spatial filters
   */
  private buildSpatialFilters(filters: NonNullable<CosmosQuery['spatialFilters']>, paramIndex: number): {
    spatialSql: string;
    spatialParams: any[];
  } {
    let sql = '';
    const params: any[] = [];

    if (filters.viewport) {
      const { min, max } = filters.viewport;
      sql += ` AND position_x BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      sql += ` AND position_y BETWEEN $${paramIndex + 2} AND $${paramIndex + 3}`;
      sql += ` AND position_z BETWEEN $${paramIndex + 4} AND $${paramIndex + 5}`;
      params.push(min[0], max[0], min[1], max[1], min[2], max[2]);
      paramIndex += 6;
    }

    if (filters.radius) {
      const { center, radius } = filters.radius;
      sql += ` AND SQRT((position_x - $${paramIndex})^2 + (position_y - $${paramIndex + 1})^2 + (position_z - $${paramIndex + 2})^2) <= $${paramIndex + 3}`;
      params.push(center[0], center[1], center[2], radius);
      paramIndex += 4;
    }

    return { spatialSql: sql, spatialParams: params };
  }

  /**
   * Build set-based filters
   */
  private buildSetFilters(filters: NonNullable<CosmosQuery['setFilters']>, paramIndex: number): {
    setSql: string;
    setParams: any[];
  } {
    let sql = '';
    const params: any[] = [];

    if (filters.nodeIds && filters.nodeIds.length > 0) {
      sql += ` AND entity_id = ANY($${paramIndex})`;
      params.push(filters.nodeIds);
      paramIndex++;
    }

    if (filters.excludeIds && filters.excludeIds.length > 0) {
      sql += ` AND entity_id != ALL($${paramIndex})`;
      params.push(filters.excludeIds);
    }

    return { setSql: sql, setParams: params };
  }

  /**
   * Build time travel filters
   */
  private buildTimeTravelFilters(timeTravel: NonNullable<CosmosQuery['timeTravel']>, paramIndex: number): {
    timeSql: string;
    timeParams: any[];
  } {
    const { timestamp, direction = 'backward' } = timeTravel;
    
    if (direction === 'backward') {
      return {
        timeSql: ` AND created_at <= $${paramIndex}::timestamp`,
        timeParams: [timestamp]
      };
    } else {
      return {
        timeSql: ` AND created_at >= $${paramIndex}::timestamp`,
        timeParams: [timestamp]
      };
    }
  }

  /**
   * Build sorting and limit clauses
   */
  private buildSortAndLimit(options: CosmosQuery['options'], paramIndex: number): {
    sortLimitSql: string;
    sortLimitParams: any[];
  } {
    let sql = '';
    const params: any[] = [];

    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'importance':
          sql += ' ORDER BY importance_score';
          break;
        case 'created_at':
          sql += ' ORDER BY created_at';
          break;
        case 'distance':
          sql += ' ORDER BY created_at';
          break;
        default:
          sql += ' ORDER BY created_at';
      }
      
      sql += options.sortOrder === 'asc' ? ' ASC' : ' DESC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    if (options?.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      sql += ` OFFSET $${paramIndex + (options?.limit ? 1 : 0)}`;
      params.push(options.offset);
    }

    return { sortLimitSql: sql, sortLimitParams: params };
  }

  /**
   * Transform database results to CosmosQueryNode format
   */
  private transformToCosmosNodes(results: any[]): any[] {
    return results.map(row => ({
      id: row.entity_id,
      entity_id: row.entity_id,
      entity_type: row.entity_type,
      title: row.title || '',
      content: row.content || '',
      type: row.type || '',
      status: row.status || 'active',
      created_at: row.created_at,
      updated_at: row.updated_at,
      importance_score: row.importance_score,
      position_x: row.position_x,
      position_y: row.position_y,
      position_z: row.position_z,
      metadata: {}
    }));
  }

  /**
   * Get edges for a set of nodes
   */
  private async getEdgesForNodes(nodeIds: string[], userId: string): Promise<any[]> {
    try {
      const cypher = `
        MATCH (a)-[r]->(b)
        WHERE a.entity_id IN $nodeIds 
          AND b.entity_id IN $nodeIds
          AND a.user_id = $userId
          AND b.user_id = $userId
        RETURN 
          id(r) as id,
          a.entity_id as source,
          b.entity_id as target,
          type(r) as type,
          r.weight as weight,
          r.created_at as created_at
        ORDER BY r.created_at DESC
      `;

      const session = this.databaseService.neo4j.session();
      try {
        const result = await session.run(cypher, { nodeIds, userId });
        
        return result.records.map((record: any) => ({
          id: record.get('id').toString(),
          source: record.get('source'),
          target: record.get('target'),
          type: record.get('type'),
          weight: record.get('weight') || 1.0,
          created_at: new Date(record.get('created_at')),
          metadata: {}
        }));
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error('🌌 SpatialQueryWorker.getEdgesForNodes - Error:', error);
      return [];
    }
  }

  /**
   * Add a viewport query job to the queue
   */
  public async addViewportQuery(
    query: CosmosQuery, 
    userId: string, 
    requestId?: string
  ): Promise<string> {
    const job = await this.queue.add('viewport-query', {
      query,
      userId,
      queryType: 'viewport' as SpatialQueryType,
      requestId: requestId || `viewport-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    console.log('🌌 SpatialQueryWorker - Viewport query job added:', {
      jobId: job.id,
      requestId: job.data.requestId,
      userId
    });

    return job.id as string;
  }

  /**
   * Add a time-travel query job to the queue
   */
  public async addTimeTravelQuery(
    query: CosmosQuery, 
    userId: string, 
    requestId?: string
  ): Promise<string> {
    const job = await this.queue.add('time-travel-query', {
      query,
      userId,
      queryType: 'time-travel' as SpatialQueryType,
      requestId: requestId || `time-travel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    console.log('🌌 SpatialQueryWorker - Time-travel query job added:', {
      jobId: job.id,
      requestId: job.data.requestId,
      userId
    });

    return job.id as string;
  }

  /**
   * Add a filtered query job to the queue
   */
  public async addFilteredQuery(
    query: CosmosQuery, 
    userId: string, 
    requestId?: string
  ): Promise<string> {
    const job = await this.queue.add('filtered-query', {
      query,
      userId,
      queryType: 'filtered' as SpatialQueryType,
      requestId: requestId || `filtered-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    console.log('🌌 SpatialQueryWorker - Filtered query job added:', {
      jobId: job.id,
      requestId: job.data.requestId,
      userId
    });

    return job.id as string;
  }

  /**
   * Get job status and result
   */
  public async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      return {
        exists: false,
        status: 'not_found'
      };
    }

    const state = await job.getState();
    
    return {
      exists: true,
      status: state,
      progress: job.progress,
      result: job.returnvalue,
      error: job.failedReason,
      data: job.data
    };
  }

  /**
   * Wait for job completion and return result
   */
  public async waitForJobCompletion(jobId: string, timeoutMs: number = 30000): Promise<any> {
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    try {
      // Use a simple polling approach
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        const state = await job.getState();
        if (state === 'completed') {
          return job.returnvalue;
        } else if (state === 'failed') {
          throw new Error(job.failedReason || 'Job failed');
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Poll every 100ms
      }
      throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
    } catch (error) {
      console.error('🌌 SpatialQueryWorker - Job completion error:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }

  /**
   * Gracefully shutdown the worker
   */
  public async shutdown(): Promise<void> {
    console.log('🌌 SpatialQueryWorker - Shutting down...');
    await this.worker.close();
    await this.queue.close();
    console.log('🌌 SpatialQueryWorker - Shutdown complete');
  }
}
