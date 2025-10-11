'use client';

import React, { useState, useEffect } from 'react';
import { useEngagementStore } from '../../stores/EngagementStore';
import { useEngagementContext } from '../../hooks/useEngagementContext';

/**
 * Debug component to visualize engagement tracking data
 * Only shows in development mode
 */
export const EngagementDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { events, getEngagementContext } = useEngagementStore();
  const { getFormattedEngagementContext, analyzeEngagementPatterns } = useEngagementContext();
  const [engagementData, setEngagementData] = useState<any>(null);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    const updateData = () => {
      const context = getEngagementContext(30000); // Last 30 seconds
      const formatted = getFormattedEngagementContext(30000);
      const patterns = analyzeEngagementPatterns(30000);
      
      setEngagementData({
        context,
        formatted,
        patterns,
        recentEvents: events.slice(-10) // Last 10 events
      });
    };

    updateData();
    const interval = setInterval(updateData, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [events, getEngagementContext, getFormattedEngagementContext, analyzeEngagementPatterns]);

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
          {engagementData.recentEvents.map((event: any, index: number) => (
            <div key={index} style={{ marginLeft: '10px', fontSize: '10px' }}>
              {event.type} {event.target} ({event.view})
            </div>
          ))}
          
          <div style={{ marginTop: '10px' }}>
            <strong>Session Duration:</strong> {Math.round((engagementData.context?.sessionDuration || 0) / 1000)}s
          </div>
          
          <div>
            <strong>Total Clicks:</strong> {engagementData.context?.interactionSummary?.totalClicks || 0}
          </div>
          
          <div>
            <strong>View Switches:</strong> {engagementData.context?.interactionSummary?.viewSwitches || 0}
          </div>
          
          {engagementData.patterns && (
            <div style={{ marginTop: '10px' }}>
              <strong>Patterns:</strong>
              <div style={{ fontSize: '10px', marginLeft: '10px' }}>
                {Object.entries(engagementData.patterns).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    {key}: {JSON.stringify(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
