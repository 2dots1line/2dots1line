/**
 * types.ts
 * Comprehensive type definitions for HybridRetrievalTool V9.5
 */

// User-specific HRT Parameters
export interface HRTUserParameters {
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
    maxConcurrentPhrases: number;
    cacheResults: boolean;
  };
  qualityFilters: {
    minimumRelevanceScore: number;
    dedupeSimilarResults: boolean;
    boostRecentContent: boolean;
  };
}

// Core Input/Output Types
export interface HRTInput {
  keyPhrasesForRetrieval: string[];
  userId: string;
  retrievalScenario?: string;
  maxResults?: number;
  userParameters?: HRTUserParameters; // Optional user-specific parameters
}

// Entity Types
export interface SeedEntity {
  id: string;
  type: string;
  weaviateScore: number;
}

export interface CandidateEntity {
  id: string;
  type: 'MemoryUnit' | 'Concept' | 'DerivedArtifact';
  wasSeedEntity: boolean;
  hopDistance?: number;
  weaviateScore?: number;
}

export interface ScoredEntity {
  id: string;
  type: 'MemoryUnit' | 'Concept' | 'DerivedArtifact';
  finalScore: number;
  scoreBreakdown: {
    semantic: number;
    recency: number;
    importance_score: number;
  };
  wasSeedEntity: boolean;
  hopDistance?: number;
  weaviateScore?: number;
}

// Metadata Types
export interface EntityMetadata {
  entityId: string;
  entityType: 'MemoryUnit' | 'Concept' | 'DerivedArtifact';
  importance_score?: number;
  createdAt: Date;
  lastModified: Date;
}

// Scoring Context
export interface ScoringContext {
  seedEntitiesWithSimilarity: SeedEntity[];
  metadataMap: Map<string, EntityMetadata>;
}

// Retrieval Weights
export interface RetrievalWeights {
  alpha_semantic_similarity: number;
  beta_recency: number;
  gamma_importance_score: number;
  delta_user_preference?: number; // Optional in V9.5
}

// Cypher Query Types
export interface CypherQuery {
  cypher: string;
  params: Record<string, any>;
}

export interface CypherTemplate {
  description: string;
  cypher: string;
  allowedParams: string[];
  defaultParams: Record<string, any>;
}

// Execution Context
export interface HRTExecutionContext {
  requestId: string;
  userId: string;
  startTime: number;
  keyPhrasesCount: number;
  retrievalScenario: string;
  
  stageResults: {
    keyPhraseProcessing: { success: boolean; processedCount: number };
    semanticGrounding: { success: boolean; seedEntitiesFound: number };
    graphTraversal: { success: boolean; candidatesFound: number };
    preHydration: { success: boolean; metadataFetched: number };
    scoring: { success: boolean; entitiesScored: number };
    hydration: { success: boolean; entitiesHydrated: number };
  };
  
  timings: {
    totalDuration: number;
    weaviateLatency: number;
    neo4jLatency: number;
    postgresLatency: number;
    scoringDuration: number;
  };
  
  errors: Array<{
    stage: string;
    error: Error;
    impact: 'fatal' | 'degraded' | 'logged';
  }>;
}

// Extended AugmentedMemoryContext for V9.5 compatibility
export interface ExtendedAugmentedMemoryContext {
  relevant_memories?: string[];
  contextual_insights?: string[];
  emotional_context?: string;
  retrievedMemoryUnits?: any[];
  retrievedConcepts?: any[];
  retrievedArtifacts?: any[];
  retrievalSummary?: string;
  scoringDetails?: {
    totalCandidatesEvaluated: number;
    seedEntitiesFound: number;
    averageScore: number;
    scoringWeights: any;
  };
  unmatched_key_phrases?: string[];
  // NEW: Seed entity IDs for cosmos view
  seedEntityIds?: string[];
  errors?: Array<{
    stage: string;
    error: string;
    impact: string;
    timestamp: string;
  }>;
  performance_metadata?: {
    total_execution_time_ms: number;
    stage_timings: any;
    result_counts: {
      weaviate_candidates: number;
      neo4j_candidates: number;
      final_results_after_scoring: number;
    };
  };
} 