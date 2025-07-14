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
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCards: () => Promise<void>;
  setSelectedCard: (card: DisplayCard | null) => void;
  refreshCards: () => Promise<void>;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      // Initial state
      cards: [],
      selectedCard: null,
      isLoading: false,
      error: null,
      
      // Simplified card loading - only from API
      loadCards: async () => {
        console.log('CardStore.loadCards - Starting card load');
        set({ isLoading: true, error: null });
        try {
          console.log('CardStore.loadCards - Calling cardService.getCards()');
          const response = await cardService.getCards();
          console.log('CardStore.loadCards - Response received:', {
            success: response.success,
            cardsCount: response.cards?.length || 0,
            totalCount: response.total_count,
            hasError: !!response.error
          });
          
          if (response.success && response.cards) {
            console.log('CardStore.loadCards - Setting cards');
            set({ cards: response.cards, isLoading: false });
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