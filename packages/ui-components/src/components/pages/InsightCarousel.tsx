import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GlassButton from '../GlassButton';
import { PortraitInsightCard } from './PortraitInsightCard';

export interface InsightCarouselProps {
  insights: Array<{
    id: string;
    title: string;
    content: string;
    cardCover?: string;
    videoBackground?: string;
    backgroundType?: 'image' | 'video' | 'solid';
  }>;
  onPlay?: (insightId: string) => void;
  onPause?: (insightId: string) => void;
  isPlaying?: (insightId: string) => boolean;
  isSupported?: boolean;
  className?: string;
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const InsightCarousel: React.FC<InsightCarouselProps> = ({
  insights,
  onPlay,
  onPause,
  isPlaying = () => false,
  isSupported = true,
  className = '',
  showDots = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isHovered) {
      intervalRef.current = setInterval(nextSlide, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, isHovered, autoPlayInterval]);

  if (insights.length === 0) {
    return (
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
        <div className="text-center text-white/60 py-8">
          No insights available
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full max-w-4xl mx-auto ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-lg">
        {/* Cards Container */}
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {insights.map((insight) => (
            <div key={insight.id} className="w-full flex-shrink-0 px-4">
              <PortraitInsightCard
                title={insight.title}
                content={insight.content}
                cardCover={insight.cardCover}
                videoBackground={insight.videoBackground}
                backgroundType={insight.backgroundType}
                onPlay={() => onPlay?.(insight.id)}
                onPause={() => onPause?.(insight.id)}
                isPlaying={isPlaying(insight.id)}
                isSupported={isSupported}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && insights.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
              aria-label="Previous insight"
            >
              <GlassButton
                variant="default"
                size="sm"
                className="p-2"
              >
                <ChevronLeft size={20} className="stroke-current" strokeWidth={1.5} />
              </GlassButton>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
              aria-label="Next insight"
            >
              <GlassButton
                variant="default"
                size="sm"
                className="p-2"
              >
                <ChevronRight size={20} className="stroke-current" strokeWidth={1.5} />
              </GlassButton>
            </button>
          </>
        )}
      </div>

      {/* Dot Navigation */}
      {showDots && insights.length > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {insights.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white/80 scale-110'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to insight ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {insights.length > 1 && (
        <div className="text-center mt-4 text-white/60 text-sm">
          {currentIndex + 1} of {insights.length}
        </div>
      )}
    </div>
  );
};

export default InsightCarousel;
