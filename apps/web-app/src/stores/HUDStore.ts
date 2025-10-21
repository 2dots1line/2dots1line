import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewType = 'dashboard' | 'chat' | 'cards' | 'cosmos' | 'settings' | null;

interface HUDState {
  // State
  isExpanded: boolean;
  activeView: ViewType; // Unified state for all views
  showSettings: boolean; // Toggle for inline settings panel (separate from activeView)
  isDragging: boolean;
  position: { x: number; y: number };
  
  // Mobile HUD state
  mobileHudVisible: boolean;
  
  // Navigation state
  isNavigatingFromCosmos: boolean;
  
  // Card detail modal (overlays on cards view)
  cardDetailModalOpen: boolean;
  
  // Chat states for different views
  cardsChatOpen: boolean;
  cosmosChatOpen: boolean;
  cardsChatSize: 'medium' | 'mini';
  cosmosChatSize: 'medium' | 'mini';
  
  // Global settings modal state
  showGlobalSettings: boolean;
  
  // Pexels modal state (for background video selection)
  pexelsModalView: ViewType; // Which view is requesting pexels search
  
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
  
  // Mobile HUD actions
  setMobileHudVisible: (visible: boolean) => void;
  
  // Chat actions
  setCardsChatOpen: (open: boolean) => void;
  setCosmosChatOpen: (open: boolean) => void;
  setCardsChatSize: (size: 'medium' | 'mini') => void;
  setCosmosChatSize: (size: 'medium' | 'mini') => void;
  
  // Settings actions
  setShowSettings: (show: boolean) => void;
  toggleSettings: () => void;
  setShowGlobalSettings: (show: boolean) => void;
  setPexelsModalView: (view: ViewType) => void;
  
  resetToDefaults: () => void;
}

const DEFAULT_POSITION = { x: 20, y: 0 }; // 20px from left, 0px from top (will be adjusted to right side in component)

export const useHUDStore = create<HUDState>()(
  persist(
    (set, get) => ({
      // Initial state - Start expanded for better visibility
      isExpanded: true,
      activeView: null, // Unified view state
      showSettings: false, // Inline settings panel toggle
      isDragging: false,
      position: DEFAULT_POSITION,
      isNavigatingFromCosmos: false,
      cardDetailModalOpen: false,
      
      // Mobile HUD state
      mobileHudVisible: true, // Start visible for testing
      
      // Chat states - mini chat always open by default in cards/cosmos
      cardsChatOpen: true,
      cosmosChatOpen: true,
      cardsChatSize: 'mini',
      cosmosChatSize: 'mini',
      
      // Global settings modal state
      showGlobalSettings: false,
      
      // Pexels modal state
      pexelsModalView: null,

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
        // Close settings panel when switching views
        if (view !== 'settings') {
          set({ showSettings: false });
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

      // Mobile HUD actions
      setMobileHudVisible: (visible: boolean) => {
        set({ mobileHudVisible: visible });
      },

      // Chat actions
      setCardsChatOpen: (open: boolean) => {
        set({ cardsChatOpen: open });
      },

      setCosmosChatOpen: (open: boolean) => {
        set({ cosmosChatOpen: open });
      },

      setCardsChatSize: (size: 'medium' | 'mini') => {
        set({ cardsChatSize: size });
      },

      setCosmosChatSize: (size: 'medium' | 'mini') => {
        set({ cosmosChatSize: size });
      },

      // Settings actions
      setShowSettings: (show: boolean) => {
        set({ showSettings: show });
      },

      toggleSettings: () => {
        const { showSettings } = get();
        set({ showSettings: !showSettings });
      },

      setShowGlobalSettings: (show: boolean) => {
        set({ showGlobalSettings: show });
      },

      setPexelsModalView: (view: ViewType) => {
        set({ pexelsModalView: view });
      },

      resetToDefaults: () => {
        set({
          isExpanded: true,
          activeView: null,
          showSettings: false,
          isDragging: false,
          position: DEFAULT_POSITION,
          isNavigatingFromCosmos: false,
          cardDetailModalOpen: false,
          cardsChatOpen: true,
          cosmosChatOpen: true,
          cardsChatSize: 'mini',
          cosmosChatSize: 'mini',
          showGlobalSettings: false,
        });
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