import React from 'react';

import { cn } from '../utils/cn';

interface MinimizeToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

const MinimizeToggle: React.FC<MinimizeToggleProps> = ({
  isExpanded,
  onToggle,
  className,
}) => {
  return (
    <div
      className={cn(
        // Base positioning and sizing - Made wider for better visibility
        'absolute top-0 right-0 w-10 h-16',
        // Glassmorphism - Enhanced for better visibility
        'bg-white/20 backdrop-blur-md border border-white/30',
        'rounded-l-xl cursor-pointer select-none',
        // Improved visibility logic - More prominent when minimized
        isExpanded ? 'opacity-90' : 'opacity-80 hover:opacity-100',
        // Hover effects - Enhanced
        'hover:bg-white/25 hover:border-white/40',
        // Transition
        'transition-all duration-300 ease-in-out',
        // Removed problematic transform - toggle stays in place
        // Custom classes
        className
      )}
      onClick={onToggle}
      title={isExpanded ? 'Minimize HUD' : 'Expand HUD'}
    >
      <div className="flex items-center justify-center h-full">
        <div
          className={cn(
            'w-5 h-5 flex items-center justify-center',
            'transition-transform duration-300 ease-in-out',
            isExpanded ? 'rotate-0' : 'rotate-180'
          )}
        >
          {/* Enhanced arrow icon for better visibility */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-white/90"
          >
            <path
              d="M9 3.5L6 6.5L9 9.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MinimizeToggle; 