import { useEffect, useRef } from 'react';

import { useCardStore } from '../../stores/CardStore';
import { useUserStore } from '../../stores/UserStore';

/**
 * Hook to automatically load cards when user is authenticated
 * This ensures cards are available as soon as the user logs in
 */
export const useAutoLoadCards = () => {
  const { isAuthenticated, hasHydrated, user } = useUserStore();
  const { cards, isLoading, initializeSortedLoader, error } = useCardStore();
  const hasInitialized = useRef(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    console.log('useAutoLoadCards - State check:', {
      isAuthenticated,
      hasHydrated,
      userId: user?.user_id,
      lastUserId: lastUserId.current,
      cardsLength: cards.length,
      isLoading,
      hasInitialized: hasInitialized.current,
      hasError: !!error
    });

    // Reset initialization flag when user changes (different user logs in)
    if (user?.user_id && lastUserId.current && lastUserId.current !== user.user_id) {
      console.log('useAutoLoadCards - Different user detected, resetting initialization flag');
      hasInitialized.current = false;
    }
    
    // Update the last user ID
    lastUserId.current = user?.user_id || null;

    // Load cards when user is authenticated, but only if no cards are loaded and we haven't initialized yet
    // Note: We don't wait for hasHydrated on first login since the user becomes authenticated before hydration
    if (isAuthenticated && cards.length === 0 && !isLoading && !hasInitialized.current) {
      console.log('useAutoLoadCards - Loading cards for authenticated user');
      hasInitialized.current = true;
      initializeSortedLoader('newest');
    }

    // Reset initialization flag when user logs out or when there's an error (to allow retry)
    if (!isAuthenticated || error) {
      hasInitialized.current = false;
    }
  }, [isAuthenticated, hasHydrated, user?.user_id, cards.length, isLoading, error, initializeSortedLoader]);

  return {
    isLoading,
    cardsLoaded: cards.length > 0,
    totalCards: cards.length
  };
}; 