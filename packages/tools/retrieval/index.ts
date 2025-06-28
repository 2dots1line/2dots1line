/**
 * packages/tools/retrieval/index.ts
 * Main exports for HybridRetrievalTool package
 */

export { HybridRetrievalTool } from './HybridRetrievalTool';

// Export types for external use
export type {
  HRTInput,
  SeedEntity,
  CandidateEntity,
  ScoredEntity,
  EntityMetadata,
  ScoringContext,
  RetrievalWeights,
  CypherQuery,
  CypherTemplate,
  HRTExecutionContext,
  ExtendedAugmentedMemoryContext
} from './types';

// Export internal modules for advanced use cases (optional)
export { CypherBuilder, EntityScorer, HydrationAdapter, ParamGuard } from './internal'; 