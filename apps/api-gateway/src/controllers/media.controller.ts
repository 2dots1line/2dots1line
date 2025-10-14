import { Request, Response } from 'express';
import { PexelsService } from '@2dots1line/pexels-service';
import { MediaGenerationService } from '@2dots1line/media-generation-service';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { VideoJobData } from '@2dots1line/video-generation-worker';
import { GeneratedMediaRepository } from '@2dots1line/database';
import fs from 'fs';
import path from 'path';

export class MediaController {
  private pexelsService: PexelsService;
  private mediaGenerationService: MediaGenerationService;
  private videoGenerationQueue: Queue<VideoJobData> | null = null;
  private redisConnection: Redis | null = null;
  private generatedMediaRepo: GeneratedMediaRepository;

  constructor() {
    // Environment variables are loaded by DatabaseService.getInstance() in app.ts
    // No need to load them again here
    this.pexelsService = new PexelsService();
    this.mediaGenerationService = new MediaGenerationService();
    this.generatedMediaRepo = new GeneratedMediaRepository();
    
    // Initialize video generation queue if Redis is available
    this.initializeVideoGenerationQueue();
  }

  private initializeVideoGenerationQueue(): void {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      });

      this.videoGenerationQueue = new Queue<VideoJobData>('video-generation-queue', {
        connection: this.redisConnection
      });

      console.log('✅ Video generation queue initialized');
    } catch (error) {
      console.error('❌ Failed to initialize video generation queue:', error);
      console.log('⚠️  Video generation functionality will be disabled');
    }
  }

  /**
   * Search for media (videos/photos) on Pexels
   */
  async searchMedia(req: Request, res: Response) {
    try {
      const { q: query, type = 'video', page = 1, per_page = 20 } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
      }

      let results;
      if (type === 'video') {
        results = await this.pexelsService.searchVideos(query, {
          page: Number(page),
          per_page: Number(per_page)
        });
      } else if (type === 'photo') {
        results = await this.pexelsService.searchPhotos(query, {
          page: Number(page),
          per_page: Number(per_page)
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Type must be either "video" or "photo"'
        });
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Media search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search media'
      });
    }
  }

  /**
   * Get recommended media for a specific view
   */
  async getRecommendedMedia(req: Request, res: Response) {
    try {
      const { view } = req.query;

      if (!view || typeof view !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'View parameter is required'
        });
      }

      const results = await this.pexelsService.getRecommendedMedia(view);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Recommended media error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get recommended media'
      });
    }
  }

  /**
   * Get popular videos
   */
  async getPopularVideos(req: Request, res: Response) {
    try {
      const { page = 1, per_page = 20 } = req.query;

      const results = await this.pexelsService.getPopularVideos(
        Number(page),
        Number(per_page)
      );

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Popular videos error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular videos'
      });
    }
  }

  /**
   * Get popular photos
   */
  async getPopularPhotos(req: Request, res: Response) {
    try {
      const { page = 1, per_page = 20 } = req.query;

      const results = await this.pexelsService.getPopularPhotos(
        Number(page),
        Number(per_page)
      );

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Popular photos error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular photos'
      });
    }
  }

  /**
   * Get specific video details
   */
  async getVideoDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const videoId = Number(id);

      if (isNaN(videoId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid video ID'
        });
      }

      const result = await this.pexelsService.getVideoDetails(videoId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Video details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get video details'
      });
    }
  }

  /**
   * Get specific photo details
   */
  async getPhotoDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const photoId = Number(id);

      if (isNaN(photoId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid photo ID'
        });
      }

      const result = await this.pexelsService.getPhotoDetails(photoId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Photo not found'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Photo details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get photo details'
      });
    }
  }

  /**
   * Generate an image using AI (dedicated endpoint for chat-based image generation)
   * V11.0 AI Media Generation Suite
   */
  async generateImage(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      // Extract userId from authenticated request
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - User ID not found'
        });
      }

      // Extract and validate request parameters
      const {
        prompt,
        style,
        quality = 'medium',
        viewContext = 'chat'
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required and must be a non-empty string'
        });
      }

      // Generate image using MediaGenerationService
      console.log(`[generateImage] Generating image for user ${userId}: "${prompt}"`);
      
      const { imageUrl, provider, model } = await this.mediaGenerationService.generateImage({
        motif: prompt,
        styleHints: style ? [style] : undefined,
        quality: quality as 'low' | 'medium' | 'high'
      });

      // Save to filesystem: apps/web-app/public/images/generated/{userId}/
      const timestamp = Date.now();
      const webAppPublicDir = path.join(process.cwd(), 'apps', 'web-app', 'public', 'images', 'generated', userId);
      const userDir = webAppPublicDir;
      
      // Ensure directory exists
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const filename = `img-${timestamp}.png`;
      const filePath = path.join(userDir, filename);
      const publicUrl = `/images/generated/${userId}/${filename}`;

      // Convert base64 to buffer and save
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, imageBuffer);

      console.log(`✅ Image saved to: ${filePath}`);

      // Save metadata to database
      const generationDurationSeconds = Math.floor((Date.now() - startTime) / 1000);
      const generationCost = model.includes('nano-banana') || model.includes('flash') 
        ? 0.001 
        : (model.includes('fast') ? 0.02 : 0.04);

      try {
        await this.generatedMediaRepo.createGeneratedMedia({
          userId,
          mediaType: 'image',
          fileUrl: publicUrl,
          filePath,
          prompt,
          viewContext,
          generationCost,
          generationDurationSeconds,
          provider,
          model,
          metadata: {
            style,
            quality
          }
        });
        console.log('✅ Media metadata saved to database');
      } catch (dbError) {
        console.error('⚠️ Failed to save media metadata to database (image still saved successfully):', dbError);
      }

      // Return success response with image URL
      res.json({
        success: true,
        imageUrl: publicUrl,
        provider,
        model,
        cost: `$${generationCost.toFixed(3)}`,
        duration: `${generationDurationSeconds}s`
      });

    } catch (error) {
      console.error('[generateImage] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate image',
        detail: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate a background video using Veo 3
   * V11.0 AI Media Generation Suite
   */
  async generateVideo(req: Request, res: Response) {
    try {
      // Extract userId from authenticated request
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - User ID not found'
        });
      }

      if (!this.videoGenerationQueue) {
        return res.status(503).json({
          success: false,
          error: 'Video generation service is currently unavailable. Please ensure Redis and the video-generation-worker are running.'
        });
      }

      // Extract and validate request parameters
      const {
        prompt,
        viewContext = 'chat',
        mood,
        quality = 'fast',
        cinematography,
        useImageSeed = false,
        imageSeedMotif
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required and must be a non-empty string'
        });
      }

      if (!['chat', 'cards', 'dashboard'].includes(viewContext)) {
        return res.status(400).json({
          success: false,
          error: 'viewContext must be one of: chat, cards, dashboard'
        });
      }

      if (!['fast', 'standard'].includes(quality)) {
        return res.status(400).json({
          success: false,
          error: 'quality must be either "fast" or "standard"'
        });
      }

      // Add job to video generation queue
      const job = await this.videoGenerationQueue.add('generate_video', {
        userId,
        prompt,
        viewContext,
        mood,
        quality,
        cinematography,
        useImageSeed,
        imageSeedMotif: useImageSeed ? imageSeedMotif || `Static frame: ${prompt}` : undefined
      });

      console.log(`✅ Video generation job ${job.id} queued for user ${userId}`);

      // Return 202 Accepted with job information
      res.status(202).json({
        success: true,
        message: 'Video generation started. You will be notified when complete.',
        jobId: job.id,
        estimatedTime: quality === 'fast' ? '30 seconds to 2 minutes' : '1 to 6 minutes',
        estimatedCost: quality === 'fast' ? '$4.00' : '$6.00'
      });

    } catch (error) {
      console.error('Video generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start video generation',
        detail: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get video generation job status
   * V11.0 AI Media Generation Suite
   */
  async getVideoJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;

      if (!this.videoGenerationQueue) {
        return res.status(503).json({
          success: false,
          error: 'Video generation service is currently unavailable'
        });
      }

      const job = await this.videoGenerationQueue.getJob(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      const state = await job.getState();
      const progress = job.progress;
      const returnValue = job.returnvalue;

      res.json({
        success: true,
        data: {
          jobId: job.id,
          state,
          progress,
          result: returnValue,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason
        }
      });

    } catch (error) {
      console.error('Job status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check job status'
      });
    }
  }

  /**
   * Get user's generated media library
   * V11.0 AI Media Generation Suite
   */
  async getGeneratedMedia(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - User ID not found'
        });
      }

      const { type } = req.query as { type?: 'image' | 'video' };

      // Query generated media repository
      const generatedMedia = await this.generatedMediaRepo.getUserGeneratedMedia(
        userId,
        type
      );

      res.json({
        success: true,
        data: generatedMedia,
        count: generatedMedia.length
      });

    } catch (error) {
      console.error('Get generated media error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve generated media'
      });
    }
  }

  /**
   * Delete generated media by ID
   * V11.0 AI Media Generation Suite
   */
  async deleteGeneratedMedia(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - User ID not found'
        });
      }

      // Get media to verify ownership and get file path
      const media = await this.generatedMediaRepo.getGeneratedMediaById(id);

      if (!media) {
        return res.status(404).json({
          success: false,
          error: 'Generated media not found'
        });
      }

      if (media.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden - You do not own this media'
        });
      }

      // Delete from database
      const deleted = await this.generatedMediaRepo.deleteGeneratedMedia(id, userId);

      if (!deleted) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete media from database'
        });
      }

      // Attempt to delete file from filesystem (non-blocking)
      try {
        if (fs.existsSync(media.filePath)) {
          fs.unlinkSync(media.filePath);
          console.log(`✅ Deleted file: ${media.filePath}`);
        }
      } catch (fileError) {
        console.error(`⚠️  Failed to delete file: ${media.filePath}`, fileError);
        // Continue anyway - database record is deleted
      }

      res.json({
        success: true,
        message: 'Generated media deleted successfully'
      });

    } catch (error) {
      console.error('Delete generated media error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete generated media'
      });
    }
  }
}
