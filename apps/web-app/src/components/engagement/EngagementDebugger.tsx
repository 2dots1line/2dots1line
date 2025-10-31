'use client';

import React, { useState, useEffect } from 'react';
import { useEngagementStore } from '../../stores/EngagementStore';
import { useEngagementContext } from '../../hooks/useEngagementContext';
import type { EngagementEvent } from '@2dots1line/shared-types';

/**
 * Debug component to visualize engagement tracking data
 * Only shows in development mode
 */
export const EngagementDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { events, getEngagementContext } = useEngagementStore();
  const { getFormattedEngagementContext, analyzeEngagementPatterns } = useEngagementContext();

  interface EngagementDebugData {
    context: unknown;
    formatted: unknown;
    patterns: Record<string, unknown> | null;
    recentEvents: EngagementEvent[];
  }
  const [engagementData, setEngagementData] = useState<EngagementDebugData | null>(null);

  useEffect(() => {
    // Only run in development; keeps hooks order stable
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const updateData = () => {
      const context = getEngagementContext(30000);
      const formatted = getFormattedEngagementContext(30000);
      const patterns = analyzeEngagementPatterns(30000);

      setEngagementData({
        context,
        formatted,
        patterns,
        recentEvents: events.slice(-10),
      });
    };

    updateData();
    const interval = setInterval(updateData, 2000);
    return () => clearInterval(interval);
  }, [events, getEngagementContext, getFormattedEngagementContext, analyzeEngagementPatterns]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong>Engagement Debug</strong>
        <button 
          onClick={() => setIsVisible(!isVisible)}
          style={{ 
            background: 'none', 
            border: '1px solid white', 
            color: 'white', 
            padding: '2px 6px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isVisible && engagementData && (
        <div>
          <div><strong>Recent Events ({engagementData.recentEvents.length}):</strong></div>
          {engagementData.recentEvents.map((event: EngagementEvent, index: number) => (
            <div key={index} style={{ marginLeft: '10px', fontSize: '10px' }}>
              {event.type} {event.target} ({event.view})
            </div>
          ))}

          {/* Patterns typed entries */}
          {engagementData.patterns && (
            <div style={{ marginTop: '10px' }}>
              <strong>Patterns:</strong>
              <div style={{ fontSize: '10px', marginLeft: '10px' }}>
                {Object.entries(engagementData.patterns).map(
                  ([key, value]: [string, unknown]) => (
                    <div key={key}>
                      {key}: {JSON.stringify(value)}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
