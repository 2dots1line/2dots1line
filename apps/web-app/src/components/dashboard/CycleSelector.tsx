/**
 * CycleSelector.tsx
 * V9.7 Component for selecting different cycles in the dashboard
 */

import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';

interface Cycle {
  cycle_id: string;
  cycle_start_date: string;
  cycle_end_date: string;
  status: string;
  artifacts_created: number;
  prompts_created: number;
  processing_duration_ms?: number;
}

interface CycleSelectorProps {
  selectedCycleId?: string;
  onCycleChange: (cycleId: string) => void;
  className?: string;
}

export const CycleSelector: React.FC<CycleSelectorProps> = ({
  selectedCycleId,
  onCycleChange,
  className = ''
}) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getUserCycles(20);
      
      if (response.success && response.data) {
        setCycles(response.data.cycles);
      } else {
        setError(response.error || 'Failed to load cycles');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading cycles:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCycleDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-10 w-48 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error loading cycles: {error}
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No cycles available
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Select Cycle
      </label>
      <select
        value={selectedCycleId || ''}
        onChange={(e) => onCycleChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Most Recent</option>
        {cycles.map((cycle) => (
          <option key={cycle.cycle_id} value={cycle.cycle_id}>
            {formatCycleDate(cycle.cycle_start_date)} - {formatCycleDate(cycle.cycle_end_date)} 
            ({cycle.artifacts_created} artifacts, {cycle.prompts_created} prompts)
          </option>
        ))}
      </select>
      
      {selectedCycleId && (
        <div className="text-xs text-gray-500">
          {(() => {
            const cycle = cycles.find(c => c.cycle_id === selectedCycleId);
            if (!cycle) return null;
            
            return (
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
                  {cycle.status}
                </span>
                {cycle.processing_duration_ms && (
                  <span>Processed in {Math.round(cycle.processing_duration_ms / 1000)}s</span>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
