/**
 * HRT Parameters Controller
 * Handles API endpoints for managing Hybrid Retrieval Tool parameters
 */

import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '@2dots1line/database';

export interface HRTParameters {
  weaviate: {
    resultsPerPhrase: number;
    similarityThreshold: number;
    timeoutMs: number;
  };
  neo4j: {
    maxResultLimit: number;
    maxGraphHops: number;
    maxSeedEntities: number;
    queryTimeoutMs: number;
  };
  scoring: {
    topNCandidatesForHydration: number;
    recencyDecayRate: number;
    diversityThreshold: number;
  };
  scoringWeights: {
    alphaSemanticSimilarity: number;
    betaRecency: number;
    gammaImportanceScore: number;
  };
  performance: {
    maxRetrievalTimeMs: number;
    enableParallelProcessing: boolean;
    cacheResults: boolean;
  };
  qualityFilters: {
    minimumRelevanceScore: number;
    dedupeSimilarResults: boolean;
    boostRecentContent: boolean;
  };
}

interface SaveHRTParametersRequest {
  parameters: HRTParameters;
  userId: string;
}

interface HRTParametersResponse {
  success: boolean;
  data: HRTParameters;
  message?: string;
}

export class HRTParametersController {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Save HRT parameters for a user
   */
  public saveParameters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { parameters, userId } = req.body as SaveHRTParametersRequest;
      const requestingUserId = (req as any).user?.userId;

      // Validate that the user can only save their own parameters
      if (requestingUserId && requestingUserId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot save parameters for another user',
        });
        return;
      }

      // Validate parameters
      const validation = this.validateParameters(parameters);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: `Invalid parameters: ${validation.errors.join(', ')}`,
        });
        return;
      }

      // Save to database (using Redis for now, could be moved to PostgreSQL)
      const key = `hrt_parameters:${userId}`;
      await this.databaseService.redis.setex(key, 86400 * 30, JSON.stringify(parameters)); // 30 days TTL

      const response: HRTParametersResponse = {
        success: true,
        data: parameters,
        message: 'Parameters saved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error saving HRT parameters:', error);
      next(error);
    }
  };

  /**
   * Load HRT parameters for a user
   */
  public loadParameters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const requestingUserId = (req as any).user?.userId;

      // Validate that the user can only load their own parameters
      if (requestingUserId && requestingUserId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot load parameters for another user',
        });
        return;
      }

      // Load from database
      const key = `hrt_parameters:${userId}`;
      const storedParams = await this.databaseService.redis.get(key);

      if (!storedParams) {
        // Return default parameters if none found
        const defaultParams = this.getDefaultParameters();
        const response: HRTParametersResponse = {
          success: true,
          data: defaultParams,
          message: 'No saved parameters found, returning defaults',
        };
        res.status(200).json(response);
        return;
      }

      const parameters = JSON.parse(storedParams) as HRTParameters;
      const response: HRTParametersResponse = {
        success: true,
        data: parameters,
        message: 'Parameters loaded successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error loading HRT parameters:', error);
      next(error);
    }
  };

  /**
   * Reset HRT parameters to defaults for a user
   */
  public resetParameters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const requestingUserId = (req as any).user?.userId;

      // Validate that the user can only reset their own parameters
      if (requestingUserId && requestingUserId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot reset parameters for another user',
        });
        return;
      }

      const defaultParams = this.getDefaultParameters();

      // Save default parameters
      const key = `hrt_parameters:${userId}`;
      await this.databaseService.redis.setex(key, 86400 * 30, JSON.stringify(defaultParams)); // 30 days TTL

      const response: HRTParametersResponse = {
        success: true,
        data: defaultParams,
        message: 'Parameters reset to defaults successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error resetting HRT parameters:', error);
      next(error);
    }
  };

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
   * Validate HRT parameters
   */
  private validateParameters(parameters: HRTParameters): { isValid: boolean; errors: string[] } {
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

