/**
 * EntityScorer.ts
 * V9.5 Entity scoring and prioritization module
 * Implements multi-factor scoring algorithm for retrieved entities
 */

import { ScoredEntity, CandidateEntity, EntityMetadata, ScoringContext, RetrievalWeights, SeedEntity } from '../types';

export class EntityScorer {
  private weights: RetrievalWeights;

  constructor(weights: RetrievalWeights) {
    this.weights = weights;
  }

  /**
   * Update scoring weights dynamically
   */
  public updateWeights(newWeights: RetrievalWeights): void {
    this.weights = newWeights;
  }

  /**
   * Score and prioritize candidates using V9.5 multi-factor algorithm
   */
  public scoreAndPrioritize(
    candidates: CandidateEntity[], 
    context: ScoringContext, 
    topN: number
  ): ScoredEntity[] {
    const scoredEntities = candidates.map(candidate => {
      const entityMetadata = context.metadataMap.get(candidate.id);
      if (!entityMetadata) return null; // Skip if no metadata

      const semanticScore = this.calculateSemanticScore(candidate, context.seedEntitiesWithSimilarity);
      const recencyScore = this.calculateRecencyScore(entityMetadata);
      const importanceScore = this.calculateImportanceScore(entityMetadata);
      
      // V9.5 scoring formula (user preference factor dropped)
      const finalScore = 
        (this.weights.alpha_semantic_similarity * semanticScore) +
        (this.weights.beta_recency * recencyScore) +
        (this.weights.gamma_importance_score * importanceScore);

      return {
        id: candidate.id,
        type: candidate.type,
        finalScore,
        scoreBreakdown: { 
          semantic: semanticScore, 
          recency: recencyScore, 
          importance_score: importanceScore 
        },
        wasSeedEntity: candidate.wasSeedEntity,
        hopDistance: candidate.hopDistance,
        weaviateScore: candidate.weaviateScore
      } as ScoredEntity;
    }).filter((e): e is ScoredEntity => e !== null);

    // Sort by final score and take top N
    return scoredEntities
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topN);
  }

  /**
   * Calculate semantic similarity score
   */
  private calculateSemanticScore(candidate: CandidateEntity, seedEntities: SeedEntity[]): number {
    if (candidate.wasSeedEntity && candidate.weaviateScore !== undefined) {
      return candidate.weaviateScore;
    } else {
      // Derived score based on hop distance for non-seed entities
      const decayFactor = Math.pow(0.8, candidate.hopDistance || 1);
      return 0.5 * decayFactor; // Base score with decay
    }
  }

  /**
   * Calculate recency score using exponential decay
   */
  private calculateRecencyScore(metadata: EntityMetadata): number {
    if (!metadata?.lastModified) return 0.5;
    
    const ageInDays = (Date.now() - new Date(metadata.lastModified).getTime()) / (1000 * 60 * 60 * 24);
    const decayRate = 0.1; // Configurable decay rate
    return Math.exp(-decayRate * ageInDays);
  }

  /**
   * Calculate importance score
   */
  private calculateImportanceScore(metadata: EntityMetadata): number {
    if (!metadata) return 0.5;
    
    const rawScore = metadata.importance_score || 0;
    return Math.min(rawScore / 10.0, 1.0); // Normalize to 0-1 range
  }

  /**
   * Get current scoring weights
   */
  public getWeights(): RetrievalWeights {
    return { ...this.weights };
  }
} 