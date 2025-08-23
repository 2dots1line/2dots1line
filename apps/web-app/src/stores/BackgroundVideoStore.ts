import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './UserStore';

export type LocalVideoOption = 'Cloud1.mp4' | 'Cloud2.mp4' | 'Cloud3.mp4' | 'Cloud4.mp4' | 'Star1.mp4' | 'starryNight.mp4';
export type ViewType = 'dashboard' | 'chat' | 'cards' | 'settings';

// Type for all possible views (including cosmos)
export type AllViewType = ViewType | 'cosmos';

export interface MediaItem {
  id: string;
  source: 'local' | 'pexels';
  type: 'video' | 'photo';
  title: string;
  url: string;
  thumbnailUrl?: string;
  pexelsId?: number;
  localPath?: string;
  category?: string;
  duration?: number;
  width?: number;
  height?: number;
  photographer?: string;
}

export interface UserMediaPreference {
  source: 'local' | 'pexels';
  type: 'video' | 'photo';
  id: string;
  url?: string;
  title?: string;
}

interface BackgroundVideoState {
  // State
  mediaPreferences: Record<ViewType, UserMediaPreference | null>;
  searchResults: MediaItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setMediaForView: (view: ViewType, media: UserMediaPreference) => void;
  getMediaForView: (view: ViewType) => UserMediaPreference | null;
  searchMedia: (query: string, type: 'video' | 'photo') => Promise<void>;
  getRecommendedMedia: (view: ViewType) => Promise<MediaItem[]>;
  loadUserPreferences: () => Promise<void>;
  saveUserPreferences: () => Promise<void>;
  resetToDefaults: () => void;
  clearSearchResults: () => void;
}

const DEFAULT_LOCAL_VIDEOS: Record<ViewType, UserMediaPreference> = {
  dashboard: { source: 'local', type: 'video', id: 'Cloud1.mp4' },
  chat: { source: 'local', type: 'video', id: 'Cloud1.mp4' },
  cards: { source: 'local', type: 'video', id: 'Cloud1.mp4' },
  settings: { source: 'local', type: 'video', id: 'Cloud1.mp4' },
};

export const useBackgroundVideoStore = create<BackgroundVideoState>()(
  persist(
    (set, get) => ({
      // Initial state
      mediaPreferences: { ...DEFAULT_LOCAL_VIDEOS },
      searchResults: [],
      isLoading: false,
      error: null,

      // Actions
      setMediaForView: (view: ViewType, media: UserMediaPreference) => {
        const { mediaPreferences } = get();
        const newPreferences = { ...mediaPreferences, [view]: media };
        set({ mediaPreferences: newPreferences });
        
        // Auto-save to user preferences
        get().saveUserPreferences();
      },

      getMediaForView: (view: ViewType) => {
        const { mediaPreferences } = get();
        return mediaPreferences[view] || DEFAULT_LOCAL_VIDEOS[view];
      },

                   searchMedia: async (query: string, type: 'video' | 'photo') => {
               console.log('Store searchMedia called with:', query, type);
               set({ isLoading: true, error: null });

               try {
                 const response = await fetch(`/api/v1/media/search?q=${encodeURIComponent(query)}&type=${type}`, {
                   headers: {
                     'Authorization': 'Bearer dev-token'
                   }
                 });
          
          if (!response.ok) {
            throw new Error('Failed to search media');
          }
          
          const results = await response.json();
          console.log('Store received search results:', results.data);
          set({ searchResults: results.data || [], isLoading: false });
        } catch (error) {
          console.error('Failed to search media:', error);
          set({ error: 'Failed to search media', isLoading: false });
        }
      },

                   getRecommendedMedia: async (view: ViewType) => {
               try {
                 const response = await fetch(`/api/v1/media/recommended?view=${view}`, {
                   headers: {
                     'Authorization': 'Bearer dev-token'
                   }
                 });
          
          if (!response.ok) {
            throw new Error('Failed to get recommended media');
          }
          
          const results = await response.json();
          return results.data || [];
        } catch (error) {
          console.error('Failed to get recommended media:', error);
          return [];
        }
      },

      loadUserPreferences: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const userStore = useUserStore.getState();
          const user = userStore.user;
          
          if (user?.preferences?.background_media) {
            const userMedia = user.preferences.background_media as Record<ViewType, UserMediaPreference>;
            const newPreferences = { ...DEFAULT_LOCAL_VIDEOS };
            
            // Update with user preferences
            Object.entries(userMedia).forEach(([view, media]) => {
              if (view in DEFAULT_LOCAL_VIDEOS) {
                newPreferences[view as ViewType] = media;
              }
            });
            
            set({ mediaPreferences: newPreferences });
          }
        } catch (error) {
          console.error('Failed to load media preferences:', error);
          set({ error: 'Failed to load media preferences' });
        } finally {
          set({ isLoading: false });
        }
      },

      saveUserPreferences: async () => {
        try {
          const userStore = useUserStore.getState();
          const user = userStore.user;
          
          if (!user) {
            console.warn('No user available to save media preferences');
            return;
          }

          // Update user preferences with current media settings
          const currentPreferences = user.preferences || {};
          const updatedPreferences = {
            ...currentPreferences,
            background_media: get().mediaPreferences,
          };

          // This would typically call an API to update user preferences
          // For now, we'll just update the local user store
          userStore.updateUserPreferences(updatedPreferences);
        } catch (error) {
          console.error('Failed to save media preferences:', error);
          set({ error: 'Failed to save media preferences' });
        }
      },

      resetToDefaults: () => {
        set({ mediaPreferences: { ...DEFAULT_LOCAL_VIDEOS } });
        get().saveUserPreferences();
      },

      clearSearchResults: () => {
        set({ searchResults: [] });
      },
    }),
    {
      name: 'background-media-storage',
      // Only persist media preferences
      partialize: (state) => ({
        mediaPreferences: state.mediaPreferences,
      }),
    }
  )
);
