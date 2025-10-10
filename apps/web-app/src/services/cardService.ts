/**
 * Card Service - Frontend API client for Card management
 * V11.0 - Card system integration with API Gateway
 */

import { CardStatus, CardType, DisplayCard } from '@2dots1line/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Helper function to get authenticated user ID
const getAuthenticatedUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try to get from localStorage first (from UserStore persistence)
  const userStorage = localStorage.getItem('user-storage');
  if (userStorage) {
    try {
      const parsed = JSON.parse(userStorage);
      return parsed.state?.user?.user_id || null;
    } catch (error) {
      console.warn('Failed to parse user storage:', error);
    }
  }
  
  return null;
};

export interface GetCardsRequest {
  user_id?: string;
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
  favorited?: boolean;
  sortBy?: 'created_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface GetCardsResponse {
  success: boolean;
  cards?: DisplayCard[];
  total_count?: number;
  has_more?: boolean;
  error?: string;
  details?: string;
}

export interface GetAllCardIdsResponse {
  success: boolean;
  cardIds?: string[];
  error?: string;
}

export interface GetCardsByIdsRequest {
  cardIds: string[];
}

export interface GetCardsByIdsResponse {
  success: boolean;
  cards?: DisplayCard[];
  error?: string;
}

export interface UpdateCardRequest {
  card_id: string;
  updates: Partial<DisplayCard>;
}

export interface UpdateCardResponse {
  success: boolean;
  card?: DisplayCard;
  error?: string;
  details?: string;
}

export interface CreateCardRequest {
  type: string;
  source_entity_id: string;
  source_entity_type: string;
  background_image_url?: string;
  display_order?: number;
  is_selected?: boolean;
  custom_title?: string;
  custom_content?: string;
}

export interface CreateCardResponse {
  success: boolean;
  card?: DisplayCard;
  error?: string;
  details?: string;
}

export interface DeleteCardRequest {
  card_id: string;
}

export interface DeleteCardResponse {
  success: boolean;
  error?: string;
  details?: string;
}

export interface CardBackgroundUpdateRequest {
  card_id: string;
  background_image_url: string;
}

export interface CardBackgroundUpdateResponse {
  success: boolean;
  card?: DisplayCard;
  error?: string;
  details?: string;
}

class CardService {
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Always use the actual user's token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Get cards for the authenticated user
   */
  async getCards(request: GetCardsRequest = {}, signal?: AbortSignal): Promise<GetCardsResponse> {
    console.log('cardService.getCards - Starting API call with request:', request);
    
    try {
      const params = new URLSearchParams();
      
      if (request.type) params.append('type', request.type);
      if (request.status) params.append('status', request.status);
      if (request.limit) params.append('limit', request.limit.toString());
      if (request.offset) params.append('offset', request.offset.toString());
      if (request.favorited !== undefined) params.append('favorited', request.favorited.toString());
      if (request.sortBy) params.append('sort_by', request.sortBy);
      if (request.sortOrder) params.append('sort_order', request.sortOrder);

      const headers = this.getAuthHeaders();
      console.log('cardService.getCards - Making request to:', `${API_BASE_URL}/api/v1/cards?${params}`);
      console.log('cardService.getCards - Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'none' });

      const response = await fetch(`${API_BASE_URL}/api/v1/cards?${params}`, {
        method: 'GET',
        headers: headers,
        signal, // Add abort signal support
      });

      const data = await response.json();
      console.log('cardService.getCards - Raw API response:', { 
        ok: response.ok, 
        status: response.status, 
        cardsCount: data.data?.cards?.length || 0,
        success: data.success 
      });

      if (!response.ok) {
        console.error('cardService.getCards - API error:', data.error);
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Transform the API response to match frontend TCard expectations
      const transformedCards = (data.data?.cards || []).map((apiCard: any) => {
        return {
          // Map API fields to TCard interface
          card_id: apiCard.id,
          user_id: getAuthenticatedUserId() || 'unknown-user',
          type: apiCard.type,
          source_entity_id: apiCard.source_entity_id || apiCard.id,
          source_entity_type: apiCard.source_entity_type || apiCard.type,
          status: 'active_canvas', // Default status
          is_favorited: false, // Default
          is_synced: true,
          created_at: new Date(apiCard.createdAt),
          updated_at: new Date(apiCard.updatedAt),
          background_image_url: apiCard.background_image_url || null,
          display_order: apiCard.display_order || null,
          is_selected: apiCard.is_selected || false,
          custom_title: apiCard.custom_title || null,
          custom_content: apiCard.custom_content || null,
          // DisplayCard extensions
          title: apiCard.title || 'Untitled',
          subtitle: apiCard.content || `${apiCard.type} entity`,
          content: apiCard.content || '',
          entity_type: apiCard.source_entity_type || apiCard.type,
          entity_id: apiCard.source_entity_id || apiCard.id,
        };
      });

      console.log('cardService.getCards - Transformed cards:', transformedCards.length);

      return {
        success: data.success,
        cards: transformedCards,
        total_count: data.data?.total_count || 0,
        has_more: data.data?.has_more || false,
        error: data.error
      };
    } catch (error) {
      if (signal?.aborted) {
        console.log('cardService.getCards - Request was cancelled');
        throw new Error('Request was cancelled');
      }
      console.error('cardService.getCards - Exception:', error);
      throw error;
    }
  }

  /**
   * Create a new card
   */
  async createCard(request: CreateCardRequest): Promise<CreateCardResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cards`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  /**
   * Update an existing card
   */
  async updateCard(request: UpdateCardRequest): Promise<UpdateCardResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cards/${request.card_id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request.updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }

  /**
   * Delete a card
   */
  async deleteCard(request: DeleteCardRequest): Promise<DeleteCardResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cards/${request.card_id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }

  /**
   * Toggle card favorite status
   */
  async toggleFavorite(cardId: string): Promise<UpdateCardResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cards/${cardId}/favorite`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error toggling card favorite:', error);
      throw error;
    }
  }

  /**
   * Update card background image
   */
  async updateCardBackground(request: CardBackgroundUpdateRequest): Promise<CardBackgroundUpdateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cards/${request.card_id}/background`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ background_image_url: request.background_image_url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating card background:', error);
      throw error;
    }
  }

  /**
   * Get related cards for a given card
   */
  async getRelatedCards(cardId: string, limit: number = 10): Promise<GetCardsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cards/${cardId}/related?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching related cards:', error);
      throw error;
    }
  }

  /**
   * Search cards by query
   */
  async searchCards(query: string, limit: number = 50): Promise<GetCardsResponse> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/cards/search?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Transform the API response to match frontend TCard expectations
      const transformedCards = (data.data?.cards || []).map((apiCard: any) => {
        return {
          // Map API fields to TCard interface
          card_id: apiCard.id,
          user_id: getAuthenticatedUserId() || 'unknown-user',
          type: apiCard.type,
          source_entity_id: apiCard.source_entity_id || apiCard.id,
          source_entity_type: apiCard.source_entity_type || apiCard.type,
          status: 'active_canvas', // Default status
          is_favorited: false, // Default
          is_synced: true,
          created_at: new Date(apiCard.createdAt),
          updated_at: new Date(apiCard.updatedAt),
          background_image_url: apiCard.background_image_url || null,
          display_order: apiCard.display_order || null,
          is_selected: apiCard.is_selected || false,
          custom_title: apiCard.custom_title || null,
          custom_content: apiCard.custom_content || null,
          // DisplayCard extensions
          title: apiCard.title || 'Untitled',
          subtitle: apiCard.content || `${apiCard.type} entity`,
          content: apiCard.content || '',
          entity_type: apiCard.source_entity_type || apiCard.type,
          entity_id: apiCard.source_entity_id || apiCard.id,
        };
      });

      return {
        success: data.success,
        cards: transformedCards,
        total_count: data.data?.total_count || 0,
        has_more: data.data?.has_more || false,
        error: data.error
      };
    } catch (error) {
      console.error('Error searching cards:', error);
      throw error;
    }
  }

  /**
   * Get a single card by ID
   */
  async getCard(cardId: string): Promise<{ success: boolean; card?: DisplayCard; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cards/${cardId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Transform the API response to match frontend expectations
      const transformedCard = data.data ? {
        card_id: data.data.id,
        user_id: getAuthenticatedUserId() || 'unknown-user',
        type: data.data.type,
        source_entity_id: data.data.source_entity_id || data.data.id,
        source_entity_type: data.data.source_entity_type || data.data.type,
        status: 'active_canvas',
        is_favorited: false,
        is_synced: true,
        created_at: new Date(data.data.createdAt),
        updated_at: new Date(data.data.updatedAt),
        background_image_url: data.data.background_image_url || null,
        display_order: data.data.display_order || null,
        is_selected: data.data.is_selected || false,
        custom_title: data.data.custom_title || null,
        custom_content: data.data.custom_content || null,
        // DisplayCard extensions
        title: data.data.title || 'Untitled',
        subtitle: data.data.content || `${data.data.type} entity`,
        content: data.data.content || '',
        entity_type: data.data.source_entity_type || data.data.type,
        entity_id: data.data.source_entity_id || data.data.id,
      } : null;

      return {
        success: data.success,
        card: transformedCard || undefined,
        error: data.error
      };
    } catch (error) {
      console.error('Error fetching card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch card'
      };
    }
  }

  /**
   * Get cards by type
   */
  async getCardsByType(type: string, limit: number = 50): Promise<GetCardsResponse> {
    try {
      return await this.getCards({ type: type, limit });
    } catch (error) {
      console.error('Error fetching cards by type:', error);
      throw error;
    }
  }

  /**
   * Health check for card functionality
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cards/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error checking card health:', error);
      throw error;
    }
  }

  /**
   * Get all card IDs for a user (for random selection)
   */
  async getAllCardIds(): Promise<GetAllCardIdsResponse> {
    console.log('cardService.getAllCardIds - Starting API call');
    
    try {
      const headers = this.getAuthHeaders();
      console.log('cardService.getAllCardIds - Making request to:', `${API_BASE_URL}/api/v1/cards/ids`);

      const response = await fetch(`${API_BASE_URL}/api/v1/cards/ids`, {
        method: 'GET',
        headers: headers,
      });

      const data = await response.json();
      console.log('cardService.getAllCardIds - Raw API response:', { 
        ok: response.ok, 
        status: response.status, 
        cardIdsCount: data.data?.cardIds?.length || 0,
        hasError: !!data.error
      });

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        cardIds: data.data?.cardIds || [],
      };
    } catch (error) {
      console.error('cardService.getAllCardIds - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get card IDs',
      };
    }
  }

  /**
   * Get cards by specific IDs (for random loading)
   */
  async getCardsByIds(request: GetCardsByIdsRequest): Promise<GetCardsByIdsResponse> {
    console.log('cardService.getCardsByIds - Starting API call with request:', request);
    
    try {
      const headers = this.getAuthHeaders();
      console.log('cardService.getCardsByIds - Making request to:', `${API_BASE_URL}/api/v1/cards/by-ids`);

      const response = await fetch(`${API_BASE_URL}/api/v1/cards/by-ids`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();
      console.log('cardService.getCardsByIds - Raw API response:', { 
        ok: response.ok, 
        status: response.status, 
        cardsCount: data.data?.cards?.length || 0,
        hasError: !!data.error
      });

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Transform API response to match DisplayCard interface
      const transformedCards = (data.data?.cards || []).map((apiCard: any) => {
        return {
          // Map API fields to TCard interface
          card_id: apiCard.id,
          user_id: getAuthenticatedUserId() || 'unknown-user',
          type: apiCard.type,
          source_entity_id: apiCard.source_entity_id || apiCard.id,
          source_entity_type: apiCard.source_entity_type || apiCard.type,
          status: 'active_canvas', // Default status
          is_favorited: false, // Default
          is_synced: true,
          created_at: new Date(apiCard.createdAt),
          updated_at: new Date(apiCard.updatedAt),
          background_image_url: apiCard.background_image_url || null,
          display_order: apiCard.display_order || null,
          is_selected: apiCard.is_selected || false,
          custom_title: apiCard.custom_title || null,
          custom_content: apiCard.custom_content || null,
          // DisplayCard extensions
          title: apiCard.title || 'Untitled',
          subtitle: apiCard.content || `${apiCard.type} entity`,
          content: apiCard.content || '',
          entity_type: apiCard.source_entity_type || apiCard.type,
          entity_id: apiCard.source_entity_id || apiCard.id,
        };
      });

      return {
        success: true,
        cards: transformedCards,
      };
    } catch (error) {
      console.error('cardService.getCardsByIds - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cards by IDs',
      };
    }
  }
}

export const cardService = new CardService(); 