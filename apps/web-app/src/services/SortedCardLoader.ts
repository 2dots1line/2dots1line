/**
 * SortedCardLoader - Implements Option B for infinite scroll with proper sorting
 * 
 * How it works:
 * 1. Load cards in sorted order (newest, oldest, title_asc, title_desc)
 * 2. Use pagination to load cards in batches
 * 3. Trigger loading when user scrolls near bottom
 * 4. Maintains sorting integrity across all loaded cards
 */

import { DisplayCard } from '@2dots1line/shared-types';
import { cardService } from './cardService';

export type SortKey = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

export class SortedCardLoader {
  private allCards: DisplayCard[] = [];
  private currentPage = 0;
  private pageSize = 50;
  private sortKey: SortKey = 'newest';
  private coverFirst: boolean = false;
  private isLoading = false;
  private hasMore = true;
  private totalCount = 0;
  private currentAbortController: AbortController | null = null;

  /**
   * Load initial batch of sorted cards
   */
  async loadInitialCards(sortKey: SortKey = 'newest', coverFirst: boolean = false): Promise<DisplayCard[]> {
    console.log(`[SortedCardLoader] Loading initial cards with sort: ${sortKey}, coverFirst: ${coverFirst}`);
    
    this.sortKey = sortKey;
    this.coverFirst = coverFirst;
    this.currentPage = 0;
    this.allCards = [];
    this.hasMore = true;
    this.isLoading = false;

    return this.loadNextPage();
  }

  /**
   * Load next page of sorted cards
   */
  async loadNextPage(): Promise<DisplayCard[]> {
    if (this.isLoading || !this.hasMore) {
      return [];
    }

    // Cancel any existing request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }

    // Create new abort controller
    this.currentAbortController = new AbortController();

    this.isLoading = true;
    console.log(`[SortedCardLoader] Loading page ${this.currentPage + 1} with sort: ${this.sortKey}`);

    try {
      const response = await cardService.getCards({
        limit: this.pageSize,
        offset: this.currentPage * this.pageSize,
        sortBy: this.getSortByField(),
        sortOrder: this.getSortOrder(),
        coverFirst: this.coverFirst
      }, this.currentAbortController.signal);

      if (response.success && response.cards) {
        const newCards = response.cards;
        this.allCards = [...this.allCards, ...newCards];
        this.currentPage++;
        this.totalCount = response.total_count || this.allCards.length;
        this.hasMore = response.has_more || false;

        console.log(`[SortedCardLoader] Loaded ${newCards.length} cards (total: ${this.allCards.length}/${this.totalCount})`);
        return newCards;
      } else {
        throw new Error(response.error || 'Failed to load cards');
      }
    } catch (error) {
      if (this.currentAbortController?.signal.aborted) {
        console.log('[SortedCardLoader] Request was cancelled');
        throw new Error('Request was cancelled');
      }
      console.error('[SortedCardLoader] Failed to load page:', error);
      throw error;
    } finally {
      this.isLoading = false;
      this.currentAbortController = null;
    }
  }

  /**
   * Get all currently loaded cards
   */
  getAllCards(): DisplayCard[] {
    return this.allCards;
  }

  /**
   * Get the number of loaded cards
   */
  getLoadedCount(): number {
    return this.allCards.length;
  }

  /**
   * Get total number of cards available
   */
  getTotalCount(): number {
    return this.totalCount;
  }

  /**
   * Check if there are more cards to load
   */
  hasMoreCards(): boolean {
    return this.hasMore;
  }

  /**
   * Check if currently loading
   */
  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Get current sort key
   */
  getCurrentSortKey(): SortKey {
    return this.sortKey;
  }

  /**
   * Reset the loader (useful for changing sort or refreshing)
   */
  reset(): void {
    // Cancel any ongoing request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    
    this.allCards = [];
    this.currentPage = 0;
    this.hasMore = true;
    this.isLoading = false;
    this.totalCount = 0;
    console.log('[SortedCardLoader] Reset');
  }

  /**
   * Change sort key and reload
   */
  async changeSort(sortKey: SortKey): Promise<DisplayCard[]> {
    if (this.sortKey === sortKey) {
      return this.allCards;
    }

    console.log(`[SortedCardLoader] Changing sort from ${this.sortKey} to ${sortKey}`);
    this.reset();
    return this.loadInitialCards(sortKey);
  }

  /**
   * Map sort key to database sort field
   */
  private getSortByField(): 'created_at' | 'title' {
    switch (this.sortKey) {
      case 'newest':
      case 'oldest':
        return 'created_at';
      case 'title_asc':
      case 'title_desc':
        return 'title';
      default:
        return 'created_at';
    }
  }

  /**
   * Map sort key to database sort order
   */
  private getSortOrder(): 'asc' | 'desc' {
    switch (this.sortKey) {
      case 'newest':
      case 'title_desc':
        return 'desc';
      case 'oldest':
      case 'title_asc':
        return 'asc';
      default:
        return 'desc';
    }
  }
}
