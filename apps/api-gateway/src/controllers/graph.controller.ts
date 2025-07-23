// apps/api-gateway/src/controllers/graph.controller.ts
// V11.0 Architecture - Real-time graph metrics endpoint per tech lead directive

import { Request, Response } from 'express';
import type { TApiResponse } from '@2dots1line/shared-types';
import { Neo4jService, DatabaseService } from '@2dots1line/database';
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
          id: node.id,
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

      // Fetch entity details based on type
      switch (entityType) {
        case 'Concept':
          entityData = await this.databaseService.prisma.concepts.findFirst({
            where: { 
              concept_id: nodeId,
              user_id: userId
            }
          });
          break;
          
        case 'MemoryUnit':
          entityData = await this.databaseService.prisma.memory_units.findFirst({
            where: { 
              muid: nodeId,
              user_id: userId
            }
          });
          break;
          
        case 'DerivedArtifact':
          entityData = await this.databaseService.prisma.derived_artifacts.findFirst({
            where: { 
              artifact_id: nodeId,
              user_id: userId
            }
          });
          break;
          
        case 'Community':
          entityData = await this.databaseService.prisma.communities.findFirst({
            where: { 
              community_id: nodeId,
              user_id: userId
            }
          });
          break;
          
        default:
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
      const transformedData = this.transformEntityData(entityData, entityType as string);

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
   * Transform entity data for frontend consumption
   */
  private transformEntityData(entityData: any, entityType: string): any {
    switch (entityType) {
      case 'Concept':
        return {
          id: entityData.concept_id,
          type: 'Concept',
          title: entityData.name,
          description: entityData.description || 'No description available',
          importance: entityData.salience || 0.5,
          metadata: {
            conceptType: entityData.type,
            status: entityData.status,
            createdAt: entityData.created_at,
            lastUpdated: entityData.last_updated_ts,
            communityId: entityData.community_id,
            mergedInto: entityData.merged_into_concept_id
          }
        };
        
      case 'MemoryUnit':
        return {
          id: entityData.muid,
          type: 'MemoryUnit',
          title: entityData.title,
          description: entityData.content || 'No content available',
          importance: entityData.importance_score || 0.5,
          metadata: {
            sentimentScore: entityData.sentiment_score,
            createdAt: entityData.creation_ts,
            lastModified: entityData.last_modified_ts,
            ingestionDate: entityData.ingestion_ts,
            sourceConversationId: entityData.source_conversation_id
          }
        };
        
      case 'DerivedArtifact':
        return {
          id: entityData.artifact_id,
          type: 'DerivedArtifact',
          title: entityData.title,
          description: entityData.content_narrative || 'No narrative available',
          importance: 0.7, // Default importance for artifacts
          metadata: {
            artifactType: entityData.artifact_type,
            createdAt: entityData.created_at,
            sourceMemoryUnitIds: entityData.source_memory_unit_ids,
            sourceConceptIds: entityData.source_concept_ids,
            contentData: entityData.content_data
          }
        };
        
      case 'Community':
        return {
          id: entityData.community_id,
          type: 'Community',
          title: entityData.name,
          description: entityData.description || 'No description available',
          importance: 0.8, // Default importance for communities
          metadata: {
            createdAt: entityData.created_at,
            lastAnalyzed: entityData.last_analyzed_ts
          }
        };
        
      default:
        return entityData;
    }
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
} 