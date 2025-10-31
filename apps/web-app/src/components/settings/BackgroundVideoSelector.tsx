import React, { useEffect } from 'react';
import { useBackgroundVideoStore, ViewType } from '../../stores/BackgroundVideoStore';
import { useHUDStore } from '../../stores/HUDStore';
import { GlassButton } from '@2dots1line/ui-components';
import { RefreshCw } from 'lucide-react';
import type { VideoFile } from '../../stores/BackgroundVideoStore';

interface BackgroundVideoSelectorProps {
  view: ViewType;
}

export const BackgroundVideoSelector: React.FC<BackgroundVideoSelectorProps> = ({ view }) => {
  const { 
    mediaPreferences, 
    setMediaForView,
    localVideos,
    isLoadingLocalVideos,
    loadLocalVideos 
  } = useBackgroundVideoStore();
  const { setPexelsModalView } = useHUDStore();
  
  // Load videos on component mount
  useEffect(() => {
    if (localVideos.length === 0 && !isLoadingLocalVideos) {
      loadLocalVideos();
    }
  }, []); // Only run once on mount
  
  const currentMedia = mediaPreferences[view];
  const isLocal = currentMedia?.source === 'local';

  const getCurrentDisplayName = () => {
    if (isLocal) {
      if (currentMedia?.title) return currentMedia.title;
      if (currentMedia?.id) {
        const video = localVideos.find((v: VideoFile) => v.id === currentMedia.id);
        return video ? video.label : 'Local Video';
      }
    }
    if (currentMedia?.source === 'pexels') return currentMedia?.title || 'Pexels Video';
    if (currentMedia?.source === 'generated') return currentMedia?.title || 'Generated Video';
    return 'No video selected';
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-white/90">
          Background Video
        </label>
        {!isLoadingLocalVideos && localVideos.length > 0 && (
          <button
            onClick={() => loadLocalVideos()}
            className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
            title="Refresh video list"
          >
            <RefreshCw size={10} />
          </button>
        )}
      </div>
      
      {/* Current selection display */}
      <div className="text-xs text-white/70 mb-2">
        Currently: {getCurrentDisplayName()}
      </div>
      
      {/* Dynamic video dropdown with subdirectories */}
      <select
        value={isLocal ? (currentMedia?.id || '') : ''}
        onChange={(e) => {
          if (e.target.value) {
            const selected = localVideos.find((v: VideoFile) => v.id === e.target.value);
            setMediaForView(view, {
              source: 'local',
              type: 'video',
              id: e.target.value,
              url: selected?.path,
              title: selected?.label
            });
          }
        }}
        disabled={isLoadingLocalVideos}
        className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white/90 font-brand focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all disabled:opacity-50"
      >
        {isLoadingLocalVideos && <option>Loading videos...</option>}
        {!isLoadingLocalVideos && localVideos.length === 0 && <option>No videos found</option>}
        
        {/* Group by directory */}
        {localVideos.length > 0 && (() => {
          const groups = localVideos.reduce(
            (acc: Record<string, VideoFile[]>, video: VideoFile) => {
              if (!acc[video.directory]) acc[video.directory] = [];
              acc[video.directory].push(video);
              return acc;
            },
            {} as Record<string, VideoFile[]>
          );

          const groupEntries = Object.entries(groups) as Array<[string, VideoFile[]]>;
          return groupEntries.map(([dir, videos]) => (
            <optgroup key={dir} label={dir === 'root' ? 'Default Videos' : dir} className="bg-gray-800">
              {videos.map((video: VideoFile) => (
                <option key={video.id} value={video.id} className="bg-gray-900 text-white">
                  {video.label}
                </option>
              ))}
            </optgroup>
          ));
        })()}
      </select>
      
      {/* Pexels search button */}
      <GlassButton
        onClick={() => setPexelsModalView(view)}
        size="sm"
        className="w-full justify-center px-3 py-2"
      >
        <span className="text-sm font-brand">Search Pexels</span>
      </GlassButton>
    </div>
  );
};

