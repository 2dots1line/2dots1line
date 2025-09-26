'use client';
import React, { useEffect, useState, useMemo } from 'react';
import '../../styles/covers.css';
import { AdaptiveCardTile } from '../../components/cards/AdaptiveCardTile';
import type { BasicCardInput } from '../../components/cards/AdaptiveCardTile';
import { cardService } from '../../services/cardService';

export default function CardsPage() {
  // Include background_image_url so we can track baseline and hide pre-existing cards
  interface UICard extends BasicCardInput {
    background_image_url?: string | null;
    created_at?: string | Date | null;
  }

  const [cards, setCards] = useState<UICard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toGenerate, setToGenerate] = useState<Set<string>>(new Set());

  const [sortKey, setSortKey] = useState<'newest' | 'oldest' | 'title_asc' | 'title_desc'>('newest');
  const [hasCoverFirst, setHasCoverFirst] = useState(true);

  const sortedCards = useMemo(() => {
    const arr = [...cards];

    const getTime = (v: any) => {
      const t = v ? new Date(v).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };
    const getTitle = (c: UICard) => (c?.title || c?.content || '').toString();

    arr.sort((a, b) => {
      if (hasCoverFirst) {
        const bHas = b?.background_image_url ? 1 : 0;
        const aHas = a?.background_image_url ? 1 : 0;
        const hasCmp = bHas - aHas;
        if (hasCmp !== 0) return hasCmp;
      }

      switch (sortKey) {
        case 'newest':
          return getTime(b.created_at) - getTime(a.created_at);
        case 'oldest':
          return getTime(a.created_at) - getTime(b.created_at);
        case 'title_asc':
          return getTitle(a).localeCompare(getTitle(b), undefined, { sensitivity: 'base' });
        case 'title_desc':
          return getTitle(b).localeCompare(getTitle(a), undefined, { sensitivity: 'base' });
        default:
          return 0;
      }
    });
    return arr;
  }, [cards, sortKey, hasCoverFirst]);
  const baselineRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const resp = await cardService.getCards({ limit: 30 });
        if (!cancelled && resp.success && resp.cards && resp.cards.length > 0) {
          const list: UICard[] = resp.cards.map((c, idx) => ({
            id: c.card_id || `${c.title || 'card'}-${idx}`,
            title: c.title || (c as any).subtitle || 'Untitled',
            subtitle: (c as any).subtitle || null,
            content: c.content || '',
            background_image_url: (c as any).background_image_url || null,
            created_at: (c as any).created_at ?? null,
          }));
          setCards(list);
          setError(null);
        } else {
          if (!cancelled) {
            const demo = makeDemoCards().map(d => ({ ...d, background_image_url: null, created_at: null }));
            setCards(demo);
            setError(resp.error || 'Using demo cards (API unavailable)');
          }
        }
      } catch (e) {
        if (!cancelled) {
          const demo = makeDemoCards().map(d => ({ ...d, background_image_url: null, created_at: null }));
          setCards(demo);
          setError(e instanceof Error ? e.message : 'Using demo cards (fetch error)');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleRefresh() {
    try {
      setLoading(true);
      const resp = await cardService.getCards({ limit: 30 });
      if (resp.success && resp.cards) {
        const list: UICard[] = resp.cards.map((c, idx) => ({
          id: c.card_id || `${c.title || 'card'}-${idx}`,
          title: c.title || (c as any).subtitle || 'Untitled',
          subtitle: (c as any).subtitle || null,
          content: c.content || '',
          background_image_url: (c as any).background_image_url || null
        }));
        setCards(list);
        setError(null);
      } else {
        setError(resp.error || 'Failed to refresh cards');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh cards');
    } finally {
      setLoading(false);
    }
  }

  function handleGenerateOne() {
    try {
      if (typeof window !== 'undefined') {
        (window as any).__COVER_MANUAL = true;
        setTimeout(() => {
          try { (window as any).__COVER_MANUAL = false; } catch {}
        }, 120000);
      }

      const candidate = [...cards]
        .filter((c) => !c.background_image_url)
        .sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at as any).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at as any).getTime() : 0;
          return tb - ta;
        })[0];

      if (candidate?.id) {
        setToGenerate(new Set([candidate.id]));
      }
    } catch {
      // ignore
    }
  }

  const visibleCards = cards.filter(c => !baselineRef.current.has(c.id));

  return (
    <main className="covers-page">
      <h1 style={{ margin: '0 0 16px 0' }}>Cards</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleGenerateOne}
          style={{ padding: '8px 12px', borderRadius: 8, background: '#1f2937', color: 'white' }}
          aria-label="Generate cover for next card without a cover"
        >
          Generate 1 cover (next missing)
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          style={{ padding: '8px 12px', borderRadius: 8, background: '#374151', color: 'white' }}
          aria-label="Refresh cards"
        >
          Refresh
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, color: '#9CA3AF' }}>
          <input
            type="checkbox"
            checked={hasCoverFirst}
            onChange={(e) => setHasCoverFirst(e.target.checked)}
          />
          Covers first
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <span style={{ color: '#9CA3AF' }}>Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            style={{ background: 'transparent', border: '1px solid #ffffff33', borderRadius: 6, padding: '4px 8px', color: '#E5E7EB' }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title_asc">Title A–Z</option>
            <option value="title_desc">Title Z–A</option>
          </select>
        </div>

        <span style={{ marginLeft: 8, color: '#9CA3AF' }}>
          Showing {sortedCards.length} card{sortedCards.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p style={{ color: '#8a5700' }}>{error}</p> : null}
      <section className="covers-grid" aria-label="cards grid">
        <div className="cards-grid">
          {sortedCards.map((c) => (
            <AdaptiveCardTile
              key={c.id}
              card={c}
              generateCover={toGenerate.has(c.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function makeDemoCards(): BasicCardInput[] {
  const titles = [
    'Morning Clarity',
    'Shipped V1',
    'On Persistence',
    'Naming the Fear',
    'Deep Work Sprint',
    'Tiny Joy',
    'Bridging Gaps',
    'Letting Go',
    'Flow State',
    'Resilience Checkpoint',
    'Signal Over Noise',
    'Compassion Loop',
  ];
  return titles.map((t, i) => ({
    id: `demo-${i}`,
    title: t,
    content:
      'A short note about progress, reflections, and small wins. This demonstrates adaptive covers based on text.',
  }));
}