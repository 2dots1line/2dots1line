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
  private databaseService: DatabaseService; // Direct DatabaseService access

  constructor(db: DatabaseService) {
    this.memoryRepo = new MemoryRepository(db);
    this.conceptRepo = new ConceptRepository(db);
    this.databaseService = db; // Store reference for Neo4j access
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
   * IMPLEMENTED: Enrich entities with relationship data from Neo4j
   */
  public async enrichWithRelationships(entities: HydratedEntity[]): Promise<HydratedEntity[]> {
    if (entities.length === 0) {
      return entities;
    }

    // Now we have direct access to DatabaseService.neo4j
    if (!this.databaseService.neo4j) {
      console.warn('[HydrationAdapter] Neo4j client not available, skipping relationship enrichment');
      return entities;
    }

    const session = this.databaseService.neo4j.session();
    
    try {
      const enrichedEntities = await Promise.all(
        entities.map(async (entity) => {
          try {
            // Query Neo4j for relationships of this entity
            const cypher = `
              MATCH (source)-[r]->(target)
              WHERE (source.muid = $entityId OR source.concept_id = $entityId)
                AND source.user_id = $userId
              RETURN r, target, 'outgoing' as direction
              UNION
              MATCH (source)-[r]->(target)
              WHERE (target.muid = $entityId OR target.concept_id = $entityId)
                AND target.user_id = $userId
              RETURN r, source as target, 'incoming' as direction
              LIMIT 20
            `;
            
            const result = await session.run(cypher, {
              entityId: entity.id,
              userId: entity.data?.user_id
            });
            
            const relationships = result.records.map((record: any) => {
              const relationship = record.get('r').properties;
              const relatedNode = record.get('target').properties;
              const direction = record.get('direction');
              
              return {
                direction,
                type: relationship.type || 'RELATED_TO',
                strength: relationship.strength || 0.5,
                context: relationship.context || '',
                created_at: relationship.created_at,
                source: relationship.source || 'Unknown',
                relatedEntity: {
                  id: relatedNode.muid || relatedNode.concept_id,
                  type: relatedNode.type || (relatedNode.muid ? 'MemoryUnit' : 'Concept'),
                  name: relatedNode.title || relatedNode.name,
                  importance: relatedNode.importance_score || relatedNode.salience || 0
                }
              };
            });
            
            if (relationships.length > 0) {
              console.log(`[HydrationAdapter] ✅ Found ${relationships.length} relationships for ${entity.type} ${entity.id}`);
            }
            
            return {
              ...entity,
              relationships
            };
            
          } catch (error) {
            console.warn(`[HydrationAdapter] ⚠️ Error enriching entity ${entity.id}:`, error);
            return entity; // Return original entity if enrichment fails
          }
        })
      );
      
      console.log(`[HydrationAdapter] ✅ Enriched ${enrichedEntities.length} entities with Neo4j relationships`);
      return enrichedEntities;
      
    } catch (error) {
      console.error('[HydrationAdapter] ❌ Error during relationship enrichment:', error);
      return entities; // Return original entities if enrichment fails
    } finally {
      await session.close();
    }
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