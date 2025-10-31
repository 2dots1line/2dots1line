'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useNotificationStore } from '../../stores/NotificationStore';
import { NotificationToast } from './NotificationToast';
import { useNotificationPreferencesStore } from '../../stores/NotificationPreferencesStore';
import type { Notification } from '../../stores/NotificationStore';

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  position = 'top-right',
  maxNotifications = 5,
}) => {
  type NotificationStoreState = ReturnType<typeof useNotificationStore.getState>;
  const { notifications, removeNotification, markAsRead } = useNotificationStore() as NotificationStoreState;

  type PreferencesState = ReturnType<typeof useNotificationPreferencesStore.getState>;
  const preferences = useNotificationPreferencesStore((s: PreferencesState) => s.preferences);

  const enabled = preferences.enabled;
  const isDndActive = preferences.snoozeUntil !== null && Date.now() < preferences.snoozeUntil;

  if (!enabled || isDndActive) {
    return null;
  }

  const effectivePosition = preferences.position || position;
  const effectiveMax = preferences.maxToasts ?? maxNotifications;
  const visibleNotifications = notifications
    .filter((n: Notification) => !n.isRead)
    .filter((n: Notification) => preferences.allowTypes[n.type as keyof typeof preferences.allowTypes] !== false)
    .sort((a: Notification, b: Notification) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, effectiveMax);

  if (visibleNotifications.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    switch (effectivePosition) {
      case 'top-left': return 'top-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  const containerContent = (
    <div
      className={`fixed ${getPositionClasses()} z-[950] pointer-events-none`}
      style={{ zIndex: 950 }}
    >
      <div className="flex flex-col space-y-2 pointer-events-auto">
        {visibleNotifications.map((notification: Notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
            onMarkAsRead={markAsRead}
            autoHideDuration={preferences.autoHide}
          />
        ))}
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(containerContent, document.body);
  }

  return null;
};