import { useState } from 'react';
import { useNotificationStore } from '../stores/NotificationStore';

interface TriggerOntologyOptimizationResponse {
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

interface DateRange {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
}

interface UseOntologyOptimizationTriggerReturn {
  triggerOntologyOptimization: (dateRange?: DateRange) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  jobId: string | null;
}

export const useOntologyOptimizationTrigger = (): UseOntologyOptimizationTriggerReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();

  const triggerOntologyOptimization = async (dateRange?: DateRange): Promise<void> => {
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
        title: 'Optimizing Ontology',
        description: 'Analyzing your knowledge graph to optimize concept relationships...',
        userId: 'current-user', // This will be replaced by the actual user ID from the token
        autoHide: false,
        duration: 0
      });

      // Prepare request body
      const requestBody: any = {};
      if (dateRange) {
        requestBody.startDate = dateRange.startDate;
        requestBody.endDate = dateRange.endDate;
      }

      // Make API call
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/ontology/optimize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data: TriggerOntologyOptimizationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success && data.data) {
        setJobId(data.data.jobId);
        
        // Show job queued notification (not completion)
        addNotification({
          type: 'new_star_generated',
          title: 'Ontology Optimization Queued',
          description: `Ontology optimization job ${data.data.jobId} has been queued. Processing will begin shortly...`,
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
        title: 'Ontology Optimization Failed',
        description: `Failed to optimize ontology: ${errorMessage}`,
        userId: 'current-user',
        autoHide: true,
        duration: 5000
      });
      
      console.error('Error triggering ontology optimization:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    triggerOntologyOptimization,
    isLoading,
    error,
    jobId
  };
};


