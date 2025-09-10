// CardStore.ts - Simplified card state management for V11.0 real database cards
import { DisplayCard } from '@2dots1line/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { cardService } from '../services/cardService';

// Proactively remove legacy oversized localStorage key on the client to free space
if (typeof window !== 'undefined') {
  try {
    const legacyKey = 'card-storage';
    if (window.localStorage.getItem(legacyKey)) {
      window.localStorage.removeItem(legacyKey);
      console.log('CardStore: removed legacy localStorage key to free space:', legacyKey);
    }
  } catch (e) {
    console.warn('CardStore: failed to cleanup legacy storage key:', e);
  }
}

// Simplified card state focused on real database cards
interface CardState {
  // Core data
  cards: DisplayCard[];
  selectedCard: DisplayCard | null;
  
  // Pagination state
  totalCount: number;
  hasMore: boolean;
  currentOffset: number;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCards: (limit?: number) => Promise<void>;
  loadMoreCards: () => Promise<void>;
  setSelectedCard: (card: DisplayCard | null) => void;
  refreshCards: () => Promise<void>;
  updateCardBackground: (cardId: string, url: string) => void;
  loadAllCards: () => Promise<void>; // NEW
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      // Initial state
      cards: [],
      selectedCard: null,
      totalCount: 0,
      hasMore: false,
      currentOffset: 0,
      isLoading: false,
      error: null,
      
      // Simplified card loading - only from API
      loadCards: async (limit: number = 200) => {
        console.log('CardStore.loadCards - Starting card load with limit:', limit);
        set({ isLoading: true, error: null, currentOffset: 0 });
        try {
          console.log('CardStore.loadCards - Calling cardService.getCards()');
          const response = await cardService.getCards({ limit, offset: 0 });
          console.log('CardStore.loadCards - Response received:', {
            success: response.success,
            cardsCount: response.cards?.length || 0,
            totalCount: response.total_count,
            hasMore: response.has_more,
            hasError: !!response.error
          });
          
          if (response.success && response.cards) {
            console.log('CardStore.loadCards - Setting cards');
            set({ 
              cards: response.cards, 
              totalCount: response.total_count || 0,
              hasMore: response.has_more || false,
              currentOffset: response.cards.length,
              isLoading: false 
            });
            console.log('CardStore.loadCards - Cards loaded successfully');
          } else {
            console.error('CardStore.loadCards - API returned error:', response.error);
            set({ error: response.error || 'Failed to load cards', isLoading: false });
          }
        } catch (error) {
          console.error('CardStore.loadCards - Exception caught:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load cards', 
            isLoading: false 
          });
        }
      },

      // Load more cards for pagination
      loadMoreCards: async () => {
        const state = get();
        if (state.isLoading || !state.hasMore) return;
        
        console.log('CardStore.loadMoreCards - Loading more cards from offset:', state.currentOffset);
        set({ isLoading: true, error: null });
        
        try {
          const response = await cardService.getCards({ 
            limit: 50, // Load smaller batches for pagination
            offset: state.currentOffset 
          });
          
          if (response.success && response.cards) {
            const newCards = [...state.cards, ...response.cards];
            set({ 
              cards: newCards,
              currentOffset: newCards.length,
              hasMore: response.has_more || false,
              isLoading: false 
            });
            console.log('CardStore.loadMoreCards - Loaded', response.cards.length, 'more cards');
          } else {
            set({ error: response.error || 'Failed to load more cards', isLoading: false });
          }
        } catch (error) {
          console.error('CardStore.loadMoreCards - Exception caught:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load more cards', 
            isLoading: false 
          });
        }
      },
      
      setSelectedCard: (card) => set({ selectedCard: card }),
      
      refreshCards: async () => {
        await get().loadCards();
      },

      updateCardBackground: (cardId: string, url: string) => {
        set((state) => {
          const updated = state.cards.map((c) =>
            c.card_id === cardId ? { ...c, background_image_url: url } : c
          );
          const selected =
            state.selectedCard?.card_id === cardId
              ? { ...state.selectedCard, background_image_url: url }
              : state.selectedCard || null;
          return { cards: updated, selectedCard: selected };
        });
      },
      // NEW: Load ALL cards from the database by paging through until completion
      loadAllCards: async () => {
        console.log('CardStore.loadAllCards - Fetching entire card set via pagination');
        set({ isLoading: true, error: null, currentOffset: 0, hasMore: false });
        const pageSize = 200; // conservative page size; adjust if needed
        let offset = 0;
        let all: DisplayCard[] = [];
        try {
          // Safety cap to avoid infinite loop in case of API bug
          const maxPages = 200;
          for (let page = 0; page < maxPages; page++) {
            const response = await cardService.getCards({ limit: pageSize, offset });
            if (!response.success) {
              throw new Error(response.error || 'Failed to fetch cards');
            }
            const batch = response.cards || [];
            all = all.concat(batch);
            offset += batch.length;
            const hasMore = !!response.has_more && batch.length > 0;
            console.log(`CardStore.loadAllCards - Page ${page + 1}, fetched ${batch.length}, total ${all.length}, hasMore=${hasMore}`);
            if (!hasMore) break;
          }
          set({
            cards: all,
            totalCount: all.length,
            hasMore: false,
            currentOffset: all.length,
            isLoading: false,
          });
          console.log('CardStore.loadAllCards - Completed. Total cards:', all.length);
        } catch (error) {
          console.error('CardStore.loadAllCards - Exception:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load all cards',
            isLoading: false,
          });
        }
      },
    }),
    {
      // Use a new key and persist nothing heavy to avoid quota issues
      name: 'card-storage-v2',
      partialize: () => ({}),
    }
  )
);