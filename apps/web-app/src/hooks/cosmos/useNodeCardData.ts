/**
 * useNodeCardData Hook
 * Manages fetching and caching of card data for graph nodes
 */

import { useState, useEffect, useCallback } from 'react';
import { DisplayCard } from '@2dots1line/shared-types';
import { nodeCardMappingService, NodeCardData } from '../../services/nodeCardMappingService';

export interface UseNodeCardDataReturn {
  cardData: NodeCardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearData: () => void;
}

export interface UseNodeCardDataOptions {
  autoFetch?: boolean;
  cacheTimeout?: number;
  enableRelatedCards?: boolean;
}

export const useNodeCardData = (
  node: any,
  options: UseNodeCardDataOptions = {}
): UseNodeCardDataReturn => {
  const {
    autoFetch = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    enableRelatedCards = true
  } = options;

  const [cardData, setCardData] = useState<NodeCardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchCardData = useCallback(async () => {
    if (!node || !node.id) {
      setCardData(null);
      setError(null);
      return;
    }

    // Check if we need to refetch (cache timeout)
    const now = Date.now();
    if (cardData && (now - lastFetchTime) < cacheTimeout) {
      return; // Use cached data
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 useNodeCardData: Fetching card data for node:', node.id);
      
      const data = await nodeCardMappingService.getNodeCardData(node);
      
      setCardData(data);
      setLastFetchTime(now);
      
      console.log('🔍 useNodeCardData: Card data fetched:', {
        hasCard: !!data.card,
        relatedCardsCount: data.relatedCards.length,
        connectionsCount: data.connections.length
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch card data';
      setError(errorMessage);
      console.error('❌ useNodeCardData: Error fetching card data:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [node, cardData, lastFetchTime, cacheTimeout]);

  const clearData = useCallback(() => {
    setCardData(null);
    setError(null);
    setIsLoading(false);
    setLastFetchTime(0);
  }, []);

  const refetch = useCallback(async () => {
    setLastFetchTime(0); // Force refetch
    await fetchCardData();
  }, [fetchCardData]);

  // Auto-fetch when node changes
  useEffect(() => {
    if (autoFetch && node) {
      fetchCardData();
    }
  }, [node, autoFetch, fetchCardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optional: Clear cache when component unmounts
      // nodeCardMappingService.clearCache();
    };
  }, []);

  return {
    cardData,
    isLoading,
    error,
    refetch,
    clearData
  };
};

// Convenience hook for just the main card
export const useNodeCard = (
  node: any,
  options: UseNodeCardDataOptions = {}
): {
  card: DisplayCard | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  const { cardData, isLoading, error, refetch } = useNodeCardData(node, options);
  
  return {
    card: cardData?.card || null,
    isLoading,
    error,
    refetch
  };
}; 