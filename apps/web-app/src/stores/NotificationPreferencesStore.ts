import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'new_card_available' | 'graph_projection_updated' | 'new_star_generated';

export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface NotificationPreferences {
  enabled: boolean;
  allowTypes: Record<NotificationType, boolean>;
  position: NotificationPosition;
  maxToasts: number; // visible at once
  autoHide: number; // ms; 0 = never
  snoozeUntil: number | null; // epoch ms
}

interface NotificationPreferencesState {
  preferences: NotificationPreferences;
  setEnabled: (enabled: boolean) => void;
  setTypeEnabled: (type: NotificationType, enabled: boolean) => void;
  setPosition: (position: NotificationPosition) => void;
  setMaxToasts: (n: number) => void;
  setAutoHide: (ms: number) => void;
  snoozeFor: (minutes: number) => void;
  clearSnooze: () => void;
  update: (partial: Partial<NotificationPreferences>) => void;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  allowTypes: {
    new_card_available: true,
    graph_projection_updated: true,
    new_star_generated: true,
  },
  position: 'top-right',
  maxToasts: 5,
  autoHide: 0,
  snoozeUntil: null,
};

export const useNotificationPreferencesStore = create<NotificationPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: { ...DEFAULT_PREFERENCES },

      setEnabled: (enabled) =>
        set((state) => ({ preferences: { ...state.preferences, enabled } })),

      setTypeEnabled: (type, enabled) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            allowTypes: { ...state.preferences.allowTypes, [type]: enabled },
          },
        })),

      setPosition: (position) =>
        set((state) => ({ preferences: { ...state.preferences, position } })),

      setMaxToasts: (n) =>
        set((state) => ({
          preferences: { ...state.preferences, maxToasts: Math.max(1, Math.min(10, Math.floor(n))) },
        })),

      setAutoHide: (ms) =>
        set((state) => ({ preferences: { ...state.preferences, autoHide: Math.max(0, ms) } })),

      snoozeFor: (minutes) =>
        set((state) => ({
          preferences: { ...state.preferences, snoozeUntil: Date.now() + minutes * 60_000 },
        })),

      clearSnooze: () =>
        set((state) => ({ preferences: { ...state.preferences, snoozeUntil: null } })),

      update: (partial) =>
        set((state) => ({ preferences: { ...state.preferences, ...partial } })),
    }),
    {
      name: 'notification-preferences-v1',
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);