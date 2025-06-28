'use client';

import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import React, { useState, useEffect, useCallback } from 'react';

import { HUDContainer } from '../components/hud';
import { ModalContainer } from '../components/modal';
import LoginModal from '../components/modal/LoginModal';
import SignupModal from '../components/modal/SignupModal';
import { useHUDStore } from '../stores/HUDStore';
import { useUserStore } from '../stores/UserStore';

const HomePage = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  
  const { user, isAuthenticated, logout, initializeAuth, hasHydrated } = useUserStore();
  const { setActiveModal, activeModal } = useHUDStore();

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

  // Auto-open dashboard when user is authenticated and no modal is active
  useEffect(() => {
    if (isAuthenticated && hasHydrated && !activeModal) {
      setActiveModal('dashboard');
    }
  }, [isAuthenticated, hasHydrated, activeModal, setActiveModal]);

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
    // Clear active modal on logout
    setActiveModal(null);
  };

  // Don't render auth-dependent UI until hydration is complete
  if (!hasHydrated) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover" src="/videos/Cloud1.mp4">
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-white">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Video - Layer 1 (bottom) */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="/videos/Cloud1.mp4"
        >
          Your browser does not support the video tag.
        </video>
        {/* Video Overlay */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

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

      {/* Navigation Modals - Layer 4 */}
      {isAuthenticated && <ModalContainer />}

      {/* Authentication Modals - Layer 5 (highest) */}
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