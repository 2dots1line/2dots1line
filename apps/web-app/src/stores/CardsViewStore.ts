import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'infinite' | 'sorted';
export type SortKey = 'newest' | 'oldest' | 'title_asc' | 'title_desc';
export type CoverStyle = 'minimal' | 'abstract' | 'nature' | 'cosmic' | 'photorealistic';

interface CardsViewState {
  // State
  viewMode: ViewMode;
  sortKey: SortKey;
  hasCoverFirst: boolean;
  searchQuery: string;
  defaultCoverStyle: CoverStyle;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSortKey: (key: SortKey) => void;
  setHasCoverFirst: (value: boolean) => void;
  setSearchQuery: (query: string) => void;
  setDefaultCoverStyle: (style: CoverStyle) => void;
  resetToDefaults: () => void;
}

const DEFAULT_STATE = {
  viewMode: 'sorted' as ViewMode,
  sortKey: 'newest' as SortKey,
  hasCoverFirst: false,
  searchQuery: '',
  defaultCoverStyle: 'minimal' as CoverStyle,
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
      
      setDefaultCoverStyle: (style: CoverStyle) => {
        set({ defaultCoverStyle: style });
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
        defaultCoverStyle: state.defaultCoverStyle,
      }),
    }
  )
);

