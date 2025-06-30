/**
 * packages/tools/retrieval/index.ts
 * Main exports for HybridRetrievalTool package
 */

export * from './HybridRetrievalTool';
export * from './types'; // Make sure HRT-specific types are exported

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