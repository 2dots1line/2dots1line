'use client';

import React, { useState, useEffect } from 'react';
import { GlassmorphicPanel } from '@2dots1line/ui-components';
import ChatInterface from './ChatInterface';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useHUDStore } from '../../stores/HUDStore';
import styles from './MobileMiniChat.module.css';

interface MobileMiniChatProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
  viewContext: 'cosmos' | 'cards';
  className?: string;
}

export const MobileMiniChat: React.FC<MobileMiniChatProps> = ({
  isOpen,
  onClose,
  onExpand,
  viewContext,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded by default
  const { setMobileHudVisible } = useHUDStore();
  
  // Swipe gesture handling
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeDown: () => {
      if (isExpanded) {
        setIsExpanded(false);
        onExpand(); // Notify parent of collapse
      } else {
        onClose(); // Close completely
      }
    },
    onSwipeUp: () => {
      if (!isExpanded) {
        setIsExpanded(true);
        onExpand(); // Notify parent of expansion
      }
    },
    threshold: 30, // Lower threshold for mobile
    preventDefault: true
  });

  // HUD fade management
  useEffect(() => {
    if (isOpen) {
      setMobileHudVisible(false); // Hide HUD when chat is open
    } else {
      setMobileHudVisible(true); // Show HUD when chat is closed
    }
  }, [isOpen, setMobileHudVisible]);

  // Auto-expand when user starts typing or when there are messages
  useEffect(() => {
    // Auto-expand when chat opens to show any existing messages
    if (isOpen && !isExpanded) {
      setIsExpanded(true);
      onExpand();
    }
  }, [isOpen, isExpanded, onExpand]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-[60] transition-all duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      } ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile-specific background panel */}
      <div className={`${styles.mobileMiniChatPanel} ${
        isExpanded ? styles.expanded : styles.collapsed
      }`}>
        {/* Swipe indicator */}
        <div className={styles.swipeIndicator} />
        
        {/* Chat Interface - let it handle its own glassmorphic styling */}
        <ChatInterface
          size="mini"
          isOpen={isOpen}
          onClose={onClose}
          embedded={true}
          className={styles.chatInterface}
        />
      </div>
    </div>
  );
};
