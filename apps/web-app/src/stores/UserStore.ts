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
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initializeAuth: () => void;
  setHasHydrated: (hydrated: boolean) => void;
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
      hasHydrated: true, // Set to true immediately to avoid loading screen

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
            
            // Update state - this should trigger persist middleware
            const newState = {
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            };
            
            console.log('UserStore.login - Setting new state:', newState);
            set(newState);
            
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
            set({
              isLoading: false,
              error: response.data.error || 'Login failed',
            });
          }
        } catch (error: unknown) {
          const errorMessage = isAxiosError(error) 
            ? error.response?.data?.error || 'Login failed'
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
            
            // Update state - this should trigger persist middleware
            const newState = {
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            };
            
            console.log('UserStore.signup - Setting new state:', newState);
            set(newState);
            
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
            set({
              isLoading: false,
              error: response.data.error || 'Registration failed',
            });
          }
        } catch (error: unknown) {
          const errorMessage = isAxiosError(error) 
            ? error.response?.data?.error || 'Registration failed'
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

      initializeAuth: () => {
        console.log('UserStore.initializeAuth - Starting initialization');
        
        const state = get();
        console.log('UserStore.initializeAuth - Current state:', { 
          isAuthenticated: state.isAuthenticated, 
          hasHydrated: state.hasHydrated,
          user: state.user ? 'exists' : 'null'
        });
        
        // Set hydrated to true if not already set
        if (!state.hasHydrated) {
          set({ hasHydrated: true });
        }
        
        // Only check auth state on client side
        if (typeof window !== 'undefined') {
          // If already authenticated (from rehydration), just ensure token is set
          if (state.isAuthenticated && state.user) {
            const token = localStorage.getItem('auth_token');
            if (token) {
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              console.log('UserStore.initializeAuth - User already authenticated, token restored');
            }
            console.log('UserStore.initializeAuth - Initialization complete (already authenticated)');
            return;
          }
          
          // Development mode: automatically set up dev authentication
          if (process.env.NODE_ENV === 'development') {
            const token = localStorage.getItem('auth_token');
            
            if (!token) {
              console.log('UserStore.initializeAuth - Development mode: setting up dev token');
              
              // Set up development token and user
              localStorage.setItem('auth_token', 'dev-token');
              axios.defaults.headers.common['Authorization'] = `Bearer dev-token`;
              
              // Set up mock user data
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
              console.log('UserStore.initializeAuth - Initialization complete');
              return;
            } else {
              // Token exists, set up axios header
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              console.log('UserStore.initializeAuth - Set axios header for existing token');
            }
          }
          
          // If we have a token but no authenticated state, clear inconsistent state
          if (state.isAuthenticated && !state.user) {
            const token = localStorage.getItem('auth_token');
            console.log('UserStore.initializeAuth - Found token:', !!token);
            
            if (token) {
              // Set the authorization header for future requests
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              console.log('UserStore.initializeAuth - Set axios header');
            } else {
              // No token found, clear authentication state
              console.log('UserStore.initializeAuth - No token found, clearing state');
              set({
                user: null,
                isAuthenticated: false,
                error: null,
              });
            }
          }
        }
        
        console.log('UserStore.initializeAuth - Initialization complete');
      },

      setHasHydrated: (hydrated: boolean) => {
        set({ hasHydrated: hydrated });
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
} 