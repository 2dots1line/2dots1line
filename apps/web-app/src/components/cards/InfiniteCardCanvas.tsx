import { Shuffle } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useEngagementStore } from '../../stores/EngagementStore';

import './InfiniteCardCanvas.css';

interface Card {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags?: string[];
  theme?: string;
}

interface CardDisplayProps {
  card: Card;
  onMakeover: (cardId: string) => void;
}

// Image collections for different themes
const imageCollections = {
  professional: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400',
    'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=400',
    'https://images.unsplash.com/photo-1600298882974-db5ae3a19c4c?w=400',
  ],
  dark: [
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
    'https://images.unsplash.com/photo-1603134872878-684f208fb84b?w=400',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400',
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400',
  ],
  vibrant: [
    'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=400',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  ],
};

// Generate sample cards with themed images
const generateCards = (count: number): Card[] => {
  const cards: Card[] = [];
  const themes = Object.keys(imageCollections) as Array<keyof typeof imageCollections>;
  
  for (let i = 0; i < count; i++) {
    const theme = themes[i % themes.length];
    const images = imageCollections[theme];
    const imageUrl = images[i % images.length];
    
    cards.push({
      id: `card-${i}`,
      title: `Card ${i + 1}`,
      description: `This is a sample description for card ${i + 1}. It demonstrates the glassmorphism effect with the video background visible through transparent areas.`,
      imageUrl,
      tags: [`tag${i % 3 + 1}`, `category${i % 4 + 1}`],
      theme,
    });
  }
  
  return cards;
};

const CardDisplay: React.FC<CardDisplayProps> = ({ card, onMakeover }) => {
  const { trackEvent } = useEngagementStore();

  const handleMakeover = () => {
    // Track card makeover click
    trackEvent({
      type: 'click',
      target: card.id,
      targetType: 'card',
      view: 'cards',
      metadata: {
        cardTitle: card.title,
        action: 'makeover'
      }
    });
    
    onMakeover(card.id);
  };

  const handleCardClick = () => {
    // Track card click
    trackEvent({
      type: 'click',
      target: card.id,
      targetType: 'card',
      view: 'cards',
      metadata: {
        cardTitle: card.title,
        action: 'card_click'
      }
    });
  };

  return (
    <div className="card-item" onClick={handleCardClick}>
      <div className="card-content">
        <div className="card-image-container relative">
          <Image
            src={card.imageUrl}
            alt={card.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="card-image object-cover"
            priority={false}
          />
          <button 
            className="makeover-button"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              handleMakeover();
            }}
            title="Give this card a makeover"
          >
            <Shuffle size={16} />
          </button>
        </div>
        <div className="card-details">
          <h3 className="card-title">{card.title}</h3>
          <p className="card-description">{card.description}</p>
          {card.tags && (
            <div className="card-tags">
              {card.tags.map((tag: string, index: number) => (
                <span key={index} className="card-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface InfiniteCardCanvasProps {
  onClose?: () => void;
}

export const InfiniteCardCanvas: React.FC<InfiniteCardCanvasProps> = ({ onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const { trackEvent } = useEngagementStore();

  useEffect(() => {
    // Generate initial cards
    const initialCards = generateCards(50);
    setCards(initialCards);
  }, []);

  // Track scroll events
  useEffect(() => {
    const handleScroll = () => {
      trackEvent({
        type: 'scroll',
        target: 'cards_container',
        targetType: 'modal',
        view: 'cards',
        metadata: {
          scrollPosition: containerRef.current?.scrollTop || 0,
          cardCount: cards.length
        }
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [trackEvent, cards.length]);

  const handleMakeover = useCallback((cardId: string) => {
    const themes = Object.keys(imageCollections) as Array<keyof typeof imageCollections>;
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomImages = imageCollections[randomTheme];
    const randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];

    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId 
          ? { ...card, imageUrl: randomImage, theme: randomTheme }
          : card
      )
    );
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Load more cards when near bottom
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      const newCards = generateCards(20);
      setCards(prevCards => [...prevCards, ...newCards]);
    }
  }, []);

  return (
    <div className="infinite-card-canvas">
      <div className="canvas-header">
        <h2>Card Collection</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>
      
      <div 
        ref={containerRef}
        className="cards-container"
        onScroll={handleScroll}
      >
        <div className="cards-grid">
          {cards.map((card: Card) => (
            <CardDisplay 
              key={card.id} 
              card={card} 
              onMakeover={handleMakeover}
            />
          ))}
        </div>
      </div>
    </div>
  );
};