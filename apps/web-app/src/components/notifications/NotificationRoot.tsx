'use client';

import { useEffect, useState } from 'react';
import { NotificationContainer } from '.';
import { useNotificationConnection } from '../../hooks/useNotificationConnection';

export default function NotificationRoot() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Establish SSE connection and listen for notifications
  useNotificationConnection();

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  // Render notification container (positioned at top-right)
  return <NotificationContainer position="top-right" maxNotifications={5} />;
}