import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { TApiResponse } from '@2dots1line/shared-types';
import { ConfigService } from '@2dots1line/config-service';

export class OntologyController {
  private ontologyQueue?: Queue;
  private configService?: ConfigService;

  constructor() {
    // Initialize Redis connection for ontology queue
    const redisConnection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
    });

    // Create ontology optimization queue
    this.ontologyQueue = new Queue('ontology-optimization-queue', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      }
    });

    // Initialize ConfigService for operational parameters
    this.configService = new ConfigService();
    this.configService.initialize().catch(console.error);

    console.log('✅ OntologyController initialized with Redis connection');
  }

  /**
   * Trigger ontology optimization job for authenticated user
   * POST /api/v1/ontology/optimize
   */
  async triggerOntologyOptimization(req: Request, res: Response): Promise<void> {
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

      if (!this.ontologyQueue) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Ontology optimization service is currently unavailable. Please ensure Redis and the ontology-optimization-worker are running.'
          }
        } as TApiResponse<any>);
        return;
      }

      // Extract date range from request body
      const { startDate, endDate } = req.body;
      
      // Get operational parameters for validation
      const minDays = await this.configService?.getOperationalParameter('ontology_optimization.min_date_range_days', 1) || 1;
      const maxDays = await this.configService?.getOperationalParameter('ontology_optimization.max_date_range_days', 7) || 7;
      const defaultDays = await this.configService?.getOperationalParameter('ontology_optimization.default_date_range_days', 2) || 2;
      
      // Validate date range if provided
      let validatedStartDate: Date | undefined;
      let validatedEndDate: Date | undefined;
      
      if (startDate) {
        validatedStartDate = new Date(startDate);
        if (isNaN(validatedStartDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DATE',
              message: 'Invalid start date format'
            }
          } as TApiResponse<any>);
          return;
        }
      }
      
      if (endDate) {
        validatedEndDate = new Date(endDate);
        if (isNaN(validatedEndDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DATE',
              message: 'Invalid end date format'
            }
          } as TApiResponse<any>);
          return;
        }
      }
      
      // Validate date range logic
      if (validatedStartDate && validatedEndDate) {
        if (validatedStartDate > validatedEndDate) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DATE_RANGE',
              message: 'Start date must be before end date'
            }
          } as TApiResponse<any>);
          return;
        }
        
        // Calculate date range in days
        const rangeDays = Math.ceil((validatedEndDate.getTime() - validatedStartDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (rangeDays < minDays) {
          res.status(400).json({
            success: false,
            error: {
              code: 'DATE_RANGE_TOO_SHORT',
              message: `Date range must be at least ${minDays} day(s). Current range: ${rangeDays} day(s)`
            }
          } as TApiResponse<any>);
          return;
        }
        
        if (rangeDays > maxDays) {
          res.status(400).json({
            success: false,
            error: {
              code: 'DATE_RANGE_TOO_LONG',
              message: `Date range cannot exceed ${maxDays} day(s). Current range: ${rangeDays} day(s)`
            }
          } as TApiResponse<any>);
          return;
        }
      }
      
      // If no dates provided, use default range
      if (!validatedStartDate || !validatedEndDate) {
        validatedEndDate = new Date();
        validatedStartDate = new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000);
        console.log(`📅 Using default date range: ${defaultDays} days (${validatedStartDate.toISOString().split('T')[0]} to ${validatedEndDate.toISOString().split('T')[0]})`);
      }

      // Add job to ontology optimization queue
      const job = await this.ontologyQueue.add('full-optimization', {
        userId,
        optimizationType: 'full',
        startDate: validatedStartDate?.toISOString(),
        endDate: validatedEndDate?.toISOString(),
        source: 'manual-dashboard-trigger',
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Ontology optimization job ${job.id} queued for user ${userId}${validatedStartDate && validatedEndDate ? ` with date range ${validatedStartDate.toISOString().split('T')[0]} to ${validatedEndDate.toISOString().split('T')[0]}` : ''}`);

      // Return 202 Accepted with job information
      res.status(202).json({
        success: true,
        data: {
          jobId: job.id,
          status: 'queued',
          message: 'Ontology optimization job has been queued successfully',
          userId,
          dateRange: validatedStartDate && validatedEndDate ? {
            startDate: validatedStartDate.toISOString(),
            endDate: validatedEndDate.toISOString()
          } : undefined
        }
      } as TApiResponse<any>);

    } catch (error) {
      console.error('Error in ontology controller triggerOntologyOptimization:', error);
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
