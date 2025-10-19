import { useState } from 'react';
import { useNotificationStore } from '../stores/NotificationStore';

interface TriggerInsightResponse {
  success: boolean;
  data?: {
    jobId: string;
    status: string;
    message: string;
    userId: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface UseInsightTriggerReturn {
  triggerInsight: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  jobId: string | null;
}

export const useInsightTrigger = (): UseInsightTriggerReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();

  const triggerInsight = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setJobId(null);

    try {
      // Get auth token
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Show initial notification
      addNotification({
        type: 'new_star_generated', // Using existing type for now
        title: 'Generating Insights',
        description: 'Analyzing your recent activity to generate new insights...',
        userId: 'current-user', // This will be replaced by the actual user ID from the token
        autoHide: false,
        duration: 0
      });

      // Make API call
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/insights/trigger`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data: TriggerInsightResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success && data.data) {
        setJobId(data.data.jobId);
        
        // Show job queued notification (not completion)
        addNotification({
          type: 'new_star_generated',
          title: 'Insights Job Queued',
          description: `Insight generation job ${data.data.jobId} has been queued. Processing will begin shortly...`,
          userId: 'current-user',
          autoHide: true,
          duration: 5000
        });
      } else {
        throw new Error('Unexpected response format');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      // Show error notification
      addNotification({
        type: 'new_star_generated',
        title: 'Insight Generation Failed',
        description: `Failed to generate insights: ${errorMessage}`,
        userId: 'current-user',
        autoHide: true,
        duration: 5000
      });
      
      console.error('Error triggering insight generation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    triggerInsight,
    isLoading,
    error,
    jobId
  };
};
