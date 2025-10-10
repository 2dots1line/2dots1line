'use client';

import React from 'react';
import ChatInterface from './ChatInterface';

interface MiniChatProps {
  isOpen: boolean;
  onClose?: () => void;
  onSizeChange?: (size: 'medium' | 'mini') => void;
  className?: string;
  embedded?: boolean;
}

const MiniChat: React.FC<MiniChatProps> = ({ 
  isOpen, 
  onClose, 
  onSizeChange,
  className = '',
  embedded = false 
}) => {
  return (
    <ChatInterface
      size="mini"
      isOpen={isOpen}
      onClose={onClose}
      onSizeChange={onSizeChange}
      className={className}
      embedded={embedded}
    />
  );
};

export default MiniChat;
