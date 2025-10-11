'use client';

import React from 'react';
import { useEngagementStore } from '../../stores/EngagementStore';
import { useEngagementContext } from '../../hooks/useEngagementContext';

/**
 * Test component to verify engagement tracking works
 * Only shows in development mode
 */
export const EngagementTest: React.FC = () => {
  const { trackEvent, events } = useEngagementStore();
  const { getFormattedEngagementContext } = useEngagementContext();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const testEngagement = () => {
    console.log('🧪 Testing engagement tracking...');
    
    // Test basic event tracking
    trackEvent({
      type: 'click',
      target: 'test_entity_123',
      targetType: 'entity',
      view: 'cosmos',
      metadata: { test: true }
    });

    // Test engagement context formatting
    const context = getFormattedEngagementContext(30000);
    console.log('🧪 Engagement context:', context);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>Engagement Test</strong>
      </div>
      <div style={{ marginBottom: '10px' }}>
        Events: {events.length}
      </div>
      <button 
        onClick={testEngagement}
        style={{
          background: 'none',
          border: '1px solid white',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Engagement
      </button>
    </div>
  );
};
