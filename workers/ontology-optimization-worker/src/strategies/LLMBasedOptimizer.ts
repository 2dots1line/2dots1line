import { OptimizationStrategy, SimilarConcept, ConceptMergeGroup, ConceptGraph, ConceptNode, ConceptEdge } from '../OntologyOptimizer';
import { ConceptArchive, CommunityStructure } from '@2dots1line/ontology-core/dist';
import { DatabaseService, ConceptRepository } from '@2dots1line/database/dist';
import { OntologyStageTool } from '@2dots1line/tools';
import { ConfigService } from '@2dots1line/config-service';
import { PromptCacheService } from '@2dots1line/core-utils';
import { randomUUID } from 'crypto';

export class LLMBasedOptimizer implements OptimizationStrategy {
  private ontologyStageTool: OntologyStageTool;

  constructor(
    private dbService: DatabaseService,
    private conceptRepository: ConceptRepository,
    private configService: ConfigService,
    private promptCacheService: PromptCacheService
  ) {
    this.ontologyStageTool = new OntologyStageTool(configService, dbService, promptCacheService);
  }

  async findSimilarConcepts(userId: string, conceptIds?: string[], threshold?: number): Promise<SimilarConcept[]> {
    console.log(`[LLMBasedOptimizer] Finding similar concepts for user ${userId}`);
    
    // For now, return empty array - this would be implemented with actual LLM-based similarity detection
    // In a real implementation, this would:
    // 1. Fetch concepts from database
    // 2. Use LLM to analyze similarities
    // 3. Return similar concept pairs with scores
    
    return [];
  }

  async groupConceptsForMerging(similarConcepts: SimilarConcept[]): Promise<ConceptMergeGroup[]> {
    console.log(`[LLMBasedOptimizer] Grouping ${similarConcepts.length} similar concepts for merging`);
    
    // For now, return empty array - this would be implemented with actual LLM-based grouping
    // In a real implementation, this would:
    // 1. Use LLM to determine which concepts should be merged together
    // 2. Generate new names and descriptions for merged concepts
    // 3. Return merge groups with rationale
    
    return [];
  }

  async identifyArchiveCandidates(userId: string, conceptIds?: string[]): Promise<ConceptArchive[]> {
    console.log(`[LLMBasedOptimizer] Identifying archive candidates for user ${userId}`);
    
    // For now, return empty array - this would be implemented with actual LLM-based archiving
    // In a real implementation, this would:
    // 1. Fetch concepts from database
    // 2. Use LLM to analyze relevance and importance
    // 3. Return concepts that should be archived with rationale
    
    return [];
  }

  async detectCommunities(conceptGraph: ConceptGraph): Promise<CommunityStructure[]> {
    console.log(`[LLMBasedOptimizer] Detecting communities from graph with ${conceptGraph.nodes.length} nodes`);
    
    // For now, return empty array - this would be implemented with actual LLM-based community detection
    // In a real implementation, this would:
    // 1. Use LLM to analyze concept relationships
    // 2. Group related concepts into communities
    // 3. Generate community themes and strategic importance scores
    
    return [];
  }

  async buildConceptGraph(userId: string, conceptIds?: string[]): Promise<ConceptGraph> {
    console.log(`[LLMBasedOptimizer] Building concept graph for user ${userId}`);
    
    // For now, return empty graph - this would be implemented with actual graph building
    // In a real implementation, this would:
    // 1. Fetch concepts and their relationships from database
    // 2. Build a graph structure with nodes and edges
    // 3. Calculate importance scores and relationship weights
    
    return {
      nodes: [],
      edges: []
    };
  }

  /**
   * Perform full ontology optimization using OntologyStageTool with partial processing
   */
  async performFullOptimization(userId: string): Promise<any> {
    console.log(`[LLMBasedOptimizer] Starting full ontology optimization for user ${userId}`);
    
    try {
      // Gather lightweight context (no HRT)
      const context = await this.gatherOntologyContext(userId);
      
      // Execute ontology optimization using OntologyStageTool with partial processing
      const result = await this.ontologyStageTool.execute(context);
      
      // If the old method fails validation, try partial processing with raw response
      if (!result || !result.ontology_optimizations) {
        console.log(`[LLMBasedOptimizer] Old validation failed, attempting partial processing...`);
        
        // Get the raw LLM response from the database
        const rawResponse = await this.getRawLLMResponse(userId);
        if (rawResponse) {
          const partialResult = await this.ontologyStageTool.processWithPartialValidation(rawResponse, userId);
          console.log(`[LLMBasedOptimizer] Partial processing result: ${partialResult.summary}`);
          
          // Persist the partial results
          await this.persistPartialResults(userId, partialResult);
          return partialResult;
        }
      } else {
        // Persist results from successful old method
        await this.persistOntologyResults(userId, result);
      }
      
      console.log(`[LLMBasedOptimizer] Full ontology optimization completed for user ${userId}`);
      return result;
    } catch (error) {
      console.error(`[LLMBasedOptimizer] Error in full ontology optimization:`, error);
      throw error;
    }
  }

  /**
   * Gather lightweight context for ontology optimization (no HRT retrieval)
   */
  private async gatherOntologyContext(userId: string): Promise<any> {
    console.log(`[LLMBasedOptimizer] Gathering ontology context for user ${userId}`);
    
    try {
      // Get user data
      const user = await this.dbService.prisma.users.findUnique({
        where: { user_id: userId }
      });
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Get current knowledge graph data (from database, no HRT)
      const currentKnowledgeGraph = await this.getCurrentKnowledgeGraph(userId);
      
      // Get user memory profile
      const userMemoryProfile = await this.getUserMemoryProfile(userId);
      
      // Get recent growth events (from database)
      const recentGrowthEvents = await this.getRecentGrowthEvents(userId);
      
      // Get recent conversations (from database)
      const recentConversations = await this.getRecentConversations(userId);
      
      return {
        userId,
        userName: user.name || 'User',
        userMemoryProfile,
        // No cycleId - ontology optimization is not a cycle
        // No cycleStartDate/cycleEndDate - ontology optimization is not time-bound
        currentKnowledgeGraph,
        recentGrowthEvents,
        strategicContext: {
          retrievedMemoryUnits: [],
          retrievedConcepts: [],
          retrievedArtifacts: [],
          retrievalSummary: 'No HRT retrieval needed for ontology optimization'
        },
        previousKeyPhrases: [],
        workerType: 'ontology-optimization-worker',
        workerJobId: randomUUID() // This is just for tracking the optimization job, not a cycle
      };
    } catch (error) {
      console.error(`[LLMBasedOptimizer] Failed to gather ontology context:`, error);
      throw error;
    }
  }

  /**
   * Get current knowledge graph data from database
   */
  private async getCurrentKnowledgeGraph(userId: string): Promise<any> {
    // Get concepts (exclude merged and archived)
    const concepts = await this.dbService.prisma.concepts.findMany({
      where: { 
        user_id: userId,
        status: {
          notIn: ['merged', 'archived']
        }
      },
      select: {
        entity_id: true,
        title: true,
        content: true,
        created_at: true,
        updated_at: true,
        status: true
      }
    });

    // Get memory units (exclude merged and archived)
    const memoryUnits = await this.dbService.prisma.memory_units.findMany({
      where: { 
        user_id: userId,
        status: {
          notIn: ['merged', 'archived']
        }
      },
      select: {
        entity_id: true,
        content: true,
        created_at: true,
        updated_at: true,
        status: true
      }
    });

    // Get conversations
    const conversations = await this.dbService.prisma.conversations.findMany({
      where: { 
        user_id: userId,
        created_at: {
          gte: new Date(Date.now() - (await this.configService.getOperationalParameter('ontology_optimization.default_date_range_days', 7)) * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        conversation_id: true,
        content: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // Get concepts needing synthesis
    const conceptsNeedingSynthesis = concepts.filter(concept => 
      concept.content && concept.content.length > 0
    );

    return {
      concepts,
      memoryUnits,
      conversations,
      conceptsNeedingSynthesis
    };
  }

  /**
   * Get user memory profile
   */
  private async getUserMemoryProfile(userId: string): Promise<string> {
    // Get the most recent memory profile (exclude merged and archived)
    const memoryProfile = await this.dbService.prisma.derived_artifacts.findFirst({
      where: {
        user_id: userId,
        type: 'memory_profile',
        status: {
          notIn: ['merged', 'archived']
        }
      },
      orderBy: { created_at: 'desc' },
      select: { content: true }
    });
    
    return memoryProfile?.content || 'No memory profile available';
  }

  /**
   * Get recent growth events
   */
  private async getRecentGrowthEvents(userId: string): Promise<any[]> {
    return await this.dbService.prisma.growth_events.findMany({
      where: { 
        user_id: userId,
        status: {
          notIn: ['merged', 'archived']
        },
        created_at: {
          gte: new Date(Date.now() - (await this.configService.getOperationalParameter('ontology_optimization.default_date_range_days', 7)) * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        entity_id: true,
        type: true,
        title: true,
        content: true,
        created_at: true,
        status: true
      },
      orderBy: { created_at: 'desc' },
      take: 20
    });
  }

  /**
   * Get recent conversations
   */
  private async getRecentConversations(userId: string): Promise<any[]> {
    return await this.dbService.prisma.conversations.findMany({
      where: { 
        user_id: userId,
        created_at: {
          gte: new Date(Date.now() - (await this.configService.getOperationalParameter('ontology_optimization.default_date_range_days', 7)) * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        conversation_id: true,
        content: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });
  }

  /**
   * Get raw LLM response from database for partial processing
   */
  private async getRawLLMResponse(userId: string): Promise<string | null> {
    try {
      const interactions = await this.dbService.llmInteractionRepository.getInteractions({
        userId: userId,
        workerType: 'ontology-optimization-worker',
        status: 'success'
      }, 1, 0);
      
      return interactions?.[0]?.raw_response || null;
    } catch (error) {
      console.error(`[LLMBasedOptimizer] Failed to get raw LLM response:`, error);
      return null;
    }
  }

  /**
   * Persist partial processing results
   */
  private async persistPartialResults(userId: string, partialResult: any): Promise<void> {
    console.log(`[LLMBasedOptimizer] Persisting partial results for user ${userId}: ${partialResult.summary}`);
    
    try {
      // The partial processing already executed the database operations
      // We just need to log the results
      console.log(`[LLMBasedOptimizer] Partial processing completed: ${partialResult.successfulComponents}/${partialResult.totalComponents} components processed successfully`);
      
      // Log any failed components for debugging
      const failedComponents = partialResult.results.filter((r: any) => !r.success);
      if (failedComponents.length > 0) {
        console.warn(`[LLMBasedOptimizer] ${failedComponents.length} components failed:`, failedComponents.map((f: any) => `${f.componentType}[${f.componentIndex}]: ${f.error}`));
      }
      
    } catch (error) {
      console.error(`[LLMBasedOptimizer] Failed to persist partial results:`, error);
      throw error;
    }
  }

  /**
   * Persist ontology optimization results (legacy method for successful old validation)
   */
  private async persistOntologyResults(userId: string, result: any): Promise<void> {
    console.log(`[LLMBasedOptimizer] Persisting ontology results for user ${userId}`);
    
    try {
      const ontology_optimizations = result.ontology_optimizations;
      if (!ontology_optimizations) {
        console.warn(`[LLMBasedOptimizer] No ontology optimizations found in result`);
        return;
      }

      const newEntities: Array<{ id: string; type: string }> = [];

      // Execute Ontology Updates - Concept merging (PostgreSQL + Neo4j)
      if (ontology_optimizations.concepts_to_merge?.length > 0) {
        const mergedConceptIds = await this.executeConceptMerging(ontology_optimizations.concepts_to_merge);
        newEntities.push(...mergedConceptIds.map((id: string) => ({ id, type: 'MergedConcept' })));
        console.log(`[LLMBasedOptimizer] Updated PostgreSQL concepts for ${ontology_optimizations.concepts_to_merge.length} merges`);
      }

      // Archive concepts as specified by LLM
      if (ontology_optimizations.concepts_to_archive?.length > 0) {
        await this.executeConceptArchiving(ontology_optimizations.concepts_to_archive);
        console.log(`[LLMBasedOptimizer] Archived ${ontology_optimizations.concepts_to_archive.length} concepts`);
      }

      // Create communities as specified by LLM
      if (ontology_optimizations.community_structures?.length > 0) {
        const communityIds = await this.executeCommunityCreation(ontology_optimizations.community_structures, userId);
        newEntities.push(...communityIds.map((id: string) => ({ id, type: 'Community' })));
        console.log(`[LLMBasedOptimizer] Created ${ontology_optimizations.community_structures.length} communities`);
      }

      // Process concept description synthesis
      if (ontology_optimizations.concept_description_synthesis?.length > 0) {
        await this.executeConceptSynthesis(ontology_optimizations.concept_description_synthesis);
        console.log(`[LLMBasedOptimizer] Synthesized descriptions for ${ontology_optimizations.concept_description_synthesis.length} concepts`);
      }

      // Create new strategic relationships if specified
      if (ontology_optimizations.new_strategic_relationships?.length > 0) {
        await this.executeStrategicRelationships(ontology_optimizations.new_strategic_relationships, userId);
        console.log(`[LLMBasedOptimizer] Created ${ontology_optimizations.new_strategic_relationships.length} strategic relationships`);
      }

      console.log(`[LLMBasedOptimizer] Successfully persisted all ontology optimizations for user ${userId}`);
      
    } catch (error) {
      console.error(`[LLMBasedOptimizer] Failed to persist ontology results:`, error);
      throw error;
    }
  }

  /**
   * Execute concept merging using OntologyStageTool methods
   */
  private async executeConceptMerging(conceptsToMerge: any[]): Promise<string[]> {
    const mergedConceptIds: string[] = [];
    
    for (const merge of conceptsToMerge) {
      try {
        // Use OntologyStageTool's concept merging method
        await this.ontologyStageTool.executeConceptMerging([merge]);
        mergedConceptIds.push(merge.primary_entity_id);
        console.log(`[LLMBasedOptimizer] Successfully merged concept ${merge.primary_entity_id}`);
      } catch (error: unknown) {
        console.error(`[LLMBasedOptimizer] Error merging concept ${merge.primary_entity_id}:`, error);
        // Continue with other merges
      }
    }
    
    return mergedConceptIds;
  }

  /**
   * Execute concept archiving using OntologyStageTool methods
   */
  private async executeConceptArchiving(conceptsToArchive: any[]): Promise<void> {
    await this.ontologyStageTool.executeConceptArchiving(conceptsToArchive);
  }

  /**
   * Execute community creation using OntologyStageTool methods
   */
  private async executeCommunityCreation(communityStructures: any[], userId: string): Promise<string[]> {
    return await this.ontologyStageTool.executeCommunityCreation(communityStructures, userId);
  }

  /**
   * Execute concept synthesis using OntologyStageTool methods
   */
  private async executeConceptSynthesis(conceptsToSynthesize: any[]): Promise<void> {
    await this.ontologyStageTool.synthesizeConceptDescriptions(conceptsToSynthesize);
  }

  /**
   * Execute strategic relationships creation using OntologyStageTool methods
   */
  private async executeStrategicRelationships(relationships: any[], userId: string): Promise<void> {
    await this.ontologyStageTool.createStrategicRelationships(relationships, userId);
  }
}
