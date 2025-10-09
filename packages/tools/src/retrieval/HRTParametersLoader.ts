/**
 * HRTParametersLoader
 * Loads user-specific HRT parameters with hrt_config.json as base defaults
 */

import { DatabaseService } from '@2dots1line/database';
import { HRTUserParameters } from './types';

export class HRTParametersLoader {
  private db: DatabaseService;
  private configService: any;
  private systemDefaults: HRTUserParameters | null = null;

  constructor(databaseService: DatabaseService, configService: any) {
    this.db = databaseService;
    this.configService = configService;
  }

  /**
   * Load system defaults from hrt_config.json
   */
  private async loadSystemDefaults(): Promise<HRTUserParameters> {
    if (this.systemDefaults) {
      return this.systemDefaults;
    }

    try {
      const hrtConfig = await this.configService.loadConfig('hrt_config');
      
      // Map hrt_config.json structure to HRTUserParameters interface
      this.systemDefaults = {
        weaviate: {
          resultsPerPhrase: hrtConfig?.stage_configurations?.semantic_grounding?.results_per_phrase || 3,
          similarityThreshold: hrtConfig?.stage_configurations?.semantic_grounding?.minimum_similarity || 0.1,
          timeoutMs: hrtConfig?.stage_configurations?.semantic_grounding?.weaviate_timeout_ms || 5000,
        },
        neo4j: {
          maxResultLimit: hrtConfig?.stage_configurations?.graph_traversal?.max_seed_entities || 100,
          maxGraphHops: hrtConfig?.stage_configurations?.graph_traversal?.max_hops || 3,
          maxSeedEntities: hrtConfig?.stage_configurations?.graph_traversal?.max_seed_entities || 10,
          queryTimeoutMs: hrtConfig?.stage_configurations?.graph_traversal?.neo4j_timeout_ms || 10000,
        },
        scoring: {
          topNCandidatesForHydration: hrtConfig?.stage_configurations?.scoring?.top_n_for_hydration || 50,
          recencyDecayRate: hrtConfig?.stage_configurations?.scoring?.recency_decay_rate || 0.1,
          diversityThreshold: hrtConfig?.stage_configurations?.scoring?.diversity_threshold || 0.3,
        },
        scoringWeights: {
          alphaSemanticSimilarity: 0.5,
          betaRecency: 0.3,
          gammaImportanceScore: 0.2,
        },
        performance: {
          maxRetrievalTimeMs: hrtConfig?.performance_limits?.max_total_execution_time_ms || 5000,
          enableParallelProcessing: hrtConfig?.performance_limits?.enable_parallel_processing ?? true,
          maxConcurrentPhrases: hrtConfig?.performance_limits?.max_concurrent_phrases || 3,
          cacheResults: hrtConfig?.caching?.enable_result_caching || true,
        },
        qualityFilters: {
          minimumRelevanceScore: 0.1,
          dedupeSimilarResults: true,
          boostRecentContent: true,
        },
      };

      console.log('[HRTParametersLoader] Loaded system defaults from hrt_config.json:', {
        topNCandidatesForHydration: this.systemDefaults.scoring.topNCandidatesForHydration,
        resultsPerPhrase: this.systemDefaults.weaviate.resultsPerPhrase,
        maxGraphHops: this.systemDefaults.neo4j.maxGraphHops
      });

      return this.systemDefaults;
    } catch (error) {
      console.error('Failed to load hrt_config.json, falling back to hardcoded defaults:', error);
      return this.getFallbackDefaults();
    }
  }

  /**
   * Load user-specific HRT parameters from Redis with system defaults as base
   */
  public async loadUserParameters(userId: string): Promise<HRTUserParameters> {
    try {
      // Load system defaults first
      const systemDefaults = await this.loadSystemDefaults();
      
      const key = `hrt_parameters:${userId}`;
      const storedParams = await this.db.redis.get(key);

      if (!storedParams) {
        // Return system defaults if no user overrides found
        return systemDefaults;
      }

      const userOverrides = JSON.parse(storedParams) as Partial<HRTUserParameters>;
      
      // Merge user overrides with system defaults
      const mergedParameters = this.mergeParameters(systemDefaults, userOverrides);
      
      // Validate the merged parameters
      this.validateParameters(mergedParameters);
      
      console.log('[HRTParametersLoader] Loaded parameters for user:', userId, {
        topNCandidatesForHydration: mergedParameters.scoring.topNCandidatesForHydration,
        resultsPerPhrase: mergedParameters.weaviate.resultsPerPhrase,
        maxGraphHops: mergedParameters.neo4j.maxGraphHops
      });
      
      return mergedParameters;
    } catch (error) {
      console.error('Failed to load HRT parameters for user:', userId, error);
      // Return system defaults on error
      return await this.loadSystemDefaults();
    }
  }

  /**
   * Merge user overrides with system defaults
   */
  private mergeParameters(systemDefaults: HRTUserParameters, userOverrides: Partial<HRTUserParameters>): HRTUserParameters {
    return {
      weaviate: {
        ...systemDefaults.weaviate,
        ...userOverrides.weaviate,
      },
      neo4j: {
        ...systemDefaults.neo4j,
        ...userOverrides.neo4j,
      },
      scoring: {
        ...systemDefaults.scoring,
        ...userOverrides.scoring,
      },
      scoringWeights: {
        ...systemDefaults.scoringWeights,
        ...userOverrides.scoringWeights,
      },
      performance: {
        ...systemDefaults.performance,
        ...userOverrides.performance,
      },
      qualityFilters: {
        ...systemDefaults.qualityFilters,
        ...userOverrides.qualityFilters,
      },
    };
  }

  /**
   * Get fallback default HRT parameters (used when hrt_config.json fails to load)
   */
  private getFallbackDefaults(): HRTUserParameters {
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
        topNCandidatesForHydration: 50, // Updated to match hrt_config.json default
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
        maxConcurrentPhrases: 3,
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

