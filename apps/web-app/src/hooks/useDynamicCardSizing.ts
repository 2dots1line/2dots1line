import { useState, useEffect } from 'react';

interface CardSizingConfig {
  cardSize: number;
  gapSize: number;
  cardsPerRow: number;
}

export const useDynamicCardSizing = (targetCardsPerRow: number = 3): CardSizingConfig => {
  const [sizing, setSizing] = useState<CardSizingConfig>({
    cardSize: 80,
    gapSize: 12,
    cardsPerRow: 3
  });

  useEffect(() => {
    const calculateSizing = () => {
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth <= 768;
      
      if (!isMobile) {
        // Desktop sizing - use default values
        setSizing({
          cardSize: 200,
          gapSize: 48,
          cardsPerRow: Math.floor(viewportWidth / 248) // Approximate cards per row
        });
        return;
      }

      // Mobile sizing - calculate for exactly targetCardsPerRow
      const padding = viewportWidth <= 480 ? 16 : 32; // Smaller padding for very small screens
      const availableWidth = viewportWidth - padding;
      
      // Calculate optimal card size and gap
      // Formula: availableWidth = (cardSize * cardsPerRow) + (gapSize * (cardsPerRow - 1))
      // We want to maximize card size while maintaining good proportions
      
      // Start with a base calculation
      const baseCardSize = availableWidth / (targetCardsPerRow + 0.5); // 0.5 accounts for gaps
      const baseGapSize = (availableWidth - (baseCardSize * targetCardsPerRow)) / (targetCardsPerRow - 1);
      
      // Apply constraints
      const minCardSize = viewportWidth <= 480 ? 50 : 60;
      const maxCardSize = Math.min(baseCardSize, 120); // Don't make cards too large
      const minGapSize = viewportWidth <= 480 ? 6 : 8;
      const maxGapSize = Math.min(baseGapSize, 20); // Don't make gaps too large
      
      const finalCardSize = Math.max(minCardSize, Math.min(maxCardSize, baseCardSize));
      const finalGapSize = Math.max(minGapSize, Math.min(maxGapSize, baseGapSize));
      
      setSizing({
        cardSize: finalCardSize,
        gapSize: finalGapSize,
        cardsPerRow: targetCardsPerRow
      });
    };

    calculateSizing();
    
    const handleResize = () => {
      calculateSizing();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetCardsPerRow]);

  return sizing;
};
