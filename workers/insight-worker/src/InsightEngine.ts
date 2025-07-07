import { Job } from 'bullmq';
import { StrategicSynthesisTool, StrategicSynthesisOutput, StrategicSynthesisInput } from '@2dots1line/tools';
import { 
  DatabaseService, 
  ConversationRepository, 
  UserRepository,
  MemoryRepository,
  ConceptRepository,
  DerivedArtifactRepository,
  ProactivePromptRepository
} from '@2dots1line/database';
import type { 
  CreateDerivedArtifactData,
  CreateProactivePromptData
} from '@2dots1line/database';
import { Queue } from 'bullmq';
import { InsightDataCompiler } from './InsightDataCompiler';

export interface InsightJobData {
  userId: string;
}

export interface CycleDates {
  cycleStartDate: Date;
  cycleEndDate: Date;
}

export class InsightEngine {
  private conversationRepository: ConversationRepository;
  private userRepository: UserRepository;
  private memoryRepository: MemoryRepository;
  private conceptRepository: ConceptRepository;
  private derivedArtifactRepository: DerivedArtifactRepository;
  private proactivePromptRepository: ProactivePromptRepository;
  private insightDataCompiler: InsightDataCompiler;

  constructor(
    private strategicSynthesisTool: StrategicSynthesisTool,
    private dbService: DatabaseService,
    private cardAndGraphQueue: Queue,
    private neo4jClient?: any // Neo4j client for ontology updates
  ) {
    this.conversationRepository = new ConversationRepository(dbService);
    this.userRepository = new UserRepository(dbService);
    this.memoryRepository = new MemoryRepository(dbService);
    this.conceptRepository = new ConceptRepository(dbService);
    this.derivedArtifactRepository = new DerivedArtifactRepository(dbService);
    this.proactivePromptRepository = new ProactivePromptRepository(dbService);
    this.insightDataCompiler = new InsightDataCompiler(dbService, neo4jClient);
  }

  async processUserCycle(job: Job<InsightJobData>) {
    const { userId } = job.data;
    
    console.log(`[InsightEngine] Processing strategic cycle for user ${userId}`);

    try {
      // Phase I: Data Compilation via InsightDataCompiler (Deterministic Code)
      const { strategicInput } = await this.gatherComprehensiveContext(userId);

      // Phase II: The "Single Synthesis" LLM Call
      const analysisOutput = await this.strategicSynthesisTool.execute(strategicInput);

      console.log(`[InsightEngine] Strategic synthesis completed for user ${userId}`);

      // Phase III: Persistence, Graph Update & State Propagation (Deterministic Code)
      const newEntities = await this.persistStrategicUpdates(userId, analysisOutput);

      // Phase IV: Event Publishing for Presentation Layer
      await this.publishCycleArtifacts(userId, newEntities);

      console.log(`[InsightEngine] Successfully completed strategic cycle for user ${userId}, created ${newEntities.length} new entities`);
      
    } catch (error) {
      console.error(`[InsightEngine] Error processing cycle for user ${userId}:`, error);
      throw error;
    }
  }

  private async gatherComprehensiveContext(userId: string) {
    // Determine cycle dates
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const cycleDates: CycleDates = {
      cycleStartDate: user.last_cycle_started_at || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default to 1 week ago
      cycleEndDate: new Date()
    };

    console.log(`[InsightEngine] Compiling data for cycle from ${cycleDates.cycleStartDate} to ${cycleDates.cycleEndDate}`);

    // Phase I: Compile the three distinct "Input Packages" in parallel
    const [ingestionSummary, graphAnalysis, strategicInsights] = await Promise.all([
      this.insightDataCompiler.compileIngestionActivity(userId, cycleDates),
      this.insightDataCompiler.compileGraphAnalysis(userId),
      this.insightDataCompiler.compileStrategicInsights(userId, cycleDates)
    ]);

    // Build StrategicSynthesisInput to match the expected interface
    const strategicInput: StrategicSynthesisInput = {
      userId,
      cycleId: `cycle-${userId}-${Date.now()}`,
      currentKnowledgeGraph: {
        memoryUnits: ingestionSummary.conversationSummaries.map(conv => ({
          id: conv.id,
          title: conv.context_summary || 'No title',
          content: conv.context_summary || '',
          importance_score: conv.importance_score,
          tags: [],
          created_at: conv.created_at.toISOString()
        })),
        concepts: [], // Will be populated from database
        relationships: [] // Will be populated from Neo4j if available
      },
      recentGrowthEvents: strategicInsights.userEvolutionMetrics ? [
        {
          dim_key: 'knowledge_breadth',
          event_type: 'metric_change',
          description: `Knowledge breadth changed by ${strategicInsights.userEvolutionMetrics.knowledge_breadth_change}`,
          impact_level: Math.abs(strategicInsights.userEvolutionMetrics.knowledge_breadth_change),
          created_at: new Date().toISOString()
        }
      ] : [],
      userProfile: {
        preferences: user.memory_profile || {},
        goals: [],
        interests: [],
        growth_trajectory: user.knowledge_graph_schema || {}
      }
    };

    return { strategicInput };
  }

  private async persistStrategicUpdates(
    userId: string, 
    analysisOutput: StrategicSynthesisOutput
  ): Promise<Array<{ id: string; type: string }>> {
    const { ontology_optimizations, derived_artifacts, proactive_prompts } = analysisOutput;
    const newEntities: Array<{ id: string; type: string }> = [];

    try {
      // Execute Ontology Updates (Neo4j) - IMPLEMENTED: Actual concept merging
      if (this.neo4jClient && ontology_optimizations.concepts_to_merge.length > 0) {
        const mergedConceptIds = await this.executeConceptMerging(ontology_optimizations, this.neo4jClient);
        newEntities.push(...mergedConceptIds.map(id => ({ id, type: 'MergedConcept' })));
        console.log(`[InsightEngine] Merged ${ontology_optimizations.concepts_to_merge.length} concepts successfully`);
      }

      // Create new strategic relationships if specified
      if (this.neo4jClient && ontology_optimizations.new_strategic_relationships.length > 0) {
        const relationshipIds = await this.createStrategicRelationships(ontology_optimizations.new_strategic_relationships, this.neo4jClient);
        newEntities.push(...relationshipIds.map(id => ({ id, type: 'StrategicRelationship' })));
        console.log(`[InsightEngine] Created ${ontology_optimizations.new_strategic_relationships.length} strategic relationships`);
      }

      // Create Derived Artifacts
      for (const artifact of derived_artifacts) {
        const artifactData: CreateDerivedArtifactData = {
          user_id: userId,
          artifact_type: artifact.artifact_type,
          title: artifact.title,
          content_narrative: artifact.content
        };

        const createdArtifact = await this.derivedArtifactRepository.create(artifactData);
        newEntities.push({ id: createdArtifact.artifact_id, type: 'DerivedArtifact' });
        
        console.log(`[InsightEngine] Created derived artifact: ${createdArtifact.artifact_id}`);
      }

      // Create Proactive Prompts
      for (const prompt of proactive_prompts) {
        const promptData: CreateProactivePromptData = {
          user_id: userId,
          prompt_text: prompt.prompt_text,
          source_agent: 'InsightEngine',
          metadata: {
            prompt_type: prompt.prompt_type,
            timing_suggestion: prompt.timing_suggestion,
            priority_level: prompt.priority_level
          }
        };

        const createdPrompt = await this.proactivePromptRepository.create(promptData);
        newEntities.push({ id: createdPrompt.prompt_id, type: 'ProactivePrompt' });
        
        console.log(`[InsightEngine] Created proactive prompt: ${createdPrompt.prompt_id} - ${prompt.title}`);
      }

      // Update user strategic state
      await this.userRepository.update(userId, {
        last_cycle_started_at: new Date(),
        concepts_created_in_cycle: 0
      });

      console.log(`[InsightEngine] Updated user strategic state for ${userId}`);

    } catch (error) {
      console.error(`[InsightEngine] Error persisting strategic updates for user ${userId}:`, error);
      throw error;
    }

    return newEntities;
  }

  private async publishCycleArtifacts(userId: string, newEntities: Array<{ id: string; type: string }>) {
    if (newEntities.length === 0) {
      console.log(`[InsightEngine] No new entities to publish for user ${userId}`);
      return;
    }

    try {
      await this.cardAndGraphQueue.add('cycle_artifacts_created', {
        type: 'cycle_artifacts_created',
        userId,
        entities: newEntities,
        source: 'InsightEngine'
      });

      console.log(`[InsightEngine] Published cycle artifacts event for user ${userId} with ${newEntities.length} entities`);
    } catch (error) {
      console.error(`[InsightEngine] Error publishing cycle artifacts for user ${userId}:`, error);
      throw error;
    }
  }

  private async getRecentQuestHistory(userId: string, cycleDates: CycleDates): Promise<any[]> {
    try {
      // Query for recent proactive prompts/quests using correct field names
      const recentQuests = await this.dbService.prisma.proactive_prompts.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: cycleDates.cycleStartDate,
            lte: cycleDates.cycleEndDate
          }
        },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      return recentQuests.map(quest => ({
        prompt_text: quest.prompt_text,
        source_agent: quest.source_agent,
        status: quest.status,
        created_at: quest.created_at,
        metadata: quest.metadata
      }));
    } catch (error) {
      console.error(`[InsightEngine] Error fetching recent quest history for user ${userId}:`, error);
      return [];
    }
  }

  private async generateEffectiveQueryPatterns(userId: string): Promise<string[]> {
    try {
      // Analyze user's conversation patterns using correct field names
      const recentConversations = await this.dbService.prisma.conversations.findMany({
        where: {
          user_id: userId,
          start_time: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        select: {
          context_summary: true
        },
        take: 20
      });

      // Simple pattern extraction (filter out null values)
      const patterns = recentConversations
        .map(conv => conv.context_summary)
        .filter((summary): summary is string => summary !== null && summary.length > 10)
        .slice(0, 5);

      return patterns.length > 0 ? patterns : ['General inquiry patterns'];
    } catch (error) {
      console.error(`[InsightEngine] Error generating query patterns for user ${userId}:`, error);
      return ['General inquiry patterns'];
    }
  }

  /**
   * Execute Neo4j concept merging operations
   */
  private async executeConceptMerging(ontologyOptimizations: any, neo4jClient: any): Promise<string[]> {
    const session = neo4jClient.session();
    const mergedConceptIds: string[] = [];
    
    try {
      for (const merge of ontologyOptimizations.concepts_to_merge) {
        const cypher = `
          MATCH (primary:Concept {concept_id: $primaryId}), (secondary:Concept {concept_id: $secondaryId})
          WITH primary, secondary
          SET primary.name = $newName,
              primary.description = $newDescription,
              primary.merged_from = coalesce(primary.merged_from, []) + $secondaryId,
              primary.updated_at = datetime()
          WITH primary, secondary
          MATCH (secondary)-[r]->(target)
          CREATE (primary)-[newRel:RELATED_TO]->(target)
          SET newRel = properties(r)
          WITH primary, secondary
          MATCH (source)-[r]->(secondary)
          CREATE (source)-[newRel:RELATED_TO]->(primary)
          SET newRel = properties(r)
          WITH primary, secondary
          DETACH DELETE secondary
          RETURN primary.concept_id as mergedId
        `;
        
        const result = await session.run(cypher, {
          primaryId: merge.primary_concept_id,
          secondaryId: merge.secondary_concept_ids[0], // Handle first secondary for now
          newName: merge.new_concept_name,
          newDescription: merge.new_concept_description
        });
        
        if (result.records.length > 0) {
          const mergedId = result.records[0].get('mergedId');
          mergedConceptIds.push(mergedId);
          console.log(`[InsightEngine] Merged concept ${merge.secondary_concept_ids[0]} into ${merge.primary_concept_id}`);
        }
      }
    } catch (error) {
      console.error('[InsightEngine] Error executing concept merging:', error);
      throw error;
    } finally {
      await session.close();
    }
    
    return mergedConceptIds;
  }

  /**
   * Create strategic relationships in Neo4j
   */
  private async createStrategicRelationships(relationships: any[], neo4jClient: any): Promise<string[]> {
    const session = neo4jClient.session();
    const relationshipIds: string[] = [];
    
    try {
      for (const rel of relationships) {
        const cypher = `
          MATCH (source:Concept {concept_id: $sourceId}), (target:Concept {concept_id: $targetId})
          CREATE (source)-[r:STRATEGIC_RELATIONSHIP {
            type: $relationshipType,
            strength: $strength,
            strategic_value: $strategicValue,
            created_at: datetime(),
            relationship_id: $relationshipId
          }]->(target)
          RETURN r.relationship_id as relationshipId
        `;
        
        const relationshipId = `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const result = await session.run(cypher, {
          sourceId: rel.source_id,
          targetId: rel.target_id,
          relationshipType: rel.relationship_type,
          strength: rel.strength,
          strategicValue: rel.strategic_value,
          relationshipId
        });
        
        if (result.records.length > 0) {
          relationshipIds.push(relationshipId);
          console.log(`[InsightEngine] Created strategic relationship: ${rel.source_id} -> ${rel.target_id} (${rel.relationship_type})`);
        }
      }
    } catch (error) {
      console.error('[InsightEngine] Error creating strategic relationships:', error);
      throw error;
    } finally {
      await session.close();
    }
    
    return relationshipIds;
  }
}
