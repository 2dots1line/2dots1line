'use client';

import React, { useEffect, useState } from 'react';
import { BackgroundVideo } from '../components/BackgroundVideo';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <BackgroundVideo view="dashboard" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-white text-2xl font-light">Loading...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
