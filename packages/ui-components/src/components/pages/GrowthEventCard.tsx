import React, { useState, useRef, useEffect } from 'react';
import GlassmorphicPanel from '../GlassmorphicPanel';
import MarkdownRenderer from '../markdown/MarkdownRenderer';

export interface GrowthEventCardProps {
  title: string;
  content: string;
  growthDimension?: string; // One of the 6 growth dimensions: self_know, self_act, self_show, world_know, world_act, world_show
  cardCover?: string;
  className?: string;
  onReadMore?: () => void; // Callback for read more functionality
}

export const GrowthEventCard: React.FC<GrowthEventCardProps> = ({
  title,
  content,
  growthDimension,
  cardCover,
  className = '',
  onReadMore
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content is overflowing
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      setIsOverflowing(element.scrollHeight > element.clientHeight);
    }
  }, [content]);
  // Helper function to get display name for growth dimensions
  const getGrowthDimensionDisplayName = (dimension: string): string => {
    const dimensionMap: Record<string, string> = {
      'self_know': 'Self Knowledge',
      'self_act': 'Self Action', 
      'self_show': 'Self Expression',
      'world_know': 'World Knowledge',
      'world_act': 'World Action',
      'world_show': 'World Expression'
    };
    return dimensionMap[dimension] || dimension;
  };
  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{
          height: '256px',
          maxHeight: '256px',
          minHeight: '256px',
          backgroundImage: cardCover ? `url(${cardCover})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <GlassmorphicPanel
          variant="custom"
          rounded="lg"
          padding="lg"
          blur="sm"
          opacity={10}
          border={false}
          borderOpacity={5}
          className="h-full relative"
        >
        {/* Light to dark gradient for translucency */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-black/30 rounded-lg" />
        
        <div className="relative z-10 flex flex-col h-full overflow-hidden p-0">
          <div 
            ref={contentRef}
            className="text-sm leading-relaxed text-white/90 text-left overflow-hidden flex-1"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 7,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.4',
              maxHeight: '9.8rem'
            }}
          >
            <MarkdownRenderer 
              content={content}
              variant="dashboard"
              className="text-sm text-white/90 leading-relaxed text-left"
            />
          </div>
          
          {/* Read More Button */}
          {isOverflowing && onReadMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReadMore();
              }}
              className="text-xs text-blue-300 hover:text-blue-200 underline text-left transition-colors"
            >
              Read more...
            </button>
          )}
          
        </div>
        </GlassmorphicPanel>
      </div>
    </div>
  );
};

export default GrowthEventCard;
