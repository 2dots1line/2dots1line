import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewType = 'dashboard' | 'chat' | 'cards' | 'cosmos' | 'settings' | null;

interface HUDState {
  // State
  isExpanded: boolean;
  activeView: ViewType; // Unified state for all views
  isDragging: boolean;
  position: { x: number; y: number };
  
  // Navigation state
  isNavigatingFromCosmos: boolean;
  
  // Card detail modal (overlays on cards view)
  cardDetailModalOpen: boolean;
  
  // Actions
  toggleHUD: () => void;
  expandHUD: () => void;
  minimizeHUD: () => void;
  setActiveView: (view: ViewType) => void;
  setIsDragging: (dragging: boolean) => void;
  updatePosition: (position: { x: number; y: number }) => void;
  resetPosition: () => void;
  setCardDetailModalOpen: (open: boolean) => void;
  setIsNavigatingFromCosmos: (navigating: boolean) => void;
}

const DEFAULT_POSITION = { x: 20, y: 120 }; // 20px from right, 120px from top

export const useHUDStore = create<HUDState>()(
  persist(
    (set, get) => ({
      // Initial state - Start expanded for better visibility
      isExpanded: true,
      activeView: null, // Unified view state
      isDragging: false,
      position: DEFAULT_POSITION,
      isNavigatingFromCosmos: false,
      cardDetailModalOpen: false,

      // Actions
      toggleHUD: () => {
        const { isExpanded } = get();
        set({ isExpanded: !isExpanded });
      },

      expandHUD: () => {
        set({ isExpanded: true });
      },

      minimizeHUD: () => {
        set({ isExpanded: false });
      },

      setActiveView: (view: ViewType) => {
        set({ activeView: view });
        // Auto-expand HUD when a view is selected
        if (view) {
          set({ isExpanded: true });
        }
      },

      setIsDragging: (dragging: boolean) => {
        set({ isDragging: dragging });
      },

      updatePosition: (position: { x: number; y: number }) => {
        set({ position });
      },

      resetPosition: () => {
        set({ position: DEFAULT_POSITION });
      },

      setCardDetailModalOpen: (open: boolean) => {
        set({ cardDetailModalOpen: open });
      },

      setIsNavigatingFromCosmos: (navigating: boolean) => {
        set({ isNavigatingFromCosmos: navigating });
      },
    }),
    {
      name: 'hud-storage',
      // Only persist user preferences, not transient state
      partialize: (state) => ({
        isExpanded: state.isExpanded,
        position: state.position,
      }),
    }
  )
); 