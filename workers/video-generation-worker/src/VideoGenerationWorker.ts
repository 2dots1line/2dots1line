/**
 * VideoGenerationWorker.ts
 * V11.0 Worker for asynchronous video generation using Gemini Veo 3
 * 
 * This worker processes video generation jobs and polls for completion,
 * then saves the generated video and notifies the user via WebSocket.
 */

import { MediaGenerationService } from '@2dots1line/media-generation-service';
import { environmentLoader } from '@2dots1line/core-utils/dist/environment/EnvironmentLoader';
import { GeneratedMediaRepository } from '@2dots1line/database';
import { Worker, Job, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import fs from 'fs';
import path from 'path';

export interface VideoJobData {
  userId: string;
  prompt: string;
  viewContext: 'chat' | 'cards' | 'dashboard';
  quality?: 'fast' | 'standard';
  mood?: string;
  cinematography?: string;
  useImageSeed?: boolean;
  imageSeedMotif?: string;
}

export interface VideoGenerationWorkerConfig {
  queueName?: string;
  concurrency?: number;
  maxPollAttempts?: number;
  pollInterval?: number;
}

/**
 * VideoGenerationWorker class for processing video generation jobs
 */
export class VideoGenerationWorker {
  private worker: Worker;
  private config: VideoGenerationWorkerConfig;
  private notificationQueue: Queue;
  private redisConnection: Redis;
  private mediaService: MediaGenerationService;
  private generatedMediaRepo: GeneratedMediaRepository;

  constructor(config: VideoGenerationWorkerConfig = {}) {
    console.log('[VideoGenerationWorker] Initializing...');
    
    // Load environment variables
    environmentLoader.load();

    this.config = {
      queueName: 'video-generation-queue',
      concurrency: 2, // Max 2 simultaneous video generations
      maxPollAttempts: 36, // 6 minutes max
      pollInterval: 10000, // 10 seconds
      ...config
    };

    // Initialize Redis connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log('[VideoGenerationWorker] Connecting to Redis:', redisUrl);
    
    this.redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });

    // Initialize MediaGenerationService
    this.mediaService = new MediaGenerationService();
    
    // Initialize GeneratedMediaRepository
    this.generatedMediaRepo = new GeneratedMediaRepository();

    // Initialize notification queue
    this.notificationQueue = new Queue('notification-queue', {
      connection: this.redisConnection
    });

    // Initialize worker
    this.worker = new Worker(
      this.config.queueName!,
      this.processJob.bind(this),
      {
        connection: this.redisConnection,
        concurrency: this.config.concurrency,
        limiter: {
          max: 10,
          duration: 60000 // 10 videos per minute max
        }
      }
    );

    // Worker event handlers
    this.worker.on('completed', (job) => {
      console.log(`[VideoGenerationWorker] Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[VideoGenerationWorker] Job ${job?.id} failed:`, err);
    });

    this.worker.on('error', (err) => {
      console.error('[VideoGenerationWorker] Worker error:', err);
    });

    console.log('[VideoGenerationWorker] Initialized and listening for jobs');
  }

  /**
   * Process a video generation job
   */
  private async processJob(job: Job<VideoJobData>): Promise<void> {
    const { userId, prompt, viewContext, quality, mood, cinematography, useImageSeed, imageSeedMotif } = job.data;
    
    console.log(`[VideoGenerationWorker] Processing job ${job.id} for user ${userId}`);
    console.log(`[VideoGenerationWorker] Prompt: ${prompt}`);
    
    const startTime = Date.now();
    
    try {
      // Step 1: Optionally generate starting image for consistency
      if (useImageSeed && imageSeedMotif) {
        console.log(`[VideoGenerationWorker] Generating seed image: ${imageSeedMotif}`);
        await this.mediaService.generateImage({
          motif: imageSeedMotif,
          quality: 'low' // Use low-cost for seed
        });
        await job.updateProgress(5);
      }

      // Step 2: Generate video
      const { operationId, estimatedCost, model } = await this.mediaService.generateVideo({
        prompt,
        quality: quality || 'fast',
        mood,
        cinematography
      });

      console.log(`[VideoGenerationWorker] Video generation started. Operation: ${operationId}`);
      await job.updateProgress(10);

      // Step 3: Poll until complete (max 6 minutes)
      const maxPolls = this.config.maxPollAttempts!;
      const pollInterval = this.config.pollInterval!;
      
      for (let i = 0; i < maxPolls; i++) {
        await this.sleep(pollInterval);
        
        const result = await this.mediaService.pollVideoOperation(operationId);
        
        const progress = Math.min(90, 10 + (i / maxPolls) * 80);
        await job.updateProgress(progress);
        
        if (result.done && (result.videoBytes || result.videoUrl)) {
          console.log(`[VideoGenerationWorker] Video generation complete!`);
          
          // Step 4: Download video if only URL is provided
          let videoBuffer: Buffer;
          if (result.videoBytes) {
            videoBuffer = result.videoBytes;
          } else if (result.videoUrl) {
            console.log(`[VideoGenerationWorker] Downloading video from: ${result.videoUrl}`);
            const videoResponse = await fetch(result.videoUrl, {
              headers: {
                'x-goog-api-key': process.env.GOOGLE_API_KEY || ''
              }
            });
            if (!videoResponse.ok) {
              throw new Error(`Failed to download video: ${videoResponse.statusText}`);
            }
            const arrayBuffer = await videoResponse.arrayBuffer();
            videoBuffer = Buffer.from(arrayBuffer);
            console.log(`[VideoGenerationWorker] Video downloaded: ${videoBuffer.length} bytes`);
          } else {
            throw new Error('No video bytes or URL in response');
          }
          
          // Step 5: Save video to disk (in web-app public folder for Next.js)
          const filename = `${userId}-${viewContext}-${Date.now()}.mp4`;
          const videoDir = path.join(process.cwd(), 'apps', 'web-app', 'public', 'videos', 'generated');
          
          if (!fs.existsSync(videoDir)) {
            fs.mkdirSync(videoDir, { recursive: true });
          }
          
          const filePath = path.join(videoDir, filename);
          fs.writeFileSync(filePath, videoBuffer);
          
          const publicUrl = `/videos/generated/${filename}`;
          
          console.log(`[VideoGenerationWorker] Video saved to: ${publicUrl}`);
          
          // Step 6: Save to database
          const generationDurationSeconds = Math.floor((Date.now() - startTime) / 1000);
          try {
            await this.generatedMediaRepo.createGeneratedMedia({
              userId,
              mediaType: 'video',
              fileUrl: publicUrl,
              filePath,
              prompt,
              viewContext,
              generationCost: parseFloat(estimatedCost.replace('$', '')),
              generationDurationSeconds,
              provider: 'gemini',
              model,
              metadata: {
                quality,
                mood,
                cinematography,
                useImageSeed
              }
            });
            console.log(`[VideoGenerationWorker] Video metadata saved to database`);
          } catch (dbError) {
            console.error(`[VideoGenerationWorker] Failed to save to database:`, dbError);
            // Continue anyway - video file is saved
          }
          
          // Step 5: Notify user via notification queue
          await this.notificationQueue.add('video_generation_complete', {
            type: 'video_generation_complete',
            userId,
            videoUrl: publicUrl,
            viewContext,
            cost: estimatedCost,
            model,
            message: `Your background video is ready!`
          });
          
          await job.updateProgress(100);
          console.log(`[VideoGenerationWorker] Notification sent to user ${userId}`);
          return;
        }
        
        console.log(`[VideoGenerationWorker] Poll ${i + 1}/${maxPolls}: Video still processing...`);
      }
      
      // Timeout after max polls
      throw new Error(`Video generation timed out after ${maxPolls * pollInterval / 1000} seconds`);
      
    } catch (error) {
      console.error(`[VideoGenerationWorker] Job ${job.id} failed:`, error);
      
      // Notify user of failure
      await this.notificationQueue.add('video_generation_failed', {
        type: 'video_generation_failed',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Video generation failed. Please try again.'
      });
      
      throw error;
    }
  }

  /**
   * Helper to sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[VideoGenerationWorker] Shutting down...');
    
    await this.worker.close();
    await this.notificationQueue.close();
    await this.redisConnection.quit();
    
    console.log('[VideoGenerationWorker] Shutdown complete');
  }
}

export default VideoGenerationWorker;

