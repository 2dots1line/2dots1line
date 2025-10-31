'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import LayoutRouter with SSR disabled to prevent hydration errors
const LayoutRouter = dynamic(
  () => import('../components/adaptive/LayoutRouter').then(mod => ({ default: mod.LayoutRouter })),
  { 
    ssr: false,
    loading: () => <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: 'white'
    }}>Loading...</div>
  }
);

function HomePage() {
  return <LayoutRouter />;
}

export default HomePage;