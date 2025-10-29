/**
 * useDashboard.ts
 * V11.0 Unified dashboard hook for both mobile and desktop
 * 
 * Features:
 * - Single source of truth for dashboard data
 * - Automatic refresh on insight completion via socket events
 * - Cycle support (optional cycleId parameter)
 * - Type-safe entity types from backend
 */

import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DynamicDashboardData } from '../services/dashboardService';

interface UseDashboardReturn {
  data: DynamicDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboard = (cycleId?: string): UseDashboardReturn => {
  const [data, setData] = useState<DynamicDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = cycleId
        ? await dashboardService.getDynamicDashboardForCycle(cycleId)
        : await dashboardService.getDynamicDashboard();

      if (response.success && response.data) {
        setData(response.data);
        console.log(`[useDashboard] ✅ Loaded dashboard data for cycle: ${response.data.cycle_id}`);
        console.log(`[useDashboard] Sections available: ${Object.keys(response.data.sections).join(', ')}`);
      } else {
        const errorMsg = response.error || 'Failed to load dashboard data';
        setError(errorMsg);
        console.error(`[useDashboard] ❌ Error: ${errorMsg}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('[useDashboard] ❌ Exception:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cycleId]);

  // Initial load
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Listen for insight generation completion and refresh automatically
  useEffect(() => {
    const handleInsightComplete = (event: CustomEvent) => {
      console.log('[useDashboard] 🔄 Insight generation complete, refreshing dashboard...', event.detail);
      fetchDashboard();
    };

    // Listen for custom event dispatched by useNotificationConnection
    window.addEventListener('insight_generation_complete', handleInsightComplete as EventListener);
    
    return () => {
      window.removeEventListener('insight_generation_complete', handleInsightComplete as EventListener);
    };
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard
  };
};

