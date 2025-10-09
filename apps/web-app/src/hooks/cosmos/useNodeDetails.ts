import { useState, useEffect } from 'react';

interface NodeDetails {
  id: string;
  type: string;
  title: string;
  description: string;
  importance: number;
  metadata: {
    conceptType?: string;
    status?: string;
    createdAt?: string;
    lastUpdated?: string;
    communityId?: string;
    mergedInto?: string;
    sentimentScore?: number;
    lastModified?: string;
    ingestionDate?: string;
    sourceConversationId?: string;
    artifactType?: string;
    sourceMemoryUnitIds?: string[];
    sourceConceptIds?: string[];
    contentData?: any;
    lastAnalyzed?: string;
  };
}

interface UseNodeDetailsReturn {
  nodeDetails: NodeDetails | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useNodeDetails = (node: any): UseNodeDetailsReturn => {
  const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNodeDetails = async () => {
    if (!node?.id || !node?.type) {
      setError('Invalid node data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use actual user token
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/nodes/${node.id}/details?entityType=${node.type}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch node details');
      }

      const data = await response.json();
      
      if (data.success) {
        setNodeDetails(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch node details');
      }
    } catch (err) {
      console.error('Error fetching node details:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setNodeDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (node?.id && node?.type) {
      fetchNodeDetails();
    }
  }, [node?.id, node?.type]);

  return {
    nodeDetails,
    isLoading,
    error,
    refetch: fetchNodeDetails,
  };
}; 