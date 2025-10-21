/**
 * Node Card Mapping Service
 * Maps graph projection nodes to card data for enhanced modal display
 */

import { DisplayCard } from '@2dots1line/shared-types';
import { cardService } from './cardService';

export interface NodeCardMapping {
  nodeId: string;
  cardId: string;
  cardType: string;
  confidence: number;
}

export interface NodeCardData {
  card: DisplayCard | null;
  relatedCards: DisplayCard[];
  connections: any[];
}

class NodeCardMappingService {
  private mappingCache = new Map<string, NodeCardMapping>();

  /**
   * Map a graph node to its corresponding card data
   */
  async mapNodeToCard(node: any): Promise<string | null> {
    if (!node || !node.id) return null;

    // Check cache first
    if (this.mappingCache.has(node.id)) {
      const mapping = this.mappingCache.get(node.id)!;
      return mapping.cardId;
    }

    try {
      // Strategy 1: Direct ID mapping (if node ID matches card ID)
      const directCard = await this.findCardById(node.id);
      if (directCard) {
        this.mappingCache.set(node.id, {
          nodeId: node.id,
          cardId: directCard.card_id,
          cardType: directCard.entity_type,
          confidence: 1.0
        });
        return directCard.card_id;
      }

      // Strategy 2: Title-based mapping
      if (node.title) {
        const titleCard = await this.findCardByTitle(node.title);
        if (titleCard) {
          this.mappingCache.set(node.id, {
            nodeId: node.id,
            cardId: titleCard.card_id,
            cardType: titleCard.entity_type,
            confidence: 0.8
          });
          return titleCard.card_id;
        }
      }

      // Strategy 3: Content-based mapping
      if (node.content) {
        const contentCard = await this.findCardByContent(node.content);
        if (contentCard) {
          this.mappingCache.set(node.id, {
            nodeId: node.id,
            cardId: contentCard.card_id,
            cardType: contentCard.entity_type,
            confidence: 0.6
          });
          return contentCard.card_id;
        }
      }

      return null;
    } catch (error) {
      console.error('Error mapping node to card:', error);
      return null;
    }
  }

  /**
   * Get comprehensive card data for a node
   */
  async getNodeCardData(node: any): Promise<NodeCardData> {
    const cardId = await this.mapNodeToCard(node);
    
    let card: DisplayCard | null = null;
    let relatedCards: DisplayCard[] = [];
    let connections: any[] = [];

    if (cardId) {
      try {
        // Get the main card
        const cardResponse = await cardService.getCard(cardId);
        card = cardResponse.card || null;

        // Get related cards
        const relatedResponse = await cardService.getRelatedCards(cardId, 5);
        relatedCards = relatedResponse.cards || [];

        // Get connections (from graph data)
        connections = this.extractConnections(node);
      } catch (error) {
        console.error('Error fetching card data:', error);
      }
    }

    return {
      card,
      relatedCards,
      connections
    };
  }

  /**
   * Find card by exact ID match
   */
  private async findCardById(cardId: string): Promise<DisplayCard | null> {
    try {
      const response = await cardService.getCard(cardId);
      return response.card || null;
    } catch {
      return null;
    }
  }

  /**
   * Find card by title similarity
   */
  private async findCardByTitle(title: string): Promise<DisplayCard | null> {
    try {
      const response = await cardService.searchCards(title, 10);
      const cards = response.cards || [];
      
      // Find exact title match
      const exactMatch = cards.find(card => 
        card.title?.toLowerCase() === title.toLowerCase()
      );
      
      if (exactMatch) return exactMatch;

      // Find partial title match
      const partialMatch = cards.find(card => 
        card.title?.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(card.title?.toLowerCase() || '')
      );
      
      return partialMatch || null;
    } catch {
      return null;
    }
  }

  /**
   * Find card by content similarity
   */
  private async findCardByContent(content: string): Promise<DisplayCard | null> {
    try {
      // Extract key words from content
      const words = content.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      const searchQuery = words.slice(0, 3).join(' '); // Use first 3 words
      
      const response = await cardService.searchCards(searchQuery, 10);
      const cards = response.cards || [];
      
      // Find card with similar content
      const contentMatch = cards.find(card => 
        card.content?.toLowerCase().includes(content.toLowerCase()) ||
        card.title?.toLowerCase().includes(content.toLowerCase())
      );
      
      return contentMatch || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract connections from node data
   */
  private extractConnections(node: any): any[] {
    const connections: any[] = [];
    
    // Extract from node connections if available
    if (node.connections) {
      connections.push(...node.connections);
    }
    
    // Extract from node metadata if available
    if (node.metadata?.connections) {
      connections.push(...node.metadata.connections);
    }
    
    return connections;
  }

  /**
   * Clear mapping cache
   */
  clearCache(): void {
    this.mappingCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.mappingCache.size,
      entries: Array.from(this.mappingCache.keys())
    };
  }
}

export const nodeCardMappingService = new NodeCardMappingService(); 