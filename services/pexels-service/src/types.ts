export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

export interface PexelsVideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface PexelsSearchResponse<T> {
  total_results: number;
  page: number;
  per_page: number;
  photos?: T[];
  videos?: T[];
  next_page?: string;
  prev_page?: string;
}

export interface SearchFilters {
  query?: string;
  page?: number;
  per_page?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  color?: string;
  locale?: string;
}

export interface VideoSearchFilters extends SearchFilters {
  min_width?: number;
  min_height?: number;
  min_duration?: number;
  max_duration?: number;
}

export interface MediaItem {
  id: string;
  source: 'local' | 'pexels';
  type: 'video' | 'photo';
  title: string;
  url: string;
  thumbnailUrl?: string;
  pexelsId?: number;
  localPath?: string;
  category?: string;
  duration?: number; // For videos
  width?: number;
  height?: number;
  photographer?: string; // For Pexels media
}

export interface PexelsServiceConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: {
    requestsPerHour: number;
    requestsPerMinute: number;
  };
}
