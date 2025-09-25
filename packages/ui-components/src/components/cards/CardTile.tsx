/**
 * CardTile - Individual card component with glassmorphic design
 * V11.0 - Adapted from prototype with intelligent image selection
 */

import React, { useState, useRef, useEffect } from 'react';
import { Heart, Share2, Archive, Image, MoreHorizontal } from 'lucide-react';
import GlassmorphicPanel from '../GlassmorphicPanel';
import GlassButton from '../GlassButton';
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

const IMAGE_CLASSES: Record<CardSize, string> = {
  sm: 'h-28',  // Most of the card is image
  md: 'h-36',  // Most of the card is image
  lg: 'h-44'   // Most of the card is image
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
  style?: React.CSSProperties; // NEW: Support for absolute positioning in infinite grid
  optimizeForInfiniteGrid?: boolean; // NEW: Performance optimizations for infinite grid
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
  style, // NEW: Positioning styles for infinite grid
  optimizeForInfiniteGrid = false // NEW: Performance optimization flag
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Use card hooks
  const { imageUrl, suggestedImages } = useCardImage(card);
  
  // Set imageLoaded to true immediately for CSS gradients
  useEffect(() => {
    if (imageUrl && (imageUrl.startsWith('linear-gradient') || imageUrl.startsWith('radial-gradient'))) {
      setImageLoaded(true);
    }
  }, [imageUrl]);
  const {
    handleCardClick,
    handleCardHover,
    handleCardHoverEnd,
    handleCardFavorite,
    handleCardShare,
    handleCardArchive,
    handleBackgroundChangeStart,
    handleDetailView,
    isCardLoading,
    isCardHovered,
    isCardSelected
  } = useCardInteractions({
    onCardClick: onClick,
    onCardFavorite: onFavorite,
    onCardShare: onShare,
    onCardArchive: onArchive,
    onBackgroundChange,
    onDetailView
  });
  
  // Determine display values
  const displayTitle = card.title || card.type?.replace(/_/g, ' ') || 'Card';
  const displaySubtitle = card.subtitle || card.source_entity_type?.replace(/_/g, ' ') || 'Item';
  const displayDescription = card.description || `${displayTitle} from ${displaySubtitle}`;
  
  // Card status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active_canvas':
        return 'border-emerald-400/50 bg-emerald-400/5';
      case 'active_archive':
        return 'border-amber-400/50 bg-amber-400/5';
      case 'completed':
        return 'border-blue-400/50 bg-blue-400/5';
      default:
        return 'border-white/20 bg-white/5';
    }
  };
  
  // Card type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'memory_unit':
        return '🧠';
      case 'concept':
        return '💡';
      case 'derived_artifact':
        return '🔬';
      case 'proactive_prompt':
        return '🧭';
      default:
        return '📄';
    }
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  const handleImageError = () => {
    setImageLoaded(false);
  };
  
  const handleActionMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionMenu(!showActionMenu);
  };
  
  return (
    <div
      ref={cardRef}
      className={cn(
        'card-tile', // Added base class for infinite grid CSS targeting
        'relative group cursor-pointer transition-all duration-300 ease-out',
        !optimizeForInfiniteGrid && SIZE_CLASSES[size], // Skip size classes in infinite grid
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-transparent',
        isHovered && 'scale-105 z-10',
        className
      )}
      style={style} // Apply positioning styles for infinite grid
      onClick={(e) => handleCardClick(card, e)}
      onMouseEnter={(e) => handleCardHover(card, e)}
      onMouseLeave={handleCardHoverEnd}
    >
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="none"
        className={cn(
          'relative h-full overflow-hidden transition-all duration-300',
          'hover:shadow-2xl hover:shadow-primary/20',
          'border border-white/10',
          getStatusColor(card.status || 'default'),
          isCardLoading(card.card_id) && 'opacity-50 pointer-events-none',
          isCardSelected(card.card_id) && 'ring-2 ring-primary',
          isCardHovered(card.card_id) && 'shadow-xl shadow-primary/30'
        )}
      >
        {/* Background Image - Takes up most of the card */}
        <div className={cn(
          'card-background', // Added for infinite grid CSS targeting
          'relative overflow-hidden rounded-t-xl', 
          !optimizeForInfiniteGrid && IMAGE_CLASSES[size] // Skip size classes in infinite grid
        )}>
          {imageUrl && (
            <>
              {/* Check if imageUrl is a CSS gradient or regular image */}
              {imageUrl.startsWith('linear-gradient') || imageUrl.startsWith('radial-gradient') ? (
                /* CSS Gradient Background */
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{ background: imageUrl }}
                />
              ) : (
                /* Regular Image */
                <img
                  src={imageUrl}
                  alt={displayTitle}
                  className={cn(
                    'absolute inset-0 w-full h-full object-cover transition-all duration-500',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </>
          )}
          
          {/* Subtle gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Loading placeholder - only show for regular images */}
          {!imageLoaded && !imageUrl?.startsWith('linear-gradient') && !imageUrl?.startsWith('radial-gradient') && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 animate-pulse" />
          )}
          
          {/* Status indicator - small and minimal */}
          <div className="absolute top-2 left-2 flex items-center gap-1">
            {card.is_favorited && (
              <Heart size={12} className="text-red-400 fill-current drop-shadow-sm" />
            )}
            <span className="text-xs text-white/90 drop-shadow-sm">
              {getTypeIcon(card.type)}
            </span>
          </div>
          
          {/* Actions menu - minimal and unobtrusive */}
          {showActions && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="relative">
                <GlassButton
                  size="sm"
                  onClick={handleActionMenuToggle}
                  className="p-1 hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <MoreHorizontal size={12} />
                </GlassButton>
                
                {/* Action menu dropdown */}
                {showActionMenu && (
                  <div className="absolute right-0 top-8 z-50 min-w-32">
                    <GlassmorphicPanel
                      variant="glass-panel"
                      rounded="md"
                      padding="sm"
                      className="flex flex-col gap-1"
                    >
                      <GlassButton
                        size="sm"
                        onClick={(e) => handleCardFavorite(card, e)}
                        className="justify-start text-xs"
                      >
                        <Heart size={12} className="mr-2" />
                        {card.is_favorited ? 'Unfavorite' : 'Favorite'}
                      </GlassButton>
                      
                      <GlassButton
                        size="sm"
                        onClick={(e) => handleCardShare(card, e)}
                        className="justify-start text-xs"
                      >
                        <Share2 size={12} className="mr-2" />
                        Share
                      </GlassButton>
                      
                      <GlassButton
                        size="sm"
                        onClick={(e) => handleBackgroundChangeStart(card, e)}
                        className="justify-start text-xs"
                      >
                        <Image size={12} className="mr-2" />
                        Change Image
                      </GlassButton>
                      
                      <GlassButton
                        size="sm"
                        onClick={(e) => handleCardArchive(card, e)}
                        className="justify-start text-xs"
                      >
                        <Archive size={12} className="mr-2" />
                        Archive
                      </GlassButton>
                    </GlassmorphicPanel>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Card Content - Compact, Apple-like text layout */}
        <div className={cn(
          'card-content', // Added for infinite grid CSS targeting
          'p-2 flex-1 flex flex-col justify-center bg-black/20 backdrop-blur-sm'
        )}>
          {/* Title - Center aligned like Apple icons */}
          <h3 className={cn(
            'font-brand font-medium text-white text-center line-clamp-1',
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          )}>
            {displayTitle}
          </h3>
          
          {/* Subtitle - Only show if there's space and it's useful */}
          {showMetadata && size !== 'sm' && (
            <p className={cn(
              'text-white/70 text-center line-clamp-1 mt-1',
              'text-xs'
            )}>
              {displaySubtitle}
            </p>
          )}
        </div>
        
        {/* Loading overlay */}
        {isCardLoading(card.card_id) && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-xl">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </GlassmorphicPanel>
      
      {/* Click outside handler for action menu */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowActionMenu(false)}
        />
      )}
    </div>
  );
}; 