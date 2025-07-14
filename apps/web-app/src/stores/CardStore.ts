// CardStore.ts - Card state management adapted from prototype DeckStore
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TCard, CardStatus, CardType } from '@2dots1line/shared-types';
import { cardService } from '../services/cardService';

// Image collections adapted from prototype
export interface ImageCollection {
  name: string;
  source: string;
  images: string[];
}

export const imageCollections: ImageCollection[] = [
  {
    name: "Professional & Modern",
    source: "Local Collection",
    images: [
      "/images/cards/library/technology/code-matrix-001.jpg",
      "/images/cards/library/science/laboratory-001.jpg",
      "/images/cards/library/abstract/networks-001.jpg",
    ]
  },
  {
    name: "Dark & Moody",
    source: "Local Collection", 
    images: [
      "/images/cards/library/abstract/particles-002.jpg",
      "/images/cards/library/nature/forest-002.jpg",
      "/images/cards/library/science/space-003.jpg",
    ]
  },
  {
    name: "Nature & Organic",
    source: "Local Collection",
    images: [
      "/images/cards/library/nature/cells-001.jpg",
      "/images/cards/library/nature/ocean-003.jpg",
      "/images/cards/library/human/community-001.jpg",
    ]
  },
  {
    name: "Tech & Digital",
    source: "Local Collection",
    images: [
      "/images/cards/library/technology/ai-neural-002.jpg",
      "/images/cards/library/technology/circuits-003.jpg",
      "/images/cards/library/abstract/fractals-003.jpg",
    ]
  },
  {
    name: "Scientific & Research",
    source: "Local Collection",
    images: [
      "/images/cards/library/science/molecules-002.jpg",
      "/images/cards/library/science/laboratory-001.jpg",
      "/images/cards/library/abstract/particles-002.jpg",
    ]
  },
  {
    name: "Human & Social",
    source: "Local Collection",
    images: [
      "/images/cards/library/human/mind-002.jpg",
      "/images/cards/library/human/culture-003.jpg",
      "/images/cards/library/human/community-001.jpg",
    ]
  },
  {
    name: "Cosmic & Abstract",
    source: "Local Collection",
    images: [
      "/images/cards/library/science/space-003.jpg",
      "/images/cards/library/abstract/networks-001.jpg",
      "/images/cards/library/abstract/fractals-003.jpg",
    ]
  },
  {
    name: "Minimal & Clean",
    source: "Local Collection",
    images: [
      "/images/cards/library/abstract/particles-002.jpg",
      "/images/cards/library/nature/ocean-003.jpg",
      "/images/cards/library/technology/circuits-003.jpg",
    ]
  }
];

// Extended card interface with background image support
export type DisplayCard = TCard & {
  background_image_url?: string;
  title?: string;
  subtitle?: string;
  description?: string;
};

// Helper type to ensure DisplayCard has all TCard properties
export type CardWithDisplay = TCard & {
  background_image_url?: string;
  title?: string;
  subtitle?: string;
  description?: string;
};

// Card view modes
export type CardView = 'gallery' | 'detail';

// Card filter options
export interface CardFilter {
  status?: CardStatus;
  type?: CardType;
  favorited?: boolean;
  search?: string;
}

// Card interaction modes
export type CardInteractionMode = 'select' | 'favorite' | 'archive' | 'change_background';

interface CardState {
  // Card data
  cards: DisplayCard[];
  filteredCards: DisplayCard[];
  
  // UI state
  currentView: CardView;
  selectedCard: DisplayCard | null;
  currentCollectionIndex: number;
  filter: CardFilter;
  isLoading: boolean;
  error: string | null;
  
  // Viewport state for infinite scroll
  viewportOffset: { x: number; y: number };
  visibleCardIds: string[];
  
  // Actions
  setCards: (cards: DisplayCard[]) => void;
  addCard: (card: DisplayCard) => void;
  updateCard: (cardId: string, updates: Partial<DisplayCard>) => void;
  deleteCard: (cardId: string) => void;
  
  // API actions
  loadCards: () => Promise<void>;
  refreshCards: () => Promise<void>;
  
  // View management
  setCurrentView: (view: CardView) => void;
  setSelectedCard: (card: DisplayCard | null) => void;
  
  // Collection management
  setCurrentCollection: (index: number) => void;
  getCurrentCollection: () => ImageCollection;
  
  // Filtering
  setFilter: (filter: Partial<CardFilter>) => void;
  applyFilter: () => void;
  
  // Card interactions
  toggleFavorite: (cardId: string) => void;
  updateCardBackground: (cardId: string, imageUrl: string) => void;
  
  // Viewport management for infinite scroll
  setViewportOffset: (offset: { x: number; y: number }) => void;
  updateVisibleCards: (cardIds: string[]) => void;
  
  // Utility functions
  getRelatedCards: (cardId: string) => DisplayCard[];
  getCardsByType: (type: CardType) => DisplayCard[];
  searchCards: (query: string) => DisplayCard[];
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      // Initial state
      cards: [],
      filteredCards: [],
      currentView: 'gallery',
      selectedCard: null,
      currentCollectionIndex: 0,
      filter: {},
      isLoading: false,
      error: null,
      viewportOffset: { x: 0, y: 0 },
      visibleCardIds: [],
      
      // Card data actions
      setCards: (cards) => {
        set({ cards });
        get().applyFilter();
      },
      
      addCard: (card) => {
        set((state) => ({
          cards: [...state.cards, card]
        }));
        get().applyFilter();
      },
      
      updateCard: (cardId, updates) => {
        set((state) => ({
          cards: state.cards.map(card =>
            card.card_id === cardId ? { ...card, ...updates } : card
          )
        }));
        get().applyFilter();
      },
      
      deleteCard: (cardId) => {
        set((state) => ({
          cards: state.cards.filter(card => card.card_id !== cardId),
          selectedCard: state.selectedCard?.card_id === cardId ? null : state.selectedCard
        }));
        get().applyFilter();
      },
      
             // API actions
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
             console.log('CardStore.loadCards - Setting cards and applying filter');
             set({ cards: response.cards });
             get().applyFilter();
             console.log('CardStore.loadCards - Cards loaded successfully');
           } else {
             console.error('CardStore.loadCards - API returned error:', response.error);
             set({ error: response.error || 'Failed to load cards' });
           }
         } catch (err) {
           console.error('CardStore.loadCards - Exception caught:', err);
           set({ error: err instanceof Error ? err.message : 'Failed to load cards' });
         } finally {
           set({ isLoading: false });
           console.log('CardStore.loadCards - Loading completed');
         }
       },
       refreshCards: async () => {
         set({ isLoading: true, error: null });
         try {
           const response = await cardService.getCards();
           if (response.success && response.cards) {
             set({ cards: response.cards });
             get().applyFilter();
           } else {
             set({ error: response.error || 'Failed to load cards' });
           }
         } catch (err) {
           set({ error: err instanceof Error ? err.message : 'Failed to load cards' });
         } finally {
           set({ isLoading: false });
         }
       },
      
      // View management
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedCard: (card) => set({ selectedCard: card }),
      
      // Collection management
      setCurrentCollection: (index) => set({ currentCollectionIndex: index }),
      getCurrentCollection: () => imageCollections[get().currentCollectionIndex] || imageCollections[0],
      
      // Filtering
      setFilter: (filter) => {
        set((state) => ({
          filter: { ...state.filter, ...filter }
        }));
        get().applyFilter();
      },
      
      applyFilter: () => {
        const { cards, filter } = get();
        console.log('CardStore.applyFilter - Starting with:', {
          cardsCount: cards.length,
          filter: filter,
          sampleCard: cards[0] ? {
            card_id: cards[0].card_id,
            card_type: cards[0].card_type,
            status: cards[0].status,
            is_favorited: cards[0].is_favorited
          } : null
        });
        
        let filtered = [...cards];
        
        // Apply status filter
        if (filter.status) {
          console.log('CardStore.applyFilter - Applying status filter:', filter.status);
          filtered = filtered.filter(card => card.status === filter.status);
          console.log('CardStore.applyFilter - After status filter:', filtered.length);
        }
        
        // Apply type filter
        if (filter.type) {
          console.log('CardStore.applyFilter - Applying type filter:', filter.type);
          filtered = filtered.filter(card => card.card_type === filter.type);
          console.log('CardStore.applyFilter - After type filter:', filtered.length);
        }
        
        // Apply favorited filter
        if (filter.favorited !== undefined) {
          console.log('CardStore.applyFilter - Applying favorited filter:', filter.favorited);
          filtered = filtered.filter(card => card.is_favorited === filter.favorited);
          console.log('CardStore.applyFilter - After favorited filter:', filtered.length);
        }
        
        // Apply search filter
        if (filter.search && filter.search.trim()) {
          console.log('CardStore.applyFilter - Applying search filter:', filter.search);
          const searchTerm = filter.search.toLowerCase();
          filtered = filtered.filter(card => {
            const title = card.title?.toLowerCase() || '';
            const subtitle = card.subtitle?.toLowerCase() || '';
            const description = card.description?.toLowerCase() || '';
            const cardType = card.card_type?.toLowerCase() || '';
            
            return title.includes(searchTerm) ||
                   subtitle.includes(searchTerm) ||
                   description.includes(searchTerm) ||
                   cardType.includes(searchTerm);
          });
          console.log('CardStore.applyFilter - After search filter:', filtered.length);
        }
        
        console.log('CardStore.applyFilter - Final filtered count:', filtered.length);
        set({ filteredCards: filtered });
      },
      
      // Card interactions
      toggleFavorite: (cardId) => {
        get().updateCard(cardId, { 
          is_favorited: !get().cards.find(c => c.card_id === cardId)?.is_favorited 
        });
      },
      
      updateCardBackground: (cardId, imageUrl) => {
        get().updateCard(cardId, { background_image_url: imageUrl });
      },
      
      // Viewport management
      setViewportOffset: (offset) => set({ viewportOffset: offset }),
      updateVisibleCards: (cardIds) => set({ visibleCardIds: cardIds }),
      
      // Utility functions
      getRelatedCards: (cardId) => {
        const { cards } = get();
        const card = cards.find(c => c.card_id === cardId);
        if (!card) return [];
        
        // Find cards of the same type or related source entities
        return cards.filter(c => 
          c.card_id !== cardId && (
            c.card_type === card.card_type ||
            c.source_entity_type === card.source_entity_type
          )
        ).slice(0, 10); // Limit to 10 related cards
      },
      
      getCardsByType: (type) => {
        return get().cards.filter(card => card.card_type === type);
      },
      
      searchCards: (query) => {
        const { cards } = get();
        const searchQuery = query.toLowerCase();
        
        return cards.filter(card =>
          card.title?.toLowerCase().includes(searchQuery) ||
          card.subtitle?.toLowerCase().includes(searchQuery) ||
          card.description?.toLowerCase().includes(searchQuery) ||
          card.card_type.toLowerCase().includes(searchQuery)
        );
      }
    }),
    {
      name: 'card-storage',
      // Only persist user preferences and card data, not UI state
      partialize: (state) => ({
        cards: state.cards,
        currentCollectionIndex: state.currentCollectionIndex,
        filter: state.filter,
        viewportOffset: state.viewportOffset,
      }),
    }
  )
); 