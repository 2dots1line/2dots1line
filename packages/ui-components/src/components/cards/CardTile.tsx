/**
 * CardTile - Individual card component matching sorted view styling with infinite view animations
 * V11.0 - Standardized to match sorted view appearance with infinite view hover effects
 */

import React, { useState, useRef, useEffect } from 'react';
import { DisplayCard } from '@2dots1line/shared-types';
import { useCardImage } from '../../hooks/cards/useCardImage';
import { useCardInteractions } from '../../hooks/cards/useCardInteractions';
import { cn } from '../../utils/cn';

// Card sizes
export type CardSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<CardSize, string> = {
  sm: 'w-40 h-40',    // Square like iOS icons
  md: 'w-50 h-50',    // Medium square
  lg: 'w-60 h-60'     // Large square
};

// Responsive sizing matching sorted view breakpoints
const RESPONSIVE_SIZE_CLASSES = {
  base: 'w-[200px] h-[200px]',
  'max-[1600px]': 'max-[1600px]:w-[180px] max-[1600px]:h-[180px]',
  'max-[1200px]': 'max-[1200px]:w-[160px] max-[1200px]:h-[160px]',
  'max-[768px]': 'max-[768px]:w-[140px] max-[768px]:h-[140px]',
  'max-[480px]': 'max-[480px]:w-[120px] max-[480px]:h-[120px]'
};

interface CardTileProps {
  card: DisplayCard;
  size?: CardSize;
  onClick?: () => void;
  onFavorite?: (card: DisplayCard) => void;
  onShare?: (card: DisplayCard) => void;
  onArchive?: (card: DisplayCard) => void;
  onBackgroundChange?: (card: DisplayCard, imageUrl: string) => void;
  onDetailView?: (card: DisplayCard) => void;
  isSelected?: boolean;
  isHovered?: boolean;
  showMetadata?: boolean;
  showActions?: boolean;
  className?: string;
  style?: React.CSSProperties; // Support for absolute positioning in infinite grid
  optimizeForInfiniteGrid?: boolean; // Performance optimizations for infinite grid
  useResponsiveSizing?: boolean; // Use responsive breakpoints instead of fixed sizes
}

export const CardTile: React.FC<CardTileProps> = ({
  card,
  size = 'md',
  onClick,
  onFavorite,
  onShare,
  onArchive,
  onBackgroundChange,
  onDetailView,
  isSelected = false,
  isHovered = false,
  showMetadata = true,
  showActions = true,
  className,
  style, // Positioning styles for infinite grid
  optimizeForInfiniteGrid = false, // Performance optimization flag
  useResponsiveSizing = false, // Use responsive breakpoints instead of fixed sizes
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Use card hooks
  const { imageUrl } = useCardImage(card);
  const { 
    handleCardClick, 
    handleCardHover, 
    handleCardHoverEnd,
    isCardLoading,
    isCardSelected,
    isCardHovered
  } = useCardInteractions({
    onCardClick: onClick,
    onCardHover: undefined,
    onCardFavorite: onFavorite,
    onCardShare: onShare,
    onCardArchive: onArchive,
    onBackgroundChange: onBackgroundChange,
    onDetailView: onDetailView,
  });

  // Determine display values
  const displayTitle = card.title || card.type?.replace(/_/g, ' ') || 'Card';
  const displaySubtitle = card.subtitle || card.source_entity_type?.replace(/_/g, ' ') || 'Item';
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  const handleImageError = () => {
    setImageLoaded(false);
  };

  // Animation and sizing helpers
  const getSizeClasses = () => {
    if (useResponsiveSizing) {
      return Object.values(RESPONSIVE_SIZE_CLASSES).join(' ');
    }
    return !optimizeForInfiniteGrid ? SIZE_CLASSES[size] : '';
  };

  const getHoverClasses = () => {
    // Match infinite view animation effects exactly
    return 'hover:-translate-y-3 hover:scale-[1.08] hover:shadow-[0_25px_80px_rgba(0,0,0,0.25),0_12px_30px_rgba(0,0,0,0.15)] hover:z-10';
  };

  const getBackgroundHoverClasses = () => {
    // Match infinite view background scaling exactly
    return 'hover:scale-[1.03]';
  };
  
  return (
    <div
      ref={cardRef}
      className={cn(
        'card-tile', // Base class for infinite grid CSS targeting
        'relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 ease-out',
        getSizeClasses(), // Use responsive or fixed sizing
        getHoverClasses(), // Infinite view hover effects
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-transparent',
        isHovered && 'scale-105 z-10',
        className
      )}
      style={style} // Apply positioning styles for infinite grid
      onClick={(e) => handleCardClick(card, e)}
      onMouseEnter={(e) => handleCardHover(card, e)}
      onMouseLeave={handleCardHoverEnd}
    >
      {/* Background image (cover or gradient) - exactly like sorted view */}
      {card.background_image_url ? (
        <img
          src={card.background_image_url}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-transform duration-300',
            getBackgroundHoverClasses()
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
      )}
      
      {/* Readability overlay - exactly like sorted view */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Text - exactly like sorted view */}
      <div className="absolute bottom-2 left-2 right-2 text-white">
        <div className="text-sm font-semibold truncate">{displayTitle}</div>
        <div className="text-xs opacity-80 truncate">{displaySubtitle}</div>
      </div>
      
      {/* Loading overlay */}
      {isCardLoading(card.card_id) && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};