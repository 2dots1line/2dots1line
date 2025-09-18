import { create } from 'zustand';
import { SSEMessage } from '@2dots1line/shared-types';

export interface Notification {
  id: string;
  type: 'new_star_generated' | 'new_card_available' | 'graph_projection_updated';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  userId: string;
  isVisible: boolean;
  autoHide?: boolean;
  duration?: number;
  metadata?: {
    starId?: string;
    cardId?: string;
    starType?: string;
  };
}

interface NotificationState {
  notifications: Notification[];
  isConnected: boolean;
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isVisible' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  hideNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  connectSSE: () => void;
  disconnectSSE: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isConnected: false,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      isVisible: true,
      isRead: false,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications]
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  hideNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, isVisible: false } : n
      )
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      )
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  connectSSE: () => {
    set({ isConnected: true });
  },

  disconnectSSE: () => {
    set({ isConnected: false });
  },
}));