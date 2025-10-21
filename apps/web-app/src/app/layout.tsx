import React from 'react';
import './globals.css';
import NotificationRoot from '../components/notifications/NotificationRoot';
import { ViewTracker } from '../components/engagement/ViewTracker';
import { EngagementDebugger } from '../components/engagement/EngagementDebugger';
import { DeviceDetectionProvider } from '../components/adaptive/DeviceDetectionProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        
        {/* Apple-specific meta tags for PWA standalone mode */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="2D1L" />
        <meta name="apple-touch-fullscreen" content="yes" />
        
        {/* Additional PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="2D1L" />
        
        {/* Safari specific meta tags for macOS */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        <DeviceDetectionProvider>
          {/* Engagement tracking */}
          <ViewTracker />
          {/* Engagement debugger (development only) - HIDDEN */}
          {/* <EngagementDebugger /> */}
          {/* Notification layer */}
          <NotificationRoot />
          {children}
        </DeviceDetectionProvider>
      </body>
    </html>
  );
}