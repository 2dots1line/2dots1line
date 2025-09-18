import { ConceptRepository, DatabaseService } from '@2dots1line/database/dist';

export interface ConceptArchive {
  concept_id: string;
  archive_rationale: string;
  replacement_concept_id?: string | null;
}

export class ConceptArchiver {
  constructor(
    private conceptRepository: ConceptRepository,
    private weaviateService: any
  ) {}

  /**
   * Archive concepts as specified by LLM
   * Includes error handling to prevent job failures
   */
  async executeConceptArchive(archive: ConceptArchive): Promise<void> {
    try {
      // Update concept status to archived
      await this.conceptRepository.update(archive.concept_id, {
        status: 'archived',
        // Store archive rationale in description or metadata if available
        description: `ARCHIVED: ${archive.archive_rationale}${archive.replacement_concept_id ? ` (Replaced by: ${archive.replacement_concept_id})` : ''}`
      });
      console.log(`[ConceptArchiver] Archived concept ${archive.concept_id} with rationale: ${archive.archive_rationale}`);
      
      // Sync status to Weaviate
      try {
        await this.weaviateService.updateConceptStatus(archive.concept_id, 'archived');
      } catch (weaviateError) {
        console.warn(`[ConceptArchiver] Failed to sync concept ${archive.concept_id} status to Weaviate:`, weaviateError);
      }
    } catch (error: unknown) {
      const errorMsg = `Failed to archive concept ${archive.concept_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[ConceptArchiver] ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Archive multiple concepts with error handling
   */
  async executeConceptArchives(conceptsToArchive: ConceptArchive[]): Promise<void> {
    const errors: string[] = [];
    
    for (const archive of conceptsToArchive) {
      try {
        await this.executeConceptArchive(archive);
      } catch (error: unknown) {
        const errorMsg = `Failed to archive concept ${archive.concept_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[ConceptArchiver] ${errorMsg}`);
        errors.push(errorMsg);
        // Continue with other concepts instead of failing the entire job
      }
    }
    
    // Log summary of any errors but don't fail the job
    if (errors.length > 0) {
      console.warn(`[ConceptArchiver] Completed concept archiving with ${errors.length} errors:`, errors);
    } else {
      console.log(`[ConceptArchiver] Successfully completed all concept archiving`);
    }
  }

  /**
   * Update concept status in Neo4j (archived/merged)
   */
  async updateNeo4jConceptStatus(conceptId: string, status: string, metadata?: any, dbService?: DatabaseService): Promise<void> {
    if (!dbService?.neo4j) {
      console.warn('[ConceptArchiver] Neo4j client not available, skipping concept status update');
      return;
    }

    const session = dbService.neo4j.session();
    
    try {
      let cypher: string;
      let params: any;

      if (status === 'archived') {
        cypher = `
          MATCH (c:Concept {id: $conceptId})
          SET c.status = $status,
              c.archived_at = datetime(),
              c.archive_rationale = $archiveRationale,
              c.replacement_concept_id = $replacementConceptId
          RETURN c.id as conceptId
        `;
        
        params = {
          conceptId,
          status,
          archiveRationale: metadata?.archive_rationale || 'Archived by ConceptArchiver',
          replacementConceptId: metadata?.replacement_concept_id || null
        };
      } else {
        cypher = `
          MATCH (c:Concept {id: $conceptId})
          SET c.status = $status,
              c.updated_at = datetime()
          RETURN c.id as conceptId
        `;
        
        params = {
          conceptId,
          status
        };
      }

      const result = await session.run(cypher, params);
      
      if (result.records.length === 0) {
        console.warn(`[ConceptArchiver] No concept found with ID ${conceptId} in Neo4j`);
      } else {
        console.log(`[ConceptArchiver] Updated concept ${conceptId} status to ${status} in Neo4j`);
      }

    } catch (error: unknown) {
      console.error(`[ConceptArchiver] Error updating concept status in Neo4j:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
}
