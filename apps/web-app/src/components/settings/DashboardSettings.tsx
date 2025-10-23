import React from 'react';
import { BackgroundVideoSelector } from './BackgroundVideoSelector';
import { GlassButton } from '@2dots1line/ui-components';
import { Sparkles } from 'lucide-react';
import { useInsightTrigger } from '../../hooks/useInsightTrigger';

export const DashboardSettings: React.FC = () => {
  const { triggerInsight, isLoading } = useInsightTrigger();

  const handleTriggerInsight = async () => {
    await triggerInsight();
  };

  return (
    <div className="space-y-4">
      <BackgroundVideoSelector view="dashboard" />
      
      <div className="pt-3 border-t border-white/20">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-white/70 block mb-2">AI Analysis</label>
            <GlassButton
              onClick={handleTriggerInsight}
              disabled={isLoading}
              size="sm"
              className="w-full justify-start text-left px-3 py-2"
            >
              <Sparkles size={14} className="mr-2" />
              <span className="text-sm font-brand">{isLoading ? 'Generating Insights...' : 'Refresh Insights'}</span>
            </GlassButton>
            <p className="text-xs text-white/50 mt-2">
              Analyze recent activity and generate new insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

