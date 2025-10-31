'use client';

import React from 'react';
import './globals.css';
import NotificationRoot from '../components/notifications/NotificationRoot';
import { ViewTracker } from '../components/engagement/ViewTracker';
import { EngagementDebugger } from '../components/engagement/EngagementDebugger';
import { DeviceDetectionProvider } from '../components/adaptive/DeviceDetectionProvider';
import { TranslationProvider } from '../components/providers/TranslationProvider';

// Simple Error Boundary using React 18 ErrorBoundary pattern
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Error caught by boundary:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        <h2>Something went wrong.</h2>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

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
        <ErrorBoundary>
          <TranslationProvider>
            <DeviceDetectionProvider>
              {/* Engagement tracking */}
              <ViewTracker />
              {/* Engagement debugger (development only) - HIDDEN */}
              {/* <EngagementDebugger /> */}
              {/* Notification layer */}
              <NotificationRoot />
              {children}
            </DeviceDetectionProvider>
          </TranslationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}