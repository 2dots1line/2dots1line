// apps/api-gateway/src/controllers/graph.controller.ts
// V11.0 Architecture - Real-time graph metrics endpoint per tech lead directive

import { Request, Response } from 'express';
import type { TApiResponse } from '@2dots1line/shared-types';
import { Neo4jService, DatabaseService } from '@2dots1line/database';
import { getEntityTypeMapping } from '@2dots1line/core-utils';
import Redis from 'ioredis';

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
   * GET /api/v1/graph-projection/latest
   * V11.0: Get latest graph projection for 3D visualization
   * Returns the most recent graph projection data from PostgreSQL
   */
  public getLatestGraphProjection = async (req: Request, res: Response): Promise<void> => {
    try {
      // Temporarily use a default userId for testing
      const userId = req.user?.id || 'dev-user-123';

      // Query PostgreSQL for the latest graph projection
      const latestProjection = await this.databaseService.prisma.user_graph_projections.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      });

      if (!latestProjection) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NO_PROJECTION_FOUND',
            message: 'No graph projection found for this user'
          }
        } as TApiResponse<any>);
        return;
      }

      const projectionData = latestProjection.projection_data as any;
      
      // Transform nodes to flat structure for frontend compatibility
      const transformedNodes = projectionData?.nodes?.map((node: any) => {
        // Handle position as array [x, y, z] or object {x, y, z}
        let x = 0, y = 0, z = 0;
        if (Array.isArray(node.position)) {
          [x, y, z] = node.position;
        } else if (node.position && typeof node.position === 'object') {
          x = node.position.x || 0;
          y = node.position.y || 0;
          z = node.position.z || 0;
        } else {
          x = node.x || 0;
          y = node.y || 0;
          z = node.z || 0;
        }
        
        return {
          id: node.entity_id || node.id,
          title: node.properties?.title || node.title || 'Untitled',
          content: node.properties?.content || node.content || '',
          type: node.properties?.type || node.type || 'Unknown',
          x: x,
          y: y,
          z: z,
          importance: node.properties?.importance || node.importance || 0.5,
          connections: node.properties?.connections || node.connections || [],
          metadata: node.properties?.metadata || node.metadata || {}
        };
      }) || [];
      
      // Transform edges to flat structure
      const transformedEdges = projectionData?.edges?.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.properties?.type || edge.type || 'related',
        weight: edge.properties?.weight || edge.weight || 1.0,
        color: edge.properties?.color || edge.color || '#ffffff'
      })) || [];
      
      const transformedProjectionData = {
        nodes: transformedNodes,
        edges: transformedEdges
      };
      
      res.status(200).json({
        success: true,
        data: {
          projectionId: latestProjection.projection_id,
          createdAt: latestProjection.created_at,
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
      
      // Fetch entity details using generic approach (standardized field names)
      entityData = await this.fetchEntityByType(entityTypeMapping.tableName, nodeId, userId);
      
      if (!entityData) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ENTITY_TYPE',
            message: `Unsupported entity type: ${entityType}`
          }
        } as TApiResponse<any>);
        return;
      }

      if (!entityData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ENTITY_NOT_FOUND',
            message: `Entity not found: ${nodeId}`
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
   * Generic method to fetch entity by type using standardized field names
   * This replaces the need for separate switch cases since all entities now use:
   * - entity_id (primary key)
   * - user_id (for filtering)
   * - title, content, created_at, updated_at (standardized fields)
   */
  private async fetchEntityByType(tableName: string, entityId: string, userId: string): Promise<any> {
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

    // All entities now use standardized field names
    return await model.findFirst({
      where: {
        entity_id: entityId,
        user_id: userId
      }
    });
  }
} 