// CardStore.ts - Optimized card state management with batched loading
import { DisplayCard } from '@2dots1line/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { cardService } from '../services/cardService';
import { RandomCardLoader } from '../services/RandomCardLoader';
import { SortedCardLoader } from '../services/SortedCardLoader';

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

// Optimized card state with batched loading and request cancellation
interface CardState {
  // Core data
  cards: DisplayCard[];
  selectedCard: DisplayCard | null;
  
  // Loader instances
  randomLoader: RandomCardLoader | null;
  sortedLoader: SortedCardLoader | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Request cancellation
  currentAbortController: AbortController | null;
  
  // Actions
  initializeRandomLoader: () => Promise<void>;
  initializeSortedLoader: (sortKey?: 'newest' | 'oldest' | 'title_asc' | 'title_desc', coverFirst?: boolean, force?: boolean) => Promise<void>;
  loadMoreRandomCards: () => Promise<DisplayCard[]>;
  loadMoreSortedCards: () => Promise<DisplayCard[]>;
  setSelectedCard: (card: DisplayCard | null) => void;
  updateCardBackground: (cardId: string, url: string) => void;
  clearCards: () => void;
  cancelCurrentRequest: () => void;
  refreshCards: () => Promise<void>;
  getSortedLoader: () => SortedCardLoader | null;
  getRandomLoader: () => RandomCardLoader | null;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      // Initial state
      cards: [],
      selectedCard: null,
      randomLoader: null,
      sortedLoader: null,
      isLoading: false,
      error: null,
      currentAbortController: null,
      
      // Initialize random loader for infinite canvas
      initializeRandomLoader: async () => {
        console.log('CardStore.initializeRandomLoader - Starting initialization');
        
        // Check if we already have cards loaded and a loader exists - if so, don't reinitialize
        const state = get();
        if (state.cards.length > 0 && state.randomLoader) {
          console.log('CardStore.initializeRandomLoader - Cards already loaded, skipping initialization');
          return;
        }
        
        // If we have no cards but a loader exists, clear it to allow reinitialization
        if (state.cards.length === 0 && state.randomLoader) {
          console.log('CardStore.initializeRandomLoader - No cards but loader exists, clearing loader to allow reinitialization');
          set({ randomLoader: null });
        }
        
        // Cancel any existing request
        if (state.currentAbortController) {
          state.currentAbortController.abort();
        }
        
        // Create new abort controller
        const abortController = new AbortController();
        set({ isLoading: true, error: null, currentAbortController: abortController });
        
        try {
          const loader = new RandomCardLoader();
          await loader.initialize();
          
          // Check if request was cancelled
          if (abortController.signal.aborted) {
            console.log('CardStore.initializeRandomLoader - Request cancelled');
            return;
          }
          
          // Load initial batch
          const initialCards = await loader.loadNextBatch(50);
          
          // Check again if request was cancelled
          if (abortController.signal.aborted) {
            console.log('CardStore.initializeRandomLoader - Request cancelled after loading');
            return;
          }
          
          set({
            randomLoader: loader,
            cards: initialCards,
            isLoading: false,
            currentAbortController: null,
          });
          
          console.log('CardStore.initializeRandomLoader - Initialized with', initialCards.length, 'cards');
        } catch (error) {
          if (abortController.signal.aborted) {
            console.log('CardStore.initializeRandomLoader - Request was cancelled');
            return;
          }
          
          console.error('CardStore.initializeRandomLoader - Error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to initialize random loader',
            isLoading: false,
            currentAbortController: null,
          });
        }
      },

      // Initialize sorted loader for sorted view
      initializeSortedLoader: async (sortKey: 'newest' | 'oldest' | 'title_asc' | 'title_desc' = 'newest', coverFirst: boolean = false, force: boolean = false) => {
        const state = get();
        console.log('[CardStore] initializeSortedLoader CALLED:', {
          sortKey,
          coverFirst,
          force,
          currentCards: state.cards.length,
          hasLoader: !!state.sortedLoader,
          loaderPage: state.sortedLoader?.['currentPage'] || 'N/A'
        });
        
        // If force is true, clear everything and proceed
        if (force) {
          console.log('[CardStore] FORCE REINIT - Destroying old loader');
          if (state.sortedLoader) {
            state.sortedLoader.reset();
          }
          set({ cards: [], sortedLoader: null });
        } else {
          // Check if we already have cards loaded and a loader exists - if so, don't reinitialize
          if (state.cards.length > 0 && state.sortedLoader) {
            console.log('[CardStore] SKIP INIT - Already have cards and loader');
            return;
          }
          
          // If we have no cards but a loader exists, clear it to allow reinitialization
          if (state.cards.length === 0 && state.sortedLoader) {
            console.log('[CardStore] CLEAR ORPHANED LOADER - No cards but loader exists');
            set({ sortedLoader: null });
          }
        }
        
        // Cancel any existing request
        if (state.currentAbortController) {
          state.currentAbortController.abort();
        }
        
        // Create new abort controller
        const abortController = new AbortController();
        set({ isLoading: true, error: null, currentAbortController: abortController });
        
        try {
          const loader = new SortedCardLoader();
          const initialCards = await loader.loadInitialCards(sortKey, coverFirst);
          
          // Check if request was cancelled
          if (abortController.signal.aborted) {
            console.log('[CardStore] Request cancelled during init');
            return;
          }
          
          set({
            sortedLoader: loader,
            cards: initialCards,
            isLoading: false,
            currentAbortController: null,
          });
          
          console.log('[CardStore] ✅ INIT COMPLETE:', {
            cardsLoaded: initialCards.length,
            hasMore: loader.hasMoreCards(),
            currentPage: loader['currentPage']
          });
        } catch (error) {
          if (abortController.signal.aborted) {
            console.log('CardStore.initializeSortedLoader - Request was cancelled');
            return;
          }
          
          console.error('CardStore.initializeSortedLoader - Error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to initialize sorted loader',
            isLoading: false,
            currentAbortController: null,
          });
        }
      },

      // Load more random cards
      loadMoreRandomCards: async () => {
        const state = get();
        if (!state.randomLoader || state.isLoading) return [];
        
        set({ isLoading: true, error: null });
        
        try {
          const newCards = await state.randomLoader.loadNextBatch(50);
          const updatedCards = [...state.cards, ...newCards];
          
          set({
            cards: updatedCards,
            isLoading: false,
          });
          
          console.log('CardStore.loadMoreRandomCards - Loaded', newCards.length, 'more cards');
          return newCards;
        } catch (error) {
          console.error('CardStore.loadMoreRandomCards - Error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load more random cards',
            isLoading: false,
          });
          return [];
        }
      },

      // Load more sorted cards
      loadMoreSortedCards: async () => {
        const state = get();
        if (!state.sortedLoader || state.isLoading) {
          console.log('[CardStore] ⚠️ SKIP loadMore:', !state.sortedLoader ? 'NO LOADER' : 'ALREADY LOADING');
          return [];
        }
        
        const beforeCount = state.cards.length;
        const currentPage = state.sortedLoader['currentPage'];
        console.log(`[CardStore] 📥 LOAD MORE TRIGGERED:`, {
          currentCards: beforeCount,
          currentPage,
          hasMore: state.sortedLoader.hasMoreCards()
        });
        
        set({ isLoading: true, error: null });
        
        try {
          const newCards = await state.sortedLoader.loadNextPage();
          const updatedCards = [...state.cards, ...newCards];
          
          set({
            cards: updatedCards,
            isLoading: false,
          });
          
          console.log(`[CardStore] ✅ LOAD MORE SUCCESS:`, {
            newCards: newCards.length,
            before: beforeCount,
            after: updatedCards.length,
            nextPage: state.sortedLoader['currentPage'],
            hasMore: state.sortedLoader.hasMoreCards()
          });
          return newCards;
        } catch (error) {
          console.error('CardStore.loadMoreSortedCards - Error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load more sorted cards',
            isLoading: false,
          });
          return [];
        }
      },

      // Set selected card
      setSelectedCard: (card: DisplayCard | null) => {
        console.log('CardStore.setSelectedCard - Setting selected card:', card?.card_id || 'null');
        set({ selectedCard: card });
      },

      // Update card background
      updateCardBackground: async (cardId: string, url: string) => {
        console.log('CardStore.updateCardBackground - Updating background for card:', cardId);
        try {
          const response = await cardService.updateCardBackground({ card_id: cardId, background_image_url: url });
          if (response.success) {
            // Update the card in the store
            const state = get();
            const updatedCards = state.cards.map(card => 
              card.card_id === cardId 
                ? { ...card, background_image_url: url }
                : card
            );
            set({ cards: updatedCards });
            console.log('CardStore.updateCardBackground - Background updated successfully');
          } else {
            console.error('CardStore.updateCardBackground - Failed to update background:', response.error);
          }
        } catch (error) {
          console.error('CardStore.updateCardBackground - Exception:', error);
        }
      },

      // Clear all cards
      clearCards: () => {
        console.log('CardStore.clearCards - Clearing all cards');
        
        // Cancel any ongoing request
        const state = get();
        if (state.currentAbortController) {
          state.currentAbortController.abort();
        }
        
        set({
          cards: [],
          selectedCard: null,
          randomLoader: null,
          sortedLoader: null,
          error: null,
          currentAbortController: null,
        });
      },

      // Cancel current request
      cancelCurrentRequest: () => {
        const state = get();
        if (state.currentAbortController) {
          console.log('CardStore.cancelCurrentRequest - Cancelling current request');
          state.currentAbortController.abort();
          set({ currentAbortController: null, isLoading: false });
        }
      },

      // Refresh cards (clear and reload)
      refreshCards: async () => {
        console.log('CardStore.refreshCards - Refreshing all cards');
        const state = get();
        
        // Cancel any existing request
        if (state.currentAbortController) {
          state.currentAbortController.abort();
        }
        
        // Clear current state
        set({
          cards: [],
          selectedCard: null,
          randomLoader: null,
          sortedLoader: null,
          error: null,
          currentAbortController: null,
        });
        
        // Reload cards
        await get().initializeSortedLoader('newest');
      },

      // Get sorted loader (for reactive access)
      getSortedLoader: () => get().sortedLoader,
      
      // Get random loader (for reactive access)
      getRandomLoader: () => get().randomLoader,
    }),
    {
      // Use a new key and persist nothing heavy to avoid quota issues
      name: 'card-storage-v3',
      partialize: () => ({}),
    }
  )
);