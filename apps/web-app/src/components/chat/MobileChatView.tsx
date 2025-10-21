'use client';

import React from 'react';
import ChatInterface from './ChatInterface';
import styles from './MobileChatView.module.css';

interface MobileChatViewProps {
  onBack: () => void;
  className?: string;
}

export const MobileChatView: React.FC<MobileChatViewProps> = ({
  onBack,
  className = '',
}) => {
  return (
    <div className={`fixed inset-0 z-30 bg-transparent ${className}`}>
      {/* Use ChatInterface with dedicated mobile CSS */}
      <div className="absolute inset-0 pointer-events-auto">
        <ChatInterface 
          size="full" 
          isOpen={true} 
          onClose={onBack}
          embedded={true}
          className={`h-full ${styles.mobileChatContainer}`}
        />
      </div>
    </div>
  );
};
