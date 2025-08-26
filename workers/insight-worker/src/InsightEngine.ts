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
import { StrategicSynthesisTool, StrategicSynthesisOutput, StrategicSynthesisInput } from '@2dots1line/tools';
import { Job , Queue } from 'bullmq';

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
    private embeddingQueue: Queue,
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

  async processUserCycle(job: Job<InsightJobData>): Promise<void> {
    const { userId } = job.data;
    
    // Calculate cycle dates based on current time
    const cycleDates = this.calculateCycleDates();

    console.log(`[InsightEngine] Starting strategic cycle for user ${userId}`);
    console.log(`[InsightEngine] Cycle period: ${cycleDates.cycleStartDate.toISOString()} to ${cycleDates.cycleEndDate.toISOString()}`);

    try {
      // Phase I: Data Compilation via InsightDataCompiler
      const { strategicInput } = await this.gatherComprehensiveContext(userId, job.id || 'unknown', cycleDates);

      // Phase II: Strategic Synthesis LLM Call
      const analysisOutput = await this.strategicSynthesisTool.execute(strategicInput);

      console.log(`[InsightEngine] Strategic synthesis completed for user ${userId}`);
      console.log(`[InsightEngine] DEBUG: analysisOutput keys:`, Object.keys(analysisOutput || {}));
      console.log(`[InsightEngine] DEBUG: ontology_optimizations:`, analysisOutput?.ontology_optimizations ? 'EXISTS' : 'MISSING');
      console.log(`[InsightEngine] DEBUG: concepts_to_merge length:`, analysisOutput?.ontology_optimizations?.concepts_to_merge?.length || 0);

      // Phase III: Persistence, Graph Update & State Propagation
      const newEntities = await this.persistStrategicUpdates(userId, analysisOutput);

      // Phase IV: Event Publishing for Presentation Layer
      await this.publishCycleArtifacts(userId, newEntities);

      console.log(`[InsightEngine] Successfully completed strategic cycle for user ${userId}, created ${newEntities.length} new entities`);
      
    } catch (error) {
      console.error(`[InsightEngine] Error processing cycle for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate cycle dates based on current time
   * Default: Last 30 days, but can be configured
   */
  private calculateCycleDates(): CycleDates {
    const now = new Date();
    const cycleEndDate = new Date(now);
    const cycleStartDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    
    return { cycleStartDate, cycleEndDate };
  }

  private async gatherComprehensiveContext(userId: string, jobId: string, cycleDates: CycleDates) {
    // Get user information
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    console.log(`[InsightEngine] Compiling data for cycle from ${cycleDates.cycleStartDate} to ${cycleDates.cycleEndDate}`);

    // Phase I: Compile the three distinct "Input Packages" in parallel
    const [ingestionSummary, graphAnalysis, strategicInsights] = await Promise.all([
      this.insightDataCompiler.compileIngestionActivity(userId, cycleDates),
      this.insightDataCompiler.compileGraphAnalysis(userId),
      this.insightDataCompiler.compileStrategicInsights(userId, cycleDates)
    ]);

    // Build StrategicSynthesisInput with all available data
    const strategicInput: StrategicSynthesisInput = {
      userId,
      userName: user.name || 'User',
      cycleId: `cycle-${userId}-${Date.now()}`,
      cycleStartDate: cycleDates.cycleStartDate,
      cycleEndDate: cycleDates.cycleEndDate,
      currentKnowledgeGraph: {
        // Combine conversation summaries and actual memory units, but label them clearly
        memoryUnits: await (async () => {
          const actualMemoryUnits = await this.getUserMemoryUnits(userId, cycleDates);
          const conversationSummaries = ingestionSummary.conversationSummaries.map(conv => {
            return {
              id: `conv_${conv.id}`, // Prefix to distinguish from memory units
              title: `[CONVERSATION] ${conv.title || 'Untitled Conversation'}`, // Use actual conversation title
              content: conv.context_summary || 'No summary available', // Clean content
              importance_score: conv.importance_score,
              tags: [], // No tags in conversations table - keep empty array for consistency
              created_at: conv.created_at.toISOString()
            };
          });
          
          console.log(`[InsightEngine] Assembling knowledge graph: ${actualMemoryUnits.length} actual memory units + ${conversationSummaries.length} conversation summaries = ${actualMemoryUnits.length + conversationSummaries.length} total items`);
          
          return [
            ...actualMemoryUnits,
            ...conversationSummaries
          ];
        })(),
        concepts: await this.getUserConcepts(userId, cycleDates),
        relationships: await this.getUserRelationships(userId, cycleDates)
      },
      recentGrowthEvents: await (async () => {
        // Get actual growth events from the database within the cycle period
        const growthEvents = await this.dbService.prisma.growth_events.findMany({
          where: {
            user_id: userId,
            created_at: {
              gte: cycleDates.cycleStartDate,
              lte: cycleDates.cycleEndDate
            }
          },
          orderBy: { created_at: 'desc' },
          take: 20 // Limit to most recent 20 events to avoid overwhelming the LLM
        });

        console.log(`[InsightEngine] Found ${growthEvents.length} growth events within cycle period`);
        
        // Map to the expected format
        return growthEvents.map(event => {
          const details = event.details as any;
          return {
            dim_key: details?.dim_key || 'unknown',
            event_type: 'growth_event',
            description: details?.rationale || 'Growth event recorded',
            impact_level: Math.abs(details?.delta || 0),
            created_at: event.created_at.toISOString()
          };
        });
      })(),
      userProfile: {
        preferences: user.memory_profile || {},
        goals: [],
        interests: [],
        growth_trajectory: user.knowledge_graph_schema || {}
      },
      workerType: 'insight-worker',
      workerJobId: jobId
    };

    return { strategicInput };
  }

  /**
   * Fetch user concepts from the database for strategic synthesis
   */
  private async getUserConcepts(userId: string, cycleDates: CycleDates): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    salience: number;
    created_at: string;
    merged_into_concept_id?: string;
  }>> {
    try {
      console.log(`[InsightEngine] Fetching concepts for user ${userId}`);
      
      // Get all active concepts for the user within the cycle period
      const concepts = await this.dbService.prisma.concepts.findMany({
        where: { 
          user_id: userId, 
          status: 'active',
          created_at: {
            gte: cycleDates.cycleStartDate,
            lte: cycleDates.cycleEndDate
          }
        },
        select: {
          concept_id: true,
          name: true,
          description: true,
          type: true,
          salience: true,
          created_at: true,
          merged_into_concept_id: true
        },
        orderBy: { salience: 'desc' }
      });

      // Map to the expected interface
      const mappedConcepts = concepts.map((concept: any) => ({
        id: concept.concept_id,
        name: concept.name,
        description: concept.description || '',
        category: concept.type,
        salience: concept.salience || 0,
        created_at: concept.created_at.toISOString(),
        merged_into_concept_id: concept.merged_into_concept_id
      }));

      console.log(`[InsightEngine] Retrieved ${mappedConcepts.length} concepts`);
      return mappedConcepts;

    } catch (error) {
      console.error(`[InsightEngine] Error fetching concepts for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Fetch user memory units from PostgreSQL for strategic synthesis
   */
  private async getUserMemoryUnits(userId: string, cycleDates: CycleDates): Promise<Array<{
    id: string;
    title: string;
    content: string;
    importance_score: number;
    tags: string[];
    created_at: string;
  }>> {
    try {
      console.log(`[InsightEngine] Fetching memory units for user ${userId}`);
      
      // Get all memory units for the user within the cycle period
      const memoryUnits = await this.dbService.prisma.memory_units.findMany({
        where: { 
          user_id: userId,
          creation_ts: {
            gte: cycleDates.cycleStartDate,
            lte: cycleDates.cycleEndDate
          }
        },
        select: {
          muid: true,
          title: true,
          content: true,
          importance_score: true,
          creation_ts: true
        },
        orderBy: { importance_score: 'desc' }
      });

      // Map to the expected interface
      const mappedMemoryUnits = memoryUnits.map((mu: any) => ({
        id: mu.muid,
        title: mu.title,
        content: mu.content,
        importance_score: mu.importance_score || 0,
        tags: ['memory_unit'], // Tag to distinguish from conversation summaries
        created_at: mu.creation_ts.toISOString()
      }));

      console.log(`[InsightEngine] Retrieved ${mappedMemoryUnits.length} memory units`);
      return mappedMemoryUnits;

    } catch (error) {
      console.error(`[InsightEngine] Error fetching memory units for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Fetch user relationships from Neo4j for strategic synthesis
   */
  private async getUserRelationships(userId: string, cycleDates: CycleDates): Promise<Array<{
    source_id: string;
    target_id: string;
    relationship_type: string;
    strength: number;
  }>> {
    try {
      console.log(`[InsightEngine] Fetching relationships for user ${userId}`);
      
      // For now, return empty array since Neo4j query method needs to be implemented
      // TODO: Implement proper Neo4j querying for date-filtered relationships
      console.log(`[InsightEngine] Neo4j relationships not yet implemented, returning empty array`);
      return [];

    } catch (error) {
      console.error(`[InsightEngine] Error fetching relationships for user ${userId}:`, error);
      return [];
    }
  }

  private async persistStrategicUpdates(
    userId: string,
    analysisOutput: StrategicSynthesisOutput
  ): Promise<Array<{ id: string; type: string }>> {
    console.log(`[InsightEngine] persistStrategicUpdates called for user ${userId}`);
    console.log(`[InsightEngine] DEBUG: analysisOutput type:`, typeof analysisOutput);
    console.log(`[InsightEngine] DEBUG: analysisOutput:`, JSON.stringify(analysisOutput, null, 2).substring(0, 500) + '...');

    const { ontology_optimizations, derived_artifacts, proactive_prompts } = analysisOutput;
    const newEntities: Array<{ id: string; type: string }> = [];

    try {
      // Execute Ontology Updates (Neo4j) - Actual concept merging
      if (this.neo4jClient && ontology_optimizations.concepts_to_merge.length > 0) {
        const mergedConceptIds = await this.executeConceptMerging(ontology_optimizations, this.neo4jClient);
        newEntities.push(...mergedConceptIds.map(id => ({ id, type: 'MergedConcept' })));
        console.log(`[InsightEngine] Merged ${ontology_optimizations.concepts_to_merge.length} concepts successfully in Neo4j`);
      } else if (ontology_optimizations.concepts_to_merge.length > 0) {
        console.log(`[InsightEngine] Neo4j client not available, proceeding with PostgreSQL-only concept merging`);
        // Still create entities for tracking even without Neo4j
        newEntities.push(...ontology_optimizations.concepts_to_merge.map(merge => ({ 
          id: merge.primary_concept_id, 
          type: 'MergedConcept' 
        })));
      }

      // CRITICAL FIX: Update PostgreSQL concepts table for merged concepts
      if (ontology_optimizations.concepts_to_merge.length > 0) {
        await this.updatePostgreSQLConceptsForMerging(ontology_optimizations.concepts_to_merge);
        console.log(`[InsightEngine] Updated PostgreSQL concepts for ${ontology_optimizations.concepts_to_merge.length} merges`);
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
          content_narrative: artifact.content,
          content_data: artifact.content_data || null, // ✅ Include structured data
          source_concept_ids: artifact.source_concept_ids || [], // ✅ Include source concepts
          source_memory_unit_ids: artifact.source_memory_unit_ids || [] // ✅ Include source memory units
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

      // CRITICAL FIX: Update user memory profile with strategic insights
      await this.updateUserMemoryProfile(userId, analysisOutput);

      // CRITICAL FIX: Update user knowledge graph schema
      await this.updateUserKnowledgeGraphSchema(userId, analysisOutput);

      // Publish embedding jobs for new entities
      await this.publishEmbeddingJobs(userId, newEntities);

      // Update user strategic state
      await this.userRepository.update(userId, {
        last_cycle_started_at: new Date(),
        concepts_created_in_cycle: ontology_optimizations.concepts_to_merge.length
      });

      console.log(`[InsightEngine] Updated user strategic state for ${userId}`);

    } catch (error) {
      console.error(`[InsightEngine] Error persisting strategic updates for user ${userId}:`, error);
      throw error;
    }

    return newEntities;
  }

  /**
   * Publish embedding jobs for newly created entities
   */
  private async publishEmbeddingJobs(userId: string, newEntities: Array<{ id: string; type: string }>) {
    const embeddingJobs = [];

    for (const entity of newEntities) {
      try {
        // Extract text content based on entity type
        const textContent = await this.extractTextContentForEntity(entity.id, entity.type);
        
        if (textContent) {
          embeddingJobs.push({
            entityId: entity.id,
            entityType: entity.type as 'DerivedArtifact' | 'ProactivePrompt' | 'Community',
            textContent,
            userId
          });
          
          console.log(`[InsightEngine] Prepared embedding job for ${entity.type} ${entity.id}`);
        }
      } catch (error) {
        console.error(`[InsightEngine] Error preparing embedding job for ${entity.type} ${entity.id}:`, error);
      }
    }

    if (embeddingJobs.length > 0) {
      try {
        // Add embedding jobs to queue
        for (const job of embeddingJobs) {
          await this.embeddingQueue.add('generate_embedding', job, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          });
        }
        
        console.log(`[InsightEngine] Published ${embeddingJobs.length} embedding jobs for user ${userId}`);
      } catch (error) {
        console.error(`[InsightEngine] Error publishing embedding jobs for user ${userId}:`, error);
      }
    }
  }

  /**
   * Extract text content for embedding based on entity type
   */
  private async extractTextContentForEntity(entityId: string, entityType: string): Promise<string | null> {
    try {
      switch (entityType) {
        case 'DerivedArtifact':
          const artifact = await this.derivedArtifactRepository.findById(entityId);
          return artifact ? `${artifact.title}\n\n${artifact.content_narrative}` : null;
          
        case 'ProactivePrompt':
          const prompt = await this.proactivePromptRepository.findById(entityId);
          return prompt ? prompt.prompt_text : null;
          
        case 'Community':
          // For communities, we might need to aggregate content from multiple sources
          // For now, return a placeholder - this would need to be implemented based on community structure
          return `Community entity ${entityId}`;
          
        default:
          console.warn(`[InsightEngine] Unknown entity type for embedding: ${entityType}`);
          return null;
      }
    } catch (error) {
      console.error(`[InsightEngine] Error extracting text content for ${entityType} ${entityId}:`, error);
      return null;
    }
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

  /**
   * CRITICAL FIX: Update PostgreSQL concepts table for merged concepts
   */
  private async updatePostgreSQLConceptsForMerging(conceptsToMerge: any[]): Promise<void> {
    try {
      for (const merge of conceptsToMerge) {
        // Update secondary concepts to mark them as merged
        for (const secondaryId of merge.secondary_concept_ids) {
          await this.conceptRepository.update(secondaryId, {
            status: 'merged',
            merged_into_concept_id: merge.primary_concept_id
          });
          console.log(`[InsightEngine] Marked concept ${secondaryId} as merged into ${merge.primary_concept_id}`);
        }

        // Update primary concept with new name and description
        await this.conceptRepository.update(merge.primary_concept_id, {
          name: merge.new_concept_name,
          description: merge.new_concept_description
        });
        console.log(`[InsightEngine] Updated primary concept ${merge.primary_concept_id} with new name: ${merge.new_concept_name}`);
      }
    } catch (error) {
      console.error('[InsightEngine] Error updating PostgreSQL concepts for merging:', error);
      throw error;
    }
  }

  /**
   * CRITICAL FIX: Update user memory profile with strategic insights
   */
  private async updateUserMemoryProfile(userId: string, analysisOutput: StrategicSynthesisOutput): Promise<void> {
    try {
      const { ontology_optimizations, derived_artifacts, proactive_prompts } = analysisOutput;
      
      const memoryProfileUpdate = {
        last_updated: new Date().toISOString(),
        strategic_insights: {
          ontology_optimizations: {
            concepts_merged: ontology_optimizations.concepts_to_merge.length,
            new_relationships: ontology_optimizations.new_strategic_relationships.length,
            cycle_timestamp: new Date().toISOString()
          },
          derived_artifacts: derived_artifacts.length,
          proactive_prompts: proactive_prompts.length
        },
        growth_patterns: {
          concept_consolidation: ontology_optimizations.concepts_to_merge.map(merge => ({
            primary_concept: merge.primary_concept_id,
            merged_concepts: merge.secondary_concept_ids,
            rationale: merge.merge_rationale
          }))
        }
      };

      await this.userRepository.update(userId, {
        memory_profile: memoryProfileUpdate
      });
      
      console.log(`[InsightEngine] Updated memory profile for user ${userId} with strategic insights`);
    } catch (error) {
      console.error('[InsightEngine] Error updating user memory profile:', error);
      throw error;
    }
  }

  /**
   * CRITICAL FIX: Update user knowledge graph schema with new insights
   */
  private async updateUserKnowledgeGraphSchema(userId: string, analysisOutput: StrategicSynthesisOutput): Promise<void> {
    try {
      const { ontology_optimizations } = analysisOutput;
      
      const schemaUpdate = {
        last_updated: new Date().toISOString(),
        ontology_changes: {
          concepts_merged: ontology_optimizations.concepts_to_merge.map(merge => ({
            primary_concept_id: merge.primary_concept_id,
            secondary_concept_ids: merge.secondary_concept_ids,
            new_concept_name: merge.new_concept_name,
            merge_rationale: merge.merge_rationale
          })),
          new_strategic_relationships: ontology_optimizations.new_strategic_relationships.length
        },
        schema_version: 'v1.1',
        cycle_timestamp: new Date().toISOString()
      };

      await this.userRepository.update(userId, {
        knowledge_graph_schema: schemaUpdate
      });
      
      console.log(`[InsightEngine] Updated knowledge graph schema for user ${userId}`);
    } catch (error) {
      console.error('[InsightEngine] Error updating user knowledge graph schema:', error);
      throw error;
    }
  }

}
