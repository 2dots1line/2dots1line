import { Request, Response } from 'express';
import { PexelsService } from '@2dots1line/pexels-service';

export class MediaController {
  private pexelsService: PexelsService;

  constructor() {
    // Environment variables are loaded by DatabaseService.getInstance() in app.ts
    // No need to load them again here
    this.pexelsService = new PexelsService();
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
}
