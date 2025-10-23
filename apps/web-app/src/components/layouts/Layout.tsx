'use client';

import { GlassmorphicPanel, GlassButton, InfiniteCardCanvas, CardTile } from '@2dots1line/ui-components';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { HUDContainer } from '../hud/HUDContainer';
import { ConversationHistoryPanel } from '../hud/ConversationHistoryPanel';
import LoginModal from '../modal/LoginModal';
import { ModalContainer } from '../modal/ModalContainer';
import SignupModal from '../modal/SignupModal';
import { DynamicBackground } from '../DynamicBackground';
import { MediumChat, MiniChat } from '../chat';
import { useCardStore } from '../../stores/CardStore';
import { useHUDStore } from '../../stores/HUDStore';
import { useUserStore } from '../../stores/UserStore';
import { useBackgroundVideoStore } from '../../stores/BackgroundVideoStore';
import { useEngagementStore } from '../../stores/EngagementStore';
import { useCardsViewStore } from '../../stores/CardsViewStore';
import { cardService } from '../../services/cardService';
import styles from './Layout.module.css';
import { useViewTransitionContent } from '../../hooks/useViewTransitionContent';
import PWAInstallPrompt from '../pwa/PWAInstallPrompt';
import { useDeviceStore } from '../../stores/DeviceStore';
import { useDynamicCardSizing } from '../../hooks/useDynamicCardSizing';

function Layout() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const { deviceInfo } = useDeviceStore();
  const { cardSize, gapSize } = useDynamicCardSizing(3);

  const { user, isAuthenticated, logout, hasHydrated } = useUserStore();
  const { 
    setActiveView, 
    activeView, 
    setCardDetailModalOpen, 
    isNavigatingFromCosmos,
    cardsChatOpen,
    cardsChatSize,
    setCardsChatSize
  } = useHUDStore();
  const { trackEvent } = useEngagementStore();
  const { 
    cards, 
    isLoading, 
    setSelectedCard, 
    updateCardBackground, 
    initializeRandomLoader,
    initializeSortedLoader,
    loadMoreRandomCards, 
    loadMoreSortedCards,
    clearCards
  } = useCardStore();
  
  // Access loaders reactively with selectors
  const sortedLoader = useCardStore(state => state.sortedLoader);
  const randomLoader = useCardStore(state => state.randomLoader);
  const { loadUserPreferences } = useBackgroundVideoStore();
  
  // Cards view settings from store
  const { viewMode, sortKey, hasCoverFirst, searchQuery, setViewMode, setSortKey, setHasCoverFirst, setSearchQuery } = useCardsViewStore();

  // Removed anchor pixel state and ref
  const [anchorPixel, setAnchorPixel] = useState<{ x: number; y: number } | null>(null);
  const anchorElRef = useRef<HTMLSpanElement>(null);
  const sortedViewRef = useRef<HTMLDivElement>(null);

  // Handle transition content for chat view
  useViewTransitionContent(
    'chat',
    false, // chat is always loaded
    activeView === 'chat' // only ready when chat view is active
  );
  
  // Handle transition content for cards view
  useViewTransitionContent(
    'cards',
    isLoading && cards.length === 0, // loading state
    activeView === 'cards' && cards.length > 0 // ready when cards loaded
  );
  
  // Handle transition content for dashboard view
  useViewTransitionContent(
    'dashboard',
    false, // dashboard is always loaded
    activeView === 'dashboard' // only ready when dashboard view is active
  );

  useEffect(() => {
    const updateAnchor = () => {
      const el = anchorElRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Offset below the button so the first card never hides under the toolbar
      setAnchorPixel({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    };
    updateAnchor();
    window.addEventListener('resize', updateAnchor);
    return () => window.removeEventListener('resize', updateAnchor);
  }, []);

  // Single source of automatic initialization - uses ref to run only once per view session
  const hasInitializedCards = useRef(false);

  useEffect(() => {
    // Only initialize when:
    // 1. User is authenticated
    // 2. In cards view
    // 3. Sorted view mode
    // 4. No loader exists yet
    // 5. Haven't initialized this session
    if (
      isAuthenticated && 
      activeView === 'cards' && 
      viewMode === 'sorted' && 
      !sortedLoader && 
      !isLoading &&
      !hasInitializedCards.current
    ) {
      console.log('[Layout] Initial load - Creating loader with current UI state:', {
        sortKey,
        hasCoverFirst
      });
      hasInitializedCards.current = true;
      initializeSortedLoader(sortKey, hasCoverFirst);
    }
    
    // Reset flag when leaving cards view
    if (activeView !== 'cards') {
      hasInitializedCards.current = false;
    }
  }, [isAuthenticated, activeView, viewMode, sortedLoader, isLoading, sortKey, hasCoverFirst, initializeSortedLoader]);

  // Debug: Log when loader changes
  useEffect(() => {
    console.log('[Layout] Loader state changed:', {
      hasLoader: !!sortedLoader,
      cards: cards.length,
      sortKey,
      hasCoverFirst,
      isLoading
    });
  }, [sortedLoader, cards.length, sortKey, hasCoverFirst, isLoading]);

  // Clear cards only when switching to heavy views (cosmos) to prevent memory issues
  useEffect(() => {
    if (isAuthenticated && activeView === 'cosmos') {
      console.log('[Layout] Switching to cosmos view - clearing cards to prevent memory issues');
      clearCards();
    }
  }, [isAuthenticated, activeView, clearCards]);

  // Handle loading more cards based on view mode
  const handleLoadMore = useCallback(async () => {
    if (viewMode === 'infinite') {
      await loadMoreRandomCards();
    } else {
      await loadMoreSortedCards();
    }
  }, [viewMode, loadMoreRandomCards, loadMoreSortedCards]);

  // Check if there are more cards to load - REACTIVE to loader instances
  const hasMore = useMemo(() => {
    if (viewMode === 'infinite') {
      return randomLoader?.hasMore() || false;
    } else {
      return sortedLoader?.hasMoreCards() || false;
    }
  }, [viewMode, sortedLoader, randomLoader]);

  // Handle infinite scroll for sorted view
  const handleSortedScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
    
    if (isNearBottom && hasMore && !isLoading && viewMode === 'sorted') {
      console.log('[Layout] Near bottom - triggering load more');
      handleLoadMore();
    }
  }, [hasMore, isLoading, viewMode, handleLoadMore]);

  // Initialize authentication state ONCE on component mount
  useEffect(() => {
    console.log('=== Layout useEffect MOUNT - Calling initializeAuth ===');
    // Call initializeAuth directly from store to avoid subscribing to store updates
    useUserStore.getState().initializeAuth();
    
    // Fallback: Force hydration after 2 seconds if it hasn't completed
    const hydrationTimeout = setTimeout(() => {
      const currentHasHydrated = useUserStore.getState().hasHydrated;
      if (!currentHasHydrated) {
        console.log('Layout - Forcing hydration due to timeout');
        useUserStore.getState().setHasHydrated(true);
      }
    }, 2000);

    return () => clearTimeout(hydrationTimeout);
  }, []); // Empty dependency array - run ONCE on mount only

  // Separate effect to log auth state changes for debugging (optional)
  useEffect(() => {
    console.log('Layout - Auth state changed:', { user: user?.user_id, isAuthenticated, hasHydrated });
  }, [user, isAuthenticated, hasHydrated]);

  // Load video preferences when user is authenticated
  useEffect(() => {
    if (isAuthenticated && hasHydrated) {
      loadUserPreferences();
    }
  }, [isAuthenticated, hasHydrated, loadUserPreferences]);

  // Auto-open dashboard when user is authenticated and no view is active
  // Only run this on initial page load, not when navigating from cosmos
  useEffect(() => {
    if (isAuthenticated && hasHydrated && !activeView && !isNavigatingFromCosmos) {
      setActiveView('dashboard');
    }
  }, [isAuthenticated, hasHydrated, activeView, setActiveView, isNavigatingFromCosmos]);

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
  const handleCardSelect = useCallback(
    (card: any) => {
      // Track card click in cards view
      trackEvent({
        type: 'click',
        target: card.title || card.name || card.card_id || 'unknown_card',
        targetType: 'card',
        view: 'cards',
        metadata: {
          cardId: card.card_id || card.id,
          cardTitle: card.title || card.name,
          action: 'card_select',
          source: 'cards_view'
        }
      });

      setSelectedCard(card);
      setCardDetailModalOpen(true); // Open card detail modal over cards view
    },
    [setSelectedCard, setCardDetailModalOpen, trackEvent]
  );

  // Strictly manual cover generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  // Helper: sleep
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Helper: Parse Retry-After header (seconds or HTTP-date)
  const parseRetryAfter = (retryAfter: string | null): number | null => {
    if (!retryAfter) return null;
    const s = retryAfter.trim();
    const secs = Number(s);
    if (!Number.isNaN(secs)) return Math.max(0, secs) * 1000;
    const dateMs = Date.parse(s);
    if (!Number.isNaN(dateMs)) {
      const delay = dateMs - Date.now();
      return delay > 0 ? delay : 0;
    }
    return null;
  };

  // Helper: Generate cover for a single card with conservative retries/backoff
  const generateCoverForCard = async (card: any) => {
    // Build motif from title and content/description for richer context
    const titlePart = (typeof card.title === 'string' && card.title.trim()) ||
                      (typeof card.subtitle === 'string' && card.subtitle.trim()) || '';
    const contentPart = (typeof card.display_data?.preview === 'string' && card.display_data.preview.trim()) || '';
    
    const motif = titlePart && contentPart 
      ? `${titlePart}: ${contentPart}`
      : titlePart || contentPart || card.type || 'abstract motif';

    const payload = {
      motif,
      style_pack: 'Wabi-Sabi Paper',
      constraints: ['centered', 'solid silhouette', 'no text', '1:1 aspect'],
      palette: { ink: '#2D2A2A', accent: '#D0A848' },
      export: { size: 1024, background: 'transparent', quality: 'medium' },
      cacheKey: card.card_id ? `cover:${card.card_id}` : undefined,
    };

    const maxAttempts = 2; // keep it conservative
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch('/api/covers/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const image: string | undefined = data?.image;
          if (image) return image;
          // no image -> retry below
        } else {
          // Abort on clear quota/server-unavailable signals
          if (res.status === 503) return null;

          // Try to read response body to detect RESOURCE_EXHAUSTED
          let body = '';
          try {
            body = await res.text();
          } catch {
            body = '';
          }
          if (body && /RESOURCE_EXHAUSTED|QuotaFailure|rate[- ]?limit/i.test(body)) {
            console.warn('Cover generation aborted due to quota exhaustion.');
            return null;
          }

          // Respect Retry-After if present (e.g., 429)
          const retryAfterMs = parseRetryAfter(res.headers.get('Retry-After'));
          if (retryAfterMs != null) {
            await sleep(retryAfterMs);
          } else {
            // Backoff with jitter
            const base = Math.pow(2, attempt) * 300;
            const jitter = Math.floor(Math.random() * 250);
            await sleep(base + jitter);
          }
        }
      } catch {
        // Network error -> small backoff then retry
        const base = Math.pow(2, attempt) * 300;
        const jitter = Math.floor(Math.random() * 250);
        await sleep(base + jitter);
      }
    }
    return null;
  };

  // Manual: Generate one cover per click (pick newest missing cover)
  const handleGenerateOne = useCallback(async () => {
    if (isGenerating) return;
    if (!cards || cards.length === 0) return;

    const getTime = (v: any) => {
      const t = v ? new Date(v as any).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };

    const target =
      [...cards]
        .filter((c) => !c.background_image_url)
        .sort((a, b) => getTime(b?.created_at) - getTime(a?.created_at))[0] || null;

    if (!target) {
      console.log('No cards need cover generation.');
      return;
    }

    setIsGenerating(true);
    try {
      const image = await generateCoverForCard(target);
      if (image) {
        // Optimistic update so UI shows immediately
        updateCardBackground(target.card_id, image);

        // Persist to backend
        try {
          await cardService.updateCardBackground({
            card_id: String(target.card_id),
            background_image_url: image,
          });

          // Optional: verify persistence (logs result)
          try {
            const verify = await cardService.getCard(String(target.card_id));
            if (verify?.success && verify?.card?.background_image_url === image) {
              console.info('Cover persisted and verified for card', target.card_id);
            } else {
              console.warn('Cover persistence verification failed for card', target.card_id, verify);
            }
          } catch (vErr) {
            console.warn('Verification request failed for card', target.card_id, vErr);
          }
        } catch (err) {
          console.error('Failed to persist generated cover for card', target.card_id, err);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  }, [cards, isGenerating, updateCardBackground]);

  // Manual only: Triggered by button click
  const handleGenerateBatch = useCallback(async () => {
    if (isGenerating) return;
    if (!cards || cards.length === 0) return;

    // Determine up to 10 newest cards without background image
    const sorted = [...cards].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at as any).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at as any).getTime() : 0;
      return bTime - aTime;
    });
    const targets = sorted.filter((c) => !c.background_image_url).slice(0, 10);

    if (targets.length === 0) {
      console.log('No cards need cover generation.');
      return;
    }

    setIsGenerating(true);
    setProgress({ done: 0, total: targets.length });

    // Process sequentially to avoid rate-limit spikes
    for (let i = 0; i < targets.length; i++) {
      const card = targets[i];
      const image = await generateCoverForCard(card);
      if (image) {
        // Optimistic update so UI shows immediately
        updateCardBackground(card.card_id, image);

        // Persist to backend
        try {
          await cardService.updateCardBackground({
            card_id: String(card.card_id),
            background_image_url: image,
          });
        } catch (err) {
          console.error('Failed to persist generated cover for card', card.card_id, err);
        }
      }
      setProgress({ done: i + 1, total: targets.length });
    }

    // Refresh the page to show generated images (as requested)
    try {
      window.location.reload();
    } catch {
      // Fallback no-op
    } finally {
      setIsGenerating(false);
    }
  }, [cards, isGenerating, updateCardBackground]);

  // Return cards as-is from backend - NO client-side sorting
  // Backend already handles both coverFirst and sortKey sorting correctly
  // Client-side re-sorting causes visual "snapping" during pagination
  const baseSortedCards = useMemo(() => {
    // CRITICAL: Don't process cards if we're not in cards view
    if (activeView !== 'cards' || !cards || cards.length === 0) return [] as any[];
    
    // Return cards in the exact order received from backend
    // This preserves pagination order and prevents snapping
    return cards;
  }, [cards, activeView]);

  // Search state for backend search
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Perform backend search when search query changes
  useEffect(() => {
    const performSearch = async () => {
      const q = searchQuery.trim();
      if (!q) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await cardService.searchCards(q, 100);
        if (response.success && response.cards) {
          setSearchResults(response.cards);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Consolidated card transformations: deduplicate + search filter
  const visibleCards = useMemo(() => {
    // CRITICAL: Don't process cards if we're not in cards view
    if (activeView !== 'cards') return [] as any[];
    
    // 1. Deduplicate cards
    const seen = new Set<string>();
    const unique = baseSortedCards.filter((c: any) => {
      const id = String(c?.card_id ?? '');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    
    // 2. Apply search filter
    const q = searchQuery.trim().toLowerCase();
    if (!q) return unique;
    
    // Use backend search results if available
    if (searchResults.length > 0) return searchResults;
    
    // Fallback to local filter
    return unique.filter((c: any) => (c?.title || '').toLowerCase().includes(q));
  }, [baseSortedCards, activeView, searchQuery, searchResults]);

  // For infinite canvas view (uses raw cards)
  const infiniteCanvasCards = useMemo(() => {
    if (activeView !== 'cards') return [] as any[];
    return cards;
  }, [cards, activeView]);

  // Don't render auth-dependent UI until hydration is complete
  if (!hasHydrated) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <DynamicBackground view="dashboard" />
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div>Verifying your session...</div>
          </div>
        </main>
      </div>
    );
  }

  // Determine which view is active for background video
  const currentView = activeView || 'dashboard';

  return (
    <div className={`relative w-full ${viewMode === 'sorted' ? 'min-h-screen overflow-hidden' : 'h-dvh overflow-hidden'} bg-transparent`}>
      {/* Background Media - Layer 1 (bottom) */}
      <DynamicBackground view={currentView} />

      {/* Main Content - Layer 2 (top) */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Top-right Navigation - Only show login/signup on landing page */}
        {!isAuthenticated && (
          <nav className="absolute top-0 right-0 p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-4">
              {/* Login Button */}
              <GlassButton onClick={openLoginModal} className="text-onBackground font-brand">
                Log in
              </GlassButton>
              {/* Signup Button */}
              <GlassButton onClick={openSignupModal} className="text-onBackground font-brand">
                Sign up
              </GlassButton>
            </div>
          </nav>
        )}

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

      {/* Navigation HUD - Layer 3 - Desktop only */}
      {isAuthenticated && !deviceInfo.isMobile && <HUDContainer />}

      {/* Conversation History Panel - Layer 3 - Only show in chat view on desktop */}
      {isAuthenticated && activeView === 'chat' && !deviceInfo.isMobile && <ConversationHistoryPanel />}

      {/* Main Views - Layer 4 (z-30) - Mutually Exclusive */}
      {isAuthenticated && activeView === 'cards' && (
        <>
          {/* Only show loading overlay during INITIAL load (no cards yet) */}
          {/* During pagination, keep scroll container mounted to preserve scroll position */}
          {isLoading && cards.length === 0 ? (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <div className="text-white text-xl">Loading your cards...</div>
                <div className="text-white/70 text-sm mt-2">This won't block tab switching</div>
              </div>
            </div>
          ) : (
            <>
              {/* Manual-only toolbar for Cards view - Hidden on mobile */}
              <div className="fixed z-40 top-4 left-4 hidden md:block">
                <GlassmorphicPanel variant="glass-panel" rounded="lg" padding="sm">
                  <div className="flex items-center gap-3">
                    {/* removed: <span ref={anchorElRef} style={{ display: 'inline-block', width: 0, height: 0 }} /> */}
                    <div className="flex items-center gap-3 ml-4">
                      <label className="flex items-center gap-2 text-sm text-onSurface/80">
                        <input
                          type="checkbox"
                          checked={hasCoverFirst}
                          onChange={async (e) => {
                            const newCoverFirst = e.target.checked;
                            setHasCoverFirst(newCoverFirst);
                            setViewMode('sorted');
                            // Force reinitialize with new cover setting (will clear and reload)
                            await initializeSortedLoader(sortKey, newCoverFirst, true);
                          }}
                        />
                        Covers first
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-onSurface/80">Sort by</span>
                        <select
                          className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm text-onSurface"
                          value={sortKey}
                          onChange={async (e) => {
                            const newSortKey = e.target.value as any;
                            setSortKey(newSortKey);
                            setViewMode('sorted');
                            // Force reinitialize with new sort key (will clear and reload)
                            await initializeSortedLoader(newSortKey, hasCoverFirst, true);
                          }}
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                          <option value="title_asc">Title A–Z</option>
                          <option value="title_desc">Title Z–A</option>
                        </select>
                      </div>

                      {/* New: explicit trigger to open Sorted View even when value hasn't changed */}
                      {viewMode !== 'sorted' && (
                        <GlassButton
                          onClick={() => setViewMode('sorted')}
                          className="ml-2 text-onBackground font-brand"
                          aria-label="Open Sorted View"
                        >
                          Sort
                        </GlassButton>
                      )}

                      {viewMode === 'sorted' && (
                        <div className="ml-3 relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name…"
                            className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm text-onSurface placeholder:text-onSurface/50 w-48 pr-8"
                          />
                          {isSearching && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            </div>
                          )}
                          {!isSearching && searchQuery.trim() && searchResults.length > 0 && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white/70">
                              {searchResults.length}
                            </div>
                          )}
                        </div>
                      )}

                      {viewMode === 'sorted' && (
                        <GlassButton
                          onClick={() => setViewMode('infinite')}
                          className="ml-2 text-onBackground font-brand"
                        >
                          Go to Infinite View
                        </GlassButton>
                      )}
                    </div>
                  </div>
                </GlassmorphicPanel>
              </div>

              {viewMode === 'infinite' ? (
                <InfiniteCardCanvas
                  cards={infiniteCanvasCards}
                  onCardSelect={handleCardSelect}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  className="z-30"
                />
              ) : (
                // Sorted View: Plain fixed overlay with its own scroll
                <div 
                  ref={sortedViewRef}
                  className="fixed inset-0 z-30 pt-28 pb-8 overflow-y-auto"
                  onScroll={handleSortedScroll}
                >
                  <div className="w-full px-[12px] max-[768px]:px-[4px]">
                    {/* Auto-wrap with responsive tile size and gap; centered with small symmetric gutters */}
                    <div 
                      className={`flex flex-wrap justify-center
                                  gap-[48px]
                                  max-[1600px]:gap-[43px]
                                  max-[1200px]:gap-[37px]
                                  max-[768px]:justify-start
                                  max-[768px]:px-2
                                  ${styles.mobileSortedCards}`}
                      style={{
                        gap: deviceInfo.isMobile ? `${gapSize}px` : undefined,
                        '--mobile-card-size': deviceInfo.isMobile ? `${cardSize}px` : undefined,
                        '--mobile-gap-size': deviceInfo.isMobile ? `${gapSize}px` : undefined,
                      } as React.CSSProperties}
                    >
                      {visibleCards.map((card: any, idx: number) => (
                        <CardTile
                          key={String(card.card_id ?? card.id ?? idx)}
                          card={card}
                          useResponsiveSizing={true}
                          onClick={() => handleCardSelect(card)}
                          showActions={false}
                          showMetadata={true}
                        />
                      ))}
                    </div>
                    
                    {/* Pagination loading indicator - shows at bottom when loading more */}
                    {isLoading && cards.length > 0 && (
                      <div className="flex justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50 mx-auto mb-2"></div>
                          <div className="text-white/60 text-sm">Loading more cards...</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Chat Components for Cards View - Desktop only */}
          {isAuthenticated && !deviceInfo.isMobile && activeView === 'cards' && cardsChatOpen && (
            <div className="fixed inset-0 z-[1010] pointer-events-none">
              {cardsChatSize === 'medium' ? (
                <MediumChat 
                  isOpen={cardsChatOpen}
                  onSizeChange={setCardsChatSize}
                />
              ) : (
                <MiniChat 
                  isOpen={cardsChatOpen}
                  onSizeChange={setCardsChatSize}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Container - Handles all modals (main views + overlays) */}
      {isAuthenticated && <ModalContainer />}

      {/* Authentication Modals - Layer 6 (highest) */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeModals} onSwitchToSignup={openSignupModal} />

      <SignupModal isOpen={isSignupModalOpen} onClose={closeModals} onSwitchToLogin={openLoginModal} />

      {/* PWA Install Prompt - Layer 7 (highest) */}
      <PWAInstallPrompt />
    </div>
  );
}

export default Layout;
