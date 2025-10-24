import React from 'react';
import GlassmorphicPanel from '../GlassmorphicPanel';
import GlassButton from '../GlassButton';
import { Play, Pause, Volume2 } from 'lucide-react';

export interface ProactivePromptCardProps {
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

export const ProactivePromptCard: React.FC<ProactivePromptCardProps> = ({
  title,
  content,
  cardCover,
  videoBackground,
  backgroundType = 'solid',
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
        return {}; // Video element will handle background
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
          backgroundColor: '#1a1a2e' // Dark purple fallback
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
          variant="glass-panel"
          rounded="lg"
          padding="lg"
          className="hover:bg-white/15 transition-all duration-200 h-full relative"
        >
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="relative z-10 flex flex-col h-full">
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
                  className="flex items-center gap-1 text-xs"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={12} className="stroke-current" strokeWidth={1.5} />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="stroke-current" strokeWidth={1.5} />
                      <span>Listen</span>
                    </>
                  )}
                </GlassButton>
              )}
            </div>
            <p className="text-sm leading-relaxed text-white/80 mb-4 flex-grow">{content}</p>
          </div>
        </GlassmorphicPanel>
      </div>
    </div>
  );
};

export default ProactivePromptCard;