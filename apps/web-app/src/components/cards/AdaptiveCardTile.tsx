import React from 'react';
import { decideAdaptiveCover } from '../../lib/adaptiveCover';
import { useGeneratedCover } from '../../hooks/cards/useGeneratedCover';

export interface BasicCardInput {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
}

interface AdaptiveCardTileProps {
  card: BasicCardInput;
  generateCover?: boolean;
}

export const AdaptiveCardTile: React.FC<AdaptiveCardTileProps> = ({ card: cardProp, generateCover = false }) => {
    // Safely default the incoming card so downstream code never crashes
    const card = (cardProp ?? { id: undefined, title: 'Untitled', description: '', subtitle: '' }) as any;

    const title = card.title ?? 'Untitled';
    const desc = card.description ?? '';
    const decision = decideAdaptiveCover(title, desc);

    // Generate style-pack cover only when requested
    const motif = card.title ?? card.subtitle ?? 'abstract motif';
    const gateOpen = typeof window !== 'undefined' && (window as any).__COVER_MANUAL === true;
    const { image: generatedCover } = useGeneratedCover({
        enabled: !!generateCover && gateOpen,
        cacheKey: card?.id ? `cover:${card.id}` : undefined,
        payload: {
            motif,
            style_pack: 'Wabi-Sabi Paper',
            constraints: ['centered', 'solid silhouette', 'no text', '1:1 aspect'],
            palette: { ink: '#2D2A2A', accent: '#D0A848' },
            export: { size: 1024, background: 'transparent', quality: 'medium' }
        }
    });

    const { updateCardBackground } = useCardStore();
    React.useEffect(() => {
      if (!generatedCover) return;
      if (!card?.id) return;
      const idStr = String(card.id);
      if (idStr.startsWith('demo-')) return;

      // ensure one persist attempt per card per page session
      const w: any = typeof window !== 'undefined' ? window : null;
      const saveKey = `cover-saved:${idStr}`;
      if (w) {
        w.__coverSaved = w.__coverSaved || {};
        if (w.__coverSaved[saveKey]) return;
        w.__coverSaved[saveKey] = true;
      }

      (async () => {
        try {
          await cardService.updateCardBackground({
            card_id: idStr,
            background_image_url: generatedCover
          });
          updateCardBackground(idStr, generatedCover);
        } catch (e) {
          console.error('Failed to persist generated cover for card', idStr, e);
          if (w && w.__coverSaved) {
            try { delete w.__coverSaved[saveKey]; } catch {}
          }
        }
      })();
    }, [generatedCover, card?.id, updateCardBackground]);

  return (
    <article
      className="cover-tile"
      aria-label={`Card: ${title}`}
      style={decision.bgStyle}
    >
      <div className="cover-content" style={{ position: 'relative' }}>
        {generatedCover ? (
          <img
            src={generatedCover}
            alt={motif}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none'
            }}
          />
        ) : null}
        <h3 className="cover-title" title={title}>{title}</h3>
        {desc ? <p className="cover-desc" title={desc}>{desc}</p> : null}

        <div className="cover-chips">
          <span className={`chip ${decision.source === 'generated' ? 'chip-amber' : 'chip-green'}`}>
            {decision.source === 'generated' ? 'Generated' : 'Retrieved'}
          </span>
          <span className="chip chip-gray">score {decision.score.toFixed(2)}</span>
          <span className="chip chip-blue">motif: {decision.motif}</span>
          {'seed' in decision ? (
            <>
              <span className="chip chip-purple">seed {decision.seed}</span>
              <span className="chip chip-slate">spec {decision.spec}</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
};

// Rename previously added duplicate definitions to avoid name clash
type GeneratedCoverProps = {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  generateCover?: boolean;
};

function GeneratedCoverOverlay(props: GeneratedCoverProps) {
  const motif = props.title || props.subtitle || 'abstract motif';
  const { image: generatedCover } = useGeneratedCover({
    enabled: !!props.generateCover,
    cacheKey: props.id ? `cover:${props.id}` : undefined,
    payload: {
      motif,
      style_pack: 'Wabi-Sabi Paper',
      constraints: ['centered', 'solid silhouette', 'no text', '1:1 aspect'],
      palette: { ink: '#2D2A2A', accent: '#D0A848' },
      export: { size: 1024, background: 'transparent', quality: 'medium' }
    }
  });

  return generatedCover ? (
    <img
      src={generatedCover}
      alt={motif}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none'
      }}
    />
  ) : null;
}
import { useCardStore } from '../../stores/CardStore';
import { cardService } from '../../services/cardService';