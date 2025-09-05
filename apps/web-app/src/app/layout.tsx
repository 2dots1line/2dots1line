import React from 'react';
import './globals.css';
import NotificationRoot from '../components/notifications/NotificationRoot';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Notification layer */}
        <NotificationRoot />
        {children}
      </body>
    </html>
  );
}