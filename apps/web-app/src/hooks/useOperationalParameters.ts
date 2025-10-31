import { useState, useEffect } from 'react';

interface OperationalParameters {
  ontology_optimization: {
    default_date_range_days: number;
    max_date_range_days: number;
    min_date_range_days: number;
    max_user_prompt_tokens: number;
    max_output_tokens: number;
    max_total_tokens: number;
    sampling_strategy: string;
    max_concept_merges: number;
    max_strategic_relationships: number;
    max_community_structures: number;
  };
  ingestion: {
    min_importance_score_threshold: number;
  };
  workers: {
    check_interval_seconds: number;
  };
  conversation_timeout_seconds: number;
  version: string;
}

interface UseOperationalParametersReturn {
  parameters: OperationalParameters | null;
  isLoading: boolean;
  error: string | null;
  ontologyConstraints: {
    minDays: number;
    maxDays: number;
    defaultDays: number;
  } | null;
}

export const useOperationalParameters = (): UseOperationalParametersReturn => {
  const [parameters, setParameters] = useState<OperationalParameters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/v1/config/operational-parameters');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch operational parameters: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setParameters(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching operational parameters:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback to hardcoded defaults if API fails
        setParameters({
          ontology_optimization: {
            default_date_range_days: 2,
            max_date_range_days: 7,
            min_date_range_days: 1,
            max_user_prompt_tokens: 20000,
            max_output_tokens: 50000,
            max_total_tokens: 50000,
            sampling_strategy: 'entity_id_hash',
            max_concept_merges: 20,
            max_strategic_relationships: 30,
            max_community_structures: 10
          },
          ingestion: {
            min_importance_score_threshold: 3
          },
          workers: {
            check_interval_seconds: 60
          },
          conversation_timeout_seconds: 600,
          version: '1.0'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchParameters();
  }, []);

  const ontologyConstraints = parameters ? {
    minDays: parameters.ontology_optimization.min_date_range_days,
    maxDays: parameters.ontology_optimization.max_date_range_days,
    defaultDays: parameters.ontology_optimization.default_date_range_days
  } : null;

  return {
    parameters,
    isLoading,
    error,
    ontologyConstraints
  };
};


