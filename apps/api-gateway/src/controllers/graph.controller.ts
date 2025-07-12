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
      
      res.status(200).json({
        success: true,
        data: {
          projectionId: latestProjection.projection_id,
          createdAt: latestProjection.created_at,
          projectionData: projectionData,
          metadata: {
            nodeCount: projectionData?.nodes?.length || 0,
            edgeCount: projectionData?.edges?.length || 0
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