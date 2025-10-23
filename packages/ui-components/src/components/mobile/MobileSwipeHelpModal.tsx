'use client';

import React from 'react';
import { X, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  label: string;
  description: string;
  color: string;
}

export interface MobileSwipeHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  gestures?: SwipeGesture[];
}

const defaultGestures: SwipeGesture[] = [
  {
    direction: 'left',
    label: 'Swipe Left',
    description: 'Navigate to Cosmos',
    color: 'blue'
  },
  {
    direction: 'right',
    label: 'Swipe Right',
    description: 'Navigate to Cards',
    color: 'green'
  },
  {
    direction: 'up',
    label: 'Swipe Up',
    description: 'Open Chat',
    color: 'purple'
  },
  {
    direction: 'down',
    label: 'Swipe Down',
    description: 'Go to Dashboard',
    color: 'orange'
  }
];

export const MobileSwipeHelpModal: React.FC<MobileSwipeHelpModalProps> = ({
  isOpen,
  onClose,
  gestures = defaultGestures
}) => {
  if (!isOpen) return null;

  const getIcon = (direction: string) => {
    switch (direction) {
      case 'left': return ArrowLeft;
      case 'right': return ArrowRight;
      case 'up': return ArrowUp;
      case 'down': return ArrowDown;
      default: return ArrowRight;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500/20 text-blue-400';
      case 'green': return 'bg-green-500/20 text-green-400';
      case 'purple': return 'bg-purple-500/20 text-purple-400';
      case 'orange': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-4 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Swipe Navigation</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="space-y-6">
          {gestures.map((gesture) => {
            const IconComponent = getIcon(gesture.direction);
            const colorClasses = getColorClasses(gesture.color);
            
            return (
              <div key={gesture.direction} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses}`}>
                  <IconComponent size={20} />
                </div>
                <div>
                  <div className="text-white font-medium">{gesture.label}</div>
                  <div className="text-white/60 text-sm">{gesture.description}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 p-4 bg-white/5 rounded-lg">
          <div className="text-white/80 text-sm">
            <strong>Tip:</strong> You can always use the menu button (☰) in the top-left corner for traditional navigation.
          </div>
        </div>
      </div>
    </div>
  );
};
