// CardStore.ts - Simplified card state management for V11.0 real database cards
import { DisplayCard } from '@2dots1line/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { cardService } from '../services/cardService';

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
      }
    }),
    {
      name: 'card-storage',
      partialize: (state) => ({
        cards: state.cards, // Persist loaded cards
      }),
    }
  )
); 