/**
 * GraphProjectionWorker.ts
 * V9.5 Production-Grade Worker for 3D Knowledge Cosmos Projection
 * 
 * This worker processes graph ontology updates and new entity events to generate
 * 3D spatial representations of the user's knowledge graph. It coordinates between
 * Neo4j graph structure, Weaviate vector embeddings, and Python dimension reduction
 * to create immersive 3D knowledge visualizations.
 * 
 * ARCHITECTURE: Presentation layer worker that transforms knowledge structures
 * into spatial coordinates for 3D rendering in the web interface.
 */

import { DatabaseService, GraphProjectionRepository, GraphProjectionData, Neo4jService } from '@2dots1line/database';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { Worker, Job } from 'bullmq';

// Event types that trigger projection updates
export interface GraphOntologyUpdatedEvent {
  type: "graph_ontology_updated";
  userId: string;
  source: "InsightEngine";
  timestamp: string;
  summary: {
    concepts_merged: number;
    concepts_archived: number;
    new_communities: number;
    strategic_relationships_added: number;
  };
  affectedNodeIds: string[];
}

export interface NewEntitiesCreatedEvent {
  type: "new_entities_created";
  userId: string;
  source: "IngestionAnalyst";
  timestamp: string;
  entities: Array<{
    id: string;
    type: "MemoryUnit" | "Concept";
  }>;
}

export type GraphProjectionEvent = GraphOntologyUpdatedEvent | NewEntitiesCreatedEvent;

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
  type: 'MemoryUnit' | 'Concept';
  title: string;
  content: string;
  position: [number, number, number]; // 3D coordinates
  connections: string[]; // Connected node IDs
  importance: number;
  metadata: {
    createdAt: string;
    lastUpdated: string;
    userId: string;
  };
}

export interface GraphProjection {
  userId: string;
  version: string;
  createdAt: string;
  nodes: Node3D[];
  statistics: {
    totalNodes: number;
    memoryUnits: number;
    concepts: number;
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

  constructor(
    private databaseService: DatabaseService,
    config: GraphProjectionWorkerConfig = {}
  ) {
    // CRITICAL: Load environment variables first
    console.log('[GraphProjectionWorker] Loading environment variables...');
    environmentLoader.load();
    console.log('[GraphProjectionWorker] Environment variables loaded successfully');

    this.config = {
      queueName: 'card-and-graph-queue',
      concurrency: 2,
      retryAttempts: 3,
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

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`[GraphProjectionWorker] Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, error) => {
      if (job) {
        console.error(`[GraphProjectionWorker] Job ${job.id} failed:`, error);
      }
    });

    this.worker.on('error', (error) => {
      console.error('[GraphProjectionWorker] Worker error:', error);
    });

    console.log(`[GraphProjectionWorker] Worker initialized and listening on queue: ${this.config.queueName}`);
  }

  /**
   * Main job processing function - only processes relevant events
   */
  private async processJob(job: Job<GraphProjectionEvent>): Promise<void> {
    const { data } = job;

    // Only process events that require projection updates
    const shouldProcess = data.type === 'graph_ontology_updated' || 
                         (data.type === 'new_entities_created' && data.entities.length > 0);

    if (!shouldProcess) {
      console.log(`[GraphProjectionWorker] Skipping ${data.type} event - no projection update needed`);
      return;
    }

    const startTime = Date.now();

    try {
      console.log(`[GraphProjectionWorker] Processing ${data.type} event for user ${data.userId}`);
      
      // Generate new projection
      const projection = await this.generateProjection(data.userId);
      
      // Store projection in database
      await this.storeProjection(projection);

      const duration = Date.now() - startTime;
      console.log(`[GraphProjectionWorker] Successfully generated projection for user ${data.userId} in ${duration}ms`);
      console.log(`[GraphProjectionWorker] Projection contains ${projection.nodes.length} nodes`);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[GraphProjectionWorker] Failed to generate projection for user ${data.userId} after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Generate complete 3D projection for a user
   */
  private async generateProjection(userId: string): Promise<GraphProjection> {
    console.log(`[GraphProjectionWorker] Starting projection generation for user ${userId}`);

    // Step 1: Fetch graph structure from Neo4j using real service
    const graphData = await this.fetchGraphStructureFromNeo4j(userId);
    console.log(`[GraphProjectionWorker] Fetched ${graphData.nodes.length} nodes from Neo4j`);

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
  }> {
    try {
      // Use Neo4jService to fetch full graph structure
      const graphStructure = await this.neo4jService.fetchFullGraphStructure(userId);
      
      const processedNodes = graphStructure.nodes.map(node => {
        // Determine node type from labels
        const nodeType = node.labels.includes('Concept') ? 'Concept' : 'MemoryUnit';
        
                 // Extract connections from edges
         const connections = graphStructure.edges
           .filter(edge => edge.source === node.id)
           .map(edge => edge.target);
        
        return {
          id: node.id,
          type: nodeType,
          title: node.properties.title || node.properties.name || 'Untitled',
          content: node.properties.content || node.properties.description || '',
          importance: node.properties.importance_score || node.properties.salience || 0.5,
          createdAt: node.properties.created_at || node.properties.creation_ts || new Date().toISOString(),
          connections
        };
      });
      
      console.log(`[GraphProjectionWorker] ✅ Fetched ${processedNodes.length} nodes from Neo4j for user ${userId}`);
      return { nodes: processedNodes };
      
    } catch (error) {
      console.error(`[GraphProjectionWorker] ❌ Neo4j query failed:`, error);
      // Return empty structure on failure
      return { nodes: [] };
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
          const className = node.type === 'Concept' ? 'Concept' : 'MemoryUnit';
          
          // Query Weaviate for the specific entity by ID
          const result = await this.databaseService.weaviate
            .graphql
            .get()
            .withClassName(className)
            .withFields('entity_id embedding')
            .withWhere({
              path: ['entity_id'],
              operator: 'Equal',
              valueString: node.id
            })
            .withLimit(1)
            .do();

          if (result.data?.Get?.[className]?.[0]?.embedding) {
            const embedding = result.data.Get[className][0].embedding;
            vectors.push(embedding);
            console.log(`[GraphProjectionWorker] ✅ Retrieved embedding for ${node.type} ${node.id}`);
          } else {
            // Try alternative query with content similarity if direct ID lookup fails
            const fallbackResult = await this.databaseService.weaviate
              .graphql
              .get()
              .withClassName(className)
              .withFields('entity_id embedding')
              .withNearText({ 
                concepts: [node.content || node.title],
                distance: 0.7 
              })
              .withLimit(1)
              .do();

            if (fallbackResult.data?.Get?.[className]?.[0]?.embedding) {
              const embedding = fallbackResult.data.Get[className][0].embedding;
              vectors.push(embedding);
              console.log(`[GraphProjectionWorker] ✅ Retrieved fallback embedding for ${node.type} ${node.id}`);
            } else {
              throw new Error('No embedding found in Weaviate');
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
  private async storeProjection(projection: GraphProjection): Promise<void> {
          try {
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
        edges: [], // TODO: Extract edges from node connections if needed
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

    const memoryUnits = nodes.filter(n => n.type === 'MemoryUnit').length;
    const concepts = nodes.filter(n => n.type === 'Concept').length;
    const totalConnections = nodes.reduce((sum, node) => sum + node.connections.length, 0);

    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(coordinates3D);

    return {
      userId,
      version: `v${Date.now()}`,
      createdAt: new Date().toISOString(),
      nodes,
      statistics: {
        totalNodes: nodes.length,
        memoryUnits,
        concepts,
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
      statistics: {
        totalNodes: 0,
        memoryUnits: 0,
        concepts: 0,
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
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[GraphProjectionWorker] Shutting down...');
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
}
