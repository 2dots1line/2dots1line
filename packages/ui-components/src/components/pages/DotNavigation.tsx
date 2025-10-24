import React from 'react';

export interface DotNavigationProps {
  totalItems: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'large';
  showLabels?: boolean;
  labels?: string[];
}

export const DotNavigation: React.FC<DotNavigationProps> = ({
  totalItems,
  currentIndex,
  onDotClick,
  className = '',
  variant = 'default',
  showLabels = false,
  labels = []
}) => {
  const getDotSize = () => {
    switch (variant) {
      case 'minimal':
        return 'w-2 h-2';
      case 'large':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  const getDotSpacing = () => {
    switch (variant) {
      case 'minimal':
        return 'space-x-1';
      case 'large':
        return 'space-x-3';
      default:
        return 'space-x-2';
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Dots */}
      <div className={`flex ${getDotSpacing()}`}>
        {Array.from({ length: totalItems }, (_, index) => (
          <button
            key={index}
            onClick={() => onDotClick(index)}
            className={`${getDotSize()} rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-white/80 scale-110'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to item ${index + 1}`}
          />
        ))}
      </div>

      {/* Labels */}
      {showLabels && labels.length > 0 && (
        <div className="mt-3 flex space-x-4">
          {labels.map((label, index) => (
            <button
              key={index}
              onClick={() => onDotClick(index)}
              className={`text-xs transition-colors duration-200 ${
                index === currentIndex
                  ? 'text-white/90 font-medium'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Progress Bar Alternative */}
      {variant === 'large' && (
        <div className="mt-2 w-full max-w-xs">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DotNavigation;
