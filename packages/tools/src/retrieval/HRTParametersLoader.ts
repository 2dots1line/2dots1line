/**
 * HRTParametersLoader
 * Loads user-specific HRT parameters from the API
 */

import { DatabaseService } from '@2dots1line/database';
import { HRTUserParameters } from './types';

export class HRTParametersLoader {
  private db: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
  }

  /**
   * Load user-specific HRT parameters from Redis
   */
  public async loadUserParameters(userId: string): Promise<HRTUserParameters> {
    try {
      const key = `hrt_parameters:${userId}`;
      const storedParams = await this.db.redis.get(key);

      if (!storedParams) {
        // Return default parameters if none found
        return this.getDefaultParameters();
      }

      const parameters = JSON.parse(storedParams) as HRTUserParameters;
      
      // Validate the loaded parameters
      this.validateParameters(parameters);
      
      return parameters;
    } catch (error) {
      console.error('Failed to load HRT parameters for user:', userId, error);
      // Return default parameters on error
      return this.getDefaultParameters();
    }
  }

  /**
   * Get default HRT parameters
   */
  private getDefaultParameters(): HRTUserParameters {
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
   * Validate HRT parameters
   */
  private validateParameters(parameters: HRTUserParameters): void {
    // Validate scoring weights sum to 1.0
    const { alphaSemanticSimilarity, betaRecency, gammaImportanceScore } = parameters.scoringWeights;
    const total = alphaSemanticSimilarity + betaRecency + gammaImportanceScore;
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Invalid scoring weights: must sum to 1.0 (current: ${total.toFixed(3)})`);
    }

    // Validate numeric ranges
    if (parameters.weaviate.resultsPerPhrase < 1 || parameters.weaviate.resultsPerPhrase > 20) {
      throw new Error('resultsPerPhrase must be between 1 and 20');
    }
    if (parameters.weaviate.similarityThreshold < 0 || parameters.weaviate.similarityThreshold > 1) {
      throw new Error('similarityThreshold must be between 0 and 1');
    }
    if (parameters.neo4j.maxGraphHops < 1 || parameters.neo4j.maxGraphHops > 10) {
      throw new Error('maxGraphHops must be between 1 and 10');
    }
    if (parameters.scoring.topNCandidatesForHydration < 1 || parameters.scoring.topNCandidatesForHydration > 100) {
      throw new Error('topNCandidatesForHydration must be between 1 and 100');
    }
  }
}

