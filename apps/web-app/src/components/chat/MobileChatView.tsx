'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const currentScrollY = messagesContainer.scrollTop;
      
      // Determine scroll direction and position
      if (currentScrollY < lastScrollY && currentScrollY > 50) {
        // Scrolling up (swipe down) - make input transparent (get out of the way when reading earlier messages)
        setIsScrolledUp(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down (swipe up) - make input opaque (ready to type new messages)
        setIsScrolledUp(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Add scroll listener to the messages container
    messagesContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

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
          messagesContainerRef={messagesContainerRef}
          inputOpacity={isScrolledUp ? 0.3 : 1.0}
        />
      </div>
    </div>
  );
};
