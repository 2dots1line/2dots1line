import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModalType = 'dashboard' | 'chat' | 'card' | 'cosmos' | 'settings' | 'cardMatrix' | null;

interface HUDState {
  // State
  isExpanded: boolean;
  activeModal: ModalType;
  isDragging: boolean;
  position: { x: number; y: number };
  
  // Actions
  toggleHUD: () => void;
  expandHUD: () => void;
  minimizeHUD: () => void;
  setActiveModal: (modal: ModalType) => void;
  setIsDragging: (dragging: boolean) => void;
  updatePosition: (position: { x: number; y: number }) => void;
  resetPosition: () => void;
}

const DEFAULT_POSITION = { x: 20, y: 120 }; // 20px from right, 120px from top

export const useHUDStore = create<HUDState>()(
  persist(
    (set, get) => ({
      // Initial state - Start expanded for better visibility
      isExpanded: true,
      activeModal: null,
      isDragging: false,
      position: DEFAULT_POSITION,

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

      setActiveModal: (modal: ModalType) => {
        set({ activeModal: modal });
        // Auto-expand HUD when a modal is selected
        if (modal) {
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