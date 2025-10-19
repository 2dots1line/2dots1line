import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { TApiResponse } from '@2dots1line/shared-types';

export class InsightController {
  private insightQueue?: Queue;

  constructor() {
    // Initialize Redis connection for insight queue
    const redisConnection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
    });

    // Create insight queue
    this.insightQueue = new Queue('insight-queue', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      }
    });

    console.log('✅ InsightController initialized with Redis connection');
  }

  /**
   * Trigger insight generation job for authenticated user
   * POST /api/v1/insights/trigger
   */
  async triggerInsightJob(req: Request, res: Response): Promise<void> {
    try {
      // Extract userId from authenticated request
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized - User ID not found'
          }
        } as TApiResponse<any>);
        return;
      }

      if (!this.insightQueue) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Insight generation service is currently unavailable. Please ensure Redis and the insight-worker are running.'
          }
        } as TApiResponse<any>);
        return;
      }

      // Add job to insight queue
      const job = await this.insightQueue.add('user-cycle', {
        userId,
        source: 'manual-dashboard-trigger',
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Insight generation job ${job.id} queued for user ${userId}`);

      // Return 202 Accepted with job information
      res.status(202).json({
        success: true,
        data: {
          jobId: job.id,
          status: 'queued',
          message: 'Insight generation job has been queued successfully',
          userId
        }
      } as TApiResponse<any>);

    } catch (error) {
      console.error('Error in insight controller triggerInsightJob:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal Server Error'
        }
      } as TApiResponse<any>);
    }
  }
}
