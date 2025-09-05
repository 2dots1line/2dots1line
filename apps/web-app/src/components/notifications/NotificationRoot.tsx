'use client';

import { NotificationContainer } from '.';
import { useNotificationConnection } from '../../hooks/useNotificationConnection';

export default function NotificationRoot() {
  // Establish SSE connection and listen for notifications
  useNotificationConnection();

  // Render notification container (positioned at top-right)
  return <NotificationContainer position="top-right" maxNotifications={5} />;
}