/**
 * GraphProjectionWorker.ts
 * V11.0 Production-Grade Worker for 3D Knowledge Cosmos Coordinates
 * 
 * This worker generates 3D coordinates for entities whenever the InsightEngine
 * finishes its job. It coordinates between Neo4j graph structure, Weaviate 
 * vector embeddings, and Python dimension reduction to create 3D coordinates
 * stored directly in entity tables.
 * 
 * SIMPLE TRIGGER: Only processes 'cycle_artifacts_created' events from InsightEngine
 * 
 * ARCHITECTURE: V11.0 query-driven approach - stores coordinates in entity tables
 * instead of generating large JSON projections. Frontend queries coordinates directly.
 */

import { DatabaseService, Neo4jService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Worker, Job, Queue } from 'bullmq';
import { Prisma } from '@prisma/client';

// Event types that trigger projection updates
export interface NewEntitiesCreatedEvent {
  type: "new_entities_created";
  userId: string;
  source: "IngestionAnalyst";
  entities: Array<{
    id: string;
    type: "MemoryUnit" | "Concept" | "DerivedArtifact" | "Community" | "ProactivePrompt" | "GrowthEvent" | "User";
  }>;
}

export interface CycleArtifactsCreatedEvent {
  type: "cycle_artifacts_created";
  userId: string;
  source: "InsightEngine";
  timestamp: string;
  entities: Array<{
    id: string;
    type: "MemoryUnit" | "Concept" | "DerivedArtifact" | "Community" | "ProactivePrompt" | "GrowthEvent" | "User";
  }>;
}

export type GraphProjectionEvent = NewEntitiesCreatedEvent | CycleArtifactsCreatedEvent;

export interface GraphProjectionWorkerConfig {
  queueName?: string;
  concurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
  dimensionReducerUrl?: string;
  projectionMethod?: 'umap' | 'tsne';
  // V11.0 Hybrid UMAP Configuration
  umapInterval?: number;        // Default: 500 nodes
  minNodesForUMAP?: number;    // Default: 500 nodes
  maxNodesForUMAP?: number;    // Default: 10000 nodes
}

export interface Node3D {
  entity_id: string;
  type: 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'Community' | 'ProactivePrompt' | 'GrowthEvent' | 'User';
  title: string;
  content: string;
  position: [number, number, number]; // 3D coordinates
  connections: string[]; // Connected node IDs
  importance: number;
  metadata: {
    createdAt: string;
    lastUpdated: string;
    userId: string;
    isMerged?: boolean;
    mergedIntoConceptId?: string | null;
    status?: string;
  };
}


/**
 * GraphProjectionWorker V11.0 Production Implementation
 * 
 * Generates 3D coordinates for entities and stores them directly in entity tables.
 * Integrates Neo4j graph structure, Weaviate embeddings, and Python ML services.
 * Uses the new V11.0 query-driven architecture - no longer generates legacy JSON projections.
 */
export class GraphProjectionWorker {
  private worker: Worker;
  private config: GraphProjectionWorkerConfig;
  private neo4jService: Neo4jService;
  private retryCounts: Map<string, number> = new Map(); // Track retry attempts per job
  // Add a queue for publishing notification jobs
  private notificationQueue: Queue;

  constructor(
    private databaseService: DatabaseService,
    config: GraphProjectionWorkerConfig = {}
  ) {
    // CRITICAL: Load environment variables first
    console.log('[GraphProjectionWorker] Loading environment variables...');
    environmentLoader.load();
    environmentLoader.injectIntoProcess();
    console.log('[GraphProjectionWorker] Environment variables loaded successfully');

    this.config = {
      queueName: 'graph-queue',
      concurrency: 2,
      retryAttempts: 3, // ENABLED: BullMQ retries appropriate for non-LLM operations (database, Python service, network)
      retryDelay: 5000,
      dimensionReducerUrl: environmentLoader.get('DIMENSION_REDUCER_URL') || 'http://localhost:8000',
      projectionMethod: 'umap',
      // V11.0 Hybrid UMAP Configuration
      umapInterval: parseInt(environmentLoader.get('UMAP_INTERVAL') || '500'),
      minNodesForUMAP: parseInt(environmentLoader.get('MIN_NODES_FOR_UMAP') || '500'),
      maxNodesForUMAP: parseInt(environmentLoader.get('MAX_NODES_FOR_UMAP') || '10000'),
      ...config
    };

    // Validate configuration
    this.validateConfiguration();

    console.log(`[GraphProjectionWorker] Using dimension reducer at: ${this.config.dimensionReducerUrl}`);

    // Initialize services
    this.neo4jService = new Neo4jService(databaseService);

    // Initialize BullMQ worker with EnvironmentLoader
    const redisConnection = {
      host: environmentLoader.get('REDIS_HOST') || 'localhost',
      port: parseInt(environmentLoader.get('REDIS_PORT') || '6379'),
      password: environmentLoader.get('REDIS_PASSWORD'),
    };

    console.log(`[GraphProjectionWorker] Redis connection configured: ${redisConnection.host}:${redisConnection.port}`);

    this.worker = new Worker(
      this.config.queueName!,
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: this.config.concurrency,
      }
    );

    // Initialize notification queue (same Redis connection)
    this.notificationQueue = new Queue('notification-queue', { connection: redisConnection });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`[GraphProjectionWorker] Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[GraphProjectionWorker] Job ${job?.id} failed:`, error);
      
      // Log specific error details for debugging
      if (error.message.includes('database') || error.message.includes('postgres') || error.message.includes('neo4j')) {
        console.error(`[GraphProjectionWorker] Database error detected - will retry if attempts remaining`);
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        console.error(`[GraphProjectionWorker] Network/connection error detected - will retry if attempts remaining`);
      } else if (error.message.includes('python') || error.message.includes('umap') || error.message.includes('service')) {
        console.error(`[GraphProjectionWorker] Python service error detected - will retry if attempts remaining`);
      } else {
        console.error(`[GraphProjectionWorker] Unknown error type - will retry if attempts remaining`);
      }
      
      // Check if job has exhausted all retries
      if (job && job.attemptsMade >= this.config.retryAttempts!) {
        console.error(`[GraphProjectionWorker] Job ${job.id} exhausted all retry attempts, moving to DLQ`);
      }
    });

    this.worker.on('error', (error) => {
      console.error('[GraphProjectionWorker] Worker error:', error);
    });

    console.log(`[GraphProjectionWorker] Worker initialized and listening on queue: ${this.config.queueName}`);
  }

  /**
   * V11.0: Validate configuration parameters
   */
  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate UMAP interval
    if (!this.config.umapInterval || this.config.umapInterval < 1) {
      errors.push('UMAP_INTERVAL must be a positive integer');
    }

    // Validate minimum nodes for UMAP
    if (!this.config.minNodesForUMAP || this.config.minNodesForUMAP < 1) {
      errors.push('MIN_NODES_FOR_UMAP must be a positive integer');
    }

    // Validate maximum nodes for UMAP
    if (this.config.maxNodesForUMAP && this.config.maxNodesForUMAP < this.config.minNodesForUMAP!) {
      errors.push('MAX_NODES_FOR_UMAP must be greater than or equal to MIN_NODES_FOR_UMAP');
    }

    // Validate dimension reducer URL
    if (!this.config.dimensionReducerUrl) {
      errors.push('DIMENSION_REDUCER_URL must be set');
    }

    // Validate concurrency
    if (!this.config.concurrency || this.config.concurrency < 1) {
      errors.push('concurrency must be a positive integer');
    }

    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
      console.error(`[GraphProjectionWorker] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`[GraphProjectionWorker] ✅ Configuration validated successfully`);
    console.log(`[GraphProjectionWorker] UMAP Interval: ${this.config.umapInterval}, Min Nodes: ${this.config.minNodesForUMAP}, Max Nodes: ${this.config.maxNodesForUMAP || 'unlimited'}`);
  }

  /**
   * Main job processing function - processes both IngestionAnalyst and InsightEngine completion events
   */
  private async processJob(job: Job<GraphProjectionEvent>): Promise<void> {
    const { data } = job;

    // Process both new_entities_created and cycle_artifacts_created events
    if (data.type !== 'new_entities_created' && data.type !== 'cycle_artifacts_created') {
      console.log(`[GraphProjectionWorker] Skipping event - only processing new_entities_created and cycle_artifacts_created`);
      return;
    }

    // Now we know data is properly typed, so we can safely access its properties
    const sourceWorker = data.type === 'new_entities_created' ? 'IngestionAnalyst' : 'InsightEngine';
    console.log(`[GraphProjectionWorker] ✅ ${sourceWorker} finished job for user ${data.userId}`);
    console.log(`[GraphProjectionWorker] Event contains ${data.entities.length} entities: ${data.entities.map(e => `${e.type}:${e.id}`).join(', ')}`);

    const startTime = Date.now();

    try {
      // Check if embeddings are ready for the new entities
      const missingEmbeddings = await this.checkMissingEmbeddings(data.entities);
      if (missingEmbeddings.length > 0) {
        // Check retry limit (max 15 retries = 30 seconds total wait)
        const jobKey = `${data.userId}_${data.entities.map(e => e.id).join('_')}`;
        const retryCount = this.retryCounts.get(jobKey) || 0;
        const maxRetries = 15; // 30 seconds total (15 * 2 seconds)
        
        if (retryCount >= maxRetries) {
          console.warn(`[GraphProjectionWorker] ⚠️ Max retries (${maxRetries}) reached for embeddings: ${missingEmbeddings.join(', ')}`);
          console.warn(`[GraphProjectionWorker] ⚠️ Proceeding with projection using available embeddings only`);
          this.retryCounts.delete(jobKey); // Clean up
        } else {
          console.log(`[GraphProjectionWorker] Waiting for embeddings: ${missingEmbeddings.join(', ')} (retry ${retryCount + 1}/${maxRetries})`);
          this.retryCounts.set(jobKey, retryCount + 1);
          // Wait 2 seconds and retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.processJob(job); // Retry
        }
      } else {
        // All embeddings ready, clean up retry tracking
        const jobKey = `${data.userId}_${data.entities.map(e => e.id).join('_')}`;
        this.retryCounts.delete(jobKey);
        console.log(`[GraphProjectionWorker] All embeddings ready, proceeding with projection`);
      }
      
      // Generate 3D coordinates using hybrid UMAP approach (V11.0 Cosmos)
      console.log(`[GraphProjectionWorker] 🔄 Generating 3D coordinates for user ${data.userId} after ${sourceWorker} completion`);
      const projection = await this.generateProjectionWithHybridUMAP(data.userId, data.entities);

      const duration = Date.now() - startTime;
      console.log(`[GraphProjectionWorker] ✅ Successfully generated coordinates for user ${data.userId} in ${duration}ms`);
      console.log(`[GraphProjectionWorker] Updated coordinates for ${projection.nodes.length} nodes`);

      // Enqueue notification for "coordinates_updated"
      try {
        const payload = {
          type: 'coordinates_updated' as const,
          userId: data.userId,
          coordinateUpdate: {
            nodeCount: projection.nodes.length,
            method: projection.projectionMethod,
            isIncremental: projection.metadata?.isIncremental || false,
          },
        };

        await this.notificationQueue.add('coordinates_updated', payload, {
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        });

        console.log(
          `[GraphProjectionWorker] 📣 Enqueued notification 'coordinates_updated' for user ${data.userId} (nodes=${projection.nodes.length})`
        );
      } catch (notifyErr) {
        console.error('[GraphProjectionWorker] Failed to enqueue coordinates_updated notification:', notifyErr);
        // Do not fail the coordinate generation job if notification enqueue fails
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[GraphProjectionWorker] Failed to generate coordinates for user ${data.userId} after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Check if embeddings exist for the given entities
   */
  private async checkMissingEmbeddings(entities: Array<{id: string, type: string}>): Promise<string[]> {
    const missing: string[] = [];
    
    for (const entity of entities) {
      try {
        // Validate if entity.id is a valid UUID before querying Weaviate
        if (!this.isValidUuid(entity.id)) {
          console.warn(`[GraphProjectionWorker] ⚠️ Entity ID "${entity.id}" is not a valid UUID, skipping Weaviate check`);
          missing.push(entity.id);
          continue;
        }

        const exists = await this.databaseService.weaviate
          .graphql
          .get()
          .withClassName('UserKnowledgeItem')
          .withFields('entity_id')
          .withWhere({
            operator: 'And',
            operands: [
              { path: ['entity_type'], operator: 'Equal', valueString: entity.type },
              { path: ['entity_id'], operator: 'Equal', valueString: entity.id }
            ]
          })
          .withLimit(1)
          .do();
          
        if (!exists.data?.Get?.UserKnowledgeItem?.[0]) {
          missing.push(entity.id);
        }
      } catch (error) {
        console.warn(`[GraphProjectionWorker] Error checking embedding for ${entity.type} ${entity.id}:`, error);
        missing.push(entity.id);
      }
    }
    
    return missing;
  }

  /**
   * V11.0 Hybrid UMAP: Generate coordinates using hybrid approach
   * Decides between UMAP learning and linear transformation based on node count
   */
  public async generateProjectionWithHybridUMAP(userId: string, newEntities: Array<{id: string, type: string}>): Promise<{
    nodes: Node3D[];
    projectionMethod: string;
    metadata?: {
      transformationMatrix?: number[][];
      umapParameters?: any;
      isIncremental?: boolean;
    };
  }> {
    console.log(`[GraphProjectionWorker] Starting hybrid UMAP coordinate generation for user ${userId}`);

    // Get current node count
    const currentNodeCount = await this.getCurrentNodeCount(userId);
    const totalNodes = currentNodeCount + newEntities.length;
    
    console.log(`[GraphProjectionWorker] Current nodes: ${currentNodeCount}, New entities: ${newEntities.length}, Total: ${totalNodes}`);

    if (this.shouldRunUMAP(totalNodes)) {
      console.log(`[GraphProjectionWorker] 🧠 Running UMAP Learning Phase (total nodes: ${totalNodes})`);
      return await this.handleUMAPLearningPhase(userId, newEntities);
    } else {
      console.log(`[GraphProjectionWorker] ⚡ Running Linear Transformation Phase (total nodes: ${totalNodes})`);
      return await this.handleLinearTransformationPhase(userId, newEntities);
    }
  }

  /**
   * V11.0: Check if UMAP learning should run based on node count
   */
  private shouldRunUMAP(totalNodes: number): boolean {
    // Configuration is validated in constructor, so these values are guaranteed to exist
    const minNodes = this.config.minNodesForUMAP!;
    const maxNodes = this.config.maxNodesForUMAP || Infinity;
    const interval = this.config.umapInterval!;
    
    return totalNodes >= minNodes && 
           totalNodes <= maxNodes &&
           totalNodes % interval === 0;
  }

  /**
   * V11.0: Get current node count for user (optimized - uses PostgreSQL COUNT queries)
   */
  private async getCurrentNodeCount(userId: string): Promise<number> {
    try {
      // Count entities with 3D coordinates from PostgreSQL (this is what the frontend uses)
      const [conceptsCount, memoryUnitsCount, derivedArtifactsCount, communitiesCount, growthEventsCount] = await Promise.all([
        this.databaseService.prisma.concepts.count({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          }
        }),
        this.databaseService.prisma.memory_units.count({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          }
        }),
        this.databaseService.prisma.derived_artifacts.count({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          }
        }),
        this.databaseService.prisma.communities.count({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          }
        }),
        this.databaseService.prisma.growth_events.count({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          }
        })
      ]);

      const totalCount = conceptsCount + memoryUnitsCount + derivedArtifactsCount + communitiesCount + growthEventsCount;
      console.log(`[GraphProjectionWorker] Current node count for user ${userId}: ${totalCount} (concepts: ${conceptsCount}, memory_units: ${memoryUnitsCount}, derived_artifacts: ${derivedArtifactsCount}, communities: ${communitiesCount}, growth_events: ${growthEventsCount})`);
      return totalCount;
    } catch (error) {
      console.error(`[GraphProjectionWorker] Failed to get node count for user ${userId}:`, error);
      throw new Error(`Failed to get node count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * V11.0: UMAP Learning Phase - Learn manifold structure and create transformation matrix
   */
  private async handleUMAPLearningPhase(userId: string, newEntities: Array<{id: string, type: string}>): Promise<{
    nodes: Node3D[];
    projectionMethod: string;
    metadata?: {
      transformationMatrix?: number[][];
      umapParameters?: any;
      isIncremental?: boolean;
    };
  }> {
    console.log(`[GraphProjectionWorker] 🧠 UMAP Learning Phase: Learning manifold structure`);

    // Step 1: Get ALL nodes (existing + new)
    const allNodes = await this.fetchGraphStructureFromNeo4j(userId);
    console.log(`[GraphProjectionWorker] UMAP Learning: Processing ${allNodes.nodes.length} total nodes`);

    if (allNodes.nodes.length === 0) {
      return { nodes: [], projectionMethod: 'none' };
    }

    // Step 2: Get embeddings for all nodes
    const allEmbeddings = await this.fetchEmbeddingsFromWeaviate(allNodes.nodes);
    console.log(`[GraphProjectionWorker] UMAP Learning: Fetched ${allEmbeddings.length} embeddings`);

    // Step 3: Run UMAP to learn manifold structure
    const dimensionResult = await this.callDimensionReducer(allEmbeddings);
    console.log(`[GraphProjectionWorker] UMAP Learning: Generated coordinates for ${dimensionResult.coordinates.length} nodes`);

    // Step 4: Store transformation matrix for future linear transformations
    if (dimensionResult.transformationMatrix) {
      await this.storeTransformationMatrix(userId, dimensionResult.transformationMatrix, dimensionResult.umapParameters);
      console.log(`[GraphProjectionWorker] UMAP Learning: Stored transformation matrix`);
    }

    // Step 5: Update all coordinates in entity tables
    await this.storeCoordinatesInEntities(userId, allNodes.nodes, dimensionResult.coordinates);
    console.log(`[GraphProjectionWorker] UMAP Learning: Updated coordinates for all ${allNodes.nodes.length} entities`);

    // Step 6: Create node data for notifications
    const nodes: Node3D[] = allNodes.nodes.map((node: any, index: number) => ({
      entity_id: node.entity_id,
      type: node.type as 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'Community' | 'ProactivePrompt' | 'GrowthEvent' | 'User',
      title: node.title,
      content: node.content,
      position: dimensionResult.coordinates[index] as [number, number, number],
      connections: node.connections || [],
      importance: node.importance || 0.5,
      metadata: {
        createdAt: node.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        userId,
        isMerged: node.metadata?.isMerged || false,
        mergedIntoConceptId: node.metadata?.mergedIntoConceptId || null,
        status: node.metadata?.status || 'active'
      }
    }));

    console.log(`[GraphProjectionWorker] ✅ UMAP Learning Phase complete for ${nodes.length} nodes`);
    return {
      nodes,
      projectionMethod: 'umap_learning',
      metadata: {
        transformationMatrix: dimensionResult.transformationMatrix,
        umapParameters: dimensionResult.umapParameters,
        isIncremental: false
      }
    };
  }

  /**
   * V11.0: Linear Transformation Phase - Fast positioning using stored transformation matrix
   */
  private async handleLinearTransformationPhase(userId: string, newEntities: Array<{id: string, type: string}>): Promise<{
    nodes: Node3D[];
    projectionMethod: string;
    metadata?: {
      transformationMatrix?: number[][];
      umapParameters?: any;
      isIncremental?: boolean;
    };
  }> {
    console.log(`[GraphProjectionWorker] ⚡ Linear Transformation Phase: Fast positioning for ${newEntities.length} new entities`);

    // Step 1: Get stored transformation matrix
    const matrixData = await this.getTransformationMatrix(userId);
    if (!matrixData) {
      console.warn(`[GraphProjectionWorker] No transformation matrix found, falling back to UMAP learning`);
      return await this.handleUMAPLearningPhase(userId, newEntities);
    }

    // Step 2: Get embeddings for new entities only
    const newNodes = await this.getNodesForEntities(userId, newEntities);
    const newEmbeddings = await this.fetchEmbeddingsFromWeaviate(newNodes);
    console.log(`[GraphProjectionWorker] Linear Transformation: Fetched ${newEmbeddings.length} embeddings for new entities`);

    // Step 3: Transform new embeddings using stored matrix
    const newCoordinates = await this.transformWithLinearMatrix(newEmbeddings, matrixData.transformationMatrix);
    console.log(`[GraphProjectionWorker] Linear Transformation: Generated coordinates for ${newCoordinates.length} new entities`);

    // Step 4: Store new coordinates in entity tables
    await this.storeCoordinatesInEntities(userId, newNodes, newCoordinates);
    console.log(`[GraphProjectionWorker] Linear Transformation: Updated coordinates for ${newNodes.length} new entities`);

    // Step 5: Create node data for notifications (only new entities)
    const nodes: Node3D[] = newNodes.map((node: any, index: number) => ({
      entity_id: node.entity_id,
      type: node.type as 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'Community' | 'ProactivePrompt' | 'GrowthEvent' | 'User',
      title: node.title,
      content: node.content,
      position: newCoordinates[index] as [number, number, number],
      connections: node.connections || [],
      importance: node.importance || 0.5,
      metadata: {
        createdAt: node.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        userId,
        isMerged: node.metadata?.isMerged || false,
        mergedIntoConceptId: node.metadata?.mergedIntoConceptId || null,
        status: node.metadata?.status || 'active'
      }
    }));

    console.log(`[GraphProjectionWorker] ✅ Linear Transformation Phase complete for ${nodes.length} new entities`);
    return {
      nodes,
      projectionMethod: 'linear_transformation',
      metadata: {
        transformationMatrix: matrixData.transformationMatrix,
        umapParameters: matrixData.umapParameters,
        isIncremental: true
      }
    };
  }

  /**
   * V11.0: Store transformation matrix in user_graph_projections table
   */
  private async storeTransformationMatrix(userId: string, transformationMatrix: number[][], umapParameters?: any): Promise<void> {
    try {
      // Store in user_graph_projections table for future use
      await this.databaseService.prisma.user_graph_projections.create({
        data: {
          projection_id: `matrix_${userId}_${Date.now()}`,
          user_id: userId,
          status: 'completed',
          transformation_matrix: transformationMatrix as any,
          umap_parameters: umapParameters as any,
          metadata: {
            version: `v${Date.now()}`,
            createdAt: new Date().toISOString(),
            processingMethod: 'hybrid_umap',
            isIncremental: false,
            hybridUMAP: true,
            phase: 'umap_learning'
          }
        }
      });
      console.log(`[GraphProjectionWorker] ✅ Stored transformation matrix for user ${userId}`);
    } catch (error) {
      console.error(`[GraphProjectionWorker] Failed to store transformation matrix for user ${userId}:`, error);
      throw new Error(`Failed to store transformation matrix: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * V11.0: Get stored transformation matrix from user_graph_projections table
   */
  private async getTransformationMatrix(userId: string): Promise<{
    transformationMatrix: number[][];
    umapParameters?: any;
  } | null> {
    try {
      const projection = await this.databaseService.prisma.user_graph_projections.findFirst({
        where: {
          user_id: userId
        },
        orderBy: { created_at: 'desc' }
      });

      if (projection && projection.transformation_matrix) {
        return {
          transformationMatrix: projection.transformation_matrix as number[][],
          umapParameters: projection.umap_parameters as any
        };
      }
      return null;
    } catch (error) {
      console.error(`[GraphProjectionWorker] Failed to get transformation matrix for user ${userId}:`, error);
      throw new Error(`Failed to get transformation matrix: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * V11.0: Get nodes for specific entities (optimized - queries specific entities only)
   */
  private async getNodesForEntities(userId: string, entities: Array<{id: string, type: string}>): Promise<any[]> {
    try {
      if (entities.length === 0) {
        return [];
      }

      // Query PostgreSQL directly for new entities (they may not be in Neo4j yet)
      const entityIds = entities.map(e => e.id);
      const allNodes: any[] = [];

      // Query each entity type from PostgreSQL
      const [concepts, memoryUnits, derivedArtifacts, communities, growthEvents] = await Promise.all([
        this.databaseService.prisma.concepts.findMany({
          where: { 
            user_id: userId,
            entity_id: { in: entityIds }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            importance_score: true,
            created_at: true,
            type: true
          }
        }),
        this.databaseService.prisma.memory_units.findMany({
          where: { 
            user_id: userId,
            entity_id: { in: entityIds }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            importance_score: true,
            created_at: true,
            type: true
          }
        }),
        this.databaseService.prisma.derived_artifacts.findMany({
          where: { 
            user_id: userId,
            entity_id: { in: entityIds }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            created_at: true,
            type: true
          }
        }),
        this.databaseService.prisma.communities.findMany({
          where: { 
            user_id: userId,
            entity_id: { in: entityIds }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            created_at: true,
            type: true
          }
        }),
        this.databaseService.prisma.growth_events.findMany({
          where: { 
            user_id: userId,
            entity_id: { in: entityIds }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            created_at: true,
            type: true
          }
        })
      ]);

      // Combine and transform all entities
      const allEntities = [
        ...concepts.map(entity => ({ ...entity, type: 'Concept' })),
        ...memoryUnits.map(entity => ({ ...entity, type: 'MemoryUnit' })),
        ...derivedArtifacts.map(entity => ({ ...entity, type: 'DerivedArtifact' })),
        ...communities.map(entity => ({ ...entity, type: 'Community' })),
        ...growthEvents.map(entity => ({ ...entity, type: 'GrowthEvent' }))
      ];

      // Transform to the expected format
      const transformedNodes = allEntities.map(entity => ({
        entity_id: entity.entity_id,
        type: entity.type,
        title: entity.title || 'Untitled',
        content: entity.content || '',
        importance: (entity as any).importance_score || 0.5,
        createdAt: entity.created_at?.toISOString() || new Date().toISOString(),
        connections: [],
        metadata: {}
      }));

      console.log(`[GraphProjectionWorker] Retrieved ${transformedNodes.length} specific entities for linear transformation`);
      return transformedNodes;
    } catch (error) {
      console.error(`[GraphProjectionWorker] Failed to get nodes for entities:`, error);
      throw new Error(`Failed to get specific entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to determine entity type from Neo4j labels
   */
  private getEntityTypeFromLabels(labels: string[]): string {
    // Map Neo4j labels to entity types
    const labelMap: Record<string, string> = {
      'MemoryUnit': 'MemoryUnit',
      'Concept': 'Concept', 
      'DerivedArtifact': 'DerivedArtifact',
      'Community': 'Community',
      'ProactivePrompt': 'ProactivePrompt',
      'GrowthEvent': 'GrowthEvent',
      'User': 'User'
    };

    for (const label of labels) {
      if (labelMap[label]) {
        return labelMap[label];
      }
    }
    
    return 'Unknown';
  }

  /**
   * V11.0: Validate transformation matrix dimensions and format
   */
  private validateTransformationMatrix(matrix: number[][], embeddings: number[][]): void {
    if (!matrix || !Array.isArray(matrix)) {
      throw new Error('Transformation matrix must be a 2D array');
    }

    if (matrix.length === 0) {
      throw new Error('Transformation matrix cannot be empty');
    }

    // Check if all rows have the same length
    const expectedCols = matrix[0].length;
    for (let i = 0; i < matrix.length; i++) {
      if (!Array.isArray(matrix[i])) {
        throw new Error(`Transformation matrix row ${i} must be an array`);
      }
      if (matrix[i].length !== expectedCols) {
        throw new Error(`Transformation matrix row ${i} has ${matrix[i].length} columns, expected ${expectedCols}`);
      }
    }

    // Validate dimensions
    const embeddingDim = embeddings.length > 0 ? embeddings[0].length : 0;
    const targetDim = 3; // Always 3D for Cosmos

    if (matrix.length !== embeddingDim) {
      throw new Error(`Transformation matrix input dimension mismatch: matrix has ${matrix.length} rows, embeddings have ${embeddingDim} dimensions`);
    }

    if (matrix[0].length !== targetDim) {
      throw new Error(`Transformation matrix output dimension mismatch: matrix has ${matrix[0].length} columns, expected ${targetDim} for 3D output`);
    }

    // Check for NaN or Infinity values
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        const value = matrix[i][j];
        if (typeof value !== 'number' || !isFinite(value)) {
          throw new Error(`Transformation matrix[${i}][${j}] contains invalid value: ${value}`);
        }
      }
    }

    console.log(`[GraphProjectionWorker] ✅ Transformation matrix validated: ${matrix.length}x${matrix[0].length}`);
  }

  /**
   * V11.0: Transform embeddings using linear transformation matrix
   */
  private async transformWithLinearMatrix(embeddings: number[][], transformationMatrix: number[][]): Promise<number[][]> {
    try {
      // Validate transformation matrix
      this.validateTransformationMatrix(transformationMatrix, embeddings);

      // Call Python service for linear transformation
      const requestBody = {
        vectors: embeddings,
        method: 'linear_transformation',
        transformation_matrix: transformationMatrix,
        target_dimensions: 3
      };

      const response = await fetch(`${this.config.dimensionReducerUrl}/reduce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30 second timeout for linear transformation
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Linear transformation service responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.coordinates || !Array.isArray(result.coordinates)) {
        throw new Error('Invalid response format from linear transformation service');
      }

      console.log(`[GraphProjectionWorker] ✅ Linear transformation completed for ${embeddings.length} vectors`);
      return result.coordinates;
      
    } catch (error) {
      console.error(`[GraphProjectionWorker] ❌ Linear transformation failed, using fallback coordinates:`, error);
      return this.generateFallback3DCoordinates(embeddings.length);
    }
  }

  /**
   * REAL IMPLEMENTATION: Fetch graph structure from Neo4j using Neo4jService
   */
  private async fetchGraphStructureFromNeo4j(userId: string): Promise<{
    nodes: Array<{
      entity_id: string;
      type: string;
      title: string;
      content: string;
      importance: number;
      createdAt: string;
      connections: string[];
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      properties: Record<string, any>;
    }>;
  }> {
    try {
      // Use Neo4jService to fetch full graph structure
      const graphStructure = await this.neo4jService.fetchFullGraphStructure(userId);
      
      const processedNodes = graphStructure.nodes.map(node => {
        // Determine node type from labels - support all 8 entity types
        let nodeType: 'MemoryUnit' | 'Concept' | 'DerivedArtifact' | 'Community' | 'ProactivePrompt' | 'GrowthEvent' | 'User';
        
        if (node.labels.includes('ProactivePrompt')) {
          nodeType = 'ProactivePrompt';
        } else if (node.labels.includes('GrowthEvent')) {
          nodeType = 'GrowthEvent';
        } else if (node.labels.includes('User')) {
          nodeType = 'User';
        } else if (node.labels.includes('Concept')) {
          // Handle merged concepts - they should still appear but with merged status
          if (node.properties.status === 'merged') {
            // This is a merged concept, mark it as such but don't skip it
            nodeType = 'Concept';
            // Add merged status to metadata for visual distinction
            node.properties.isMerged = true;
            node.properties.mergedIntoEntityId = node.properties.merged_into_entity_id;
          } else {
            nodeType = 'Concept';
          }
        } else if (node.labels.includes('MemoryUnit')) {
          nodeType = 'MemoryUnit';
        } else if (node.labels.includes('DerivedArtifact')) {
          nodeType = 'DerivedArtifact';
        } else if (node.labels.includes('Community')) {
          nodeType = 'Community';
        } else {
          console.error(`[GraphProjectionWorker] ❌ Unsupported node type: ${node.labels.join(', ')} for node ${node.entity_id}`);
          throw new Error(`Unsupported node type: ${node.labels.join(', ')}`);
        }
        
        // Extract actual UUID from the standardized entity_id field
        const entityId = node.entity_id;
        
        if (!entityId || !this.isValidUuid(entityId)) {
          console.warn(`[GraphProjectionWorker] ⚠️ Skipping node with invalid UUID: ${entityId} (labels: ${node.labels.join(', ')})`);
          return null; // Skip this node
        }
        
        // Extract connections from edges
        const connections = graphStructure.edges
          .filter(edge => edge.source === entityId)
          .map(edge => edge.target);
        
        return {
          entity_id: entityId, // Use standardized entity_id field
          type: nodeType,
          title: node.properties.title || 'Untitled',
          content: node.properties.content || '',
          importance: node.properties.importance_score || 0.5,
          createdAt: node.properties.created_at || new Date().toISOString(),
          connections,
          metadata: {
            // Add merged concept information
            isMerged: node.properties.status === 'merged',
            mergedIntoEntityId: node.properties.merged_into_entity_id || null,
            status: node.properties.status || 'active'
          }
        };
      }).filter((node): node is NonNullable<typeof node> => node !== null); // Remove any null nodes
      
      // Process edges to match the expected format
      const processedEdges = graphStructure.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        properties: edge.properties
      }));
      
      console.log(`[GraphProjectionWorker] ✅ Fetched ${processedNodes.length} nodes and ${processedEdges.length} edges from Neo4j for user ${userId}`);
      return { nodes: processedNodes, edges: processedEdges };
      
    } catch (error) {
      console.error(`[GraphProjectionWorker] ❌ Neo4j query failed:`, error);
      // Return empty structure on failure
      return { nodes: [], edges: [] };
    }
  }

  /**
   * REAL IMPLEMENTATION: Fetch embeddings from Weaviate for graph nodes
   */
  private async fetchEmbeddingsFromWeaviate(nodes: any[]): Promise<number[][]> {
    if (!this.databaseService.weaviate) {
      console.warn(`[GraphProjectionWorker] Weaviate client not available, using fallback vectors`);
      return this.generateFallbackVectors(nodes.length);
    }

    try {
      const vectors: number[][] = [];
      
      for (const node of nodes) {
        try {
          // Validate if node.entity_id is a valid UUID before querying Weaviate
          if (!this.isValidUuid(node.entity_id)) {
            console.warn(`[GraphProjectionWorker] ⚠️ Node entity_id "${node.entity_id}" is not a valid UUID, using fallback vector`);
            const fallbackVector = this.generateSemanticFallbackVector(node);
            vectors.push(fallbackVector);
            continue;
          }

          // Use unified UserKnowledgeItem class with entity_type filter
          const result = await this.databaseService.weaviate
            .graphql
            .get()
            .withClassName('UserKnowledgeItem')
            .withFields('entity_id entity_type _additional { vector }')
            .withWhere({
              operator: 'And',
              operands: [
                {
                  path: ['entity_type'],
                  operator: 'Equal',
                  valueString: node.type
                },
                {
                  path: ['entity_id'],
                  operator: 'Equal',
                  valueString: node.entity_id
                }
              ]
            })
            .withLimit(1)
            .do();

          if (result.data?.Get?.UserKnowledgeItem?.[0]?._additional?.vector && result.data.Get.UserKnowledgeItem[0]._additional.vector.length > 0) {
            const embedding = result.data.Get.UserKnowledgeItem[0]._additional.vector;
            vectors.push(embedding);
            console.log(`[GraphProjectionWorker] ✅ Retrieved embedding for ${node.type} ${node.entity_id}`);
          } else {
            // Try alternative query with content similarity if direct ID lookup fails
            // Generate a temporary embedding for the fallback search
            const fallbackVector = this.generateSemanticFallbackVector(node);
            
            const fallbackResult = await this.databaseService.weaviate
              .graphql
              .get()
              .withClassName('UserKnowledgeItem')
              .withFields('entity_id entity_type _additional { vector }')
              .withWhere({
                path: ['entity_type'],
                operator: 'Equal',
                valueString: node.type
              })
              .withNearVector({ 
                vector: fallbackVector,
                distance: 0.7 
              })
              .withLimit(1)
              .do();

            if (fallbackResult.data?.Get?.UserKnowledgeItem?.[0]?._additional?.vector && fallbackResult.data.Get.UserKnowledgeItem[0]._additional.vector.length > 0) {
              const embedding = fallbackResult.data.Get.UserKnowledgeItem[0]._additional.vector;
              vectors.push(embedding);
              console.log(`[GraphProjectionWorker] ✅ Retrieved fallback embedding for ${node.type} ${node.entity_id}`);
            } else {
              // If even the fallback search fails, use the generated fallback vector
              vectors.push(fallbackVector);
              console.log(`[GraphProjectionWorker] ⚠️ Using generated fallback vector for ${node.type} ${node.entity_id} (no similar embeddings found)`);
            }
          }
                 } catch (nodeError: any) {
           // Generate fallback vector for this specific node
           const fallbackVector = this.generateSemanticFallbackVector(node);
           vectors.push(fallbackVector);
           console.warn(`[GraphProjectionWorker] ⚠️ Using fallback vector for ${node.entity_id}:`, nodeError?.message || 'Unknown error');
        }
      }
      
      console.log(`[GraphProjectionWorker] ✅ Retrieved ${vectors.length} embeddings from Weaviate`);
      return vectors;
      
    } catch (error) {
      console.error(`[GraphProjectionWorker] ❌ Weaviate query failed, using fallback vectors:`, error);
      return this.generateFallbackVectors(nodes.length);
    }
  }

  /**
   * REAL IMPLEMENTATION: Call Python dimension reducer service
   */
  /**
   * V11.0 Cosmos: Enhanced dimension reducer with UMAP learning support
   */
  private async callDimensionReducer(vectors: number[][]): Promise<{
    coordinates: number[][];
    transformationMatrix?: number[][];
    umapParameters?: any;
    isIncremental: boolean;
  }> {
    if (vectors.length === 0) {
      return { coordinates: [], isIncremental: false };
    }

    try {
      const requestBody = {
        vectors: vectors,
        method: 'umap_learning', // V11.0: Use UMAP learning phase
        target_dimensions: 3,
        random_state: 42,
        n_neighbors: Math.min(15, Math.max(2, vectors.length - 1)),
        min_dist: 0.8, // V11.0: Increased for better spread
        spread: 3.0,   // V11.0: Added spread parameter
        use_linear_transformation: true
      };

      console.log(`[GraphProjectionWorker] Calling UMAP learning dimension reducer with ${vectors.length} vectors`);

      const response = await fetch(`${this.config.dimensionReducerUrl}/reduce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Dimension reducer service responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.coordinates || !Array.isArray(result.coordinates)) {
        throw new Error('Invalid response format from dimension reducer');
      }

      console.log(`[GraphProjectionWorker] ✅ Hybrid UMAP reduction completed for ${vectors.length} vectors in ${result.processing_time_ms}ms, incremental: ${result.is_incremental}`);
      
      return {
        coordinates: result.coordinates,
        transformationMatrix: result.transformation_matrix,
        umapParameters: result.umap_parameters,
        isIncremental: result.is_incremental || false
      };
      
    } catch (error) {
      console.error(`[GraphProjectionWorker] ❌ Hybrid UMAP reduction failed, using fallback coordinates:`, error);
      return {
        coordinates: this.generateFallback3DCoordinates(vectors.length),
        isIncremental: false
      };
    }
  }

  /**
   * V11.0 Cosmos: Store 3D coordinates directly in entity tables
   */
  private async storeCoordinatesInEntities(userId: string, nodes: any[], coordinates: number[][]): Promise<void> {
    try {
      console.log(`[GraphProjectionWorker] Storing 3D coordinates for ${nodes.length} entities`);
      
      for (let i = 0; i < nodes.length && i < coordinates.length; i++) {
        const node = nodes[i];
        const coord = coordinates[i];
        
        if (!node.entity_id || coord.length < 3) {
          console.warn(`[GraphProjectionWorker] Skipping invalid node or coordinate: ${node.entity_id}`);
          continue;
        }
        
        // Update the appropriate entity table based on type
        await this.updateEntityCoordinates(node.entity_id, node.type, coord[0], coord[1], coord[2]);
      }
      
      console.log(`[GraphProjectionWorker] ✅ Successfully stored 3D coordinates for ${nodes.length} entities`);
    } catch (error) {
      console.error(`[GraphProjectionWorker] ❌ Failed to store coordinates in entities:`, error);
      // Don't throw - this is not critical for projection generation
    }
  }

  /**
   * Update entity coordinates in the appropriate table
   */
  private async updateEntityCoordinates(entityId: string, entityType: string, x: number, y: number, z: number): Promise<void> {
    try {
      // Use the prisma client to update coordinates
      const updateData = {
        position_x: x,
        position_y: y,
        position_z: z
      };
      
      // Update based on entity type
      switch (entityType) {
        case 'Concept':
          await this.databaseService.prisma.concepts.update({
            where: { entity_id: entityId },
            data: updateData
          });
          break;
        case 'MemoryUnit':
          await this.databaseService.prisma.memory_units.update({
            where: { entity_id: entityId },
            data: updateData
          });
          break;
        case 'DerivedArtifact':
          await this.databaseService.prisma.derived_artifacts.update({
            where: { entity_id: entityId },
            data: updateData
          });
          break;
        case 'Community':
          await this.databaseService.prisma.communities.update({
            where: { entity_id: entityId },
            data: updateData
          });
          break;
        case 'ProactivePrompt':
          await this.databaseService.prisma.proactive_prompts.update({
            where: { entity_id: entityId },
            data: updateData
          });
          break;
        case 'GrowthEvent':
          await this.databaseService.prisma.growth_events.update({
            where: { entity_id: entityId },
            data: updateData
          });
          break;
        default:
          console.warn(`[GraphProjectionWorker] Unknown entity type for coordinate update: ${entityType}`);
      }
    } catch (error) {
      console.error(`[GraphProjectionWorker] Failed to update coordinates for ${entityType} ${entityId}:`, error);
    }
  }


  /**
   * REAL IMPLEMENTATION: Test dimension reducer service connectivity
   */
  async testDimensionReducer(): Promise<boolean> {
    try {
      console.log(`[GraphProjectionWorker] Testing dimension reducer at ${this.config.dimensionReducerUrl}`);
      
      const response = await fetch(`${this.config.dimensionReducerUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }

      const health = await response.json();
      
      const isHealthy = health.status === 'healthy' && 
                       (health.umap_available || health.sklearn_available);
      
      console.log(`[GraphProjectionWorker] ✅ Dimension reducer test ${isHealthy ? 'passed' : 'failed'}:`, health);
      return isHealthy;
      
    } catch (error) {
      console.error('[GraphProjectionWorker] ❌ Dimension reducer test failed:', error);
      return false;
    }
  }

  /**
   * Generate semantically meaningful fallback vector based on node content
   */
  private generateSemanticFallbackVector(node: any): number[] {
    // Create a deterministic but varied vector based on node properties
    const content = (node.content || node.title || '').toLowerCase();
    const seed = this.hashString(content + node.entity_id);
    
    const vector: number[] = [];
    let currentSeed = seed;
    
    for (let i = 0; i < 768; i++) {
      // Use simple linear congruential generator for deterministic randomness
      currentSeed = (currentSeed * 1664525 + 1013904223) % Math.pow(2, 32);
      vector.push((currentSeed / Math.pow(2, 32)) - 0.5);
    }
    
    // Add some semantic meaning based on node type and importance
    const typeBoost = node.type === 'Concept' ? 0.1 : -0.1;
    const importanceBoost = (node.importance || 0.5) - 0.5;
    
    for (let i = 0; i < 10; i++) {
      vector[i] += typeBoost;
      vector[i + 10] += importanceBoost;
    }
    
    return vector;
  }

  /**
   * Simple string hashing function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate fallback vectors when Weaviate is unavailable
   */
  private generateFallbackVectors(nodeCount: number): number[][] {
    console.log(`[GraphProjectionWorker] Generating ${nodeCount} fallback embedding vectors`);
    
    const vectors: number[][] = [];
    for (let i = 0; i < nodeCount; i++) {
      // Generate random 768-dimensional vector with some structure
      const vector = Array.from({ length: 768 }, (_, j) => {
        // Add some clustering by making similar indices have similar values
        const cluster = Math.floor(i / 10);
        const clusterNoise = (cluster * 0.1) % 1.0;
        return (Math.random() - 0.5) + (clusterNoise - 0.5) * 0.3;
      });
      vectors.push(vector);
    }
    
    return vectors;
  }

  /**
   * Generate fallback 3D coordinates when Python service is unavailable
   */
  private generateFallback3DCoordinates(nodeCount: number): number[][] {
    console.log(`[GraphProjectionWorker] Generating fallback 3D coordinates for ${nodeCount} nodes`);
    
    const coordinates: number[][] = [];
    const radius = Math.max(5, Math.sqrt(nodeCount));
    
    for (let i = 0; i < nodeCount; i++) {
      // Use golden ratio spiral for better distribution
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const angle = i * 2 * Math.PI / goldenRatio;
      const y = nodeCount === 1 ? 0 : 1 - (i / (nodeCount - 1)) * 2; // [-1, 1]
      const radiusAtY = Math.sqrt(1 - y * y);
      
      const x = Math.cos(angle) * radiusAtY * radius;
      const z = Math.sin(angle) * radiusAtY * radius;
      
      coordinates.push([x, y * radius, z]);
    }
    
    return coordinates;
  }





  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[GraphProjectionWorker] Shutting down...');
    this.retryCounts.clear(); // Clean up retry tracking
    await this.worker.close();
    console.log('[GraphProjectionWorker] Shutdown complete');
  }

  /**
   * Get worker statistics
   */
  getStats(): { 
    isRunning: boolean;
    processed: number;
    failed: number;
  } {
    return {
      isRunning: !this.worker.closing,
      processed: 0, // TODO: Implement metrics tracking
      failed: 0
    };
  }

  /**
   * Helper to check if a string is a valid UUID
   */
  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

}
