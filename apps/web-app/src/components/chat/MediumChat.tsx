'use client';

import React from 'react';
import ChatInterface from './ChatInterface';

interface MediumChatProps {
  isOpen: boolean;
  onClose?: () => void;
  onSizeChange?: (size: 'medium' | 'mini') => void;
  className?: string;
  embedded?: boolean;
}

const MediumChat: React.FC<MediumChatProps> = ({ 
  isOpen, 
  onClose, 
  onSizeChange,
  className = '',
  embedded = false 
}) => {
  return (
    <ChatInterface
      size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSizeChange={onSizeChange}
      className={className}
      embedded={embedded}
    />
  );
};

export default MediumChat;
