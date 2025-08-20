/**
 * Card Service - Frontend API client for Card management
 * V11.0 - Card system integration with API Gateway
 */

import { CardStatus, CardType, DisplayCard } from '@2dots1line/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface GetCardsRequest {
  user_id?: string;
  card_type?: CardType;
  status?: CardStatus;
  limit?: number;
  offset?: number;
  favorited?: boolean;
}

export interface GetCardsResponse {
  success: boolean;
  cards?: DisplayCard[];
  total_count?: number;
  has_more?: boolean;
  error?: string;
  details?: string;
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
  card_type: CardType;
  source_entity_id: string;
  source_entity_type: string;
  display_data?: Record<string, any>;
  background_image_url?: string;
  title?: string;
  subtitle?: string;
  description?: string;
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
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Get cards for the authenticated user
   */
  async getCards(request: GetCardsRequest = {}): Promise<GetCardsResponse> {
    console.log('cardService.getCards - Starting API call with request:', request);
    
    try {
      const params = new URLSearchParams();
      
      if (request.card_type) params.append('card_type', request.card_type);
      if (request.status) params.append('status', request.status);
      if (request.limit) params.append('limit', request.limit.toString());
      if (request.offset) params.append('offset', request.offset.toString());
      if (request.favorited !== undefined) params.append('favorited', request.favorited.toString());

      const headers = this.getAuthHeaders();
      console.log('cardService.getCards - Making request to:', `${API_BASE_URL}/api/v1/cards?${params}`);
      console.log('cardService.getCards - Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'none' });

      const response = await fetch(`${API_BASE_URL}/api/v1/cards?${params}`, {
        method: 'GET',
        headers: headers,
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
        // Ensure every card type has meaningful title and subtitle
        let title = apiCard.title;
        let subtitle = apiCard.preview;
        
        // Fallback logic for different card types when title/subtitle are empty
        if (!title) {
          switch (apiCard.type) {
            case 'concept':
              title = apiCard.display_data?.name || 
                     apiCard.display_data?.description || 
                     apiCard.display_data?.concept_id || 
                     `Concept: ${apiCard.id}`;
              break;
            case 'proactiveprompt':
              title = apiCard.display_data?.prompt_text || 
                     apiCard.display_data?.prompt_id || 
                     `Proactive Prompt: ${apiCard.id}`;
              break;
            case 'derivedartifact':
              title = apiCard.display_data?.title || 
                     apiCard.display_data?.artifact_type || 
                     apiCard.display_data?.artifact_id || 
                     `Derived Artifact: ${apiCard.id}`;
              break;
            case 'community':
              title = apiCard.display_data?.name || 
                     apiCard.display_data?.community_id || 
                     `Community: ${apiCard.id}`;
              break;
            case 'memoryunit':
              title = apiCard.display_data?.title || 
                     apiCard.display_data?.memory_id || 
                     `Memory Unit: ${apiCard.id}`;
              break;
            default:
              title = `${apiCard.type.charAt(0).toUpperCase() + apiCard.type.slice(1)}: ${apiCard.id}`;
          }
        }
        
        if (!subtitle) {
          switch (apiCard.type) {
            case 'concept':
              subtitle = apiCard.display_data?.description || 
                        apiCard.display_data?.concept_id || 
                        'Concept entity';
              break;
            case 'proactiveprompt':
              subtitle = apiCard.display_data?.prompt_text || 
                        apiCard.display_data?.prompt_id || 
                        'Proactive prompt';
              break;
            case 'derivedartifact':
              subtitle = apiCard.display_data?.artifact_type || 
                        apiCard.display_data?.artifact_id || 
                        'Derived artifact';
              break;
            case 'community':
              subtitle = apiCard.display_data?.description || 
                        apiCard.display_data?.community_id || 
                        'Community entity';
              break;
            case 'memoryunit':
              subtitle = apiCard.display_data?.preview || 
                        apiCard.display_data?.memory_id || 
                        'Memory unit';
              break;
            default:
              subtitle = `${apiCard.type} entity`;
          }
        }

        return {
          // Map API fields to TCard interface
          card_id: apiCard.id,
          user_id: 'dev-user-123', // Default for development
          card_type: apiCard.type,
          source_entity_id: apiCard.source_entity_id || apiCard.id, // Use actual source entity id from API
          source_entity_type: apiCard.source_entity_type || apiCard.type, // Use actual source entity type from API
          status: 'active_canvas', // Default status
          is_favorited: false, // Default
          display_data: {
            title: apiCard.title,
            preview: apiCard.preview,
            evolutionState: apiCard.evolutionState,
            growthDimensions: apiCard.growthDimensions,
            importanceScore: apiCard.importanceScore,
            connections: apiCard.connections,
            insights: apiCard.insights,
            tags: apiCard.tags
          },
          is_synced: true,
          created_at: new Date(apiCard.createdAt),
          updated_at: new Date(apiCard.updatedAt),
          // DisplayCard extensions with fallback titles/subtitles
          title,
          subtitle,
          description: `${apiCard.type} - ${apiCard.evolutionState || 'Active'}`,
          background_image_url: apiCard.background_image_url || null // Pass through from API
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

      return data;
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
      const transformedCard = data.data ? (() => {
        // Ensure every card type has meaningful title and subtitle
        let title = data.data.title;
        let subtitle = data.data.preview;
        
        // Fallback logic for different card types when title/subtitle are empty
        if (!title) {
          switch (data.data.type) {
            case 'concept':
              title = data.data.display_data?.name || 
                     data.data.display_data?.description || 
                     data.data.display_data?.concept_id || 
                     `Concept: ${data.data.id}`;
              break;
            case 'proactiveprompt':
              title = data.data.display_data?.prompt_text || 
                     data.data.display_data?.prompt_id || 
                     `Proactive Prompt: ${data.data.id}`;
              break;
            case 'derivedartifact':
              title = data.data.display_data?.title || 
                     data.data.display_data?.artifact_type || 
                     data.data.display_data?.artifact_id || 
                     `Derived Artifact: ${data.data.id}`;
              break;
            case 'community':
              title = data.data.display_data?.name || 
                     data.data.display_data?.community_id || 
                     `Community: ${data.data.id}`;
              break;
            case 'memoryunit':
              title = data.data.display_data?.title || 
                     data.data.display_data?.memory_id || 
                     `Memory Unit: ${data.data.id}`;
              break;
            default:
              title = `${data.data.type.charAt(0).toUpperCase() + data.data.type.slice(1)}: ${data.data.id}`;
          }
        }
        
        if (!subtitle) {
          switch (data.data.type) {
            case 'concept':
              subtitle = data.data.display_data?.description || 
                        data.data.display_data?.concept_id || 
                        'Concept entity';
              break;
            case 'proactiveprompt':
              subtitle = data.data.display_data?.prompt_text || 
                        data.data.display_data?.prompt_id || 
                        'Proactive prompt';
              break;
            case 'derivedartifact':
              subtitle = data.data.display_data?.artifact_type || 
                        data.data.display_data?.artifact_id || 
                        'Derived artifact';
              break;
            case 'community':
              subtitle = data.data.display_data?.description || 
                        data.data.display_data?.community_id || 
                        'Community entity';
              break;
            case 'memoryunit':
              subtitle = data.data.display_data?.preview || 
                        data.data.display_data?.memory_id || 
                        'Memory unit';
              break;
            default:
              subtitle = `${data.data.type} entity`;
          }
        }

        return {
          card_id: data.data.id,
          user_id: 'dev-user-123',
          card_type: data.data.type,
          source_entity_id: data.data.source_entity_id || data.data.id,
          source_entity_type: data.data.source_entity_type || data.data.type,
          status: 'active_canvas',
          is_favorited: false,
          display_data: {
            title: data.data.title,
            preview: data.data.preview,
            evolutionState: data.data.evolutionState,
            growthDimensions: data.data.growthDimensions,
            importanceScore: data.data.importanceScore,
            connections: data.data.connections,
            insights: data.data.insights,
            tags: data.data.tags
          },
          is_synced: true,
          created_at: new Date(data.data.createdAt),
          updated_at: new Date(data.data.updatedAt),
          title,
          subtitle,
          description: `${data.data.type} - ${data.data.evolutionState || 'Active'}`,
          background_image_url: data.data.background_image_url || null
        };
      })() : null;

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
  async getCardsByType(cardType: CardType, limit: number = 50): Promise<GetCardsResponse> {
    try {
      return await this.getCards({ card_type: cardType, limit });
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
}

export const cardService = new CardService(); 