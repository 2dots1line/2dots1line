import { useEffect } from 'react';

import { useCardStore } from '../../stores/CardStore';
import { useUserStore } from '../../stores/UserStore';

/**
 * Hook to automatically load cards when user is authenticated
 * This ensures cards are available as soon as the user logs in
 * Note: With the new batched loading system, cards are loaded when the cards view becomes active
 */
export const useAutoLoadCards = () => {
  const { isAuthenticated, hasHydrated } = useUserStore();
  const { cards, isLoading } = useCardStore();

  useEffect(() => {
    console.log('useAutoLoadCards - State check:', {
      isAuthenticated,
      hasHydrated,
      cardsLength: cards.length,
      isLoading
    });

    // With the new system, cards are loaded when the cards view becomes active
    // This hook now just provides status information
    console.log('useAutoLoadCards - Cards will be loaded when cards view becomes active');
  }, [isAuthenticated, hasHydrated, cards.length, isLoading]);

  return {
    isLoading,
    cardsLoaded: cards.length > 0,
    totalCards: cards.length
  };
}; 