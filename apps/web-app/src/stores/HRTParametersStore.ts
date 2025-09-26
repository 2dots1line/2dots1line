/**
 * HRT Parameters Store
 * Manages Hybrid Retrieval Tool configuration parameters
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { hrtParametersService } from '../services/hrtParametersService';

export interface HRTParameters {
  // Vector Search Parameters (Weaviate)
  weaviate: {
    resultsPerPhrase: number;
    similarityThreshold: number;
    timeoutMs: number;
  };
  
  // Graph Traversal Parameters (Neo4j)
  neo4j: {
    maxResultLimit: number;
    maxGraphHops: number;
    maxSeedEntities: number;
    queryTimeoutMs: number;
  };
  
  // Scoring Parameters
  scoring: {
    topNCandidatesForHydration: number;
    recencyDecayRate: number;
    diversityThreshold: number;
  };
  
  // Scoring Weights
  scoringWeights: {
    alphaSemanticSimilarity: number;
    betaRecency: number;
    gammaImportanceScore: number;
  };
  
  // Performance Tuning
  performance: {
    maxRetrievalTimeMs: number;
    enableParallelProcessing: boolean;
    cacheResults: boolean;
  };
  
  // Quality Filters
  qualityFilters: {
    minimumRelevanceScore: number;
    dedupeSimilarResults: boolean;
    boostRecentContent: boolean;
  };
}

const defaultParameters: HRTParameters = {
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

interface HRTParametersState {
  parameters: HRTParameters;
  isModified: boolean;
  lastSaved: Date | null;
  
  // Actions
  updateWeaviateParams: (params: Partial<HRTParameters['weaviate']>) => void;
  updateNeo4jParams: (params: Partial<HRTParameters['neo4j']>) => void;
  updateScoringParams: (params: Partial<HRTParameters['scoring']>) => void;
  updateScoringWeights: (weights: Partial<HRTParameters['scoringWeights']>) => void;
  updatePerformanceParams: (params: Partial<HRTParameters['performance']>) => void;
  updateQualityFilters: (filters: Partial<HRTParameters['qualityFilters']>) => void;
  resetToDefaults: () => void;
  saveParameters: () => Promise<void>;
  loadParameters: () => Promise<void>;
  setModified: (modified: boolean) => void;
}

export const useHRTParametersStore = create<HRTParametersState>()(
  persist(
    (set, get) => ({
      parameters: defaultParameters,
      isModified: false,
      lastSaved: null,
      
      updateWeaviateParams: (params) => {
        set((state) => ({
          parameters: {
            ...state.parameters,
            weaviate: { ...state.parameters.weaviate, ...params },
          },
          isModified: true,
        }));
      },
      
      updateNeo4jParams: (params) => {
        set((state) => ({
          parameters: {
            ...state.parameters,
            neo4j: { ...state.parameters.neo4j, ...params },
          },
          isModified: true,
        }));
      },
      
      updateScoringParams: (params) => {
        set((state) => ({
          parameters: {
            ...state.parameters,
            scoring: { ...state.parameters.scoring, ...params },
          },
          isModified: true,
        }));
      },
      
      updateScoringWeights: (weights) => {
        set((state) => ({
          parameters: {
            ...state.parameters,
            scoringWeights: { ...state.parameters.scoringWeights, ...weights },
          },
          isModified: true,
        }));
      },
      
      updatePerformanceParams: (params) => {
        set((state) => ({
          parameters: {
            ...state.parameters,
            performance: { ...state.parameters.performance, ...params },
          },
          isModified: true,
        }));
      },
      
      updateQualityFilters: (filters) => {
        set((state) => ({
          parameters: {
            ...state.parameters,
            qualityFilters: { ...state.parameters.qualityFilters, ...filters },
          },
          isModified: true,
        }));
      },
      
      resetToDefaults: () => {
        set({
          parameters: defaultParameters,
          isModified: true,
        });
      },
      
      saveParameters: async () => {
        try {
          const { parameters } = get();
          const userId = 'dev-user-123'; // TODO: Get from auth context
          
          // Validate parameters before saving
          const validation = hrtParametersService.validateParameters(parameters);
          if (!validation.isValid) {
            throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
          }
          
          const response = await hrtParametersService.saveParameters(parameters, userId);
          
          if (response.success) {
            set({
              isModified: false,
              lastSaved: new Date(),
            });
          } else {
            throw new Error(response.message || 'Failed to save parameters');
          }
        } catch (error) {
          console.error('Failed to save HRT parameters:', error);
          throw error;
        }
      },
      
      loadParameters: async () => {
        try {
          const userId = 'dev-user-123'; // TODO: Get from auth context
          const response = await hrtParametersService.loadParameters(userId);
          
          if (response.success) {
            set({
              parameters: response.data,
              isModified: false,
              lastSaved: new Date(),
            });
          } else {
            throw new Error(response.message || 'Failed to load parameters');
          }
        } catch (error) {
          console.error('Failed to load HRT parameters:', error);
          throw error;
        }
      },
      
      setModified: (modified) => {
        set({ isModified: modified });
      },
    }),
    {
      name: 'hrt-parameters-storage',
      partialize: (state) => ({ parameters: state.parameters }),
    }
  )
);
