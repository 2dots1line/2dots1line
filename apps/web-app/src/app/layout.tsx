import React from 'react';
import './globals.css';

export const metadata = {
  title: '2dots1line V7',
  description: 'Welcome to the new beginning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 