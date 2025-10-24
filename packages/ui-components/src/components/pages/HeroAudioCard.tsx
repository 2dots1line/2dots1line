import React, { useState } from 'react';
import GlassmorphicPanel from '../GlassmorphicPanel';
import GlassButton from '../GlassButton';
import { Play, Pause, Volume2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export interface HeroAudioCardProps {
  title: string;
  content: string;
  onPlay?: () => void;
  onPause?: () => void;
  isPlaying?: boolean;
  isSupported?: boolean;
  className?: string;
  maxLength?: number; // Character limit before showing "Continue Reading"
  showExpandButton?: boolean; // Whether to show expand/collapse functionality
}

export const HeroAudioCard: React.FC<HeroAudioCardProps> = ({
  title,
  content,
  onPlay,
  onPause,
  isPlaying = false,
  isSupported = true,
  className = '',
  maxLength = 500, // Default to 500 characters
  showExpandButton = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determine if content should be truncated
  const shouldTruncate = content.length > maxLength;
  const displayContent = shouldTruncate && !isExpanded 
    ? content.substring(0, maxLength) + '...'
    : content;
  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="lg"
        className="hover:bg-white/15 transition-all duration-200 h-full p-4 sm:p-6 lg:p-8"
      >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-white/90">{title}</h2>
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
                      size="lg"
                      className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3"
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={18} className="stroke-current" strokeWidth={1.5} />
                          <span className="text-sm sm:text-lg">Pause</span>
                        </>
                      ) : (
                        <>
                          <Play size={18} className="stroke-current" strokeWidth={1.5} />
                          <span className="text-sm sm:text-lg">Listen</span>
                        </>
                      )}
            </GlassButton>
          )}
        </div>
        
        <div className="prose prose-invert max-w-none text-left" style={{ textAlign: 'left' }}>
          <div className="text-base sm:text-lg leading-relaxed text-white/90 whitespace-pre-wrap text-left" style={{ textAlign: 'left' }}>
            {displayContent}
          </div>
          
          {/* Continue Reading / Show Less Button */}
          {shouldTruncate && showExpandButton && (
            <div className="mt-4 flex justify-center">
              <GlassButton
                onClick={() => setIsExpanded(!isExpanded)}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={16} className="stroke-current" strokeWidth={1.5} />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} className="stroke-current" strokeWidth={1.5} />
                    <span>Continue Reading</span>
                  </>
                )}
              </GlassButton>
            </div>
          )}
        </div>
      </GlassmorphicPanel>
    </div>
  );
};

export default HeroAudioCard;
