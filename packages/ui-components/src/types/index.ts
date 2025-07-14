/**
 * UI Components Types
 * V11.0 - Local types for UI components
 */

// Re-export available types from shared-types
export type { TCard, CardStatus, CardType } from '@2dots1line/shared-types';

// Re-export cosmos types if they exist
export type { 
  CosmosNode, 
  NodeConnection, 
  CosmosNavigationState,
  NodeInteractionEvent,
  Vector3D,
  ScreenPosition 
} from '@2dots1line/shared-types';

// Local types for UI components
export interface DisplayCard {
  card_id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  background_image_url?: string;
  status?: string;
  type?: string;
  tags?: string[];
  created_at?: Date;
  updated_at?: Date;
  user_id?: string;
  is_favorited?: boolean;
}

export interface CardFilter {
  category?: string;
  status?: string;
  tags?: string[];
  search?: string;
}

export interface ImageMetadata {
  filename: string;
  url: string;
  tags: string[];
  category: string;
  semantic_score?: number;
}

export interface ImageCollection {
  name: string;
  category: string;
  images: string[];
}

// Card component specific types
export type CardSize = 'sm' | 'md' | 'lg';
export type CardView = 'grid' | 'list'; 