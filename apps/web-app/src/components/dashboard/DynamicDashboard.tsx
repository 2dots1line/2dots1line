/**
 * DynamicDashboard.tsx
 * V9.7 Main component for the dynamic dashboard
 */

import React, { useState, useEffect } from 'react';
import { DashboardSection } from './DashboardSection';
import { dashboardService, DynamicDashboardData } from '../../services/dashboardService';

interface DynamicDashboardProps {
  cycleId?: string;
  className?: string;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({
  cycleId,
  className = ''
}) => {
  const [dashboardData, setDashboardData] = useState<DynamicDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(cycleId || null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedCycle]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = selectedCycle
        ? await dashboardService.getDynamicDashboardForCycle(selectedCycle)
        : await dashboardService.getDynamicDashboard();

      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError(response.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCycleChange = (newCycleId: string) => {
    setSelectedCycle(newCycleId);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Dashboard Data</h3>
          <p className="text-gray-600">No completed cycles found. Start a conversation to generate insights!</p>
        </div>
      </div>
    );
  }

  const { sections, cycle_info } = dashboardData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Insight Dashboard</h1>
            <p className="text-gray-600">
              Cycle: {new Date(cycle_info.cycle_start_date).toLocaleDateString()} - {new Date(cycle_info.cycle_end_date).toLocaleDateString()}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>📊 {cycle_info.artifacts_created} artifacts</span>
              <span>💬 {cycle_info.prompts_created} prompts</span>
              {cycle_info.processing_duration_ms && (
                <span>⏱️ {Math.round(cycle_info.processing_duration_ms / 1000)}s processing</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Status</div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              cycle_info.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {cycle_info.status}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Insights & Patterns */}
        <div className="space-y-6">
          <DashboardSection section={sections.insights} maxItems={3} />
          <DashboardSection section={sections.patterns} maxItems={2} />
          <DashboardSection section={sections.identified_patterns} maxItems={3} />
        </div>

        {/* Recommendations & Synthesis */}
        <div className="space-y-6">
          <DashboardSection section={sections.recommendations} maxItems={2} />
          <DashboardSection section={sections.synthesis} maxItems={2} />
          <DashboardSection section={sections.emerging_themes} maxItems={3} />
        </div>

        {/* Focus Areas & Growth */}
        <div className="space-y-6">
          <DashboardSection section={sections.focus_areas} maxItems={3} />
          <DashboardSection section={sections.blind_spots} maxItems={2} />
          <DashboardSection section={sections.celebration_moments} maxItems={1} />
        </div>
      </div>

      {/* Prompts Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Proactive Prompts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardSection 
            section={sections.reflection_prompts} 
            maxItems={2} 
            showHeader={true}
            className="bg-white"
          />
          <DashboardSection 
            section={sections.exploration_prompts} 
            maxItems={2} 
            showHeader={true}
            className="bg-white"
          />
          <DashboardSection 
            section={sections.goal_setting_prompts} 
            maxItems={2} 
            showHeader={true}
            className="bg-white"
          />
          <DashboardSection 
            section={sections.skill_development_prompts} 
            maxItems={2} 
            showHeader={true}
            className="bg-white"
          />
          <DashboardSection 
            section={sections.creative_expression_prompts} 
            maxItems={2} 
            showHeader={true}
            className="bg-white"
          />
        </div>
      </div>
    </div>
  );
};
