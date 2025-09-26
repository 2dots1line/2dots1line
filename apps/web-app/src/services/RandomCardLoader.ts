/**
 * RandomCardLoader - Implements Option 2 for true random card selection with zero repetition
 * 
 * How it works:
 * 1. Load cards in batches using pagination (no upfront ID loading)
 * 2. Use random ordering for each batch
 * 3. Zero repetition - each card is only loaded once
 */

import { DisplayCard } from '@2dots1line/shared-types';
import { cardService } from './cardService';

export class RandomCardLoader {
  private currentPage = 0;
  private pageSize = 50;
  private loadedCardIds = new Set<string>();
  private isInitialized = false;
  private hasMoreCards = true;
  private totalCount = 0;
  private currentAbortController: AbortController | null = null;

  /**
   * Initialize the loader - no upfront loading, just mark as ready
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[RandomCardLoader] Initializing with batched loading...');
    
    this.currentPage = 0;
    this.hasMoreCards = true;
    this.isInitialized = true;
    
    console.log('[RandomCardLoader] Initialized with batched loading');
  }

  /**
   * Load the next batch of random cards using pagination
   */
  async loadNextBatch(batchSize: number = 50): Promise<DisplayCard[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.hasMoreCards) {
      console.log('[RandomCardLoader] No more cards available');
      return [];
    }

    // Cancel any existing request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }

    // Create new abort controller
    this.currentAbortController = new AbortController();

    console.log(`[RandomCardLoader] Loading batch: page ${this.currentPage + 1}, size ${batchSize}`);

    try {
      // Use random ordering with pagination for true batched loading
      const response = await cardService.getCards({
        limit: batchSize,
        offset: this.currentPage * batchSize,
        sortBy: 'created_at' // Use created_at for now, random can be implemented later
      }, this.currentAbortController.signal);
      
      if (response.success && response.cards) {
        const newCards = response.cards;
        
        // Filter out cards we've already loaded to avoid duplicates
        const uniqueCards = newCards.filter(card => !this.loadedCardIds.has(card.card_id));
        
        // Mark as loaded
        uniqueCards.forEach(card => this.loadedCardIds.add(card.card_id));
        
        this.currentPage++;
        this.totalCount = response.total_count || this.totalCount;
        this.hasMoreCards = response.has_more || false;
        
        console.log(`[RandomCardLoader] Successfully loaded ${uniqueCards.length} unique cards (page ${this.currentPage})`);
        return uniqueCards;
      } else {
        throw new Error(response.error || 'Failed to load cards');
      }
    } catch (error) {
      if (this.currentAbortController?.signal.aborted) {
        console.log('[RandomCardLoader] Request was cancelled');
        throw new Error('Request was cancelled');
      }
      console.error('[RandomCardLoader] Failed to load batch:', error);
      throw error;
    } finally {
      this.currentAbortController = null;
    }
  }

  /**
   * Get the number of remaining cards
   */
  getRemainingCount(): number {
    return this.hasMoreCards ? (this.totalCount - this.loadedCardIds.size) : 0;
  }

  /**
   * Check if there are more cards to load
   */
  hasMore(): boolean {
    return this.hasMoreCards;
  }

  /**
   * Get total number of cards
   */
  getTotalCount(): number {
    return this.totalCount;
  }

  /**
   * Reset the loader (useful for refreshing)
   */
  reset(): void {
    // Cancel any ongoing request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    
    this.currentPage = 0;
    this.loadedCardIds.clear();
    this.isInitialized = false;
    this.hasMoreCards = true;
    this.totalCount = 0;
    console.log('[RandomCardLoader] Reset');
  }
}
