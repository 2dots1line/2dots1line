'use client';

import React from 'react';
import ChatInterface from './ChatInterface';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  return (
    <ChatInterface
      size="full"
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

export default ChatModal;
