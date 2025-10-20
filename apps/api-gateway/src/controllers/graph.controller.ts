// apps/api-gateway/src/controllers/graph.controller.ts
// V11.0 Architecture - Real-time graph metrics endpoint per tech lead directive

import { Request, Response } from 'express';
import type { TApiResponse, CosmosQuery, CosmosQueryResponse, CosmosQueryNode, CosmosEdge, SpatialQueryType } from '@2dots1line/shared-types';
import { Neo4jService, DatabaseService } from '@2dots1line/database';
import { getEntityTypeMapping } from '@2dots1line/core-utils';
import Redis from 'ioredis';

// Types for the selected fields from Prisma queries
// Different entities have different nullable field types, so we need a flexible type
type EntityWith3DCoords = {
  entity_id: string;
  title: string | null;
  content: string | null;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
};

export class GraphController {
  private neo4jService: Neo4jService;
  private databaseService: DatabaseService;
  private redis: Redis;

  constructor(databaseService: DatabaseService) {
    this.neo4jService = new Neo4jService(databaseService);
    this.databaseService = databaseService;
    this.redis = databaseService.redis;
  }

  /**
   * Get edge color based on relationship type
   */
  private getEdgeColor(relationshipType: string): string {
    switch (relationshipType) {
      case 'RELATED_TO':
        return '#60a5fa'; // Light blue for general relationships
      case 'MEMBER_OF':
        return '#4ade80'; // Green for membership
      case 'DERIVED_FROM':
        return '#f59e0b'; // Orange for derivation
      case 'STRATEGIC_RELATIONSHIP':
        return '#8b5cf6'; // Purple for strategic
      case 'includes':
        return '#06b6d4'; // Cyan for inclusion
      case 'demonstrates':
        return '#ef4444'; // Red for demonstration
      case 'contributes_to':
        return '#10b981'; // Emerald for contribution
      case 'are_influenced_by':
        return '#f97316'; // Orange for influence
      case 'is_engaged_in':
        return '#84cc16'; // Lime for engagement
      case 'involves':
        return '#6366f1'; // Indigo for involvement
      default:
        return '#6b7280'; // Gray for unknown
    }
  }

  /**
   * GET /api/v1/graph-projection/latest
   * V11.0: Get latest graph projection for 3D visualization
   * Returns entities with their actual 3D coordinates from the database
   */
  public getLatestGraphProjection = async (req: Request, res: Response): Promise<void> => {
    try {
      // Temporarily use a default userId for testing
      const userId = req.user?.id || 'dev-user-123';

      // Fetch all entities with their 3D coordinates directly from the database
      const [concepts, memoryUnits, derivedArtifacts, communities, growthEvents] = await Promise.all([
        this.databaseService.prisma.concepts.findMany({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            position_x: true,
            position_y: true,
            position_z: true
          }
        }),
        this.databaseService.prisma.memory_units.findMany({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            position_x: true,
            position_y: true,
            position_z: true
          }
        }),
        this.databaseService.prisma.derived_artifacts.findMany({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            position_x: true,
            position_y: true,
            position_z: true
          }
        }),
        this.databaseService.prisma.communities.findMany({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            position_x: true,
            position_y: true,
            position_z: true
          }
        }),
        this.databaseService.prisma.growth_events.findMany({
          where: { 
            user_id: userId,
            position_x: { not: null },
            position_y: { not: null },
            position_z: { not: null }
          },
          select: {
            entity_id: true,
            title: true,
            content: true,
            position_x: true,
            position_y: true,
            position_z: true
          }
        })
      ]);

      // Combine all entities into a single array
      const allEntities = [
        ...concepts.map((entity: EntityWith3DCoords) => ({ ...entity, type: 'Concept' })),
        ...memoryUnits.map((entity: EntityWith3DCoords) => ({ ...entity, type: 'MemoryUnit' })),
        ...derivedArtifacts.map((entity: EntityWith3DCoords) => ({ ...entity, type: 'DerivedArtifact' })),
        ...communities.map((entity: EntityWith3DCoords) => ({ ...entity, type: 'Community' })),
        ...growthEvents.map((entity: EntityWith3DCoords) => ({ ...entity, type: 'GrowthEvent' }))
      ];

      if (allEntities.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NO_ENTITIES_FOUND',
            message: 'No entities with 3D coordinates found for this user'
          }
        } as TApiResponse<any>);
        return;
      }
      
      // Transform entities to flat structure for frontend compatibility
      const transformedNodes = allEntities.map((entity: any) => {
        // Use the actual 3D coordinates from the database
        const x = entity.position_x || 0;
        const y = entity.position_y || 0;
        const z = entity.position_z || 0;
        
        return {
          id: entity.entity_id,
          title: entity.title || 'Untitled',
          content: entity.content || '',
          type: entity.type,
          x: x,
          y: y,
          z: z,
          importance: 0.5,
          connections: [],
          metadata: {}
        };
      }) || [];
      
      // Fetch relationships from Neo4j
      const relationships = await this.neo4jService.getRelationships(userId);
      
      // Transform relationships to edges
      const transformedEdges = relationships.map((rel: any) => ({
        id: rel.relationship_id || `${rel.source}-${rel.target}-${rel.type}`,
        source: rel.source,
        target: rel.target,
        type: rel.relationship_type || rel.type,
        weight: rel.strength || rel.weight || 1.0, // Use strength as primary, fallback to weight for legacy
        strength: rel.strength || rel.weight || 1.0, // Also provide strength for frontend
        description: rel.description,
        source_agent: rel.source_agent,
        created_at: rel.created_at,
        color: this.getEdgeColor(rel.relationship_type || rel.type)
      }));
      
      const transformedProjectionData = {
        nodes: transformedNodes,
        edges: transformedEdges
      };
      
      res.status(200).json({
        success: true,
        data: {
          projectionId: `direct-${Date.now()}`,
          createdAt: new Date().toISOString(),
          projectionData: transformedProjectionData,
          metadata: {
            nodeCount: transformedNodes.length,
            edgeCount: transformedEdges.length
          }
        },
        message: 'Latest graph projection retrieved successfully'
      } as TApiResponse<any>);

    } catch (error: any) {
      console.error(`[GraphController] Error getting latest graph projection:`, error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve graph projection'
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * GET /api/v1/nodes/:nodeId/details
   * V11.0: Get detailed node information from PostgreSQL
   * Returns rich content for node details modal
   */
  public getNodeDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nodeId } = req.params;
      const { entityType } = req.query;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required'
          }
        } as TApiResponse<any>);
        return;
      }

      if (!nodeId || !entityType) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Node ID and entity type are required'
          }
        } as TApiResponse<any>);
        return;
      }

      let entityData: any = null;

      // Map card entity types to database table names
      const entityTypeMapping = this.mapCardEntityTypeToDatabaseTable(entityType as string);
      
      if (!entityTypeMapping) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ENTITY_TYPE',
            message: `Unsupported entity type: ${entityType}`
          }
        } as TApiResponse<any>);
        return;
      }
      
      // Fetch entity details using generic approach with flexible ID/title lookup
      entityData = await this.fetchEntityByType(entityTypeMapping.tableName, nodeId, userId);
      
      if (!entityData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ENTITY_NOT_FOUND',
            message: `Entity not found: ${nodeId} (type: ${entityType}). Tried both entity ID and title matching.`
          }
        } as TApiResponse<any>);
        return;
      }

      // Transform entity data for frontend
      const transformedData = this.transformEntityData(entityData, entityTypeMapping.entityType);

      res.status(200).json({
        success: true,
        data: transformedData,
        message: 'Node details retrieved successfully'
      } as TApiResponse<any>);

    } catch (error: any) {
      console.error(`[GraphController] Error getting node details:`, error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve node details'
        }
      } as TApiResponse<any>);
    }
  };

  /**
   * Map card entity types to database table names and entity types
   * Now uses centralized entity mapping utility
   */
  private mapCardEntityTypeToDatabaseTable(cardEntityType: string): { tableName: string; entityType: string } | null {
    const mapping = getEntityTypeMapping(cardEntityType);
    if (!mapping) {
      return null;
    }
    
    return {
      tableName: mapping.tableName,
      entityType: mapping.entityType
    };
  }

  /**
   * Transform entity data for frontend consumption
   */
  private transformEntityData(entityData: any, entityType: string): any {
    // Use centralized entity mapping for consistent transformation
    const mapping = getEntityTypeMapping(entityType);
    if (!mapping) {
      return entityData; // Return as-is for unknown types
    }

    // Generic transformation using standardized field names
    return {
      id: entityData.entity_id,
      type: mapping.displayType,
      title: entityData.title || 'Untitled',
      description: entityData.content || 'No description available',
      importance: entityData.importance_score || mapping.defaultImportance,
      metadata: {
        ...entityData, // Include all original fields as metadata
        // Override specific fields for consistency
        createdAt: entityData.created_at,
        lastUpdated: entityData.updated_at,
        lastModified: entityData.updated_at
      }
    };
  }

  /**
   * GET /api/v1/nodes/:nodeId/metrics
   * V11.0: Real-time graph metrics for UI display
   * Returns fresh data from Neo4j source of truth with optional Redis caching
   */
  public getNodeMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nodeId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required'
          }
        } as TApiResponse<any>);
        return;
      }

      if (!nodeId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Node ID is required'
          }
        } as TApiResponse<any>);
        return;
      }

      // Check Redis cache (60-second TTL as tech lead suggested)
      const cacheKey = `node_metrics:${userId}:${nodeId}`;
      const cachedMetrics = await this.redis.get(cacheKey);
      
      if (cachedMetrics) {
        const metrics = JSON.parse(cachedMetrics);
        res.status(200).json({
          success: true,
          data: {
            nodeId,
            connectionCount: metrics.connectionCount,
            cached: true
          },
          message: 'Node metrics retrieved from cache'
        } as TApiResponse<any>);
        return;
      }

      // Query Neo4j for real-time data
      const metrics = await this.neo4jService.getNodeMetrics(userId, nodeId);
      
      // Cache the result for 60 seconds
      await this.redis.setex(cacheKey, 60, JSON.stringify(metrics));

      res.status(200).json({
        success: true,
        data: {
          nodeId,
          connectionCount: metrics.connectionCount,
          cached: false
        },
        message: 'Node metrics retrieved successfully'
      } as TApiResponse<any>);

    } catch (error: any) {
      console.error(`[GraphController] Error getting metrics for node ${req.params.nodeId}:`, error);
      
      if (error.message === 'Node not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'NODE_NOT_FOUND',
            message: 'Node not found'
          }
        } as TApiResponse<any>);
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve node metrics'
          }
        } as TApiResponse<any>);
      }
    }
  };

  /**
   * Generic method to fetch entity by type using standardized field names with flexible ID/title lookup
   * This replaces the need for separate switch cases since all entities now use:
   * - entity_id (primary key)
   * - user_id (for filtering)
   * - title, content, created_at, updated_at (standardized fields)
   * 
   * Enhanced to support both entity IDs (UUIDs) and entity titles with fuzzy matching
   */
  private async fetchEntityByType(tableName: string, identifier: string, userId: string): Promise<any> {
    const prisma = this.databaseService.prisma;
    
    // Map table names to Prisma model accessors
    const tableModelMap: Record<string, any> = {
      'concepts': prisma.concepts,
      'memory_units': prisma.memory_units,
      'derived_artifacts': prisma.derived_artifacts,
      'communities': prisma.communities,
      'proactive_prompts': prisma.proactive_prompts,
      'growth_events': prisma.growth_events
    };

    const model = tableModelMap[tableName];
    if (!model) {
      return null;
    }

    // Determine if identifier is a UUID (entity_id) or a title
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let entityData: any = null;

    if (isUUID) {
      // Direct entity_id lookup
      entityData = await model.findFirst({
        where: {
          entity_id: identifier,
          user_id: userId
        }
      });
    } else {
      // Title-based lookup with fuzzy matching
      entityData = await this.findEntityByTitle(model, identifier, userId);
    }

    if (!entityData) {
      return null;
    }

    // Also fetch associated card data if exists (for background_image_url)
    const cardData = await prisma.cards.findFirst({
      where: {
        source_entity_id: entityData.entity_id,
        user_id: userId
      },
      select: {
        card_id: true,
        background_image_url: true,
        status: true
      }
    });

    // Merge card data into entity data
    return {
      ...entityData,
      card_id: cardData?.card_id,
      background_image_url: cardData?.background_image_url,
      card_status: cardData?.status
    };
  }

  /**
   * Find entity by title with fuzzy matching
   * Handles variations in naming and partial matches
   */
  private async findEntityByTitle(model: any, title: string, userId: string): Promise<any> {
    // Clean and normalize the title for matching
    const normalizedTitle = title.trim().toLowerCase();
    
    // Try multiple matching strategies in order of preference
    
    // 1. Exact match (case-insensitive)
    let entity = await model.findFirst({
      where: {
        title: {
          equals: title,
          mode: 'insensitive'
        },
        user_id: userId
      }
    });

    if (entity) return entity;

    // 2. Fuzzy match using ILIKE with wildcards
    entity = await model.findFirst({
      where: {
        title: {
          contains: title,
          mode: 'insensitive'
        },
        user_id: userId
      }
    });

    if (entity) return entity;

    // 3. Partial word matching (for multi-word titles)
    const words = normalizedTitle.split(/\s+/).filter(word => word.length > 2);
    if (words.length > 1) {
      // Try to find entities that contain all the significant words
      const wordConditions = words.map(word => ({
        title: {
          contains: word,
          mode: 'insensitive' as const
        }
      }));

      entity = await model.findFirst({
        where: {
          AND: [
            { user_id: userId },
            ...wordConditions
          ]
        }
      });

      if (entity) return entity;
    }

    // 4. Levenshtein distance-based fuzzy matching for very similar titles
    // This is a fallback for cases where the title is close but not exact
    const allEntities = await model.findMany({
      where: {
        user_id: userId
      },
      select: {
        entity_id: true,
        title: true,
        content: true,
        type: true,
        created_at: true,
        updated_at: true,
        status: true,
        importance_score: true,
        position_x: true,
        position_y: true,
        position_z: true
      }
    });

    // Find the best match using simple string similarity
    let bestMatch = null;
    let bestScore = 0;
    const threshold = 0.6; // Minimum similarity threshold

    for (const candidate of allEntities) {
      const similarity = this.calculateStringSimilarity(normalizedTitle, candidate.title.toLowerCase());
      if (similarity > bestScore && similarity >= threshold) {
        bestScore = similarity;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity using a simple algorithm
   * Returns a score between 0 and 1
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * POST /api/v1/cosmos/query
   * V11.0: Unified spatial query endpoint for interactive cosmos navigation
   */
  public processCosmosQuery = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'dev-user-123';
      const query: CosmosQuery = req.body;

      console.log('🌌 GraphController.processCosmosQuery - Processing query:', {
        userId,
        queryType: this.determineQueryType(query),
        hasAttributeFilters: !!query.attributeFilters,
        hasSpatialFilters: !!query.spatialFilters,
        hasSetFilters: !!query.setFilters,
        hasTimeTravel: !!query.timeTravel
      });

      const startTime = Date.now();
      const result = await this.executeSpatialQuery(query, userId);
      const queryTime = Date.now() - startTime;

      const response: CosmosQueryResponse = {
        success: true,
        data: {
          ...result,
          metadata: {
            ...result.metadata,
            queryTime
          }
        }
      };

      console.log('🌌 GraphController.processCosmosQuery - Query completed:', {
        nodeCount: result.nodes.length,
        edgeCount: result.edges?.length || 0,
        queryTime: `${queryTime}ms`
      });

      res.json(response);
    } catch (error) {
      console.error('🌌 GraphController.processCosmosQuery - Error:', error);
      const response: CosmosQueryResponse = {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
      res.status(500).json(response);
    }
  };

  /**
   * Determine the primary query type based on the query parameters
   */
  private determineQueryType(query: CosmosQuery): SpatialQueryType {
    if (query.timeTravel) return 'time-travel';
    if (query.spatialFilters?.viewport) return 'viewport';
    return 'filtered';
  }

  /**
   * Execute spatial query with all filter types
   */
  private async executeSpatialQuery(query: CosmosQuery, userId: string): Promise<{
    nodes: CosmosQueryNode[];
    edges?: CosmosEdge[];
    metadata: {
      totalNodes: number;
      totalEdges?: number;
      viewportBounds?: {
        min: [number, number, number];
        max: [number, number, number];
      };
    };
  }> {
    // Build base SQL query with UNION wrapped in subquery
    let sql = `SELECT * FROM (${this.buildBaseQuery(query)}) AS combined_entities WHERE 1=1`;
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

    console.log('🌌 GraphController.executeSpatialQuery - SQL:', sql);
    console.log('🌌 GraphController.executeSpatialQuery - Params:', params);

    // Execute query
    const result = await this.databaseService.prisma.$queryRawUnsafe(sql, ...params);
    const nodes = this.transformToCosmosNodes(result as any[]);

    // Get edges if requested
    let edges: CosmosEdge[] | undefined;
    if (query.options?.includeEdges) {
      edges = await this.getEdgesForNodes(nodes.map(n => n.entity_id), userId);
    }

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges?.length,
        viewportBounds: query.spatialFilters?.viewport
      }
    };
  }

  /**
   * Build base SQL query for all entity types
   */
  private buildBaseQuery(query: CosmosQuery): string {
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
          // Distance sorting would require a center point - implement if needed
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
  private transformToCosmosNodes(results: any[]): CosmosQueryNode[] {
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
  private async getEdgesForNodes(nodeIds: string[], userId: string): Promise<CosmosEdge[]> {
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
      console.error('🌌 GraphController.getEdgesForNodes - Error:', error);
      return [];
    }
  }

  /**
   * Simple entity lookup by ID - Proof of Concept
   */
  async getEntityById(req: Request, res: Response): Promise<void> {
    try {
      const { entityId } = req.params;

      if (!entityId) {
        res.status(400).json({
          success: false,
          error: 'Entity ID is required'
        });
        return;
      }

      console.log(`🔍 GraphController.getEntityById - Looking up entity: ${entityId}`);

      // Search across all entity tables
      const entityQueries = [
        this.databaseService.prisma.concepts.findFirst({
          where: { entity_id: entityId },
          select: {
            entity_id: true,
            title: true,
            content: true,
            type: true,
            status: true,
            created_at: true,
            updated_at: true,
            importance_score: true,
            position_x: true,
            position_y: true,
            position_z: true,
          }
        }),
        this.databaseService.prisma.memory_units.findFirst({
          where: { entity_id: entityId },
          select: {
            entity_id: true,
            title: true,
            content: true,
            type: true,
            status: true,
            created_at: true,
            updated_at: true,
            importance_score: true,
            position_x: true,
            position_y: true,
            position_z: true,
          }
        }),
        this.databaseService.prisma.derived_artifacts.findFirst({
          where: { entity_id: entityId },
          select: {
            entity_id: true,
            title: true,
            content: true,
            type: true,
            status: true,
            created_at: true,
            updated_at: true,
            position_x: true,
            position_y: true,
            position_z: true,
          }
        })
      ];

      const results = await Promise.all(entityQueries);
      const entity = results.find((result: any) => result !== null);

      if (!entity) {
        res.status(404).json({
          success: false,
          error: `Entity with ID "${entityId}" not found`
        });
        return;
      }

      // Determine entity type based on which table it came from
      let entityType = 'unknown';
      if (results[0] === entity) entityType = 'concept';
      else if (results[1] === entity) entityType = 'memory_unit';
      else if (results[2] === entity) entityType = 'derived_artifact';

      const response: CosmosQueryNode = {
        id: entity.entity_id,
        entity_id: entity.entity_id,
        entity_type: entityType,
        title: entity.title || 'Untitled',
        content: entity.content || '',
        type: entity.type || 'unknown',
        status: entity.status || 'unknown',
        created_at: entity.created_at,
        updated_at: entity.updated_at || entity.created_at,
        importance_score: (entity as any).importance_score || 0,
        position_x: entity.position_x || 0,
        position_y: entity.position_y || 0,
        position_z: entity.position_z || 0,
        metadata: {},
      };

      res.status(200).json({
        success: true,
        data: {
          entity: response
        }
      });

    } catch (error) {
      console.error('🔍 GraphController.getEntityById - Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * POST /api/v1/neo4j/query
   * V11.0: Direct Neo4j query endpoint for graph traversal
   */
  public executeNeo4jQuery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cypher, params } = req.body;
      const userId = req.user?.id || 'dev-user-123';

      console.log('🔍 GraphController.executeNeo4jQuery - Executing query:', {
        userId,
        cypher: cypher.substring(0, 100) + '...',
        params
      });

      if (!cypher) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CYPHER',
            message: 'Cypher query is required'
          }
        });
        return;
      }

      // Execute the Neo4j query
      const records = await this.neo4jService.executeCustomQuery(cypher, { ...params, userId });

      console.log('🔍 GraphController.executeNeo4jQuery - Query completed:', {
        recordCount: records.length
      });

      // Transform the result to a more usable format
      const data = records.map((record: any) => {
        const obj: any = {};
        record.keys.forEach((key: string) => {
          obj[key] = record.get(key);
        });
        return obj;
      });

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('🔍 GraphController.executeNeo4jQuery - Error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'NEO4J_ERROR',
          message: error instanceof Error ? error.message : 'Unknown Neo4j error occurred'
        }
      });
    }
  };

  /**
   * GET /api/v1/entities/:entityId/related
   * V11.0: Get related entities via Neo4j relationships
   */
  public getRelatedEntities = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entityId } = req.params;
      const { entityType } = req.query;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required'
          }
        } as TApiResponse<any>);
        return;
      }

      if (!entityId || !entityType) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Entity ID and entity type are required'
          }
        } as TApiResponse<any>);
        return;
      }

      // Query Neo4j for relationships where this entity is source or target
      const cypher = `
        MATCH (source {entity_id: $entityId, user_id: $userId})-[r]-(target)
        WHERE target.user_id = $userId
        RETURN DISTINCT
          target.entity_id AS entity_id,
          target.title AS title,
          target.entity_type AS entity_type,
          type(r) AS relationship_type
        LIMIT 20
      `;

      const records = await this.neo4jService.executeCustomQuery(cypher, {
        entityId,
        userId
      });

      // Transform records to related entities array
      const relatedEntities = records.map((record: any) => ({
        entity_id: record.get('entity_id'),
        title: record.get('title') || 'Untitled',
        entity_type: record.get('entity_type'),
        relationship_type: record.get('relationship_type')
      }));

      res.status(200).json({
        success: true,
        data: relatedEntities,
        message: 'Related entities retrieved successfully'
      } as TApiResponse<any>);

    } catch (error: any) {
      console.error(`[GraphController] Error getting related entities:`, error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve related entities'
        }
      } as TApiResponse<any>);
    }
  };
} 