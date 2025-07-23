import { useState, useEffect } from 'react';

interface EntityDetails {
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

interface UseEntityDetailsReturn {
  entityDetails: EntityDetails | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Universal hook for fetching entity details
 * Works for both cards (via source_entity_id) and nodes (via node.id)
 */
export const useEntityDetails = (item: any): UseEntityDetailsReturn => {
  const [entityDetails, setEntityDetails] = useState<EntityDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntityDetails = async () => {
    // Determine entity ID and type from the item
    let entityId: string | null = null;
    let entityType: string | null = null;

    if (item?.source_entity_id && item?.source_entity_type) {
      // This is a card - use its source entity
      entityId = item.source_entity_id;
      entityType = item.source_entity_type;
    } else if (item?.id && item?.type) {
      // This is a node - use its id and type
      entityId = item.id;
      entityType = item.type;
    } else {
      setError('Invalid item data - missing entity ID or type');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For development, use dev-token if no auth token is available
      let token = localStorage.getItem('auth_token');
      if (!token && process.env.NODE_ENV === 'development') {
        token = 'dev-token';
        console.log('🔧 useEntityDetails: Using development token');
      }
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/nodes/${entityId}/details?entityType=${entityType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch entity details');
      }

      const data = await response.json();
      
      if (data.success) {
        setEntityDetails(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch entity details');
      }
    } catch (err) {
      console.error('Error fetching entity details:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setEntityDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (item) {
      fetchEntityDetails();
    }
  }, [item?.source_entity_id, item?.source_entity_type, item?.id, item?.type]);

  return {
    entityDetails,
    isLoading,
    error,
    refetch: fetchEntityDetails,
  };
}; 