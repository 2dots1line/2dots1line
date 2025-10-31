'use client';

import React from 'react';
import Image from 'next/image';
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
  
  // Handle generated media
  if (media.source === 'generated') {
    if (!media.url) {
      return <LocalBackgroundVideo view={view as ViewType} className={className} overlayOpacity={overlayOpacity} />;
    }
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
  }
  
  // Handle Pexels media
  if (media.source === 'pexels') {
    if (media.type === 'video') {
      if (!media.url) {
        return <LocalBackgroundVideo view={view as ViewType} className={className} overlayOpacity={overlayOpacity} />;
      }
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
      if (!media.url) {
        return <LocalBackgroundVideo view={view as ViewType} className={className} overlayOpacity={overlayOpacity} />;
      }
      return (
        <div className={`absolute inset-0 z-0 ${className}`}>
          <div className="relative w-full h-full">
            <Image
              src={media.url!}
              alt={media.title || 'Background'}
              fill
              sizes="100vw"
              className="object-cover"
              priority={false}
            />
          </div>
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
  
  // Support both old format (just filename) and new format (relative path with subdirs)
  let videoPath = '/videos/Cloud1.mp4'; // fallback
  
  if (media?.source === 'local') {
    if (media.url) {
      // New format with full path
      videoPath = media.url;
    } else if (media.id) {
      // Old format or new format - check if it includes subdirectory
      videoPath = media.id.includes('/') ? `/videos/${media.id}` : `/videos/${media.id}`;
    }
  } else if (media?.source === 'generated' && media.url) {
    videoPath = media.url;
  }

  return (
    <div className={`absolute inset-0 z-0 ${className}`}>
      <video
        key={videoPath} // Force re-render on video change
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        src={videoPath}
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
