import React from 'react';
import './globals.css';
import NotificationRoot from '../components/notifications/NotificationRoot';
import { ViewTracker } from '../components/engagement/ViewTracker';
import { EngagementDebugger } from '../components/engagement/EngagementDebugger';
import { EngagementTest } from '../components/engagement/EngagementTest';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Engagement tracking */}
        <ViewTracker />
        {/* Engagement test (development only) */}
        <EngagementTest />
        {/* Engagement debugger (development only) */}
        <EngagementDebugger />
        {/* Notification layer */}
        <NotificationRoot />
        {children}
      </body>
    </html>
  );
}