import React from 'react';
import { useBackgroundVideoStore, ViewType } from '../../stores/BackgroundVideoStore';
import { useHUDStore } from '../../stores/HUDStore';
import { GlassButton } from '@2dots1line/ui-components';
import { Video } from 'lucide-react';

interface BackgroundVideoSelectorProps {
  view: ViewType;
}

export const BackgroundVideoSelector: React.FC<BackgroundVideoSelectorProps> = ({ view }) => {
  const { mediaPreferences, setMediaForView } = useBackgroundVideoStore();
  const { setPexelsModalView } = useHUDStore();
  
  const currentMedia = mediaPreferences[view];
  const isLocal = currentMedia?.source === 'local';
  
  const localVideoOptions = [
    { value: 'Cloud1.mp4', label: 'Cloud 1' },
    { value: 'Cloud2.mp4', label: 'Cloud 2' },
    { value: 'Cloud3.mp4', label: 'Cloud 3' },
    { value: 'Cloud4.mp4', label: 'Cloud 4' },
    { value: 'Star1.mp4', label: 'Stars' },
  ];
  
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/70 flex items-center gap-1">
        <Video size={12} className="opacity-70" />
        Background Video
      </label>
      
      {/* Current selection display */}
      <div className="text-xs text-white/60 mb-1">
        {isLocal && `Currently: ${localVideoOptions.find(opt => opt.value === currentMedia?.id)?.label || currentMedia?.id}`}
        {currentMedia?.source === 'pexels' && `Currently: ${currentMedia?.title || 'Pexels Video'}`}
        {!currentMedia && 'No video selected'}
      </div>
      
      {/* Local video dropdown - matches app styling */}
      <select
        value={isLocal ? currentMedia?.id : ''}
        onChange={(e) => {
          if (e.target.value) {
            setMediaForView(view, {
              source: 'local',
              type: 'video',
              id: e.target.value
            });
          }
        }}
        className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white/90 font-brand focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
      >
        {localVideoOptions.map(({ value, label }) => (
          <option key={value} value={value} className="bg-gray-900 text-white">
            {label}
          </option>
        ))}
      </select>
      
      {/* Pexels search button - uses GlassButton component */}
      <GlassButton
        onClick={() => setPexelsModalView(view)}
        size="sm"
        className="w-full justify-center"
      >
        Search Pexels
      </GlassButton>
    </div>
  );
};

