'use client';

import { GlassmorphicPanel, GlassButton, InfiniteCardCanvas } from '@2dots1line/ui-components';
import React, { useState, useEffect, useCallback } from 'react';

import { useAutoLoadCards } from '../components/hooks/useAutoLoadCards';
import { HUDContainer } from '../components/hud/HUDContainer';
import { ConversationHistoryPanel } from '../components/hud/ConversationHistoryPanel';
import LoginModal from '../components/modal/LoginModal';
import { ModalContainer } from '../components/modal/ModalContainer';
import SignupModal from '../components/modal/SignupModal';
import { DynamicBackground } from '../components/DynamicBackground';
import { useCardStore } from '../stores/CardStore';
import { useHUDStore } from '../stores/HUDStore';
import { useUserStore } from '../stores/UserStore';
import { useBackgroundVideoStore } from '../stores/BackgroundVideoStore';

const HomePage = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  
  const { user, isAuthenticated, logout, initializeAuth, hasHydrated } = useUserStore();
  const { setActiveView, activeView, setCardDetailModalOpen } = useHUDStore();
  const { cards, loadCards, loadMoreCards, hasMore, isLoading, setSelectedCard } = useCardStore();
  const { loadUserPreferences } = useBackgroundVideoStore();
  
  // Automatically load cards when user is authenticated
  const { cardsLoaded, totalCards } = useAutoLoadCards();
  
  // Load cards when cards view becomes active
  useEffect(() => {
    if (isAuthenticated && activeView === 'cards') {
      loadCards(200);
    }
  }, [isAuthenticated, activeView, loadCards]);

  // Memoize initializeAuth to prevent unnecessary re-renders
  const memoizedInitializeAuth = useCallback(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Initialize authentication state on component mount
  useEffect(() => {
    memoizedInitializeAuth();
    // Debug: Log current authentication state
    console.log('HomePage - Auth state:', { user, isAuthenticated, hasHydrated });
    console.log('HomePage - localStorage token:', localStorage.getItem('auth_token'));
    console.log('HomePage - localStorage state:', localStorage.getItem('user-storage'));
    
    // Fallback: Force hydration after 2 seconds if it hasn't completed
    const hydrationTimeout = setTimeout(() => {
      if (!hasHydrated) {
        console.log('HomePage - Forcing hydration due to timeout');
        useUserStore.getState().setHasHydrated(true);
      }
    }, 2000);
    
    return () => clearTimeout(hydrationTimeout);
  }, [memoizedInitializeAuth, user, isAuthenticated, hasHydrated]);

  // Load video preferences when user is authenticated
  useEffect(() => {
    if (isAuthenticated && hasHydrated) {
      loadUserPreferences();
    }
  }, [isAuthenticated, hasHydrated, loadUserPreferences]);

  // Auto-open dashboard when user is authenticated and no view is active
  useEffect(() => {
    if (isAuthenticated && hasHydrated && !activeView) {
      setActiveView('dashboard');
    }
  }, [isAuthenticated, hasHydrated, activeView, setActiveView]);

  // Handle opening login modal
  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsSignupModalOpen(false);
  };

  // Handle opening signup modal
  const openSignupModal = () => {
    setIsSignupModalOpen(true);
    setIsLoginModalOpen(false);
  };

  // Handle closing modals
  const closeModals = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    // Clear active view on logout
    setActiveView(null);
  };
  
  // Handle card selection from InfiniteCardCanvas
  const handleCardSelect = useCallback((card: any) => {
    setSelectedCard(card);
    setCardDetailModalOpen(true); // Open card detail modal over cards view
  }, [setSelectedCard, setCardDetailModalOpen]);

  // Don't render auth-dependent UI until hydration is complete
  if (!hasHydrated) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <DynamicBackground view="dashboard" />
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-white">Loading...</div>
        </main>
      </div>
    );
  }

  // Determine which view is active for background video
  const currentView = activeView || 'dashboard';

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Media - Layer 1 (bottom) */}
      <DynamicBackground view={currentView} />

      {/* Main Content - Layer 2 (top) */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Top-right Navigation */}
        <nav className="absolute top-0 right-0 p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* User Greeting */}
                <GlassmorphicPanel 
                  variant="glass-panel" 
                  rounded="lg" 
                  padding="sm" 
                  className="text-sm text-onSurface"
                >
                  Welcome, {user?.name || user?.email?.split('@')[0] || 'User'}
                  {cardsLoaded && (
                    <span className="ml-2 text-xs opacity-75">
                      ({totalCards} cards)
                    </span>
                  )}
                </GlassmorphicPanel>
                {/* Logout Button */}
                <GlassButton 
                  onClick={handleLogout}
                  className="text-onBackground font-brand"
                >
                  Log out
                </GlassButton>
              </>
            ) : (
              <>
                {/* Login Button */}
                <GlassButton 
                  onClick={openLoginModal}
                  className="text-onBackground font-brand"
                >
                  Log in
                </GlassButton>
                {/* Signup Button */}
                <GlassButton 
                  onClick={openSignupModal}
                  className="text-onBackground font-brand"
                >
                  Sign up
                </GlassButton>
              </>
            )}
          </div>
        </nav>

        {/* Centered Welcome Panel - Only shown when not authenticated */}
        {!isAuthenticated && (
          <GlassmorphicPanel 
            variant="glass-panel"
            rounded="xl" 
            padding="lg"
            className="w-full max-w-xl md:max-w-2xl text-center sm:rounded-2xl"
          >
            <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl font-medium text-primary mb-4">
              A New Horizon Awaits
            </h1>
            <p className="font-sans text-base sm:text-lg text-onSurface max-w-prose mx-auto">
              Step into a space of reflection and connection. Discover the stories within, and watch your inner world expand.
            </p>
          </GlassmorphicPanel>
        )}
      </main>

      {/* Navigation HUD - Layer 3 */}
      {isAuthenticated && <HUDContainer />}

      {/* Conversation History Panel - Layer 3 - Only show in chat view */}
      {isAuthenticated && activeView === 'chat' && <ConversationHistoryPanel />}

      {/* Main Views - Layer 4 (z-30) - Mutually Exclusive */}
      {isAuthenticated && activeView === 'cards' && (
        <>
          {isLoading ? (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20">
              <div className="text-white text-xl">Loading your cards...</div>
            </div>
          ) : (
            <InfiniteCardCanvas
              cards={cards}
              onCardSelect={handleCardSelect}
              onLoadMore={loadMoreCards}
              hasMore={hasMore}
              className="z-30"
            />
          )}
        </>
      )}

      {/* Modal Container - Handles all modals (main views + overlays) */}
      {isAuthenticated && <ModalContainer />}

      {/* Authentication Modals - Layer 6 (highest) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeModals}
        onSwitchToSignup={openSignupModal}
      />
      
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={closeModals}
        onSwitchToLogin={openLoginModal}
      />
    </div>
  );
};

export default HomePage;