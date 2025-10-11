import { useState, useEffect } from 'react';

interface RelatedEntity {
  entity_id: string;
  title: string;
  entity_type: string;
  relationship_type: string;
}

interface UseRelatedEntitiesReturn {
  relatedEntities: RelatedEntity[] | null;
  isLoadingRelated: boolean;
  errorRelated: string | null;
  refetchRelated: () => Promise<void>;
}

/**
 * Hook for fetching related entities via Neo4j relationships
 */
export const useRelatedEntities = (
  entityId?: string,
  entityType?: string
): UseRelatedEntitiesReturn => {
  const [relatedEntities, setRelatedEntities] = useState<RelatedEntity[] | null>(null);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [errorRelated, setErrorRelated] = useState<string | null>(null);

  const fetchRelatedEntities = async () => {
    if (!entityId || !entityType) {
      setRelatedEntities(null);
      return;
    }

    setIsLoadingRelated(true);
    setErrorRelated(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/entities/${entityId}/related?entityType=${entityType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch related entities');
      }

      const data = await response.json();
      
      if (data.success) {
        setRelatedEntities(data.data || []);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch related entities');
      }
    } catch (err) {
      console.error('Error fetching related entities:', err);
      setErrorRelated(err instanceof Error ? err.message : 'An unknown error occurred');
      setRelatedEntities(null);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  useEffect(() => {
    if (entityId && entityType) {
      fetchRelatedEntities();
    }
  }, [entityId, entityType]);

  return {
    relatedEntities,
    isLoadingRelated,
    errorRelated,
    refetchRelated: fetchRelatedEntities,
  };
};

