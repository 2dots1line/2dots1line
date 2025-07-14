import { useEffect } from 'react';

import { useCardStore } from '../../stores/CardStore';
import { useUserStore } from '../../stores/UserStore';

/**
 * Hook to automatically load cards when user is authenticated
 * This ensures cards are available as soon as the user logs in
 */
export const useAutoLoadCards = () => {
  const { isAuthenticated, hasHydrated } = useUserStore();
  const { cards, loadCards, isLoading } = useCardStore();

  useEffect(() => {
    console.log('useAutoLoadCards - State check:', {
      isAuthenticated,
      hasHydrated,
      cardsLength: cards.length,
      isLoading
    });

    // Only load cards if user is authenticated, hydration is complete,
    // cards array is empty, and not already loading
    if (isAuthenticated && hasHydrated && cards.length === 0 && !isLoading) {
      console.log('useAutoLoadCards - Loading cards for authenticated user');
      loadCards().catch(error => {
        console.error('useAutoLoadCards - Error loading cards:', error);
      });
    } else {
      console.log('useAutoLoadCards - Skipping card load:', {
        reason: !isAuthenticated ? 'not authenticated' :
                !hasHydrated ? 'not hydrated' :
                cards.length > 0 ? 'cards already loaded' :
                isLoading ? 'already loading' : 'unknown'
      });
    }
  }, [isAuthenticated, hasHydrated, cards.length, isLoading, loadCards]);

  return {
    isLoading,
    cardsLoaded: cards.length > 0,
    totalCards: cards.length
  };
}; 