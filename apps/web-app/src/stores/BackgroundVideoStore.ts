import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './UserStore';

export type VideoOption = 'Cloud1.mp4' | 'Cloud2.mp4' | 'Cloud3.mp4' | 'Cloud4.mp4' | 'Star1.mp4';
export type ViewType = 'dashboard' | 'chat' | 'cards' | 'settings';

// Type for all possible views (including cosmos)
export type AllViewType = ViewType | 'cosmos';

interface BackgroundVideoState {
  // State
  videoPreferences: Record<ViewType, VideoOption>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setVideoForView: (view: ViewType, video: VideoOption) => void;
  getVideoForView: (view: ViewType) => VideoOption;
  loadUserPreferences: () => Promise<void>;
  saveUserPreferences: () => Promise<void>;
  resetToDefaults: () => void;
}

const DEFAULT_VIDEOS: Record<ViewType, VideoOption> = {
  dashboard: 'Cloud1.mp4',
  chat: 'Cloud1.mp4',
  cards: 'Cloud1.mp4',
  settings: 'Cloud1.mp4',
};

export const useBackgroundVideoStore = create<BackgroundVideoState>()(
  persist(
    (set, get) => ({
      // Initial state
      videoPreferences: { ...DEFAULT_VIDEOS },
      isLoading: false,
      error: null,

      // Actions
      setVideoForView: (view: ViewType, video: VideoOption) => {
        const { videoPreferences } = get();
        const newPreferences = { ...videoPreferences, [view]: video };
        set({ videoPreferences: newPreferences });
        
        // Auto-save to user preferences
        get().saveUserPreferences();
      },

      getVideoForView: (view: ViewType) => {
        const { videoPreferences } = get();
        return videoPreferences[view] || DEFAULT_VIDEOS[view];
      },

      loadUserPreferences: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const userStore = useUserStore.getState();
          const user = userStore.user;
          
          if (user?.preferences?.background_videos) {
            const userVideos = user.preferences.background_videos as Record<ViewType, VideoOption>;
            const newPreferences = { ...DEFAULT_VIDEOS };
            
            // Only update with valid video options
            Object.entries(userVideos).forEach(([view, video]) => {
              if (view in DEFAULT_VIDEOS && Object.values(DEFAULT_VIDEOS).includes(video)) {
                newPreferences[view as ViewType] = video;
              }
            });
            
            set({ videoPreferences: newPreferences });
          }
        } catch (error) {
          console.error('Failed to load video preferences:', error);
          set({ error: 'Failed to load video preferences' });
        } finally {
          set({ isLoading: false });
        }
      },

      saveUserPreferences: async () => {
        try {
          const userStore = useUserStore.getState();
          const user = userStore.user;
          
          if (!user) {
            console.warn('No user available to save video preferences');
            return;
          }

          // Update user preferences with current video settings
          const currentPreferences = user.preferences || {};
          const updatedPreferences = {
            ...currentPreferences,
            background_videos: get().videoPreferences,
          };

          // This would typically call an API to update user preferences
          // For now, we'll just update the local user store
          userStore.updateUserPreferences(updatedPreferences);
        } catch (error) {
          console.error('Failed to save video preferences:', error);
          set({ error: 'Failed to save video preferences' });
        }
      },

      resetToDefaults: () => {
        set({ videoPreferences: { ...DEFAULT_VIDEOS } });
        get().saveUserPreferences();
      },
    }),
    {
      name: 'background-video-storage',
      // Only persist video preferences
      partialize: (state) => ({
        videoPreferences: state.videoPreferences,
      }),
    }
  )
);
