'use client';

import React from 'react';
import { useBackgroundVideoStore, type ViewType, type AllViewType } from '../stores/BackgroundVideoStore';

interface BackgroundVideoProps {
  view: AllViewType;
  className?: string;
  overlayOpacity?: number;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  view,
  className = '',
  overlayOpacity = 0.3,
}) => {
  const { getVideoForView } = useBackgroundVideoStore();
  
  // Cosmos view doesn't use background videos (it's 3D)
  if (view === 'cosmos') {
    return null;
  }
  
  const videoSrc = getVideoForView(view as ViewType);

  return (
    <div className={`absolute inset-0 z-0 ${className}`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        src={`/videos/${videoSrc}`}
      >
        Your browser does not support the video tag.
      </video>
      {/* Video Overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
};
