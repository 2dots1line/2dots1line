'use client';

import React from 'react';
import ChatInterface from './ChatInterface';

interface MobileChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const MobileChatOverlay: React.FC<MobileChatOverlayProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-1/2 z-40 pointer-events-none ${className}`}>
      {/* TikTok-style gradient overlay */}
      <div className="relative w-full h-full bg-gradient-to-t from-black/80 to-transparent">
        <div className="absolute bottom-0 left-0 w-full h-full p-4 pointer-events-auto">
          <ChatInterface 
            size="mini" 
            isOpen={isOpen} 
            onClose={onClose} 
            embedded={true}
          />
        </div>
      </div>
    </div>
  );
};
