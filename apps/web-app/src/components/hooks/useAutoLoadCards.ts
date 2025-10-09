import { useEffect, useRef } from 'react';

import { useCardStore } from '../../stores/CardStore';
import { useUserStore } from '../../stores/UserStore';

/**
 * Hook to automatically load cards when user is authenticated
 * This ensures cards are available as soon as the user logs in
 */
export const useAutoLoadCards = () => {
  const { isAuthenticated, hasHydrated } = useUserStore();
  const { cards, isLoading, initializeSortedLoader } = useCardStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    console.log('useAutoLoadCards - State check:', {
      isAuthenticated,
      hasHydrated,
      cardsLength: cards.length,
      isLoading,
      hasInitialized: hasInitialized.current
    });

    // Load cards when user is authenticated and hydrated, but only if no cards are loaded and we haven't initialized yet
    if (isAuthenticated && hasHydrated && cards.length === 0 && !isLoading && !hasInitialized.current) {
      console.log('useAutoLoadCards - Loading cards for authenticated user');
      hasInitialized.current = true;
      initializeSortedLoader('newest');
    }

    // Reset initialization flag when user logs out
    if (!isAuthenticated) {
      hasInitialized.current = false;
    }
  }, [isAuthenticated, hasHydrated, cards.length, isLoading]);

  return {
    isLoading,
    cardsLoaded: cards.length > 0,
    totalCards: cards.length
  };
}; 