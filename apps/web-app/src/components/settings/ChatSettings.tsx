import React from 'react';
import { BackgroundVideoSelector } from './BackgroundVideoSelector';
import { useNotificationPreferencesStore } from '../../stores/NotificationPreferencesStore';

export const ChatSettings: React.FC = () => {
  const { preferences, setEnabled, snoozeFor } = useNotificationPreferencesStore();
  
  return (
    <div className="space-y-4">
      <BackgroundVideoSelector view="chat" />
      
      <div className="pt-3 border-t border-white/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-brand text-white/90">Enable notifications</span>
            <button
              onClick={() => setEnabled(!preferences.enabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                preferences.enabled ? 'bg-blue-600' : 'bg-white/20'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                preferences.enabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div>
            <button
              onClick={() => snoozeFor(30)}
              className="text-sm font-brand text-white/60 hover:text-white/90 transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Snooze 30 min
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

