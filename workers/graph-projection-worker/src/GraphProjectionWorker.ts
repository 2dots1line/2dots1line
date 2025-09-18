/**
 * GraphProjectionWorker.ts
 * V9.5 Production-Grade Worker for 3D Knowledge Cosmos Projection
 * 
 * This worker regenerates the 3D graph projection whenever the InsightEngine
 * finishes its job. It coordinates between Neo4j graph structure, Weaviate 
 * vector embeddings, and Python dimension reduction to create immersive 3D 
 * knowledge visualizations.
 * 
 * SIMPLE TRIGGER: Only processes 'cycle_artifacts_created' events from InsightEngine
 * 
 * ARCHITECTURE: Presentation layer worker that transforms knowledge structures
 * into spatial coordinates for 3D rendering in the web interface.
 */

import { DatabaseService, GraphProjectionRepository, GraphProjectionData, Neo4jService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Worker, Job, Queue } from 'bullmq';

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
}

export interface Node3D {
  id: string;
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

export interface GraphProjection {
  userId: string;
  version: string;
  createdAt: string;
  nodes: Node3D[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    properties: Record<string, any>;
  }>;
  statistics: {
    totalNodes: number;
    memoryUnits: number;
    concepts: number;
    derivedArtifacts: number;
    communities: number;
    proactivePrompts: number;
    growthEvents: number;
    users: number;
    connections: number;
  };
  projectionMethod: string;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

/**
 * GraphProjectionWorker V11.0 Production Implementation
 * 
 * Processes graph projection updates for the 3D Knowledge Cosmos.
 * Integrates Neo4j graph structure, Weaviate embeddings, and Python ML services.
 * Uses EnvironmentLoader for consistent environment management.
 */
export class GraphProjectionWorker {
  private worker: Worker;
  private config: GraphProjectionWorkerConfig;
  private graphProjectionRepo: GraphProjectionRepository;
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
      ...config
    };

    console.log(`[GraphProjectionWorker] Using dimension reducer at: ${this.config.dimensionReducerUrl}`);

    // Initialize repositories and services
    this.graphProjectionRepo = new GraphProjectionRepository(databaseService);
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
      
      // Regenerate projection to reflect all changes from either worker
      console.log(`[GraphProjectionWorker] 🔄 Regenerating graph projection for user ${data.userId} after ${sourceWorker} completion`);
      const projection = await this.generateProjection(data.userId);
      
      // Store projection in database
      await this.storeProjection(projection);

      const duration = Date.now() - startTime;
      console.log(`[GraphProjectionWorker] ✅ Successfully regenerated projection for user ${data.userId} in ${duration}ms`);
      console.log(`[GraphProjectionWorker] Projection contains ${projection.nodes.length} nodes and ${projection.edges.length} edges`);

      // Enqueue notification for "graph_projection_updated"
      try {
        const payload = {
          type: 'graph_projection_updated' as const,
          userId: data.userId,
          projection: {
            version: projection.version,
            nodeCount: projection.nodes.length,
            edgeCount: projection.edges.length,
          },
        };

        await this.notificationQueue.add('graph_projection_updated', payload, {
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        });

        console.log(
          `[GraphProjectionWorker] 📣 Enqueued notification 'graph_projection_updated' for user ${data.userId} (version=${projection.version})`
        );
      } catch (notifyErr) {
        console.error('[GraphProjectionWorker] Failed to enqueue graph_projection_updated notification:', notifyErr);
        // Do not fail the projection job if notification enqueue fails
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[GraphProjectionWorker] Failed to generate projection for user ${data.userId} after ${duration}ms:`, error);
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
          .withFields('externalId')
          .withWhere({
            operator: 'And',
            operands: [
              { path: ['sourceEntityType'], operator: 'Equal', valueString: entity.type },
              { path: ['sourceEntityId'], operator: 'Equal', valueString: entity.id }
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
   * Generate complete 3D projection for a user
   */
  public async generateProjection(userId: string): Promise<GraphProjection> {
    console.log(`[GraphProjectionWorker] Starting projection generation for user ${userId}`);

    // Step 1: Fetch graph structure from Neo4j using real service
    const graphData = await this.fetchGraphStructureFromNeo4j(userId);
    console.log(`[GraphProjectionWorker] Fetched ${graphData.nodes.length} nodes and ${graphData.edges.length} edges from Neo4j`);

    if (graphData.nodes.length === 0) {
      console.log(`[GraphProjectionWorker] No nodes found for user ${userId}, creating empty projection`);
      return this.createEmptyProjection(userId);
    }

    // Step 2: Fetch vector embeddings from Weaviate
    const vectors = await this.fetchEmbeddingsFromWeaviate(graphData.nodes);
    console.log(`[GraphProjectionWorker] Fetched ${vectors.length} embedding vectors from Weaviate`);

    // Step 3: Reduce to 3D coordinates using Python service
    const coordinates3D = await this.callDimensionReducer(vectors);
    console.log(`[GraphProjectionWorker] Generated 3D coordinates for ${coordinates3D.length} nodes`);

    // Step 4: Assemble final projection
    const projection = this.assembleProjection(userId, graphData, coordinates3D);
    
    console.log(`[GraphProjectionWorker] Projection assembly complete`);
    return projection;
  }

  /**
   * REAL IMPLEMENTATION: Fetch graph structure from Neo4j using Neo4jService
   */
  private async fetchGraphStructureFromNeo4j(userId: string): Promise<{
    nodes: Array<{
      id: string;
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
            node.properties.mergedIntoConceptId = node.properties.merged_into_concept_id;
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
          console.error(`[GraphProjectionWorker] ❌ Unsupported node type: ${node.labels.join(', ')} for node ${node.id}`);
          throw new Error(`Unsupported node type: ${node.labels.join(', ')}`);
        }
        
        // Extract actual UUID from properties instead of Neo4j internal ID
        const entityId = node.properties.prompt_id || node.properties.muid || node.properties.id || 
                        node.properties.community_id || node.properties.artifact_id ||
                        node.properties.event_id || node.properties.userId;
        
        if (!entityId || !this.isValidUuid(entityId)) {
          console.error(`[GraphProjectionWorker] ❌ Invalid or missing UUID for node ${node.id}: ${entityId}`);
          throw new Error(`Invalid UUID for node ${node.id}: ${entityId}`);
        }
        
        // Extract connections from edges
        const connections = graphStructure.edges
          .filter(edge => edge.source === node.id)
          .map(edge => edge.target);
        
        return {
          id: entityId, // Use actual UUID, not Neo4j internal ID
          type: nodeType,
          title: node.properties.title || node.properties.name || 'Untitled',
          content: node.properties.content || node.properties.description || '',
          importance: node.properties.importance_score || node.properties.salience || 0.5,
          createdAt: node.properties.created_at || node.properties.creation_ts || new Date().toISOString(),
          connections,
          metadata: {
            // Add merged concept information
            isMerged: node.properties.isMerged || false,
            mergedIntoConceptId: node.properties.mergedIntoConceptId || null,
            status: node.properties.status || 'active'
          }
        };
      }).filter(Boolean); // Remove any null nodes (should be none now)
      
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
          // Validate if node.id is a valid UUID before querying Weaviate
          if (!this.isValidUuid(node.id)) {
            console.warn(`[GraphProjectionWorker] ⚠️ Node ID "${node.id}" is not a valid UUID, using fallback vector`);
            const fallbackVector = this.generateSemanticFallbackVector(node);
            vectors.push(fallbackVector);
            continue;
          }

          // Use unified UserKnowledgeItem class with sourceEntityType filter
          const result = await this.databaseService.weaviate
            .graphql
            .get()
            .withClassName('UserKnowledgeItem')
            .withFields('externalId sourceEntityType sourceEntityId _additional { vector }')
            .withWhere({
              operator: 'And',
              operands: [
                {
                  path: ['sourceEntityType'],
                  operator: 'Equal',
                  valueString: node.type
                },
                {
                  path: ['sourceEntityId'],
                  operator: 'Equal',
                  valueString: node.id
                }
              ]
            })
            .withLimit(1)
            .do();

          if (result.data?.Get?.UserKnowledgeItem?.[0]?._additional?.vector) {
            const embedding = result.data.Get.UserKnowledgeItem[0]._additional.vector;
            vectors.push(embedding);
            console.log(`[GraphProjectionWorker] ✅ Retrieved embedding for ${node.type} ${node.id}`);
          } else {
            // Try alternative query with content similarity if direct ID lookup fails
            // Generate a temporary embedding for the fallback search
            const fallbackVector = this.generateSemanticFallbackVector(node);
            
            const fallbackResult = await this.databaseService.weaviate
              .graphql
              .get()
              .withClassName('UserKnowledgeItem')
              .withFields('externalId sourceEntityType sourceEntityId _additional { vector }')
              .withWhere({
                path: ['sourceEntityType'],
                operator: 'Equal',
                valueString: node.type
              })
              .withNearVector({ 
                vector: fallbackVector,
                distance: 0.7 
              })
              .withLimit(1)
              .do();

            if (fallbackResult.data?.Get?.UserKnowledgeItem?.[0]?._additional?.vector) {
              const embedding = fallbackResult.data.Get.UserKnowledgeItem[0]._additional.vector;
              vectors.push(embedding);
              console.log(`[GraphProjectionWorker] ✅ Retrieved fallback embedding for ${node.type} ${node.id}`);
            } else {
              // If even the fallback search fails, use the generated fallback vector
              vectors.push(fallbackVector);
              console.log(`[GraphProjectionWorker] ⚠️ Using generated fallback vector for ${node.type} ${node.id} (no similar embeddings found)`);
            }
          }
                 } catch (nodeError: any) {
           // Generate fallback vector for this specific node
           const fallbackVector = this.generateSemanticFallbackVector(node);
           vectors.push(fallbackVector);
           console.warn(`[GraphProjectionWorker] ⚠️ Using fallback vector for ${node.id}:`, nodeError?.message || 'Unknown error');
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
  private async callDimensionReducer(vectors: number[][]): Promise<number[][]> {
    if (vectors.length === 0) {
      return [];
    }

    try {
      const requestBody = {
        vectors: vectors,
        method: this.config.projectionMethod || 'umap',
        target_dimensions: 3,
        random_state: 42,
        n_neighbors: Math.min(15, Math.max(2, vectors.length - 1)),
        min_dist: 0.1
      };

      console.log(`[GraphProjectionWorker] Calling dimension reducer with ${vectors.length} vectors using ${requestBody.method}`);

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

      console.log(`[GraphProjectionWorker] ✅ Dimension reduction completed for ${vectors.length} vectors in ${result.processing_time_ms}ms`);
      return result.coordinates;
      
    } catch (error) {
      console.error(`[GraphProjectionWorker] ❌ Dimension reducer failed, using fallback coordinates:`, error);
      return this.generateFallback3DCoordinates(vectors.length);
    }
  }

  /**
   * REAL IMPLEMENTATION: Store projection in database using GraphProjectionRepository
   */
  public async storeProjection(projection: GraphProjection): Promise<void> {
          try {
        // Use edges directly from the projection
        const edges = projection.edges || [];

        console.log(`[GraphProjectionWorker] Using ${edges.length} edges from projection data`);

        // Convert GraphProjection to GraphProjectionData format
        const projectionData: GraphProjectionData = {
          nodes: projection.nodes.map((node: any) => ({
          id: node.id,
          position: { 
            x: node.position[0], 
            y: node.position[1], 
            z: node.position[2] 
          },
          properties: {
            type: node.type,
            title: node.title,
            content: node.content,
            importance: node.importance,
            metadata: node.metadata
          }
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          properties: {
            type: edge.type,
            weight: edge.properties?.weight || 1.0
          }
        })),
        metadata: {
          algorithm: projection.projectionMethod,
          parameters: {
            method: this.config.projectionMethod,
            target_dimensions: 3
          },
          boundingBox: {
            min: { 
              x: projection.boundingBox.min[0], 
              y: projection.boundingBox.min[1], 
              z: projection.boundingBox.min[2] 
            },
            max: { 
              x: projection.boundingBox.max[0], 
              y: projection.boundingBox.max[1], 
              z: projection.boundingBox.max[2] 
            }
          },
          statistics: {
            nodeCount: projection.statistics.totalNodes,
            edgeCount: projection.statistics.connections,
            density: projection.statistics.totalNodes > 0 ? 
              projection.statistics.connections / (projection.statistics.totalNodes * (projection.statistics.totalNodes - 1)) : 0
          }
        }
      };

             // Store using repository
               const storedProjection = await this.graphProjectionRepo.create({
          userId: projection.userId,
          projectionData: projectionData as any, // Cast to satisfy Prisma InputJsonValue
          status: 'completed',
         metadata: {
           version: projection.version,
           createdAt: projection.createdAt,
           processingMethod: projection.projectionMethod
         }
       });

      console.log(`[GraphProjectionWorker] ✅ Stored projection ${storedProjection.projection_id} for user ${projection.userId}`);
      console.log(`[GraphProjectionWorker] Projection statistics:`, projection.statistics);
      
      // Cleanup old projections (keep only last 5)
      await this.graphProjectionRepo.pruneOldVersions(projection.userId, 5);
      
    } catch (error) {
      console.error('[GraphProjectionWorker] ❌ Error storing projection:', error);
      throw error;
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
    const seed = this.hashString(content + node.id);
    
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
      const y = 1 - (i / (nodeCount - 1)) * 2; // [-1, 1]
      const radiusAtY = Math.sqrt(1 - y * y);
      
      const x = Math.cos(angle) * radiusAtY * radius;
      const z = Math.sin(angle) * radiusAtY * radius;
      
      coordinates.push([x, y * radius, z]);
    }
    
    return coordinates;
  }

  /**
   * Assemble final projection from components
   */
  private assembleProjection(
    userId: string, 
    graphData: any, 
    coordinates3D: number[][]
  ): GraphProjection {
    const nodes: Node3D[] = graphData.nodes.map((node: any, index: number) => ({
      id: node.id,
      type: node.type as 'MemoryUnit' | 'Concept',
      title: node.title,
      content: node.content,
      position: coordinates3D[index] as [number, number, number],
      connections: node.connections || [],
      importance: node.importance || 0.5,
      metadata: {
        createdAt: node.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        userId
      }
    }));

    // Use edges from graph data
    const edges = graphData.edges || [];

    const memoryUnits = nodes.filter(n => n.type === 'MemoryUnit').length;
    const concepts = nodes.filter(n => n.type === 'Concept').length;
    const derivedArtifacts = nodes.filter(n => n.type === 'DerivedArtifact').length;
    const communities = nodes.filter(n => n.type === 'Community').length;
    const proactivePrompts = nodes.filter(n => n.type === 'ProactivePrompt').length;
    const growthEvents = nodes.filter(n => n.type === 'GrowthEvent').length;
    const users = nodes.filter(n => n.type === 'User').length;
    const totalConnections = nodes.reduce((sum, node) => sum + node.connections.length, 0);

    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(coordinates3D);

    return {
      userId,
      version: `v${Date.now()}`,
      createdAt: new Date().toISOString(),
      nodes,
      edges,
      statistics: {
        totalNodes: nodes.length,
        memoryUnits,
        concepts,
        derivedArtifacts,
        communities,
        proactivePrompts,
        growthEvents,
        users,
        connections: totalConnections
      },
      projectionMethod: this.config.projectionMethod!,
      boundingBox
    };
  }

  /**
   * Calculate bounding box for 3D coordinates
   */
  private calculateBoundingBox(positions: number[][]): {
    min: [number, number, number];
    max: [number, number, number];
  } {
    if (positions.length === 0) {
      return {
        min: [-10, -10, -10],
        max: [10, 10, 10]
      };
    }

    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    positions.forEach(pos => {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], pos[i]);
        max[i] = Math.max(max[i], pos[i]);
      }
    });

    return {
      min: min as [number, number, number],
      max: max as [number, number, number]
    };
  }

  /**
   * Create empty projection for users with no data
   */
  private createEmptyProjection(userId: string): GraphProjection {
    return {
      userId,
      version: `v${Date.now()}`,
      createdAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      statistics: {
        totalNodes: 0,
        memoryUnits: 0,
        concepts: 0,
        derivedArtifacts: 0,
        communities: 0,
        proactivePrompts: 0,
        growthEvents: 0,
        users: 0,
        connections: 0
      },
      projectionMethod: this.config.projectionMethod!,
      boundingBox: {
        min: [-10, -10, -10],
        max: [10, 10, 10]
      }
    };
  }

  /**
   * Clean up old retry tracking data (prevent memory leaks)
   */
  private cleanupRetryTracking(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    // This is a simple cleanup - in production you might want more sophisticated tracking
    if (this.retryCounts.size > 100) {
      console.log(`[GraphProjectionWorker] Cleaning up retry tracking (${this.retryCounts.size} entries)`);
      this.retryCounts.clear();
    }
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
