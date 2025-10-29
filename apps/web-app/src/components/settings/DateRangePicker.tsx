import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useOperationalParameters } from '../../hooks/useOperationalParameters';

interface DateRange {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
}

interface DateRangePickerProps {
  onDateRangeChange: (dateRange: DateRange | null) => void;
  defaultRange?: DateRange;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
  defaultRange,
  className = ''
}) => {
  const { ontologyConstraints, isLoading: paramsLoading } = useOperationalParameters();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);

  // Initialize with default range or preset
  useEffect(() => {
    if (defaultRange) {
      setStartDate(defaultRange.startDate);
      setEndDate(defaultRange.endDate);
      setIsCustomRange(true);
    } else if (ontologyConstraints) {
      // Use dynamic default from operational parameters
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - ontologyConstraints.defaultDays);
      
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setIsCustomRange(false);
    }
  }, [defaultRange, ontologyConstraints]);

  // Notify parent of changes
  useEffect(() => {
    if (startDate && endDate) {
      onDateRangeChange({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      });
    } else {
      onDateRangeChange(null);
    }
  }, [startDate, endDate, onDateRangeChange]);

  const handlePresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setIsCustomRange(false);
  };

  const handleCustomRangeToggle = () => {
    setIsCustomRange(!isCustomRange);
    if (!isCustomRange) {
      // When switching to custom, keep current dates
      return;
    }
  };

  // Show loading state while fetching operational parameters
  if (paramsLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="text-xs text-white/50">Loading date range options...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preset Range Buttons */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Clock size={12} />
          <span>Quick Range</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ontologyConstraints && (
            <>
              {/* Generate preset buttons dynamically based on operational parameters */}
              {[ontologyConstraints.minDays, ontologyConstraints.defaultDays, ontologyConstraints.maxDays]
                .filter((days, index, array) => array.indexOf(days) === index) // Remove duplicates
                .sort((a, b) => a - b) // Sort ascending
                .map((days) => (
                  <button
                    key={days}
                    onClick={() => handlePresetRange(days)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      !isCustomRange && startDate && endDate && 
                      Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) === days
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {days} day{days !== 1 ? 's' : ''}
                  </button>
                ))}
            </>
          )}
          <button
            onClick={handleCustomRangeToggle}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              isCustomRange
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Inputs */}
      {isCustomRange && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Calendar size={12} />
            <span>Custom Range</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-white/50 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || new Date().toISOString().split('T')[0]}
                className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Date Range Summary */}
      {startDate && endDate && (
        <div className="space-y-1">
          <div className="text-xs text-white/50">
            {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            {(() => {
              const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
              return ` (${days} day${days !== 1 ? 's' : ''})`;
            })()}
          </div>
          {ontologyConstraints && (() => {
            const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
            if (days < ontologyConstraints.minDays) {
              return <div className="text-xs text-red-400">⚠️ Range must be at least {ontologyConstraints.minDays} day{ontologyConstraints.minDays !== 1 ? 's' : ''}</div>;
            } else if (days > ontologyConstraints.maxDays) {
              return <div className="text-xs text-red-400">⚠️ Range cannot exceed {ontologyConstraints.maxDays} day{ontologyConstraints.maxDays !== 1 ? 's' : ''}</div>;
            } else {
              return <div className="text-xs text-green-400">✅ Range is valid ({ontologyConstraints.minDays}-{ontologyConstraints.maxDays} days)</div>;
            }
          })()}
        </div>
      )}
    </div>
  );
};
