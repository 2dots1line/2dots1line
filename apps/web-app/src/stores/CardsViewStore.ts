import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'infinite' | 'sorted';
export type SortKey = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

interface CardsViewState {
  // State
  viewMode: ViewMode;
  sortKey: SortKey;
  hasCoverFirst: boolean;
  searchQuery: string;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSortKey: (key: SortKey) => void;
  setHasCoverFirst: (value: boolean) => void;
  setSearchQuery: (query: string) => void;
  resetToDefaults: () => void;
}

const DEFAULT_STATE = {
  viewMode: 'sorted' as ViewMode,
  sortKey: 'newest' as SortKey,
  hasCoverFirst: false,
  searchQuery: '',
};

export const useCardsViewStore = create<CardsViewState>()(
  persist(
    (set) => ({
      // Initial state
      ...DEFAULT_STATE,
      
      // Actions
      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
      },
      
      setSortKey: (key: SortKey) => {
        set({ sortKey: key });
      },
      
      setHasCoverFirst: (value: boolean) => {
        set({ hasCoverFirst: value });
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      resetToDefaults: () => {
        set(DEFAULT_STATE);
      },
    }),
    {
      name: 'cards-view-storage',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortKey: state.sortKey,
        hasCoverFirst: state.hasCoverFirst,
      }),
    }
  )
);

