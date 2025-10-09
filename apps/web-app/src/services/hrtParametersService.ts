/**
 * HRT Parameters Service
 * Handles API calls for saving and loading HRT parameters
 */

import { HRTParameters } from '../stores/HRTParametersStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface HRTParametersResponse {
  success: boolean;
  data: HRTParameters;
  message?: string;
}

export interface SaveHRTParametersRequest {
  parameters: HRTParameters;
  userId: string;
}

export class HRTParametersService {
  private static instance: HRTParametersService;
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1`;
  }

  public static getInstance(): HRTParametersService {
    if (!HRTParametersService.instance) {
      HRTParametersService.instance = new HRTParametersService();
    }
    return HRTParametersService.instance;
  }

  /**
   * Save HRT parameters to the backend
   */
  public async saveParameters(
    parameters: HRTParameters,
    userId: string
  ): Promise<HRTParametersResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/hrt/parameters`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          parameters,
          userId,
        } as SaveHRTParametersRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to save HRT parameters:', error);
      throw new Error(`Failed to save HRT parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load HRT parameters from the backend
   */
  public async loadParameters(userId: string): Promise<HRTParametersResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/hrt/parameters/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No parameters found, return default parameters
          return {
            success: true,
            data: this.getDefaultParameters(),
            message: 'No saved parameters found, using defaults',
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to load HRT parameters:', error);
      // Return default parameters on error
      return {
        success: true,
        data: this.getDefaultParameters(),
        message: 'Failed to load parameters, using defaults',
      };
    }
  }

  /**
   * Reset HRT parameters to defaults
   */
  public async resetParameters(userId: string): Promise<HRTParametersResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/hrt/parameters/${userId}/reset`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to reset HRT parameters:', error);
      throw new Error(`Failed to reset HRT parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get default HRT parameters
   */
  private getDefaultParameters(): HRTParameters {
    return {
      weaviate: {
        resultsPerPhrase: 3,
        similarityThreshold: 0.1,
        timeoutMs: 5000,
      },
      neo4j: {
        maxResultLimit: 100,
        maxGraphHops: 3,
        maxSeedEntities: 10,
        queryTimeoutMs: 10000,
      },
      scoring: {
        topNCandidatesForHydration: 10,
        recencyDecayRate: 0.1,
        diversityThreshold: 0.3,
      },
      scoringWeights: {
        alphaSemanticSimilarity: 0.5,
        betaRecency: 0.3,
        gammaImportanceScore: 0.2,
      },
      performance: {
        maxRetrievalTimeMs: 5000,
        enableParallelProcessing: true,
        cacheResults: true,
      },
      qualityFilters: {
        minimumRelevanceScore: 0.1,
        dedupeSimilarResults: true,
        boostRecentContent: true,
      },
    };
  }

  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Always use the actual user's token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Validate HRT parameters
   */
  public validateParameters(parameters: HRTParameters): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate scoring weights sum to 1.0
    const { alphaSemanticSimilarity, betaRecency, gammaImportanceScore } = parameters.scoringWeights;
    const total = alphaSemanticSimilarity + betaRecency + gammaImportanceScore;
    if (Math.abs(total - 1.0) > 0.01) {
      errors.push(`Scoring weights must sum to 1.0 (current: ${total.toFixed(3)})`);
    }

    // Validate individual weight ranges
    if (alphaSemanticSimilarity < 0 || alphaSemanticSimilarity > 1) {
      errors.push('Semantic similarity weight must be between 0 and 1');
    }
    if (betaRecency < 0 || betaRecency > 1) {
      errors.push('Recency weight must be between 0 and 1');
    }
    if (gammaImportanceScore < 0 || gammaImportanceScore > 1) {
      errors.push('Importance score weight must be between 0 and 1');
    }

    // Validate numeric ranges
    if (parameters.weaviate.resultsPerPhrase < 1 || parameters.weaviate.resultsPerPhrase > 20) {
      errors.push('Results per phrase must be between 1 and 20');
    }
    if (parameters.weaviate.similarityThreshold < 0 || parameters.weaviate.similarityThreshold > 1) {
      errors.push('Similarity threshold must be between 0 and 1');
    }
    if (parameters.neo4j.maxGraphHops < 1 || parameters.neo4j.maxGraphHops > 10) {
      errors.push('Max graph hops must be between 1 and 10');
    }
    if (parameters.scoring.topNCandidatesForHydration < 1 || parameters.scoring.topNCandidatesForHydration > 100) {
      errors.push('Top N candidates must be between 1 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const hrtParametersService = HRTParametersService.getInstance();
