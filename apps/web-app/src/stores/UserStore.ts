import axios, { isAxiosError } from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User type based on the Prisma schema
export interface User {
  user_id: string;
  email: string;
  name?: string;
  preferences?: Record<string, unknown>;
  region: string;
  timezone?: string;
  language_preference?: string;
  profile_picture_url?: string;
  created_at: string;
  last_active_at?: string;
  account_status: string;
  growth_profile?: Record<string, unknown>;
}

export interface UserState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  isInitializing: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initializeAuth: () => void;
  setHasHydrated: (hydrated: boolean) => void;
  updateUserPreferences: (preferences: Record<string, unknown>) => void;
}

// API base URL - updated to use the correct port where API Gateway is running
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.API_GATEWAY_HOST_PORT || '3001'}`;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false, // Start as false to prevent hydration mismatch
      isInitializing: false, // Track if initialization is in progress

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        console.log('UserStore.login - Starting login for:', email);
        
        try {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
            email,
            password,
          });

          console.log('UserStore.login - Response:', response.data);

          if (response.data.success) {
            const { user, token } = response.data.data;
            
            // Store token in localStorage
            localStorage.setItem('auth_token', token);
            // Set axios header immediately
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Clear ALL existing user data to prevent data leakage between users
            try {
              // Clear chat data
              import('./ChatStore').then(({ useChatStore }) => {
                useChatStore.getState().clearUserData();
              });
              
              // Clear card data
              // NOTE: Commented out to prevent race condition with card loading
              // Cards will be loaded fresh for the user anyway
              // import('./CardStore').then(({ useCardStore }) => {
              //   useCardStore.getState().clearCards();
              // });
              
              // Note: We don't clear background video preferences here because they should be loaded from backend
              // The localStorage will be cleared below, but preferences will be restored from user.preferences on login
              
              // Clear HRT parameters
              import('./HRTParametersStore').then(({ useHRTParametersStore }) => {
                useHRTParametersStore.getState().resetToDefaults();
              });
              
              // Clear cosmos graph data
              import('./CosmosStore').then(({ useCosmosStore }) => {
                useCosmosStore.getState().setGraphData({ 
                  version: '', 
                  createdAt: '', 
                  nodeCount: 0, 
                  edgeCount: 0, 
                  nodes: [], 
                  edges: [], 
                  communities: [], 
                  metadata: { 
                    dimension_reduction_algorithm: '', 
                    vector_dimensionality: '', 
                    semantic_similarity_threshold: 0, 
                    communities: [] 
                  } 
                });
                useCosmosStore.getState().setSelectedNode(null);
              });
              
              // Clear notifications
              import('./NotificationStore').then(({ useNotificationStore }) => {
                useNotificationStore.getState().clearAllNotifications();
              });
              
              // Clear HUD state
              import('./HUDStore').then(({ useHUDStore }) => {
                useHUDStore.getState().resetToDefaults();
              });
              
            } catch (error) {
              console.warn('Failed to clear existing user data on login:', error);
            }
            
            // Update state - this should trigger persist middleware
            const newState = {
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            };
            
            console.log('UserStore.login - Setting new state:', newState);
            set(newState);
            
            // Load user preferences after successful login
            try {
              const { useBackgroundVideoStore } = await import('./BackgroundVideoStore');
              await useBackgroundVideoStore.getState().loadUserPreferences();
              console.log('UserStore.login - User preferences loaded successfully');
            } catch (error) {
              console.warn('Failed to load user preferences after login:', error);
            }
            
            // Force a verification that state was set
            setTimeout(() => {
              const currentState = get();
              console.log('UserStore.login - State after set:', {
                user: currentState.user,
                isAuthenticated: currentState.isAuthenticated
              });
              console.log('UserStore.login - localStorage after set:', localStorage.getItem('user-storage'));
            }, 100);
            
          } else {
            console.log('UserStore.login - Login failed:', response.data.error);
            // Extract message from error object if it exists
            const errorMessage = response.data.error?.message || response.data.error || 'Login failed';
            set({
              isLoading: false,
              error: errorMessage,
            });
          }
        } catch (error: unknown) {
          const errorMessage = isAxiosError(error) 
            ? (error.response?.data?.error?.message || error.response?.data?.error || 'Login failed')
            : 'Login failed';
          
          console.log('UserStore.login - Error:', errorMessage);
          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      signup: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        console.log('UserStore.signup - Starting signup for:', email);
        
        try {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
            email,
            password,
            name,
          });

          console.log('UserStore.signup - Response:', response.data);

          if (response.data.success) {
            const { user, token } = response.data.data;
            
            // Store token in localStorage
            localStorage.setItem('auth_token', token);
            // Set axios header immediately
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Clear ALL existing user data to prevent data leakage between users
            try {
              // Clear chat data
              import('./ChatStore').then(({ useChatStore }) => {
                useChatStore.getState().clearUserData();
              });
              
              // Clear card data
              // NOTE: Commented out to prevent race condition with card loading
              // Cards will be loaded fresh for the user anyway
              // import('./CardStore').then(({ useCardStore }) => {
              //   useCardStore.getState().clearCards();
              // });
              
              // Note: We don't clear background video preferences here because they should be loaded from backend
              // The localStorage will be cleared below, but preferences will be restored from user.preferences on login
              
              // Clear HRT parameters
              import('./HRTParametersStore').then(({ useHRTParametersStore }) => {
                useHRTParametersStore.getState().resetToDefaults();
              });
              
              // Clear cosmos graph data
              import('./CosmosStore').then(({ useCosmosStore }) => {
                useCosmosStore.getState().setGraphData({ 
                  version: '', 
                  createdAt: '', 
                  nodeCount: 0, 
                  edgeCount: 0, 
                  nodes: [], 
                  edges: [], 
                  communities: [], 
                  metadata: { 
                    dimension_reduction_algorithm: '', 
                    vector_dimensionality: '', 
                    semantic_similarity_threshold: 0, 
                    communities: [] 
                  } 
                });
                useCosmosStore.getState().setSelectedNode(null);
              });
              
              // Clear notifications
              import('./NotificationStore').then(({ useNotificationStore }) => {
                useNotificationStore.getState().clearAllNotifications();
              });
              
              // Clear HUD state
              import('./HUDStore').then(({ useHUDStore }) => {
                useHUDStore.getState().resetToDefaults();
              });
              
            } catch (error) {
              console.warn('Failed to clear existing user data on signup:', error);
            }
            
            // Update state - this should trigger persist middleware
            const newState = {
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            };
            
            console.log('UserStore.signup - Setting new state:', newState);
            set(newState);
            
            // Load user preferences after successful signup
            try {
              const { useBackgroundVideoStore } = await import('./BackgroundVideoStore');
              await useBackgroundVideoStore.getState().loadUserPreferences();
              console.log('UserStore.signup - User preferences loaded successfully');
            } catch (error) {
              console.warn('Failed to load user preferences after signup:', error);
            }
            
            // Force a verification that state was set
            setTimeout(() => {
              const currentState = get();
              console.log('UserStore.signup - State after set:', {
                user: currentState.user,
                isAuthenticated: currentState.isAuthenticated
              });
              console.log('UserStore.signup - localStorage after set:', localStorage.getItem('user-storage'));
            }, 100);
            
          } else {
            console.log('UserStore.signup - Signup failed:', response.data.error);
            // Extract message from error object if it exists
            const errorMessage = response.data.error?.message || response.data.error || 'Registration failed';
            set({
              isLoading: false,
              error: errorMessage,
            });
          }
        } catch (error: unknown) {
          const errorMessage = isAxiosError(error) 
            ? (error.response?.data?.error?.message || error.response?.data?.error || 'Registration failed')
            : 'Registration failed';
          
          console.log('UserStore.signup - Error:', errorMessage);
          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      logout: () => {
        console.log('UserStore.logout - Logging out');
        // Remove token from localStorage
        localStorage.removeItem('auth_token');
        // Remove axios header
        delete axios.defaults.headers.common['Authorization'];
        
        // Clear the persisted state from localStorage
        localStorage.removeItem('user-storage');
        
        // Clear ALL user-specific data to prevent data leakage between users
        try {
          // Clear chat data
          import('./ChatStore').then(({ useChatStore }) => {
            useChatStore.getState().clearUserData();
          });
          
          // Clear card data
          import('./CardStore').then(({ useCardStore }) => {
            useCardStore.getState().clearCards();
          });
          
          // Note: We don't clear background video preferences here because they should be loaded from backend
          // The localStorage will be cleared below, but preferences will be restored from user.preferences on login
          
          // Clear HRT parameters
          import('./HRTParametersStore').then(({ useHRTParametersStore }) => {
            useHRTParametersStore.getState().resetToDefaults();
          });
          
          // Clear cosmos graph data
          import('./CosmosStore').then(({ useCosmosStore }) => {
            useCosmosStore.getState().setGraphData({ 
              version: '', 
              createdAt: '', 
              nodeCount: 0, 
              edgeCount: 0, 
              nodes: [], 
              edges: [], 
              communities: [], 
              metadata: { 
                dimension_reduction_algorithm: '', 
                vector_dimensionality: '', 
                semantic_similarity_threshold: 0, 
                communities: [] 
              } 
            });
            useCosmosStore.getState().setSelectedNode(null);
          });
          
          // Clear notifications
          import('./NotificationStore').then(({ useNotificationStore }) => {
            useNotificationStore.getState().clearAllNotifications();
          });
          
          // Clear HUD state
          import('./HUDStore').then(({ useHUDStore }) => {
            useHUDStore.getState().resetToDefaults();
          });
          
          // Clear any other user-specific localStorage items
          const userSpecificKeys = [
            'card-storage-v3',
            'background-media-storage',
            'chat-storage',
            'hrt-parameters-storage',
            'notification-preferences-v1',
            'hud-storage'
          ];
          
          userSpecificKeys.forEach(key => {
            localStorage.removeItem(key);
          });
          
        } catch (error) {
          console.warn('Failed to clear user data on logout:', error);
        }
        
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
        
        console.log('UserStore.logout - State cleared, localStorage:', localStorage.getItem('user-storage'));
      },

      clearError: () => {
        set({ error: null });
      },

      initializeAuth: async () => {
        const state = get();
        
        // Guard: Prevent multiple simultaneous initializations
        if (state.isInitializing) {
          console.log('UserStore.initializeAuth - Already initializing, skipping');
          return;
        }
        
        // DEBUG: Log stack trace to see WHO is calling this
        console.log('UserStore.initializeAuth - Starting initialization');
        console.log('UserStore.initializeAuth - Called from:', new Error().stack);
        set({ isInitializing: true });
        
        // Set hydrated to true immediately to prevent UI blocking
        if (!state.hasHydrated) {
          set({ hasHydrated: true });
        }
        
        // Only check auth state on client side
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          
          // Development mode auto-auth
          if (process.env.NODE_ENV === 'development' && !token && !state.isAuthenticated) {
            const persistedState = localStorage.getItem('user-storage');
            
            // Only auto-setup dev auth if there's no persisted state
            if (!persistedState) {
              console.log('UserStore.initializeAuth - Development mode: setting up dev token');
              
              localStorage.setItem('auth_token', 'dev-token');
              axios.defaults.headers.common['Authorization'] = `Bearer dev-token`;
              
              const mockUser: User = {
                user_id: 'dev-user-123',
                email: 'dev@example.com',
                name: 'Developer User',
                region: 'US',
                timezone: 'UTC',
                language_preference: 'en',
                profile_picture_url: undefined,
                created_at: new Date().toISOString(),
                last_active_at: new Date().toISOString(),
                account_status: 'active',
                growth_profile: {},
                preferences: {}
              };
              
              set({
                user: mockUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              
              console.log('UserStore.initializeAuth - Development authentication set up');
            }
            return;
          }
          
          // If we have a token, verify it with the backend
          if (token) {
            console.log('UserStore.initializeAuth - Verifying token with backend...');
            
            try {
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              const response = await axios.get(`${API_BASE_URL}/api/v1/auth/verify`, {
                timeout: 5000 // 5 second timeout to prevent hanging
              });
              
              if (response.data.success) {
                const { user, token: newToken, refreshed } = response.data.data;
                
                // Update state with verified user
                set({
                  user,
                  isAuthenticated: true,
                  error: null,
                });
                
                // If token was refreshed, store the new one
                if (refreshed && newToken) {
                  localStorage.setItem('auth_token', newToken);
                  axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                  console.log('UserStore.initializeAuth - Token refreshed automatically');
                }
                
                console.log('UserStore.initializeAuth - Token verified successfully');
              }
            } catch (error) {
              // Token is invalid or expired - clear authentication state
              console.log('UserStore.initializeAuth - Token verification failed, logging out', error);
              localStorage.removeItem('auth_token');
              delete axios.defaults.headers.common['Authorization'];
              set({
                user: null,
                isAuthenticated: false,
                error: 'Session expired. Please log in again.',
              });
            }
          } else if (state.isAuthenticated) {
            // No token but state says authenticated - clear inconsistent state
            console.log('UserStore.initializeAuth - Clearing inconsistent state');
            set({
              user: null,
              isAuthenticated: false,
              error: null,
            });
          }
        }
        
        console.log('UserStore.initializeAuth - Initialization complete');
        set({ isInitializing: false });
      },

      setHasHydrated: (hydrated: boolean) => {
        set({ hasHydrated: hydrated });
      },

      updateUserPreferences: (preferences: Record<string, unknown>) => {
        const { user } = get();
        if (user) {
          const updatedUser = {
            ...user,
            preferences: {
              ...user.preferences,
              ...preferences,
            },
          };
          set({ user: updatedUser });
        }
      },
    }),
    {
      name: 'user-storage',
      // Persist user data and auth status
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Add onRehydrateStorage callback for better debugging
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.log('UserStore - Rehydration error:', error);
          } else {
            console.log('UserStore - Rehydrated state:', state);
            if (state && state.isAuthenticated) {
              // Restore axios header if user is authenticated
              const token = localStorage.getItem('auth_token');
              if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                console.log('UserStore - Restored axios header on rehydration');
              }
            }
          }
          console.log('UserStore - Rehydration complete');
          // Mark as hydrated after rehydration
          if (state) {
            state.setHasHydrated(true);
          }
        };
      },
    }
  )
);

// Initialize axios interceptor to handle token from localStorage
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // Global axios interceptor to handle 401 responses
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.log('Axios interceptor - 401 detected, clearing auth state');
        
        // Clear auth state
        localStorage.removeItem('auth_token');
        delete axios.defaults.headers.common['Authorization'];
        
        useUserStore.getState().logout();
        
        // Show error message to user
        useUserStore.setState({
          error: 'Your session has expired. Please log in again.',
        });
      }
      return Promise.reject(error);
    }
  );
} 