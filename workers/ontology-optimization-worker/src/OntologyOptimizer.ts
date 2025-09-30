import { Job, Queue } from 'bullmq';
import { DatabaseService, ConceptRepository, CommunityRepository } from '@2dots1line/database/dist';
import { ConceptMerger, ConceptArchiver, CommunityCreator, ConceptMerge, ConceptArchive, CommunityStructure } from '@2dots1line/ontology-core/dist';
import { SemanticSimilarityTool } from '@2dots1line/tools/dist';

export interface OntologyJobData {
  userId: string;
  optimizationType: 'merge' | 'archive' | 'community' | 'full';
  conceptIds?: string[]; // Optional: specific concepts to optimize
  threshold?: number;    // Optional: similarity threshold
}

export interface OptimizationStrategy {
  findSimilarConcepts(userId: string, conceptIds?: string[], threshold?: number): Promise<SimilarConcept[]>;
  groupConceptsForMerging(similarConcepts: SimilarConcept[]): Promise<ConceptMergeGroup[]>;
  identifyArchiveCandidates(userId: string, conceptIds?: string[]): Promise<ConceptArchive[]>;
  detectCommunities(conceptGraph: ConceptGraph): Promise<CommunityStructure[]>;
  buildConceptGraph(userId: string, conceptIds?: string[]): Promise<ConceptGraph>;
}

export interface SimilarConcept {
  id: string;
  name: string;
  description: string;
  similarityScore: number;
}

export interface ConceptMergeGroup {
  primary_entity_id: string;
  secondary_entity_ids: string[];
  new_concept_title: string;
  new_concept_content: string;
  merge_rationale?: string;
}

export interface ConceptGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface ConceptNode {
  id: string;
  name: string;
  description: string;
  importance: number;
}

export interface ConceptEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

export class OntologyOptimizer {
  private conceptMerger: ConceptMerger;
  private conceptArchiver: ConceptArchiver;
  private communityCreator: CommunityCreator;
  private optimizationStrategy: OptimizationStrategy;

  constructor(
    private semanticSimilarityTool: SemanticSimilarityTool,
    private dbService: DatabaseService,
    private weaviateService: any,
    strategy: OptimizationStrategy
  ) {
    // Initialize shared persistence components
    this.conceptMerger = new ConceptMerger(
      new ConceptRepository(dbService),
      dbService,
      weaviateService
    );
    
    this.conceptArchiver = new ConceptArchiver(
      new ConceptRepository(dbService),
      weaviateService
    );
    
    this.communityCreator = new CommunityCreator(
      new CommunityRepository(dbService),
      dbService
    );
    
    this.optimizationStrategy = strategy;
  }

  async processOptimization(job: Job<OntologyJobData>): Promise<void> {
    const { userId, optimizationType, conceptIds, threshold } = job.data;
    
    console.log(`[OntologyOptimizer] Starting ${optimizationType} optimization for user ${userId}`);

    try {
      switch (optimizationType) {
        case 'merge':
          await this.optimizeConceptMerging(userId, conceptIds, threshold);
          break;
        case 'archive':
          await this.optimizeConceptArchiving(userId, conceptIds);
          break;
        case 'community':
          await this.optimizeCommunityFormation(userId, conceptIds);
          break;
        case 'full':
          await this.performFullOptimization(userId, threshold);
          break;
      }
      
      console.log(`[OntologyOptimizer] Successfully completed ${optimizationType} optimization`);
    } catch (error) {
      console.error(`[OntologyOptimizer] Error in ${optimizationType} optimization:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Concept Merging Methods
  // ============================================================================
  private async optimizeConceptMerging(userId: string, conceptIds?: string[], threshold?: number): Promise<void> {
    console.log(`[OntologyOptimizer] Starting concept merging for user ${userId}`);
    
    // 1. Find similar concepts using strategy
    const similarConcepts = await this.optimizationStrategy.findSimilarConcepts(userId, conceptIds, threshold);
    console.log(`[OntologyOptimizer] Found ${similarConcepts.length} similar concept pairs`);
    
    // 2. Group concepts for merging
    const mergeGroups = await this.optimizationStrategy.groupConceptsForMerging(similarConcepts);
    console.log(`[OntologyOptimizer] Created ${mergeGroups.length} merge groups`);
    
    // 3. Execute merges using shared logic
    for (const group of mergeGroups) {
      try {
        await this.conceptMerger.executeConceptMerge(group);
        
        // Update Neo4j using shared logic
        if (this.dbService.neo4j) {
          await this.conceptMerger.updateNeo4jMergedConcepts(group);
        }
        
        console.log(`[OntologyOptimizer] Successfully merged concept group: ${group.primary_entity_id}`);
      } catch (error) {
        console.error(`[OntologyOptimizer] Error merging concept group ${group.primary_entity_id}:`, error);
        // Continue with other groups
      }
    }
  }

  // ============================================================================
  // Concept Archiving Methods
  // ============================================================================
  private async optimizeConceptArchiving(userId: string, conceptIds?: string[]): Promise<void> {
    console.log(`[OntologyOptimizer] Starting concept archiving for user ${userId}`);
    
    // 1. Identify candidates for archiving
    const archiveCandidates = await this.optimizationStrategy.identifyArchiveCandidates(userId, conceptIds);
    console.log(`[OntologyOptimizer] Found ${archiveCandidates.length} concepts to archive`);
    
    // 2. Execute archiving using shared logic
    for (const candidate of archiveCandidates) {
      try {
        await this.conceptArchiver.executeConceptArchive(candidate);
        
        // Update Neo4j using shared logic
        if (this.dbService.neo4j) {
          await this.conceptArchiver.updateNeo4jConceptStatus(
            candidate.entity_id, 
            'archived', 
            { 
              archive_rationale: candidate.archive_rationale,
              replacement_entity_id: candidate.replacement_entity_id 
            },
            this.dbService
          );
        }
        
        console.log(`[OntologyOptimizer] Successfully archived concept: ${candidate.entity_id}`);
      } catch (error) {
        console.error(`[OntologyOptimizer] Error archiving concept ${candidate.entity_id}:`, error);
        // Continue with other concepts
      }
    }
  }

  // ============================================================================
  // Community Formation Methods
  // ============================================================================
  private async optimizeCommunityFormation(userId: string, conceptIds?: string[]): Promise<void> {
    console.log(`[OntologyOptimizer] Starting community formation for user ${userId}`);
    
    // 1. Analyze concept relationships
    const conceptGraph = await this.optimizationStrategy.buildConceptGraph(userId, conceptIds);
    console.log(`[OntologyOptimizer] Built concept graph with ${conceptGraph.nodes.length} nodes and ${conceptGraph.edges.length} edges`);
    
    // 2. Detect communities
    const communities = await this.optimizationStrategy.detectCommunities(conceptGraph);
    console.log(`[OntologyOptimizer] Detected ${communities.length} communities`);
    
    // 3. Create communities using shared logic
    for (const community of communities) {
      try {
        const communityId = await this.communityCreator.executeCommunityCreation(community, userId);
        
        // Create Neo4j community using shared logic
        if (this.dbService.neo4j) {
          await this.communityCreator.createNeo4jCommunity(community, community.member_entity_ids, communityId, userId);
        }
        
        console.log(`[OntologyOptimizer] Successfully created community: ${communityId}`);
      } catch (error) {
        console.error(`[OntologyOptimizer] Error creating community:`, error);
        // Continue with other communities
      }
    }
  }

  // ============================================================================
  // Full Optimization Pipeline
  // ============================================================================
  private async performFullOptimization(userId: string, threshold?: number): Promise<void> {
    console.log(`[OntologyOptimizer] Starting full optimization for user ${userId}`);
    
    // 1. Merge similar concepts
    await this.optimizeConceptMerging(userId, undefined, threshold);
    
    // 2. Archive irrelevant concepts
    await this.optimizeConceptArchiving(userId);
    
    // 3. Form communities
    await this.optimizeCommunityFormation(userId);
    
    console.log(`[OntologyOptimizer] Completed full optimization for user ${userId}`);
  }
}
