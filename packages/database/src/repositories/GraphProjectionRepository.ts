import { Prisma, user_graph_projections as UserGraphProjection } from '@prisma/client';
import { DatabaseService } from '../DatabaseService';

export interface GraphProjectionData {
  nodes: Array<{
    entity_id: string;
    position: { x: number; y: number; z: number };
    properties: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    properties: Record<string, any>;
  }>;
  metadata: {
    algorithm: string;
    parameters: Record<string, any>;
    boundingBox: {
      min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number };
    };
    statistics: {
      nodeCount: number;
      edgeCount: number;
      density: number;
    };
  };
}

export interface CreateGraphProjectionData {
  userId: string;
  projectionData: GraphProjectionData;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

export class GraphProjectionRepository {
  private prisma;

  constructor(databaseService: DatabaseService) {
    this.prisma = databaseService.prisma;
  }

  /**
   * Creates a new graph projection record.
   */
  public async create(data: {
    userId: string;
    projectionData: Prisma.InputJsonValue;
    status?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<UserGraphProjection> {
    
    const projectionId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // The @updatedAt directive in the schema handles this field automatically.
    // Manually setting it in a `create` call is unnecessary and can cause type errors.
    // We only need to provide fields that don't have a @default or @updatedAt value.
    
    const createData: Prisma.user_graph_projectionsUncheckedCreateInput = {
      projection_id: projectionId,
      user_id: data.userId, // Use unchecked input to directly set user_id
      projection_data: data.projectionData,
      status: data.status || 'completed',
      // Use a conditional spread to only include metadata if it's provided.
      // This is a robust pattern that avoids issues with null/undefined.
      ...(data.metadata && { metadata: data.metadata }),
    };

    return this.prisma.user_graph_projections.create({
      data: createData,
    });
  }

  /**
   * Finds the latest completed graph projection for a user.
   */
  public async findLatestForUser(userId: string): Promise<UserGraphProjection | null> {
    return this.prisma.user_graph_projections.findFirst({
      where: { 
        user_id: userId, 
        status: 'completed' 
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Finds a specific graph projection by ID and user.
   */
  public async findByIdAndUser(projectionId: string, userId: string): Promise<UserGraphProjection | null> {
    return this.prisma.user_graph_projections.findFirst({
      where: {
        projection_id: projectionId,
        user_id: userId,
      },
    });
  }

  /**
   * Updates the status of a graph projection.
   */
  public async updateStatus(
    projectionId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    metadataUpdate?: Prisma.InputJsonValue
  ): Promise<UserGraphProjection> {
    // The `updated_at` field is handled automatically by `@updatedAt`
    return this.prisma.user_graph_projections.update({
      where: { projection_id: projectionId },
      data: {
        status,
        ...(metadataUpdate && { metadata: metadataUpdate }),
      },
    });
  }

  /**
   * Updates the projection data for an existing projection.
   */
  public async updateProjectionData(
    projectionId: string, 
    projectionData: GraphProjectionData
  ): Promise<UserGraphProjection> {
    return this.prisma.user_graph_projections.update({
      where: { projection_id: projectionId },
      data: {
        projection_data: projectionData as any,
        status: 'completed',
        // updated_at is handled by Prisma @updatedAt automatically
      },
    });
  }

  /**
   * Gets all graph projections for a user with pagination.
   */
  public async findAllForUser(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      status?: 'pending' | 'processing' | 'completed' | 'failed';
    } = {}
  ): Promise<UserGraphProjection[]> {
    const { limit = 10, offset = 0, status } = options;
    
    const whereClause: any = { user_id: userId };
    if (status) {
      whereClause.status = status;
    }

    return this.prisma.user_graph_projections.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Counts the total number of projections for a user.
   */
  public async countForUser(
    userId: string, 
    status?: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<number> {
    const whereClause: any = { user_id: userId };
    if (status) {
      whereClause.status = status;
    }

    return this.prisma.user_graph_projections.count({
      where: whereClause,
    });
  }

  /**
   * Prunes old graph projection versions, keeping only the most recent ones.
   */
  public async pruneOldVersions(userId: string, keepCount: number = 3): Promise<number> {
    // First, get the projections to keep (most recent ones)
    const projectionsToKeep = await this.prisma.user_graph_projections.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: keepCount,
      select: { projection_id: true },
    });

    const idsToKeep = projectionsToKeep.map(p => p.projection_id);

    // Delete old projections
    const deleteResult = await this.prisma.user_graph_projections.deleteMany({
      where: {
        user_id: userId,
        projection_id: {
          notIn: idsToKeep,
        },
      },
    });

    return deleteResult.count;
  }

  /**
   * Deletes a specific graph projection.
   */
  public async delete(projectionId: string, userId: string): Promise<boolean> {
    try {
      await this.prisma.user_graph_projections.delete({
        where: {
          projection_id: projectionId,
          user_id: userId,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Record not found
        return false;
      }
      throw error;
    }
  }

  /**
   * Gets projection statistics for a user.
   */
  public async getProjectionStatistics(userId: string): Promise<{
    totalProjections: number;
    completedProjections: number;
    failedProjections: number;
    averageNodeCount: number;
    averageEdgeCount: number;
    lastProjectionDate: Date | null;
  }> {
    const [totalCount, completedCount, failedCount, latestProjection] = await Promise.all([
      this.prisma.user_graph_projections.count({
        where: { user_id: userId }
      }),
      this.prisma.user_graph_projections.count({
        where: { user_id: userId, status: 'completed' }
      }),
      this.prisma.user_graph_projections.count({
        where: { user_id: userId, status: 'failed' }
      }),
      this.prisma.user_graph_projections.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: { created_at: true, projection_data: true }
      })
    ]);

    // Calculate average node and edge counts from completed projections
    const completedProjections = await this.prisma.user_graph_projections.findMany({
      where: { user_id: userId, status: 'completed' },
      select: { projection_data: true },
      take: 10, // Sample from recent projections for performance
      orderBy: { created_at: 'desc' }
    });

    let totalNodes = 0;
    let totalEdges = 0;
    let validProjections = 0;

    completedProjections.forEach(projection => {
      const data = projection.projection_data as any;
      if (data?.metadata?.statistics) {
        totalNodes += data.metadata.statistics.nodeCount || 0;
        totalEdges += data.metadata.statistics.edgeCount || 0;
        validProjections++;
      }
    });

    const averageNodeCount = validProjections > 0 ? Math.round(totalNodes / validProjections) : 0;
    const averageEdgeCount = validProjections > 0 ? Math.round(totalEdges / validProjections) : 0;

    return {
      totalProjections: totalCount,
      completedProjections: completedCount,
      failedProjections: failedCount,
      averageNodeCount,
      averageEdgeCount,
      lastProjectionDate: latestProjection?.created_at || null
    };
  }

  /**
   * Finds projections that need cleanup (failed or very old).
   */
  public async findProjectionsForCleanup(
    olderThanDays: number = 30,
    includeStatuses: Array<'pending' | 'processing' | 'completed' | 'failed'> = ['failed', 'pending']
  ): Promise<UserGraphProjection[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return this.prisma.user_graph_projections.findMany({
      where: {
        OR: [
          {
            status: { in: includeStatuses },
            created_at: { lt: cutoffDate }
          },
          {
            status: 'processing',
            created_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Processing for more than 24 hours
          }
        ]
      },
      orderBy: { created_at: 'asc' }
    });
  }

  /**
   * Bulk deletes projections by their IDs.
   */
  public async bulkDelete(projectionIds: string[]): Promise<number> {
    if (projectionIds.length === 0) {
      return 0;
    }

    const deleteResult = await this.prisma.user_graph_projections.deleteMany({
      where: {
        projection_id: { in: projectionIds }
      }
    });

    return deleteResult.count;
  }

  /**
   * Creates a projection with a specific ID (useful for testing or migration).
   */
  public async createWithId(
    projectionId: string,
    data: {
      userId: string;
      projectionData: Prisma.InputJsonValue;
      status?: string;
      metadata?: Prisma.InputJsonValue;
    }
  ): Promise<UserGraphProjection> {
    // `created_at` and `updated_at` are handled automatically by Prisma
    return this.prisma.user_graph_projections.create({
      data: {
        projection_id: projectionId,
        user_id: data.userId,
        projection_data: data.projectionData,
        status: data.status || 'completed',
        ...(data.metadata && { metadata: data.metadata }),
      },
    });
  }

  /**
   * Health check - verifies the repository can connect to the database.
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.user_graph_projections.count({ take: 1 });
      return true;
    } catch (error) {
      console.error('GraphProjectionRepository health check failed:', error);
      return false;
    }
  }
} 