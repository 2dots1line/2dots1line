import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './UserStore';
import { userPreferencesService } from '../services/userPreferencesService';

export type LocalVideoOption = 'Cloud1.mp4' | 'Cloud2.mp4' | 'Cloud3.mp4' | 'Cloud4.mp4' | 'Star1.mp4' | 'starryNight.mp4';
export type ViewType = 'dashboard' | 'chat' | 'cards' | 'settings';

// Type for all possible views (including cosmos)
export type AllViewType = ViewType | 'cosmos';

export interface VideoFile {
  id: string; // Relative path from /videos/
  label: string; // Display name
  path: string; // Full URL path
  directory: string; // 'root' | 'generated' | etc
  size?: number;
  createdAt?: string;
}

export interface MediaItem {
  id: string;
  source: 'local' | 'pexels' | 'generated';
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
  prompt?: string; // For generated media
  generatedAt?: string; // For generated media
}

export interface UserMediaPreference {
  source: 'local' | 'pexels' | 'generated';
  type: 'video' | 'photo';
  id: string;
  url?: string;
  title?: string;
}

interface BackgroundVideoState {
  // State
  mediaPreferences: Record<ViewType, UserMediaPreference | null>;
  searchResults: MediaItem[];
  generatedMedia: MediaItem[]; // New: cached generated media
  localVideos: VideoFile[]; // New: local videos from filesystem
  isLoading: boolean;
  isLoadingLocalVideos: boolean; // New: loading state for local videos
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
  // New: Generated media actions
  loadGeneratedMedia: () => Promise<void>;
  deleteGeneratedMedia: (id: string) => Promise<void>;
  applyGeneratedVideo: (id: string, view: ViewType) => void;
  // New: Local videos action
  loadLocalVideos: () => Promise<void>;
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
      generatedMedia: [],
      localVideos: [],
      isLoading: false,
      isLoadingLocalVideos: false,
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
                 const token = localStorage.getItem('auth_token');
                 const response = await fetch(`/api/v1/media/search?q=${encodeURIComponent(query)}&type=${type}`, {
                   headers: {
                     'Authorization': `Bearer ${token}`
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
                 const token = localStorage.getItem('auth_token');
                 const response = await fetch(`/api/v1/media/recommended?view=${view}`, {
                   headers: {
                     'Authorization': `Bearer ${token}`
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

          // Save to backend via API
          const response = await userPreferencesService.updateUserPreferences(user.user_id, {
            preferences: updatedPreferences
          });

          if (response.success) {
            // Update the local user store with the response from backend
            userStore.updateUserPreferences(updatedPreferences);
            console.log('Background video preferences saved to backend successfully');
          } else {
            console.error('Failed to save media preferences to backend:', response.error);
            set({ error: 'Failed to save media preferences to backend' });
          }
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

      // New: Load generated media from API
      loadGeneratedMedia: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const token = localStorage.getItem('auth_token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/media/generated?type=video`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to load generated media');
          }
          
          const data = await response.json();
          
          if (data.success && Array.isArray(data.data)) {
            const items: MediaItem[] = data.data.map((m: any) => ({
              id: m.id,
              source: 'generated' as const,
              type: 'video' as const,
              title: m.prompt,
              url: m.fileUrl,
              prompt: m.prompt,
              generatedAt: m.createdAt
            }));
            
            set({ generatedMedia: items, isLoading: false });
            console.log(`✅ Loaded ${items.length} generated videos`);
          } else {
            set({ generatedMedia: [], isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load generated media:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load generated media',
            isLoading: false 
          });
        }
      },

      // New: Delete generated media
      deleteGeneratedMedia: async (id: string) => {
        try {
          const token = localStorage.getItem('auth_token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/media/generated/${id}`, {
            method: 'DELETE',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete generated media');
          }
          
          // Remove from local state
          const { generatedMedia } = get();
          set({ 
            generatedMedia: generatedMedia.filter(m => m.id !== id)
          });
          
          console.log(`✅ Deleted generated media: ${id}`);
        } catch (error) {
          console.error('Failed to delete generated media:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete generated media'
          });
        }
      },

      // New: Apply generated video to a view
      applyGeneratedVideo: (id: string, view: ViewType) => {
        const { generatedMedia, setMediaForView } = get();
        const media = generatedMedia.find(m => m.id === id);
        
        if (media) {
          setMediaForView(view, {
            source: 'generated',
            type: 'video',
            id: media.id,
            url: media.url,
            title: media.title
          });
          console.log(`✅ Applied generated video to ${view} view`);
        } else {
          console.warn(`⚠️  Generated video not found: ${id}`);
        }
      },

      // New: Load local videos from filesystem via API
      loadLocalVideos: async () => {
        set({ isLoadingLocalVideos: true });
        
        try {
          const response = await fetch('/api/videos/list');
          const data = await response.json();
          
          if (data.success) {
            set({ localVideos: data.data, isLoadingLocalVideos: false });
            console.log(`✅ Loaded ${data.data.length} local videos from filesystem`);
          } else {
            set({ localVideos: [], isLoadingLocalVideos: false });
          }
        } catch (error) {
          console.error('Failed to load local videos:', error);
          set({ localVideos: [], isLoadingLocalVideos: false });
        }
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
