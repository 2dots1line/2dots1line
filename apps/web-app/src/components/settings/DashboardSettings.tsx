import React, { useState } from 'react';
import { BackgroundVideoSelector } from './BackgroundVideoSelector';
import { DateRangePicker } from './DateRangePicker';
import { GlassButton } from '@2dots1line/ui-components';
import { Sparkles, Network } from 'lucide-react';
import { useInsightTrigger } from '../../hooks/useInsightTrigger';
import { useOntologyOptimizationTrigger } from '../../hooks/useOntologyOptimizationTrigger';

interface DateRange {
  startDate: string;
  endDate: string;
}

export const DashboardSettings: React.FC = () => {
  const { triggerInsight, isLoading: insightsLoading } = useInsightTrigger();
  const { triggerOntologyOptimization, isLoading: ontologyLoading } = useOntologyOptimizationTrigger();
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const handleTriggerInsight = async () => {
    await triggerInsight(dateRange || undefined);
  };

  const handleTriggerOntologyOptimization = async () => {
    await triggerOntologyOptimization(dateRange || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Video Settings Section */}
      <div className="space-y-3">
        <BackgroundVideoSelector view="dashboard" />
      </div>
      
      {/* Date Range Section */}
      <div className="pt-4 border-t border-white/20">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Network size={14} className="opacity-80" />
            Data Range
          </h4>
          <DateRangePicker 
            onDateRangeChange={setDateRange}
            className="bg-white/5 p-3 rounded-lg border border-white/10"
          />
          <p className="text-xs text-white/50">
            Select the time period for analysis. Both insights and ontology optimization will use this range.
          </p>
        </div>
      </div>
      
      {/* AI Analysis Section */}
      <div className="pt-4 border-t border-white/20">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Sparkles size={14} className="opacity-80" />
            AI Analysis
          </h4>
          
          <div className="space-y-2">
            <GlassButton
              onClick={handleTriggerInsight}
              disabled={insightsLoading || ontologyLoading}
              size="sm"
              className="w-full justify-start text-left px-3 py-2"
            >
              <Sparkles size={14} className="mr-2" />
              <span className="text-sm font-brand">
                {insightsLoading ? 'Generating Insights...' : 'Refresh Insights'}
              </span>
            </GlassButton>
            <p className="text-xs text-white/50">
              Analyze recent activity and generate new insights
            </p>
          </div>

          <div className="space-y-2">
            <GlassButton
              onClick={handleTriggerOntologyOptimization}
              disabled={insightsLoading || ontologyLoading}
              size="sm"
              className="w-full justify-start text-left px-3 py-2"
            >
              <Network size={14} className="mr-2" />
              <span className="text-sm font-brand">
                {ontologyLoading ? 'Optimizing Ontology...' : 'Optimize Ontology'}
              </span>
            </GlassButton>
            <p className="text-xs text-white/50">
              Optimize concept relationships and knowledge graph structure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

