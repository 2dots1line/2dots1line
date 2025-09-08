import { environmentLoader } from '@2dots1line/core-utils';

import axios, { AxiosInstance } from 'axios';

import { 
  PexelsVideo, 
  PexelsPhoto, 
  PexelsSearchResponse, 
  SearchFilters, 
  VideoSearchFilters,
  MediaItem,
  PexelsServiceConfig
} from './types';

export class PexelsService {
  private apiKey: string;
  private baseUrl: string;
  private client: AxiosInstance;
  private rateLimit: {
    requestsPerHour: number;
    requestsPerMinute: number;
  };

  constructor(config?: Partial<PexelsServiceConfig>) {
    this.apiKey = config?.apiKey || environmentLoader.get('PEXELS_API_KEY') || '';
    this.baseUrl = config?.baseUrl || 'https://api.pexels.com/v1';
    this.rateLimit = config?.rateLimit || {
      requestsPerHour: 200,
      requestsPerMinute: 10
    };

    if (!this.apiKey) {
      throw new Error('Pexels API key is required. Set PEXELS_API_KEY environment variable.');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Search for videos on Pexels
   */
  async searchVideos(query: string, filters?: VideoSearchFilters): Promise<MediaItem[]> {
    try {
      const params = new URLSearchParams({
        query,
        per_page: (filters?.per_page || 20).toString(),
        page: (filters?.page || 1).toString(),
        ...(filters?.orientation && { orientation: filters.orientation }),
        ...(filters?.size && { size: filters.size }),
        ...(filters?.color && { color: filters.color }),
        ...(filters?.min_width && { min_width: filters.min_width.toString() }),
        ...(filters?.min_height && { min_height: filters.min_height.toString() }),
        ...(filters?.min_duration && { min_duration: filters.min_duration.toString() }),
        ...(filters?.max_duration && { max_duration: filters.max_duration.toString() })
      });

      const response = await this.client.get<PexelsSearchResponse<PexelsVideo>>(`/videos/search?${params}`);
      
      return this.transformVideosToMediaItems(response.data.videos || []);
    } catch (error) {
      console.error('Error searching Pexels videos:', error);
      throw new Error('Failed to search Pexels videos');
    }
  }

  /**
   * Search for photos on Pexels
   */
  async searchPhotos(query: string, filters?: SearchFilters): Promise<MediaItem[]> {
    try {
      const params = new URLSearchParams({
        query,
        per_page: (filters?.per_page || 20).toString(),
        page: (filters?.page || 1).toString(),
        ...(filters?.orientation && { orientation: filters.orientation }),
        ...(filters?.size && { size: filters.size }),
        ...(filters?.color && { color: filters.color }),
        ...(filters?.locale && { locale: filters.locale })
      });

      const response = await this.client.get<PexelsSearchResponse<PexelsPhoto>>(`/photos/search?${params}`);
      
      return this.transformPhotosToMediaItems(response.data.photos || []);
    } catch (error) {
      console.error('Error searching Pexels photos:', error);
      throw new Error('Failed to search Pexels photos');
    }
  }

  /**
   * Get popular videos from Pexels
   */
  async getPopularVideos(page: number = 1, perPage: number = 20): Promise<MediaItem[]> {
    try {
      const params = new URLSearchParams({
        per_page: perPage.toString(),
        page: page.toString()
      });

      const response = await this.client.get<PexelsSearchResponse<PexelsVideo>>(`/videos/popular?${params}`);
      
      return this.transformVideosToMediaItems(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching popular Pexels videos:', error);
      throw new Error('Failed to fetch popular Pexels videos');
    }
  }

  /**
   * Get popular photos from Pexels
   */
  async getPopularPhotos(page: number = 1, perPage: number = 20): Promise<MediaItem[]> {
    try {
      const params = new URLSearchParams({
        per_page: perPage.toString(),
        page: page.toString()
      });

      const response = await this.client.get<PexelsSearchResponse<PexelsPhoto>>(`/photos/popular?${params}`);
      
      return this.transformPhotosToMediaItems(response.data.photos || []);
    } catch (error) {
      console.error('Error fetching popular Pexels photos:', error);
      throw new Error('Failed to fetch popular Pexels photos');
    }
  }

  /**
   * Get specific video details by ID
   */
  async getVideoDetails(id: number): Promise<MediaItem | null> {
    try {
      const response = await this.client.get<PexelsVideo>(`/videos/${id}`);
      const mediaItems = this.transformVideosToMediaItems([response.data]);
      return mediaItems[0] || null;
    } catch (error) {
      console.error(`Error fetching Pexels video ${id}:`, error);
      return null;
    }
  }

  /**
   * Get specific photo details by ID
   */
  async getPhotoDetails(id: number): Promise<MediaItem | null> {
    try {
      const response = await this.client.get<PexelsPhoto>(`/photos/${id}`);
      const mediaItems = this.transformPhotosToMediaItems([response.data]);
      return mediaItems[0] || null;
    } catch (error) {
      console.error(`Error fetching Pexels photo ${id}:`, error);
      return null;
    }
  }

  /**
   * Transform Pexels video objects to MediaItem format
   */
  private transformVideosToMediaItems(videos: PexelsVideo[]): MediaItem[] {
    return videos.map(video => {
      // Find the best quality video file (prefer HD or higher)
      const bestVideoFile = video.video_files.find(file => 
        file.quality === 'hd' || file.quality === 'full_hd' || file.quality === '4k'
      ) || video.video_files[0];

      // Find a thumbnail
      const thumbnail = video.video_pictures[0]?.picture || video.image;

      return {
        id: `pexels-video-${video.id}`,
        source: 'pexels' as const,
        type: 'video' as const,
        title: `Video by ${video.user.name}`,
        url: bestVideoFile?.link || '',
        thumbnailUrl: thumbnail,
        pexelsId: video.id,
        category: 'video',
        duration: video.duration,
        width: video.width,
        height: video.height,
        photographer: video.user.name
      };
    });
  }

  /**
   * Transform Pexels photo objects to MediaItem format
   */
  private transformPhotosToMediaItems(photos: PexelsPhoto[]): MediaItem[] {
    return photos.map(photo => {
      return {
        id: `pexels-photo-${photo.id}`,
        source: 'pexels' as const,
        type: 'photo' as const,
        title: photo.alt || `Photo by ${photo.photographer}`,
        url: photo.src.large2x || photo.src.large || photo.src.original,
        thumbnailUrl: photo.src.medium || photo.src.small,
        pexelsId: photo.id,
        category: 'photo',
        width: photo.width,
        height: photo.height,
        photographer: photo.photographer
      };
    });
  }

  /**
   * Get recommended media based on view type
   */
  async getRecommendedMedia(view: string): Promise<MediaItem[]> {
    const recommendations: Record<string, string[]> = {
      dashboard: ['nature', 'landscape', 'business', 'office'],
      chat: ['calm', 'peaceful', 'abstract', 'minimal'],
      cards: ['creative', 'artistic', 'geometric', 'modern'],
      settings: ['clean', 'simple', 'professional', 'minimal']
    };

    const keywords = recommendations[view] || ['nature'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    try {
      const videos = await this.searchVideos(randomKeyword, { per_page: 5 });
      const photos = await this.searchPhotos(randomKeyword, { per_page: 5 });
      
      return [...videos, ...photos].slice(0, 10);
    } catch (error) {
      console.error('Error fetching recommended media:', error);
      return [];
    }
  }
}
