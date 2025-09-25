/**
 * useCardSearch - Hook for searching and filtering cards
 * V11.0 - Handles search functionality with local and API modes
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { DisplayCard } from '@2dots1line/shared-types';

// Card filter type (simplified version without app dependencies)
export interface CardFilter {
  status?: string;
  type?: string;
  favorited?: boolean;
  search?: string;
}

// Search modes
export type SearchMode = 'local' | 'remote' | 'hybrid';

// Sort options
export type SortOption = 'relevance' | 'title' | 'date_created' | 'date_updated' | 'type' | 'status';
export type SortOrder = 'asc' | 'desc';

// Advanced search operators
export interface SearchOperator {
  field: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
  value: string;
  caseSensitive?: boolean;
}

// Search configuration
export interface SearchConfig {
  mode: SearchMode;
  debounceMs: number;
  minQueryLength: number;
  maxResults: number;
  enableHighlighting: boolean;
  enableFuzzySearch: boolean;
  fuzzyThreshold: number;
}

// Search result with highlighting
export interface SearchResult {
  card: DisplayCard;
  score: number;
  highlights: {
    field: string;
    text: string;
    positions: { start: number; end: number }[];
  }[];
}

// Search state
interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  lastSearchTime: number;
}

// Filter state
interface FilterState {
  status: string | null;
  type: string | null;
  favorited: boolean | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  tags: string[];
  customFilters: Record<string, any>;
}

// Sort state
interface SortState {
  field: SortOption;
  order: SortOrder;
}

// Hook configuration
interface UseCardSearchConfig extends Partial<SearchConfig> {
  initialQuery?: string;
  initialFilters?: Partial<FilterState>;
  initialSort?: Partial<SortState>;
  cards?: DisplayCard[];
  onSearchComplete?: (results: SearchResult[]) => void;
  onError?: (error: string) => void;
}

/**
 * Calculate search relevance score
 */
function calculateRelevanceScore(card: DisplayCard, query: string): number {
  if (!query) return 0;
  
  const searchTerms = query.toLowerCase().split(/\s+/);
  let score = 0;
  
  // Title matches (highest weight)
  if (card.title) {
    const titleLower = card.title.toLowerCase();
    searchTerms.forEach(term => {
      if (titleLower.includes(term)) {
        score += titleLower.startsWith(term) ? 10 : 5;
      }
    });
  }
  
  // Description matches
  if (card.description) {
    const descLower = card.description.toLowerCase();
    searchTerms.forEach(term => {
      if (descLower.includes(term)) {
        score += 2;
      }
    });
  }
  
  // Type matches
  if (card.type) {
    const typeLower = card.type.toLowerCase();
    searchTerms.forEach(term => {
      if (typeLower.includes(term)) {
        score += 3;
      }
    });
  }
  
  // Source entity type matches
  if (card.source_entity_type) {
    const entityLower = card.source_entity_type.toLowerCase();
    searchTerms.forEach(term => {
      if (entityLower.includes(term)) {
        score += 2;
      }
    });
  }
  
  return score;
}

/**
 * Generate search highlights
 */
function generateHighlights(card: DisplayCard, query: string): SearchResult['highlights'] {
  if (!query) return [];
  
  const highlights: SearchResult['highlights'] = [];
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  // Helper to find term positions
  const findTermPositions = (text: string, term: string) => {
    const positions: { start: number; end: number }[] = [];
    const textLower = text.toLowerCase();
    let startIndex = 0;
    
    while (true) {
      const index = textLower.indexOf(term, startIndex);
      if (index === -1) break;
      
      positions.push({
        start: index,
        end: index + term.length
      });
      
      startIndex = index + 1;
    }
    
    return positions;
  };
  
  // Check title
  if (card.title) {
    const titlePositions: { start: number; end: number }[] = [];
    searchTerms.forEach(term => {
      titlePositions.push(...findTermPositions(card.title!, term));
    });
    
    if (titlePositions.length > 0) {
      highlights.push({
        field: 'title',
        text: card.title,
        positions: titlePositions.sort((a, b) => a.start - b.start)
      });
    }
  }
  
  // Check description
  if (card.description) {
    const descPositions: { start: number; end: number }[] = [];
    searchTerms.forEach(term => {
      descPositions.push(...findTermPositions(card.description!, term));
    });
    
    if (descPositions.length > 0) {
      highlights.push({
        field: 'description',
        text: card.description,
        positions: descPositions.sort((a, b) => a.start - b.start)
      });
    }
  }
  
  return highlights;
}

/**
 * Apply filters to cards
 */
function applyFilters(cards: DisplayCard[], filters: FilterState): DisplayCard[] {
  return cards.filter(card => {
    // Status filter
    if (filters.status && card.status !== filters.status) {
      return false;
    }
    
    // Type filter
    if (filters.type && card.type !== filters.type) {
      return false;
    }
    
    // Favorited filter
    if (filters.favorited !== null && card.is_favorited !== filters.favorited) {
      return false;
    }
    
    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const cardDate = new Date(card.created_at);
      if (filters.dateRange.start && cardDate < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange.end && cardDate > filters.dateRange.end) {
        return false;
      }
    }
    
    // Custom filters
    for (const [key, value] of Object.entries(filters.customFilters)) {
      if (value !== null && value !== undefined) {
        const cardValue = (card as any)[key];
        if (cardValue !== value) {
          return false;
        }
      }
    }
    
    return true;
  });
}

/**
 * Sort search results
 */
function sortResults(results: SearchResult[], sort: SortState): SearchResult[] {
  return [...results].sort((a, b) => {
    let comparison = 0;
    
    switch (sort.field) {
      case 'relevance':
        comparison = b.score - a.score;
        break;
      case 'title':
        comparison = (a.card.title || '').localeCompare(b.card.title || '');
        break;
      case 'date_created':
        comparison = new Date(a.card.created_at).getTime() - new Date(b.card.created_at).getTime();
        break;
      case 'date_updated':
        comparison = new Date(a.card.updated_at).getTime() - new Date(b.card.updated_at).getTime();
        break;
      case 'type':
        comparison = a.card.type.localeCompare(b.card.type);
        break;
      case 'status':
        comparison = a.card.status.localeCompare(b.card.status);
        break;
    }
    
    return sort.order === 'desc' ? -comparison : comparison;
  });
}

export function useCardSearch(config: UseCardSearchConfig = {}) {
  const {
    mode = 'hybrid',
    debounceMs = 300,
    minQueryLength = 2,
    maxResults = 100,
    enableHighlighting = true,
    enableFuzzySearch = false,
    fuzzyThreshold = 0.6,
    initialQuery = '',
    initialFilters = {},
    initialSort = { field: 'relevance', order: 'desc' },
    cards = [],
    onSearchComplete,
    onError
  } = config;
  
  // State
  const [searchState, setSearchState] = useState<SearchState>({
    query: initialQuery,
    results: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    hasMore: false,
    lastSearchTime: 0
  });
  
  const [filterState, setFilterState] = useState<FilterState>({
    status: null,
    type: null,
    favorited: null,
    dateRange: { start: null, end: null },
    tags: [],
    customFilters: {},
    ...initialFilters
  });
  
  const [sortState, setSortState] = useState<SortState>({
    field: 'relevance',
    order: 'desc',
    ...initialSort
  });
  
  // Refs
  const debounceTimeoutRef = useRef<number>();
  const abortControllerRef = useRef<AbortController>();
  const lastQueryRef = useRef(searchState.query);
  
  // Perform local search
  const performLocalSearch = useCallback(async (query: string, filters: FilterState): Promise<SearchResult[]> => {
    if (!query || query.length < minQueryLength) {
      return [];
    }
    
    // Apply filters first
    const filteredCards = applyFilters(cards, filters);
    
    // Calculate relevance and generate results
    const results: SearchResult[] = filteredCards
      .map(card => ({
        card,
        score: calculateRelevanceScore(card, query),
        highlights: enableHighlighting ? generateHighlights(card, query) : []
      }))
      .filter(result => result.score > 0)
      .slice(0, maxResults);
    
    return results;
  }, [cards, minQueryLength, maxResults, enableHighlighting]);
  
  // Perform remote search
  const performRemoteSearch = useCallback(async (query: string, filters: FilterState): Promise<SearchResult[]> => {
    if (!query || query.length < minQueryLength) {
      return [];
    }
    
    try {
      // This part of the code was removed as per the edit hint.
      // The original code had a dependency on cardService which is now removed.
      // The function signature was changed to remove the cardService import.
      // The implementation of this function is now incomplete.
      // For now, it will return an empty array as a placeholder.
      console.warn('Remote search functionality is not implemented yet.');
      return [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Search failed');
    }
  }, [minQueryLength, maxResults, enableHighlighting]);
  
  // Perform hybrid search
  const performHybridSearch = useCallback(async (query: string, filters: FilterState): Promise<SearchResult[]> => {
    if (!query || query.length < minQueryLength) {
      return [];
    }
    
    try {
      // Perform both local and remote searches
      const [localResults, remoteResults] = await Promise.all([
        performLocalSearch(query, filters),
        performRemoteSearch(query, filters)
      ]);
      
      // Merge results, preferring local when available
      const mergedResults = new Map<string, SearchResult>();
      
      // Add local results first
      localResults.forEach(result => {
        mergedResults.set(result.card.card_id, result);
      });
      
      // Add remote results if not already present
      remoteResults.forEach(result => {
        if (!mergedResults.has(result.card.card_id)) {
          mergedResults.set(result.card.card_id, result);
        }
      });
      
      return Array.from(mergedResults.values()).slice(0, maxResults);
    } catch (error) {
      // Fall back to local search if remote fails
      console.warn('Remote search failed, falling back to local:', error);
      return performLocalSearch(query, filters);
    }
  }, [minQueryLength, maxResults, performLocalSearch, performRemoteSearch]);
  
  // Main search function
  const performSearch = useCallback(async (query: string, filters: FilterState) => {
    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastSearchTime: Date.now()
    }));
    
    try {
      let results: SearchResult[];
      
      switch (mode) {
        case 'local':
          results = await performLocalSearch(query, filters);
          break;
        case 'remote':
          results = await performRemoteSearch(query, filters);
          break;
        case 'hybrid':
          results = await performHybridSearch(query, filters);
          break;
      }
      
      // Sort results
      const sortedResults = sortResults(results, sortState);
      
      setSearchState(prev => ({
        ...prev,
        results: sortedResults,
        isLoading: false,
        totalCount: sortedResults.length,
        hasMore: sortedResults.length === maxResults
      }));
      
      onSearchComplete?.(sortedResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        results: [],
        totalCount: 0,
        hasMore: false
      }));
      
      onError?.(errorMessage);
    }
  }, [mode, sortState, maxResults, performLocalSearch, performRemoteSearch, performHybridSearch, onSearchComplete, onError]);
  
  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = window.setTimeout(() => {
      if (query !== lastQueryRef.current) {
        lastQueryRef.current = query;
        performSearch(query, filterState);
      }
    }, debounceMs);
  }, [performSearch, filterState, debounceMs]);
  
  // Update query
  const setQuery = useCallback((query: string) => {
    setSearchState(prev => ({
      ...prev,
      query
    }));
    
    if (query.length === 0) {
      // Clear results immediately for empty query
      setSearchState(prev => ({
        ...prev,
        results: [],
        totalCount: 0,
        hasMore: false,
        isLoading: false,
        error: null
      }));
    } else {
      debouncedSearch(query);
    }
  }, [debouncedSearch]);
  
  // Update filters
  const setFilters = useCallback((filters: Partial<FilterState>) => {
    setFilterState(prev => {
      const newFilters = { ...prev, ...filters };
      
      // Trigger search if query exists
      if (searchState.query) {
        performSearch(searchState.query, newFilters);
      }
      
      return newFilters;
    });
  }, [searchState.query, performSearch]);
  
  // Update sort
  const setSort = useCallback((sort: Partial<SortState>) => {
    setSortState(prev => {
      const newSort = { ...prev, ...sort };
      
      // Re-sort existing results
      if (searchState.results.length > 0) {
        const sortedResults = sortResults(searchState.results, newSort);
        setSearchState(prevSearch => ({
          ...prevSearch,
          results: sortedResults
        }));
      }
      
      return newSort;
    });
  }, [searchState.results]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setSearchState({
      query: '',
      results: [],
      isLoading: false,
      error: null,
      totalCount: 0,
      hasMore: false,
      lastSearchTime: 0
    });
  }, []);
  
  // Clear filters
  const clearFilters = useCallback(() => {
    setFilterState({
      status: null,
      type: null,
      favorited: null,
      dateRange: { start: null, end: null },
      tags: [],
      customFilters: {}
    });
  }, []);
  
  // Get filtered cards without search
  const filteredCards = useMemo(() => {
    if (!searchState.query) {
      return applyFilters(cards, filterState);
    }
    return searchState.results.map(result => result.card);
  }, [cards, filterState, searchState.query, searchState.results]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return {
    // State
    query: searchState.query,
    results: searchState.results,
    filteredCards,
    isLoading: searchState.isLoading,
    error: searchState.error,
    totalCount: searchState.totalCount,
    hasMore: searchState.hasMore,
    
    // Filters and sorting
    filters: filterState,
    sort: sortState,
    
    // Actions
    setQuery,
    setFilters,
    setSort,
    clearSearch,
    clearFilters,
    
    // Utilities
    hasQuery: searchState.query.length > 0,
    hasResults: searchState.results.length > 0,
    hasFilters: Object.values(filterState).some(value => 
      value !== null && value !== undefined && 
      (Array.isArray(value) ? value.length > 0 : true)
    ),
    isEmpty: searchState.results.length === 0 && !searchState.isLoading,
    
    // Statistics
    resultCount: searchState.results.length,
    searchTime: searchState.lastSearchTime
  };
} 