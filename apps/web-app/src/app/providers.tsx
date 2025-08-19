'use client';

import React, { useEffect, useState } from 'react';

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
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover" src="/videos/Cloud1.mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-white text-2xl font-light">Loading...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
