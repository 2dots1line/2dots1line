'use client';

import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useBackgroundVideoStore, type ViewType } from '../../stores/BackgroundVideoStore';
import { useNotificationPreferencesStore, type NotificationPosition, type NotificationType } from '../../stores/NotificationPreferencesStore';
import { useNotificationStore } from '../../stores/NotificationStore';
import { PexelsSearchModal } from './PexelsSearchModal';
import { HRTControlPanel } from '../settings/HRTControlPanel';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ isOpen, onClose }) => {
  const { mediaPreferences, setMediaForView, resetToDefaults, generatedMedia, loadGeneratedMedia, deleteGeneratedMedia, applyGeneratedVideo } = useBackgroundVideoStore();
  const [pexelsModalOpen, setPexelsModalOpen] = useState(false);
  const [targetView, setTargetView] = useState<ViewType>('dashboard');

  // Notification preferences
  const {
    preferences,
    setEnabled,
    setTypeEnabled,
    setPosition,
    setMaxToasts,
    setAutoHide,
    snoozeFor,
    clearSnooze,
  } = useNotificationPreferencesStore();

  const { addNotification } = useNotificationStore();
  
  // Load generated media when modal opens
  useEffect(() => {
    if (isOpen) {
      loadGeneratedMedia();
    }
  }, [isOpen, loadGeneratedMedia]);
  
  if (!isOpen) return null;
  
  const localVideoOptions = [
    { value: 'Cloud1.mp4', label: 'Cloud 1' },
    { value: 'Cloud2.mp4', label: 'Cloud 2' },
    { value: 'Cloud3.mp4', label: 'Cloud 3' },
    { value: 'Cloud4.mp4', label: 'Cloud 4' },
    { value: 'Star1.mp4', label: 'Stars' },
  ] as const;

  const views = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'chat', label: 'Chat' },
    { key: 'cards', label: 'Cards' },
    { key: 'settings', label: 'Settings' },
  ] as const;
  
  return (
    <div className="fixed inset-4 z-40 flex items-center justify-center pointer-events-none">
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="lg"
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white font-brand">All Settings</h2>
          <GlassButton
            onClick={onClose}
            className="p-2 hover:bg-white/20"
          >
            <X size={20} className="stroke-current" />
          </GlassButton>
        </div>
        
        {/* Background Media Settings */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 font-brand">Background Media</h3>
          <p className="text-white/80 mb-6">
            Choose different background media for each 2D view. You can use local videos or search for new ones from Pexels.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {views.map(({ key, label }) => {
              const currentMedia = mediaPreferences[key];
              const isLocal = currentMedia?.source === 'local';
              const isPexels = currentMedia?.source === 'pexels';
              
              return (
                <div key={key} className="space-y-3">
                  <label className="block text-sm font-medium text-white/90 font-brand">
                    {label} View
                  </label>
                  
                  {/* Current Media Display */}
                  <div className="text-sm text-white/70 mb-2">
                    {isLocal && `Local: ${currentMedia?.id}`}
                    {isPexels && `Pexels: ${currentMedia?.title || 'Custom Media'}`}
                  </div>
                  
                  {/* Local Video Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-white/60">Local Videos</label>
                    <select
                      value={isLocal ? currentMedia?.id : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setMediaForView(key, {
                            source: 'local',
                            type: 'video',
                            id: e.target.value
                          });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-brand focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-sm"
                    >
                      <option value="">Select local video...</option>
                      {localVideoOptions.map(({ value, label }) => (
                        <option key={value} value={value} className="bg-gray-800 text-white">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Pexels Search Button */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-white/60">Pexels Library</label>
                    <GlassButton
                      onClick={() => {
                        setTargetView(key);
                        setPexelsModalOpen(true);
                      }}
                      size="sm"
                      className="w-full px-3 py-2 text-sm hover:bg-white/20"
                    >
                      Search Pexels
                    </GlassButton>
                  </div>
                  
                  {/* Generated Videos Section */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-white/60">
                      AI Generated Videos ({generatedMedia.length})
                    </label>
                    
                    {generatedMedia.length === 0 ? (
                      <p className="text-xs text-white/40 py-2">
                        Ask Dot to generate a custom video for you!
                      </p>
                    ) : (
                      <div className="max-h-32 overflow-y-auto space-y-1 bg-white/5 rounded-lg p-2">
                        {generatedMedia.map(media => (
                          <div key={media.id} className="flex items-center gap-2 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                            <button
                              onClick={() => applyGeneratedVideo(media.id, key)}
                              className="flex-1 text-left text-xs truncate text-white/80 hover:text-white"
                              title={media.title}
                            >
                              {media.title}
                            </button>
                            <button
                              onClick={() => deleteGeneratedMedia(media.id)}
                              className="text-red-400 hover:text-red-300 text-sm px-2"
                              title="Delete"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6">
            <GlassButton
              onClick={resetToDefaults}
              size="sm"
              className="px-4 py-2 text-sm hover:bg-white/20"
            >
              Reset to Defaults
            </GlassButton>
          </div>
        </div>
        
        {/* Notification Settings */}
        <div className="border-t border-white/20 pt-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 font-brand">Notification Settings</h3>
          <p className="text-white/80 mb-6">Configure in-app toasts and delivery preferences.</p>

          {/* Master Enable */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/90">Enable Notifications</span>
            <button
              onClick={() => setEnabled(!preferences.enabled)}
              className={`px-3 py-1 rounded-lg text-sm font-brand ${preferences.enabled ? 'bg-green-600/70 hover:bg-green-600' : 'bg-white/10 hover:bg-white/20'} text-white transition-colors`}
            >
              {preferences.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Allowed Types */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">Allow Types</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { key: 'new_card_available', label: 'New Card Available' },
                { key: 'graph_projection_updated', label: 'Graph Projection Updated' },
                { key: 'new_star_generated', label: 'New Star Generated' },
              ] as Array<{ key: NotificationType; label: string }>).map(({ key, label }) => {
                const enabled = preferences.allowTypes[key];
                return (
                  <button
                    key={key}
                    onClick={() => setTypeEnabled(key, !enabled)}
                    className={`px-3 py-2 rounded-lg text-left text-sm border border-white/20 font-brand ${enabled ? 'bg-white/15 hover:bg-white/25' : 'bg-transparent hover:bg-white/10'} text-white transition-colors`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-xs opacity-80">{enabled ? 'Allowed' : 'Blocked'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Position and Limits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Position</label>
              <select
                value={preferences.position}
                onChange={(e) => setPosition(e.target.value as NotificationPosition)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-brand focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-sm"
              >
                {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as NotificationPosition[]).map(p => (
                  <option key={p} value={p} className="bg-gray-800 text-white">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Max Visible</label>
              <input
                type="number"
                min={1}
                max={10}
                value={preferences.maxToasts}
                onChange={(e) => setMaxToasts(Number(e.target.value || 1))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-brand focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Auto-hide (seconds, 0 = never)</label>
              <input
                type="number"
                min={0}
                value={Math.floor(preferences.autoHide / 1000)}
                onChange={(e) => setAutoHide(Math.max(0, Number(e.target.value || 0)) * 1000)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-brand focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Do Not Disturb */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">Do Not Disturb</label>
            <div className="flex flex-wrap gap-3">
              <GlassButton size="sm" className="px-3 py-2 text-sm hover:bg-white/20" onClick={() => snoozeFor(15)}>
                Snooze 15m
              </GlassButton>
              <GlassButton size="sm" className="px-3 py-2 text-sm hover:bg-white/20" onClick={() => snoozeFor(30)}>
                Snooze 30m
              </GlassButton>
              <GlassButton size="sm" className="px-3 py-2 text-sm hover:bg-white/20" onClick={() => snoozeFor(60)}>
                Snooze 60m
              </GlassButton>
              <GlassButton size="sm" className="px-3 py-2 text-sm hover:bg-white/20" onClick={clearSnooze}>
                Clear Snooze
              </GlassButton>
            </div>
            {preferences.snoozeUntil && (
              <div className="mt-2 text-sm text-white/70">
                Snoozing until {new Date(preferences.snoozeUntil).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Local Test */}
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Send Test Notification (local)</span>
            <GlassButton
              size="sm"
              className="px-3 py-2 text-sm hover:bg-white/20"
              onClick={() =>
                addNotification({
                  type: 'new_card_available',
                  title: 'Test Notification',
                  description: 'This is a local test toast',
                  userId: 'local',
                })
              }
            >
              Send Test
            </GlassButton>
          </div>
        </div>

        {/* HRT Control Panel */}
        <div className="border-t border-white/20 pt-6">
          <HRTControlPanel />
        </div>
        
        {/* Pexels Search Modal */}
        <PexelsSearchModal
          isOpen={pexelsModalOpen}
          onClose={() => setPexelsModalOpen(false)}
          targetView={targetView}
        />
      </GlassmorphicPanel>
    </div>
  );
};

