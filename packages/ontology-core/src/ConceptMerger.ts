import { ConceptRepository, DatabaseService } from '@2dots1line/database/dist';

export interface ConceptMerge {
  primary_concept_id: string;
  secondary_concept_ids: string[];
  new_concept_name: string;
  new_concept_description: string;
  merge_rationale?: string;
}

export class ConceptMerger {
  constructor(
    private conceptRepository: ConceptRepository,
    private dbService: DatabaseService,
    private weaviateService: any
  ) {}

  /**
   * Execute concept merging in PostgreSQL and Weaviate
   * Includes error handling to prevent job failures
   */
  async executeConceptMerge(merge: ConceptMerge): Promise<void> {
    const errors: string[] = [];
    
    try {
      // Validate that primary concept exists before attempting merge
      const primaryConcept = await this.conceptRepository.findByIdUnfiltered(merge.primary_concept_id);
      if (!primaryConcept) {
        const errorMsg = `Primary concept ${merge.primary_concept_id} does not exist. Cannot proceed with merge.`;
        console.error(`[ConceptMerger] ${errorMsg}`);
        errors.push(errorMsg);
        console.warn(`[ConceptMerger] Completed concept merging with ${errors.length} errors:`, errors);
        return; // Exit early if primary concept doesn't exist
      }

      // Validate that all secondary concepts exist
      const missingSecondaryConcepts: string[] = [];
      for (const secondaryId of merge.secondary_concept_ids) {
        const secondaryConcept = await this.conceptRepository.findByIdUnfiltered(secondaryId);
        if (!secondaryConcept) {
          missingSecondaryConcepts.push(secondaryId);
        }
      }

      if (missingSecondaryConcepts.length > 0) {
        const errorMsg = `Secondary concepts do not exist: ${missingSecondaryConcepts.join(', ')}. Skipping merge.`;
        console.error(`[ConceptMerger] ${errorMsg}`);
        errors.push(errorMsg);
        console.warn(`[ConceptMerger] Completed concept merging with ${errors.length} errors:`, errors);
        return; // Exit early if any secondary concepts don't exist
      }

      console.log(`[ConceptMerger] Validated all concepts exist. Proceeding with merge of ${merge.secondary_concept_ids.length} concepts into ${merge.primary_concept_id}`);

      // Update secondary concepts to mark them as merged
      for (const secondaryId of merge.secondary_concept_ids) {
        try {
          await this.conceptRepository.update(secondaryId, {
            status: 'merged',
            merged_into_concept_id: merge.primary_concept_id
          });
          console.log(`[ConceptMerger] Marked concept ${secondaryId} as merged into ${merge.primary_concept_id}`);
          
          // Sync status to Weaviate
          try {
            await this.weaviateService.updateConceptStatus(secondaryId, 'merged');
          } catch (weaviateError) {
            console.warn(`[ConceptMerger] Failed to sync concept ${secondaryId} status to Weaviate:`, weaviateError);
          }
        } catch (updateError) {
          const errorMsg = `Failed to update secondary concept ${secondaryId}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`;
          console.error(`[ConceptMerger] ${errorMsg}`);
          errors.push(errorMsg);
          // Continue with other concepts instead of failing the entire job
        }
      }

      // Update primary concept with new name and description
      try {
        await this.conceptRepository.update(merge.primary_concept_id, {
          name: merge.new_concept_name,
          description: merge.new_concept_description
        });
        console.log(`[ConceptMerger] Updated primary concept ${merge.primary_concept_id} with new name: ${merge.new_concept_name}`);
      } catch (updateError) {
        const errorMsg = `Failed to update primary concept ${merge.primary_concept_id}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`;
        console.error(`[ConceptMerger] ${errorMsg}`);
        errors.push(errorMsg);
      }
    } catch (error: unknown) {
      const errorMsg = `Failed to process merge for primary concept ${merge.primary_concept_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[ConceptMerger] ${errorMsg}`);
      errors.push(errorMsg);
    }
    
    // Log summary of any errors but don't fail the job
    if (errors.length > 0) {
      console.warn(`[ConceptMerger] Completed concept merging with ${errors.length} errors:`, errors);
    } else {
      console.log(`[ConceptMerger] Successfully completed all concept merging updates`);
    }
  }

  /**
   * Handle concept merging in Neo4j graph
   */
  async updateNeo4jMergedConcepts(merge: ConceptMerge): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[ConceptMerger] Neo4j client not available, skipping concept merge update');
      return;
    }

    const session = this.dbService.neo4j.session();
    
    try {
      // First verify that the primary concept exists in Neo4j
      const checkPrimaryCypher = `MATCH (c:Concept {id: $primaryId}) RETURN c.id as conceptId`;
      const primaryCheckResult = await session.run(checkPrimaryCypher, {
        primaryId: merge.primary_concept_id
      });

      if (primaryCheckResult.records.length === 0) {
        console.warn(`[ConceptMerger] Primary concept ${merge.primary_concept_id} not found in Neo4j. Skipping Neo4j merge update.`);
        return;
      }

      // Update the primary concept with new properties
      const updatePrimaryCypher = `
        MATCH (c:Concept {id: $primaryId})
        SET c.name = $newName,
            c.description = $newDescription,
            c.updatedAt = datetime(),
            c.merge_count = COALESCE(c.merge_count, 0) + $mergeCount
        RETURN c.id as conceptId
      `;

      const updateResult = await session.run(updatePrimaryCypher, {
        primaryId: merge.primary_concept_id,
        newName: merge.new_concept_name,
        newDescription: merge.new_concept_description,
        mergeCount: merge.secondary_concept_ids.length
      });

      if (updateResult.records.length === 0) {
        console.warn(`[ConceptMerger] Failed to update primary concept ${merge.primary_concept_id} in Neo4j. Concept may not exist.`);
        return;
      }

      // Update secondary concepts to mark them as merged
      for (const secondaryId of merge.secondary_concept_ids) {
        // First check if the secondary concept exists in Neo4j
        const checkSecondaryCypher = `MATCH (c:Concept {id: $secondaryId}) RETURN c.id as conceptId`;
        const secondaryCheckResult = await session.run(checkSecondaryCypher, {
          secondaryId
        });

        if (secondaryCheckResult.records.length === 0) {
          console.warn(`[ConceptMerger] Secondary concept ${secondaryId} not found in Neo4j. Skipping.`);
          continue;
        }

        const updateSecondaryCypher = `
          MATCH (c:Concept {id: $secondaryId})
          SET c.status = 'merged',
              c.merged_at = datetime(),
              c.merged_into_concept_id = $primaryId
          RETURN c.id as conceptId
        `;

        const updateResult = await session.run(updateSecondaryCypher, {
          secondaryId,
          primaryId: merge.primary_concept_id
        });

        if (updateResult.records.length === 0) {
          console.warn(`[ConceptMerger] Failed to update secondary concept ${secondaryId} in Neo4j.`);
        }
      }

      // Redirect all relationships from secondary concepts to primary concept
      const redirectRelationshipsCypher = `
        MATCH (secondary:Concept {id: $secondaryId})-[r]-(other)
        WHERE other.id <> $primaryId
        WITH secondary, other, r, type(r) as relType, properties(r) as relProps
        MATCH (primary:Concept {id: $primaryId})
        CREATE (primary)-[newRel:RELATED_TO]->(other)
        SET newRel = relProps
        SET newRel.redirected_from = $secondaryId
        SET newRel.redirected_at = datetime()
        DELETE r
        RETURN count(newRel) as redirectedCount
      `;

      for (const secondaryId of merge.secondary_concept_ids) {
        const result = await session.run(redirectRelationshipsCypher, {
          secondaryId,
          primaryId: merge.primary_concept_id
        });
        
        const redirectedCount = result.records[0]?.get('redirectedCount') || 0;
        console.log(`[ConceptMerger] Redirected ${redirectedCount} relationships from concept ${secondaryId} to ${merge.primary_concept_id}`);
      }

      console.log(`[ConceptMerger] Successfully updated Neo4j for concept merge: ${merge.primary_concept_id} absorbed ${merge.secondary_concept_ids.length} concepts`);

    } catch (error: unknown) {
      console.error(`[ConceptMerger] Error updating Neo4j for concept merge:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update primary concept metadata to reflect merging operations
   */
  async updatePrimaryConceptMetadata(merge: ConceptMerge): Promise<void> {
    // Update primary concept status and merged_into_concept_id in PostgreSQL
    // Note: We'll store merge information in the description field since metadata is not supported
    const mergeInfo = `Merged with: ${merge.secondary_concept_ids.join(', ')}. Rationale: ${merge.merge_rationale || 'Strategic consolidation'}`;
    
    await this.conceptRepository.update(merge.primary_concept_id, {
      description: mergeInfo,
      status: 'active' // Keep primary concept active
    });
    
    // Update primary concept metadata in Neo4j
    await this.updateNeo4jPrimaryConceptMetadata(merge.primary_concept_id, {
      merge_count: merge.secondary_concept_ids.length,
      last_merged_at: new Date().toISOString(),
      merged_concepts: merge.secondary_concept_ids
    });
  }

  /**
   * Update primary concept metadata in Neo4j
   */
  private async updateNeo4jPrimaryConceptMetadata(conceptId: string, metadata: any): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[ConceptMerger] Neo4j client not available, skipping metadata update');
      return;
    }

    const session = this.dbService.neo4j.session();
    
    try {
      const updateMetadataCypher = `
        MATCH (c:Concept {id: $conceptId})
        SET c.merge_count = $mergeCount,
            c.last_merged_at = datetime($lastMergedAt),
            c.merged_concepts = $mergedConcepts
        RETURN c.id as conceptId
      `;

      await session.run(updateMetadataCypher, {
        conceptId,
        mergeCount: metadata.merge_count,
        lastMergedAt: metadata.last_merged_at,
        mergedConcepts: metadata.merged_concepts
      });

      console.log(`[ConceptMerger] Updated primary concept metadata in Neo4j: ${conceptId}`);

    } catch (error: unknown) {
      console.error(`[ConceptMerger] Error updating primary concept metadata in Neo4j:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
}
