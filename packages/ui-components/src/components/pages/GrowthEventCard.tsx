import React from 'react';
import GlassmorphicPanel from '../GlassmorphicPanel';
import GlassButton from '../GlassButton';
import MarkdownRenderer from '../markdown/MarkdownRenderer';
import { Play, Pause, Volume2, TrendingUp, Calendar } from 'lucide-react';

export interface GrowthEventCardProps {
  title: string;
  content: string;
  growthDimension?: string; // One of the 6 growth dimensions: self_know, self_act, self_show, world_know, world_act, world_show
  cardCover?: string;
  onPlay?: () => void;
  onPause?: () => void;
  isPlaying?: boolean;
  isSupported?: boolean;
  className?: string;
}

export const GrowthEventCard: React.FC<GrowthEventCardProps> = ({
  title,
  content,
  growthDimension,
  cardCover,
  onPlay,
  onPause,
  isPlaying = false,
  isSupported = true,
  className = ''
}) => {
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
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white/90">{title}</h3>
            </div>
            {isSupported && (
              <GlassButton
                onClick={() => {
                  if (isPlaying) {
                    onPause?.();
                  } else {
                    onPlay?.();
                  }
                }}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause size={14} className="stroke-current" strokeWidth={1.5} />
                    <span className="text-sm">Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="stroke-current" strokeWidth={1.5} />
                    <span className="text-sm">Listen</span>
                  </>
                )}
              </GlassButton>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-end">
            <div className="text-sm leading-relaxed text-white/90 mb-4 text-left">
              <MarkdownRenderer 
                content={content}
                variant="dashboard"
                className="text-sm text-white/90 leading-relaxed text-left"
              />
            </div>
            
            {/* Growth Dimension */}
            {growthDimension && (
              <div className="flex items-center gap-2 text-left">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-xs text-white/80 font-medium">{getGrowthDimensionDisplayName(growthDimension)}</span>
              </div>
            )}
          </div>
        </div>
        </GlassmorphicPanel>
      </div>
    </div>
  );
};

export default GrowthEventCard;
