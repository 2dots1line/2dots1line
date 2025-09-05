'use client';

import { GlassmorphicPanel, cn } from '@2dots1line/ui-components';
import { X, Star, CreditCard, Globe } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: 'new_star_generated' | 'new_card_available' | 'graph_projection_updated';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  userId: string;
  metadata?: {
    starId?: string;
    cardId?: string;
    starType?: string;
  };
}

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  autoHideDuration?: number;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'new_star_generated':
      return <Star className="w-5 h-5" />;
    case 'new_card_available':
      return <CreditCard className="w-5 h-5" />;
    case 'graph_projection_updated':
      return <Globe className="w-5 h-5" />;
    default:
      return <Star className="w-5 h-5" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'new_star_generated':
      return 'text-yellow-400';
    case 'new_card_available':
      return 'text-blue-400';
    case 'graph_projection_updated':
      return 'text-purple-400';
    default:
      return 'text-yellow-400';
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onMarkAsRead,
  autoHideDuration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const iconColor = getNotificationColor(notification.type);

  return (
    <div
      className={cn(
        'transform transition-all duration-300 ease-out',
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
        'mb-3 cursor-pointer'
      )}
      onClick={handleClick}
    >
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="lg"
        padding="md"
        className={cn(
          'relative min-w-[320px] max-w-[400px]',
          'hover:bg-white/30 transition-colors duration-200',
          !notification.isRead && 'ring-1 ring-yellow-400/30'
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-brand font-semibold text-white text-sm leading-tight">
                {notification.title}
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-white/80 text-xs mt-1 leading-relaxed">
              {notification.description}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-white/50 text-xs">
                {notification.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </div>
          </div>
        </div>
      </GlassmorphicPanel>
    </div>
  );
};