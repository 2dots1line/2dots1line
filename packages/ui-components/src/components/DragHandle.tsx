import React from 'react';

import { cn } from '../utils/cn';

interface DragHandleProps {
  className?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

const DragHandle: React.FC<DragHandleProps> = ({
  className,
  onMouseDown,
  children,
}) => {
  return (
    <div
      className={cn(
        // Base styles
        'relative cursor-move select-none',
        // Consistent glassmorphism with other components
        'glass-panel',
        'rounded-lg',
        // Hover effects
        'hover:bg-white/15 hover:border-white/30',
        // Transition
        'transition-all duration-200 ease-in-out',
        // Custom classes
        className
      )}
      onMouseDown={onMouseDown}
      draggable={false} // Prevent default HTML5 drag
    >
      {children || (
        <div className="flex items-center justify-center p-2">
          {/* Default grip dots - using white/70 for better visibility on dark glass */}
          <div className="flex flex-col space-y-1">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-white/70 rounded-full" />
              <div className="w-1 h-1 bg-white/70 rounded-full" />
            </div>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-white/70 rounded-full" />
              <div className="w-1 h-1 bg-white/70 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragHandle; 