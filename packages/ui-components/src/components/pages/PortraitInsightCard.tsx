import React from 'react';
import GlassmorphicPanel from '../GlassmorphicPanel';
import GlassButton from '../GlassButton';
import MarkdownRenderer from '../markdown/MarkdownRenderer';
import { Play, Pause, Volume2, Lightbulb } from 'lucide-react';

export interface PortraitInsightCardProps {
  title: string;
  content: string;
  cardCover?: string;
  videoBackground?: string; // Video URL for background
  backgroundType?: 'image' | 'video' | 'solid'; // Background type
  onPlay?: () => void;
  onPause?: () => void;
  isPlaying?: boolean;
  isSupported?: boolean;
  className?: string;
}

export const PortraitInsightCard: React.FC<PortraitInsightCardProps> = ({
  title,
  content,
  cardCover,
  videoBackground,
  backgroundType = 'image',
  onPlay,
  onPause,
  isPlaying = false,
  isSupported = true,
  className = ''
}) => {
  // Determine background style based on type
  const getBackgroundStyle = () => {
    switch (backgroundType) {
      case 'video':
        return {};
      case 'image':
        return {
          backgroundImage: cardCover ? `url(${cardCover})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      case 'solid':
      default:
        return {
          backgroundColor: 'transparent' // Transparent background
        };
    }
  };

  return (
    <div className={`w-full max-w-sm mx-auto ${className}`}>
      <div 
        className="relative rounded-lg overflow-hidden"
        style={getBackgroundStyle()}
      >
        {/* Video Background */}
        {backgroundType === 'video' && videoBackground && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={videoBackground} type="video/mp4" />
            <source src={videoBackground} type="video/webm" />
            {/* Fallback to image if video fails */}
            {cardCover && (
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${cardCover})` }}
              />
            )}
          </video>
        )}
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
        
        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-white/90">{title}</h3>
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
          </div>
        </div>
        </GlassmorphicPanel>
      </div>
    </div>
  );
};

export default PortraitInsightCard;
