/**
 * HydrationAdapter.ts
 * V9.5 PostgreSQL batch operations and full content hydration
 * Efficiently retrieves complete entity data from multiple repositories
 */

import { DatabaseService, MemoryRepository, ConceptRepository } from '@2dots1line/database';
import { ScoredEntity, ExtendedAugmentedMemoryContext } from '../types';

export interface HydrationRequest {
  entityIds: string[];
  entityTypes: ('MemoryUnit' | 'Concept')[];
  includeRelationships?: boolean;
  includeMetadata?: boolean;
}

export interface HydratedEntity {
  id: string;
  type: 'MemoryUnit' | 'Concept' | 'DerivedArtifact';
  data: any;
  relationships?: any[];
  metadata?: any;
}

export interface HydrationResult {
  entities: HydratedEntity[];
  notFound: string[];
  errors: Array<{
    entityId: string;
    error: string;
  }>;
}

export class HydrationAdapter {
  private memoryRepo: MemoryRepository;
  private conceptRepo: ConceptRepository;

  constructor(db: DatabaseService) {
    this.memoryRepo = new MemoryRepository(db);
    this.conceptRepo = new ConceptRepository(db);
  }

  /**
   * Hydrate top scored entities with full content from PostgreSQL
   */
  public async hydrateTopEntities(
    scoredEntities: ScoredEntity[], 
    userId: string
  ): Promise<Pick<ExtendedAugmentedMemoryContext, 'retrievedMemoryUnits' | 'retrievedConcepts'>> {
    // Bucket entities by type for efficient batch operations
    const memoryUnitIds = scoredEntities
      .filter(e => e.type === 'MemoryUnit')
      .map(e => e.id);
    
    const conceptIds = scoredEntities
      .filter(e => e.type === 'Concept')
      .map(e => e.id);

    // Parallel batch fetching for optimal performance
    const [retrievedMemoryUnits, retrievedConcepts] = await Promise.all([
      memoryUnitIds.length > 0 ? this.hydrateMemoryUnits(memoryUnitIds, userId) : Promise.resolve([]),
      conceptIds.length > 0 ? this.hydrateConcepts(conceptIds, userId) : Promise.resolve([])
    ]);

    return { 
      retrievedMemoryUnits, 
      retrievedConcepts 
    };
  }

  /**
   * Generic hydration method for flexible use cases
   */
  public async hydrate(request: HydrationRequest, userId: string): Promise<HydrationResult> {
    const results: HydratedEntity[] = [];
    const notFound: string[] = [];
    const errors: Array<{entityId: string; error: string}> = [];

    // Group by entity type for batch processing
    const memoryUnitIds = request.entityIds.filter((_, index) => 
      request.entityTypes[index] === 'MemoryUnit'
    );
    const conceptIds = request.entityIds.filter((_, index) => 
      request.entityTypes[index] === 'Concept'
    );

    try {
      // Batch fetch memory units
      if (memoryUnitIds.length > 0) {
        const memoryUnits = await this.memoryRepo.findByIds(memoryUnitIds, userId);
        
        for (const memoryUnit of memoryUnits) {
          results.push({
            id: memoryUnit.muid,
            type: 'MemoryUnit',
            data: memoryUnit,
            metadata: {
              importance_score: memoryUnit.importance_score,
              creation_ts: memoryUnit.creation_ts,
              last_modified_ts: memoryUnit.last_modified_ts
            }
          });
        }

        // Track not found memory units
        const foundIds = memoryUnits.map((mu: any) => mu.muid);
        const notFoundMemoryUnits = memoryUnitIds.filter(id => !foundIds.includes(id));
        notFound.push(...notFoundMemoryUnits);
      }

      // Batch fetch concepts
      if (conceptIds.length > 0) {
        const concepts = await this.conceptRepo.findByIds(conceptIds, userId);
        
        for (const concept of concepts) {
          results.push({
            id: concept.concept_id,
            type: 'Concept',
            data: concept,
            metadata: {
              salience: concept.salience,
              created_at: concept.created_at,
              last_updated_ts: concept.last_updated_ts
            }
          });
        }

        // Track not found concepts
        const foundIds = concepts.map((c: any) => c.concept_id);
        const notFoundConcepts = conceptIds.filter(id => !foundIds.includes(id));
        notFound.push(...notFoundConcepts);
      }

    } catch (error) {
      // Handle batch operation errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown hydration error';
      for (const entityId of request.entityIds) {
        errors.push({ entityId, error: errorMessage });
      }
    }

    return { entities: results, notFound, errors };
  }

  /**
   * Hydrate memory units with full content
   */
  public async hydrateMemoryUnits(ids: string[], userId: string): Promise<any[]> {
    try {
      return await this.memoryRepo.findByIds(ids, userId);
    } catch (error) {
      console.error('HydrationAdapter: Failed to hydrate memory units:', error);
      return [];
    }
  }

  /**
   * Hydrate concepts with full content
   */
  public async hydrateConcepts(ids: string[], userId: string): Promise<any[]> {
    try {
      return await this.conceptRepo.findByIds(ids, userId);
    } catch (error) {
      console.error('HydrationAdapter: Failed to hydrate concepts:', error);
      return [];
    }
  }

  /**
   * Enrich entities with relationship data from Neo4j (future enhancement)
   */
  public async enrichWithRelationships(entities: HydratedEntity[]): Promise<HydratedEntity[]> {
    // TODO: Implement Neo4j relationship enrichment
    // This would query Neo4j for relationship data for each entity
    console.warn('HydrationAdapter.enrichWithRelationships() - Not yet implemented');
    return entities;
  }

  /**
   * Get hydration statistics for monitoring
   */
  public getHydrationStats(): {
    totalRequests: number;
    successfulHydrations: number;
    failedHydrations: number;
  } {
    // TODO: Implement statistics tracking
    return {
      totalRequests: 0,
      successfulHydrations: 0,
      failedHydrations: 0
    };
  }
} 