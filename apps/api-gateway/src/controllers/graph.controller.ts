// apps/api-gateway/src/controllers/graph.controller.ts
// V11.0 Architecture - Real-time graph metrics endpoint per tech lead directive

import { Request, Response } from 'express';
import type { TApiResponse } from '@2dots1line/shared-types';
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
        return '#ffffff'; // White for general relationships
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
        id: `${rel.source}-${rel.target}-${rel.type}`,
        source: rel.source,
        target: rel.target,
        type: rel.type,
        weight: rel.weight || 1.0,
        color: this.getEdgeColor(rel.type)
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