'use client';

import React from 'react';
import { useBackgroundVideoStore, type ViewType, type AllViewType } from '../stores/BackgroundVideoStore';

interface DynamicBackgroundProps {
  view: AllViewType;
  className?: string;
  overlayOpacity?: number;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  view,
  className = '',
  overlayOpacity = 0.3,
}) => {
  const { getMediaForView } = useBackgroundVideoStore();
  
  // Cosmos view doesn't use background media (it's 3D)
  if (view === 'cosmos') {
    return null;
  }
  
  const media = getMediaForView(view as ViewType);
  
  if (!media) {
    // Fallback to default local video
    return <LocalBackgroundVideo view={view as ViewType} className={className} overlayOpacity={overlayOpacity} />;
  }
  
  // Handle Pexels media
  if (media.source === 'pexels') {
    if (media.type === 'video') {
      return (
        <div className={`absolute inset-0 z-0 ${className}`}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            src={media.url}
          >
            Your browser does not support the video tag.
          </video>
          <div 
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        </div>
      );
    } else {
      // Pexels photo
      return (
        <div className={`absolute inset-0 z-0 ${className}`}>
          <img
            src={media.url}
            alt={media.title || 'Background'}
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        </div>
      );
    }
  }
  
  // Handle local media (fallback to local video component)
  return <LocalBackgroundVideo view={view as ViewType} className={className} overlayOpacity={overlayOpacity} />;
};

// Local background video component (for backward compatibility)
interface LocalBackgroundVideoProps {
  view: ViewType;
  className?: string;
  overlayOpacity?: number;
}

const LocalBackgroundVideo: React.FC<LocalBackgroundVideoProps> = ({
  view,
  className = '',
  overlayOpacity = 0.3,
}) => {
  const { getMediaForView } = useBackgroundVideoStore();
  const media = getMediaForView(view);
  
  // Get the local video file name
  const videoFileName = media?.source === 'local' ? media.id : 'Cloud1.mp4';

  return (
    <div className={`absolute inset-0 z-0 ${className}`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        src={`/videos/${videoFileName}`}
      >
        Your browser does not support the video tag.
      </video>
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
};
