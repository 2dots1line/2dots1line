'use client';

import React, { useState, useEffect } from 'react';
import { Search, Video, Loader2, X, Play, Pause } from 'lucide-react';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { useBackgroundVideoStore, type ViewType, type MediaItem } from '../../stores/BackgroundVideoStore';

interface PexelsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetView: ViewType;
}

export const PexelsSearchModal: React.FC<PexelsSearchModalProps> = ({
  isOpen,
  onClose,
  targetView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchResults, setLocalSearchResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const { searchMedia, setMediaForView, getRecommendedMedia, searchResults: storeSearchResults } = useBackgroundVideoStore();

  // Load recommended media on mount
  useEffect(() => {
    if (isOpen) {
      loadRecommendedMedia();
    }
  }, [isOpen]);

  // Sync search results from store
  useEffect(() => {
    if (storeSearchResults.length > 0) {
      console.log('Received search results from store:', storeSearchResults);
      setLocalSearchResults(storeSearchResults);
    }
  }, [storeSearchResults]);

  const loadRecommendedMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const recommended = await getRecommendedMedia(targetView);
      setLocalSearchResults(recommended);
    } catch (err) {
      setError('Failed to load recommended media');
      console.error('Error loading recommended media:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    console.log('Search triggered with query:', searchQuery);
    if (!searchQuery.trim()) {
      await loadRecommendedMedia();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await searchMedia(searchQuery, 'video');
      // Results will be updated via the useEffect that syncs with store
    } catch (err) {
      setError('Failed to search media');
      console.error('Error searching media:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaSelect = (media: MediaItem) => {
    console.log('Media selected:', media);
    setSelectedMedia(media);
    console.log('Selected media state updated to:', media.id);
  };

  const handleApplyMedia = () => {
    console.log('handleApplyMedia called, selectedMedia:', selectedMedia);
    if (selectedMedia) {
      console.log('Applying media:', selectedMedia, 'to view:', targetView);
      setMediaForView(targetView, {
        source: 'pexels',
        type: selectedMedia.type,
        id: selectedMedia.id,
        url: selectedMedia.url,
        title: selectedMedia.title,
      });
      console.log('Media applied, closing modal');
      onClose();
    } else {
      console.log('No media selected, cannot apply');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center pointer-events-none">
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="lg"
        className="relative w-full max-w-4xl h-[70vh] flex flex-col overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white font-brand">
              Search Pexels Library
            </h2>
            <p className="text-white/70 text-sm">
              Find the perfect background for your {targetView} view
            </p>
          </div>
          <GlassButton
            onClick={onClose}
            className="p-2 hover:bg-white/20"
          >
            <X size={20} className="stroke-current" />
          </GlassButton>
        </div>

        {/* Search Controls */}
        <div className="flex gap-4 mb-6 flex-shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for videos..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
            />
          </div>
          
          <GlassButton
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Search'
            )}
          </GlassButton>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 flex-shrink-0">
            {error}
          </div>
        )}

        {/* Results Grid */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-white" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 max-h-full pb-4">
              {localSearchResults.map((media) => (
                <div
                  key={media.id}
                  onClick={() => {
                    console.log('Card clicked:', media.id);
                    handleMediaSelect(media);
                  }}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedMedia?.id === media.id
                      ? 'border-white/60 bg-white/10 ring-2 ring-white/40'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative">
                    {media.type === 'video' ? (
                      <div className="relative w-full h-full">
                        {/* Static thumbnail */}
                        <img
                          src={media.thumbnailUrl}
                          alt={media.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Thumbnail failed to load:', media.thumbnailUrl);
                            // Fallback to a placeholder
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VmlkZW8gUHJldmlldzwvdGV4dD4KPC9zdmc+';
                          }}
                        />
                        {/* Video preview on hover */}
                        <video
                          src={media.url}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                          muted
                          loop
                          onMouseEnter={(e) => {
                            const video = e.currentTarget;
                            video.play();
                            setPreviewVideo(media.id);
                          }}
                          onMouseLeave={(e) => {
                            const video = e.currentTarget;
                            video.pause();
                            video.currentTime = 0;
                            setPreviewVideo(null);
                          }}
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/50 rounded-full p-2">
                            <Play size={16} className="text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={media.thumbnailUrl || media.url}
                        alt={media.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Selection indicator */}
                    {selectedMedia?.id === media.id && (
                      <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {media.type === 'video' && (
                        <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                          {media.duration ? formatDuration(media.duration) : 'Video'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3 bg-black/20">
                    <h3 className="text-white text-sm font-medium truncate">
                      {media.title}
                    </h3>
                    {media.photographer && (
                      <p className="text-white/60 text-xs truncate">
                        by {media.photographer}
                      </p>
                    )}
                    {media.width && media.height && (
                      <p className="text-white/40 text-xs">
                        {media.width} × {media.height}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20 flex-shrink-0">
          <div className="text-white/60 text-sm">
            {localSearchResults.length > 0 && (
              <>
                {localSearchResults.length} result{localSearchResults.length !== 1 ? 's' : ''} found
                {selectedMedia && (
                  <span className="ml-4">
                    Selected: {selectedMedia.title}
                  </span>
                )}
              </>
            )}
          </div>
          
          <div className="flex gap-3">
            <GlassButton
              onClick={onClose}
              className="px-4 py-2 hover:bg-white/20"
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleApplyMedia}
              disabled={!selectedMedia}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50"
            >
              Apply to {targetView}
            </GlassButton>
          </div>
        </div>
      </GlassmorphicPanel>
    </div>
  );
};
