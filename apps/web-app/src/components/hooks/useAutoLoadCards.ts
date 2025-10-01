import { useEffect } from 'react';

import { useCardStore } from '../../stores/CardStore';
import { useUserStore } from '../../stores/UserStore';

/**
 * Hook to automatically load cards when user is authenticated
 * This ensures cards are available as soon as the user logs in
 */
export const useAutoLoadCards = () => {
  const { isAuthenticated, hasHydrated } = useUserStore();
  const { cards, isLoading, initializeSortedLoader } = useCardStore();

  useEffect(() => {
    console.log('useAutoLoadCards - State check:', {
      isAuthenticated,
      hasHydrated,
      cardsLength: cards.length,
      isLoading
    });

    // Load cards when user is authenticated and hydrated, but only if no cards are loaded
    if (isAuthenticated && hasHydrated && cards.length === 0 && !isLoading) {
      console.log('useAutoLoadCards - Loading cards for authenticated user');
      initializeSortedLoader('newest');
    }
  }, [isAuthenticated, hasHydrated, cards.length, isLoading, initializeSortedLoader]);

  return {
    isLoading,
    cardsLoaded: cards.length > 0,
    totalCards: cards.length
  };
}; 