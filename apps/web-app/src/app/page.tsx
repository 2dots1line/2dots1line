// top-level imports
'use client';

import { GlassmorphicPanel, GlassButton, InfiniteCardCanvas, CardTile } from '@2dots1line/ui-components';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
import { cardService } from '../services/cardService';

function HomePage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const { user, isAuthenticated, logout, initializeAuth, hasHydrated } = useUserStore();
  const { setActiveView, activeView, setCardDetailModalOpen } = useHUDStore();
  const { cards, loadCards, loadMoreCards, hasMore, isLoading, setSelectedCard, updateCardBackground, loadAllCards } = useCardStore();
  const { loadUserPreferences } = useBackgroundVideoStore();

  // UI state for sorting and cover prioritization
  const [sortKey, setSortKey] = useState<'newest' | 'oldest' | 'title_asc' | 'title_desc'>('newest');
  const [hasCoverFirst, setHasCoverFirst] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  // NEW: view mode
  const [viewMode, setViewMode] = useState<'infinite' | 'sorted'>('infinite');
  // Removed anchor pixel state and ref
  const [anchorPixel, setAnchorPixel] = useState<{ x: number; y: number } | null>(null);
  const anchorElRef = useRef<HTMLSpanElement>(null);

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

  // Automatically load cards when user is authenticated
  const { cardsLoaded, totalCards } = useAutoLoadCards();

  // Load cards when cards view becomes active
  useEffect(() => {
    if (isAuthenticated && activeView === 'cards') {
      // Fetch ALL cards to guarantee true oldest/newest across the whole DB
      loadAllCards();
    }
  }, [isAuthenticated, activeView, loadAllCards]);

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
  const handleCardSelect = useCallback(
    (card: any) => {
      setSelectedCard(card);
      setCardDetailModalOpen(true); // Open card detail modal over cards view
    },
    [setSelectedCard, setCardDetailModalOpen]
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
    const motif =
      (typeof card.title === 'string' && card.title.trim()) ||
      (typeof card.subtitle === 'string' && card.subtitle.trim()) ||
      (typeof card.display_data?.preview === 'string' && card.display_data.preview.trim()) ||
      card.card_type ||
      'abstract motif';

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

  // Compute sorted cards (base sort by sortKey)
  const baseSortedCards = useMemo(() => {
    if (!cards) return [] as any[];
    const arr = [...cards];
    arr.sort((a, b) => {
      const aCreated = a?.created_at ? new Date(a.created_at as any).getTime() : 0;
      const bCreated = b?.created_at ? new Date(b.created_at as any).getTime() : 0;
      const aTitle = (a?.title || '').toString().toLowerCase();
      const bTitle = (b?.title || '').toString().toLowerCase();
      switch (sortKey) {
        case 'oldest':
          return aCreated - bCreated;
        case 'title_asc':
          return aTitle.localeCompare(bTitle);
        case 'title_desc':
          return bTitle.localeCompare(aTitle);
        case 'newest':
        default:
          return bCreated - aCreated;
      }
    });
    return arr;
  }, [cards, sortKey]);

  const sortedCards = useMemo(() => {
    if (!hasCoverFirst) return baseSortedCards;
    const withCover = baseSortedCards.filter((c) => !!c.background_image_url);
    const withoutCover = baseSortedCards.filter((c) => !c.background_image_url);
    return [...withCover, ...withoutCover];
  }, [baseSortedCards, hasCoverFirst]);

  // NEW: Ensure no repetition in Sorted View
  const uniqueSortedCards = useMemo(() => {
    const seen = new Set<string>();
    return sortedCards.filter((c: any) => {
      const raw = c?.card_id ?? c?.id ?? c?._id ?? '';
      const id = String(raw);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [sortedCards]);

  // NEW: Search applies to Sorted View only
  const visibleSortedCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return uniqueSortedCards;
    return uniqueSortedCards.filter((c: any) => (c?.title || '').toLowerCase().includes(q));
  }, [uniqueSortedCards, searchQuery]);

  // NOTE: Infinite Canvas now uses the raw pool (no search filtering)
  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedCards;
    return sortedCards.filter((c) => (c?.title || '').toLowerCase().includes(q));
  }, [sortedCards, searchQuery]);

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
    <div className={`relative w-full ${viewMode === 'sorted' ? 'min-h-screen overflow-hidden' : 'h-dvh overflow-hidden'} bg-transparent`}>
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
                    <span className="ml-2 text-xs opacity-75">({totalCards} cards)</span>
                  )}
                </GlassmorphicPanel>
                {/* Logout Button */}
                <GlassButton onClick={handleLogout} className="text-onBackground font-brand">
                  Log out
                </GlassButton>
              </>
            ) : (
              <>
                {/* Login Button */}
                <GlassButton onClick={openLoginModal} className="text-onBackground font-brand">
                  Log in
                </GlassButton>
                {/* Signup Button */}
                <GlassButton onClick={openSignupModal} className="text-onBackground font-brand">
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
            <>
              {/* Manual-only toolbar for Cards view */}
              <div className="fixed z-40 top-20 left-4">
                <GlassmorphicPanel variant="glass-panel" rounded="lg" padding="sm">
                  <div className="flex items-center gap-3">
                    {/* removed: <span ref={anchorElRef} style={{ display: 'inline-block', width: 0, height: 0 }} /> */}
                    <div className="flex items-center gap-3 ml-4">
                      <label className="flex items-center gap-2 text-sm text-onSurface/80">
                        <input
                          type="checkbox"
                          checked={hasCoverFirst}
                          onChange={(e) => {
                            setHasCoverFirst(e.target.checked);
                            setViewMode('sorted');
                          }}
                        />
                        Covers first
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-onSurface/80">Sort by</span>
                        <select
                          className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm text-onSurface"
                          value={sortKey}
                          onChange={(e) => {
                            setSortKey(e.target.value as any);
                            setViewMode('sorted');
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
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name…"
                          className="ml-3 bg-transparent border border-white/20 rounded px-2 py-1 text-sm text-onSurface placeholder:text-onSurface/50 w-48"
                        />
                      )}

                      {viewMode === 'sorted' && (
                        <GlassButton
                          onClick={() => setViewMode('infinite')}
                          className="ml-2 text-onBackground font-brand"
                        >
                          Back to Infinite View
                        </GlassButton>
                      )}
                    </div>
                  </div>
                </GlassmorphicPanel>
              </div>

              {viewMode === 'infinite' ? (
                <InfiniteCardCanvas
                  cards={cards}
                  onCardSelect={handleCardSelect}
                  onLoadMore={loadMoreCards}
                  hasMore={hasMore}
                  className="z-30"
                />
              ) : (
                // Sorted View: Plain fixed overlay with its own scroll
                <div className="fixed inset-0 z-30 pt-28 pb-8 overflow-y-auto">
                  <div className="w-full px-[12px]">
                    {/* Auto-wrap with responsive tile size and gap; centered with small symmetric gutters */}
                    <div className="flex flex-wrap justify-center
                                    gap-[48px]
                                    max-[1600px]:gap-[43px]
                                    max-[1200px]:gap_[37px]
                                    max-[768px]:gap_[32px]
                                    max-[480px]:gap_[27px]">
                      {visibleSortedCards.map((card: any, idx: number) => (
                        <div
                          key={String(card.card_id ?? card.id ?? idx)}
                          className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition
                                     w-[200px] h-[200px]
                                     max-[1600px]:w-[180px] max-[1600px]:h-[180px]
                                     max-[1200px]:w-[160px] max-[1200px]:h-[160px]
                                     max-[768px]:w-[140px]  max-[768px]:h-[140px]
                                     max-[480px]:w-[120px]  max-[480px]:h-[120px]"
                          onClick={() => handleCardSelect(card)}
                          role="button"
                          aria-label={card?.title || 'Card'}
                        >
                          {/* Background image (cover or gradient) */}
                          {card?.background_image_url ? (
                            <img
                              src={card.background_image_url}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
                          )}
                          {/* Readability overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          {/* Text */}
                          <div className="absolute bottom-2 left-2 right-2 text-white">
                            <div className="text-sm font-semibold truncate">{card?.title || 'Card'}</div>
                            <div className="text-xs opacity-80 truncate">{card?.subtitle || card?.source_entity_type || ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal Container - Handles all modals (main views + overlays) */}
      {isAuthenticated && <ModalContainer />}

      {/* Authentication Modals - Layer 6 (highest) */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeModals} onSwitchToSignup={openSignupModal} />

      <SignupModal isOpen={isSignupModalOpen} onClose={closeModals} onSwitchToLogin={openLoginModal} />
    </div>
  );
}

export default HomePage;