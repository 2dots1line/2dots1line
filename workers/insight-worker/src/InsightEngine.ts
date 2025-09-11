import { 
  DatabaseService, 
  ConversationRepository, 
  UserRepository,
  MemoryRepository,
  ConceptRepository,
  DerivedArtifactRepository,
  ProactivePromptRepository,
  UserCycleRepository,
  WeaviateService
} from '@2dots1line/database';
import type { 
  CreateDerivedArtifactData,
  CreateProactivePromptData,
  CreateUserCycleData
} from '@2dots1line/database';
import { StrategicSynthesisTool, StrategicSynthesisOutput, StrategicSynthesisInput } from '@2dots1line/tools';
import { LLMRetryHandler } from '@2dots1line/core-utils';
import { Job , Queue } from 'bullmq';
import { randomUUID } from 'crypto';


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
  private userCycleRepository: UserCycleRepository;
  private weaviateService: WeaviateService;

  constructor(
    private strategicSynthesisTool: StrategicSynthesisTool,
    private dbService: DatabaseService,
    private cardQueue: Queue,
    private graphQueue: Queue,
    private embeddingQueue: Queue
  ) {
    this.conversationRepository = new ConversationRepository(dbService);
    this.userRepository = new UserRepository(dbService);
    this.memoryRepository = new MemoryRepository(dbService);
    this.conceptRepository = new ConceptRepository(dbService);
    this.derivedArtifactRepository = new DerivedArtifactRepository(dbService);
    this.proactivePromptRepository = new ProactivePromptRepository(dbService);
    this.userCycleRepository = new UserCycleRepository(dbService);
    this.weaviateService = new WeaviateService(dbService);
  }

  async processUserCycle(job: Job<InsightJobData>): Promise<void> {
    const { userId } = job.data;
    
    // Calculate cycle dates based on current time
    const cycleDates = this.calculateCycleDates();
    const cycleId = `cycle_${userId}_${cycleDates.cycleStartDate.getTime()}`;

    console.log(`[InsightEngine] Starting strategic cycle for user ${userId}`);
    console.log(`[InsightEngine] Cycle ID: ${cycleId}`);
    console.log(`[InsightEngine] Cycle period: ${cycleDates.cycleStartDate.toISOString()} to ${cycleDates.cycleEndDate.toISOString()}`);

    // Create cycle record
    const cycleData: CreateUserCycleData = {
      cycle_id: cycleId,
      user_id: userId,
      job_id: job.id,
      cycle_start_date: cycleDates.cycleStartDate,
      cycle_end_date: cycleDates.cycleEndDate,
      cycle_type: 'strategic_analysis',
      cycle_duration_days: 2,
      trigger_source: 'scheduled'
    };

    const cycle = await this.userCycleRepository.create(cycleData);
    console.log(`[InsightEngine] Created cycle record: ${cycle.cycle_id}`);

    const startTime = Date.now();

    let analysisOutput: StrategicSynthesisOutput;
    let newEntities: Array<{ id: string; type: string }> = [];

    try {
      // Phase I: Data Compilation and Context Gathering
      const { strategicInput } = await this.gatherComprehensiveContext(userId, job.id || 'unknown', cycleDates);

      // Phase II: Strategic Synthesis LLM Call with retry logic
      try {
        analysisOutput = await LLMRetryHandler.executeWithRetry(
          this.strategicSynthesisTool,
          strategicInput,
          { 
            maxAttempts: 3, 
            baseDelay: 1000,
            callType: 'strategic'
          }
        );
        console.log(`[InsightEngine] Strategic synthesis completed for user ${userId}`);
        console.log(`[InsightEngine] DEBUG: analysisOutput keys:`, Object.keys(analysisOutput || {}));
        console.log(`[InsightEngine] DEBUG: ontology_optimizations:`, analysisOutput?.ontology_optimizations ? 'EXISTS' : 'MISSING');
        console.log(`[InsightEngine] DEBUG: concepts_to_merge length:`, analysisOutput?.ontology_optimizations?.concepts_to_merge?.length || 0);

        // ENHANCED: Validate LLM response quality
        if (analysisOutput) {
          // Convert analysisOutput to string for validation (simplified approach)
          const outputString = JSON.stringify(analysisOutput);
          this.validateLLMResponse(outputString, 'StrategicSynthesisTool');
        }
      } catch (llmError: unknown) {
        console.error(`[InsightEngine] 🔴 LLM CALL FAILED after all retries:`);
        console.error(`[InsightEngine] LLM Error:`, llmError);
        throw llmError; // Re-throw LLM errors - let BullMQ handle as non-retryable
      }

      // Phase III: Persistence, Graph Update & State Propagation (separate try-catch for database errors)
      try {
        newEntities = await this.persistStrategicUpdates(userId, analysisOutput, cycleId);
        console.log(`[InsightEngine] Database operations completed successfully`);
      } catch (dbError: unknown) {
        console.error(`[InsightEngine] 🔴 DATABASE OPERATIONS FAILED - This is NOT a retryable error:`);
        console.error(`[InsightEngine] Database Error:`, dbError);
        console.error(`[InsightEngine] LLM call succeeded, but database operations failed. This should NOT trigger LLM retry.`);
        
        // For database failures, we still want to complete the cycle but mark it as having issues
        // Don't throw the error - just log it and continue with partial success
        console.warn(`[InsightEngine] Continuing with partial success due to database constraint violations`);
      }

      // Phase IV: Event Publishing for Presentation Layer
      try {
        await this.publishCycleArtifacts(userId, newEntities);
      } catch (publishError: unknown) {
        console.error(`[InsightEngine] Warning: Failed to publish cycle artifacts:`, publishError);
        // Don't fail the entire cycle for publishing errors
      }

      // Update cycle record with completion data
      const processingDuration = Date.now() - startTime;
      const artifactsCreated = analysisOutput.derived_artifacts?.length || 0;
      const promptsCreated = analysisOutput.proactive_prompts?.length || 0;
      const conceptsMerged = analysisOutput.ontology_optimizations?.concepts_to_merge?.length || 0;
      const relationshipsCreated = analysisOutput.ontology_optimizations?.new_strategic_relationships?.length || 0;

      await this.userCycleRepository.update(cycleId, {
        status: 'completed',
        completed_at: new Date(),
        artifacts_created: artifactsCreated,
        prompts_created: promptsCreated,
        concepts_merged: conceptsMerged,
        relationships_created: relationshipsCreated,
        processing_duration_ms: processingDuration,
        dashboard_ready: true
      });

      console.log(`[InsightEngine] Successfully completed strategic cycle for user ${userId}, created ${newEntities.length} new entities`);
      
    } catch (error: unknown) {
      console.error(`[InsightEngine] 🔴 CYCLE PROCESSING FAILED - DETAILED ERROR ANALYSIS:`);
      console.error(`[InsightEngine] ================================================`);
      console.error(`[InsightEngine] User ID: ${userId}`);
      console.error(`[InsightEngine] Job ID: ${job.id}`);
      console.error(`[InsightEngine] Cycle period: ${cycleDates.cycleStartDate.toISOString()} to ${cycleDates.cycleEndDate.toISOString()}`);
      
      // Log error details for debugging
      
      // Type-safe error logging
      if (error instanceof Error) {
        console.error(`[InsightEngine] Error type: ${error.constructor.name}`);
        console.error(`[InsightEngine] Error message: ${error.message}`);
        console.error(`[InsightEngine] Error stack: ${error.stack}`);
        
        // Log additional context if available (ES2022+ feature)
        if ('cause' in error && error.cause) {
          console.error(`[InsightEngine] Caused by: ${error.cause}`);
        }
      } else {
        console.error(`[InsightEngine] Unknown error type: ${typeof error}`);
        console.error(`[InsightEngine] Error value: ${String(error)}`);
      }
      
      // Check for validation errors (common in our error types)
      if (error && typeof error === 'object' && 'validationErrors' in error) {
        const validationError = error as { validationErrors: any };
        console.error(`[InsightEngine] Validation errors:`, JSON.stringify(validationError.validationErrors, null, 2));
      }
      
      console.error(`[InsightEngine] ================================================`);
      
      // Update cycle record with failure data
      const processingDuration = Date.now() - startTime;
      await this.userCycleRepository.update(cycleId, {
        status: 'failed',
        completed_at: new Date(),
        processing_duration_ms: processingDuration,
        error_count: 1,
        dashboard_ready: false
      });
      
      // All errors are non-retryable at BullMQ level since LLM retries are handled by LLMRetryHandler
      const nonRetryableError = new Error(`NON_RETRYABLE_ERROR: ${error instanceof Error ? error.message : String(error)}`);
      nonRetryableError.name = 'NonRetryableError';
      throw nonRetryableError;
    }
  }

  /**
   * Calculate cycle dates based on current time
   * Default: Last 2 days, but can be configured
   */
  private calculateCycleDates(): CycleDates {
    const now = new Date();
    const cycleEndDate = new Date(now);
    const cycleStartDate = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)); // 2 days ago
    
    return { cycleStartDate, cycleEndDate };
  }


  private async gatherComprehensiveContext(userId: string, jobId: string, cycleDates: CycleDates) {
    // Get user information
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    console.log(`[InsightEngine] Compiling data for cycle from ${cycleDates.cycleStartDate} to ${cycleDates.cycleEndDate}`);

    // Get conversation summaries directly from database
    const conversationSummaries = await this.dbService.prisma.conversations.findMany({
      where: {
        user_id: userId,
        start_time: {
          gte: cycleDates.cycleStartDate,
          lte: cycleDates.cycleEndDate
        }
      },
      select: {
        id: true,
        title: true,
        importance_score: true,
        context_summary: true,
        start_time: true
      },
      orderBy: { importance_score: 'desc' }
    });

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
          const conversationSummariesFormatted = conversationSummaries.map((conv: {
            id: string;
            title: string | null;
            importance_score: number | null;
            context_summary: string | null;
            start_time: Date;
          }) => {
            return {
              id: `conv_${conv.id}`, // Prefix to distinguish from memory units
              title: `[CONVERSATION] ${conv.title || 'Untitled Conversation'}`, // Use actual conversation title
              content: conv.context_summary || 'No summary available', // Clean content
              importance_score: conv.importance_score || 0,
              tags: [], // No tags in conversations table - keep empty array for consistency
              created_at: conv.start_time.toISOString()
            };
          });
          
          console.log(`[InsightEngine] Assembling knowledge graph: ${actualMemoryUnits.length} actual memory units + ${conversationSummariesFormatted.length} conversation summaries = ${actualMemoryUnits.length + conversationSummariesFormatted.length} total items`);
          
          return [
            ...actualMemoryUnits,
            ...conversationSummariesFormatted
          ];
        })(),
        concepts: await this.getUserConcepts(userId, cycleDates),
        conceptsNeedingSynthesis: await this.getConceptsNeedingSynthesis(userId, cycleDates.cycleStartDate)
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
        return growthEvents.map((event: any) => {
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
        growth_trajectory: {}
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

    } catch (error: unknown) {
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

    } catch (error: unknown) {
      console.error(`[InsightEngine] Error fetching memory units for user ${userId}:`, error);
      return [];
    }
  }


  private async persistStrategicUpdates(
    userId: string,
    analysisOutput: StrategicSynthesisOutput,
    cycleId?: string
  ): Promise<Array<{ id: string; type: string }>> {
    console.log(`[InsightEngine] persistStrategicUpdates called for user ${userId}`);
    console.log(`[InsightEngine] DEBUG: analysisOutput type:`, typeof analysisOutput);
    console.log(`[InsightEngine] DEBUG: analysisOutput:`, JSON.stringify(analysisOutput, null, 2).substring(0, 500) + '...');

    const { ontology_optimizations, derived_artifacts, proactive_prompts } = analysisOutput;
    const newEntities: Array<{ id: string; type: string }> = [];
    
    // Generate cycle_id if not provided
    const currentCycleId = cycleId || `cycle_${userId}_${Date.now()}`;

    try {
      // Execute Ontology Updates (Neo4j) - Actual concept merging
      if (this.dbService.neo4j && ontology_optimizations.concepts_to_merge.length > 0) {
        const mergedConceptIds = await this.executeConceptMerging(ontology_optimizations);
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
        
        // CRITICAL FIX: Update Neo4j for concept merging
        if (this.dbService.neo4j) {
          for (const merge of ontology_optimizations.concepts_to_merge) {
            await this.updateNeo4jMergedConcepts(merge);
          }
          console.log(`[InsightEngine] Updated Neo4j for ${ontology_optimizations.concepts_to_merge.length} concept merges`);
        }
      }

      // CRITICAL FIX: Archive concepts as specified by LLM
      if (ontology_optimizations.concepts_to_archive.length > 0) {
        await this.archiveConcepts(ontology_optimizations.concepts_to_archive);
        console.log(`[InsightEngine] Archived ${ontology_optimizations.concepts_to_archive.length} concepts`);
        
        // CRITICAL FIX: Update Neo4j concept status for archived concepts
        if (this.dbService.neo4j) {
          for (const archive of ontology_optimizations.concepts_to_archive) {
            await this.updateNeo4jConceptStatus(archive.concept_id, 'archived', {
              archive_rationale: archive.archive_rationale,
              replacement_concept_id: archive.replacement_concept_id
            });
          }
          console.log(`[InsightEngine] Updated Neo4j status for ${ontology_optimizations.concepts_to_archive.length} archived concepts`);
        }
      }

      // CRITICAL FIX: Create communities as specified by LLM
      if (ontology_optimizations.community_structures.length > 0) {
        const communityIds = await this.createCommunities(userId, ontology_optimizations.community_structures);
        newEntities.push(...communityIds.map(id => ({ id, type: 'Community' })));
        console.log(`[InsightEngine] Created ${ontology_optimizations.community_structures.length} communities`);
      }

      // Process concept description synthesis
      if (ontology_optimizations.concept_description_synthesis?.length > 0) {
        await this.synthesizeConceptDescriptions(ontology_optimizations.concept_description_synthesis);
        console.log(`[InsightEngine] Synthesized descriptions for ${ontology_optimizations.concept_description_synthesis.length} concepts`);
      }

      // Create new strategic relationships if specified
      if (this.dbService.neo4j && ontology_optimizations.new_strategic_relationships.length > 0) {
        await this.createStrategicRelationships(ontology_optimizations.new_strategic_relationships);
        console.log(`[InsightEngine] Created ${ontology_optimizations.new_strategic_relationships.length} strategic relationships`);
        // NOTE: Relationships are not entities and don't need embeddings or projection updates
      }

      // Create Derived Artifacts
      for (const artifact of derived_artifacts) {
        const artifactData: CreateDerivedArtifactData = {
          user_id: userId,
          cycle_id: currentCycleId, // ✅ Include cycle_id for dashboard grouping
          artifact_type: artifact.artifact_type,
          title: artifact.title,
          content_narrative: artifact.content,
          content_data: artifact.content_data || null, // ✅ Include structured data
          source_concept_ids: artifact.source_concept_ids || [], // ✅ Include source concepts
          source_memory_unit_ids: artifact.source_memory_unit_ids || [] // ✅ Include source memory units
        };

        const createdArtifact = await this.derivedArtifactRepository.create(artifactData);
        newEntities.push({ id: createdArtifact.artifact_id, type: 'DerivedArtifact' });
        
        // CRITICAL FIX: Create Neo4j artifact node immediately
        if (this.dbService.neo4j) {
          await this.createNeo4jArtifact(createdArtifact);
        }
        
        console.log(`[InsightEngine] Created derived artifact: ${createdArtifact.artifact_id}`);
      }

      // Create Proactive Prompts
      for (const prompt of proactive_prompts) {
        const promptData: CreateProactivePromptData = {
          user_id: userId,
          cycle_id: currentCycleId, // ✅ Include cycle_id for dashboard grouping
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
        
        // CRITICAL FIX: Create Neo4j prompt node immediately
        if (this.dbService.neo4j) {
          await this.createNeo4jPrompt(createdPrompt);
        }
        
        console.log(`[InsightEngine] Created proactive prompt: ${createdPrompt.prompt_id} - ${prompt.title}`);
      }

      // CRITICAL FIX: Update user memory profile with strategic insights
      await this.updateUserMemoryProfile(userId, analysisOutput);


      // CRITICAL FIX: Update next conversation context package
      await this.updateNextConversationContext(userId, analysisOutput);

      // CRITICAL FIX: Final Neo4j synchronization check
      if (this.dbService.neo4j) {
        await this.synchronizeNeo4jEntities(userId, newEntities);
        console.log(`[InsightEngine] Completed final Neo4j synchronization for user ${userId}`);
      }

      // Publish embedding jobs for new entities
      await this.publishEmbeddingJobs(userId, newEntities);

      // Update user strategic state
      await this.userRepository.update(userId, {
        last_cycle_started_at: new Date(),
        concepts_created_in_cycle: ontology_optimizations.concepts_to_merge.length
      });

      console.log(`[InsightEngine] Updated user strategic state for ${userId}`);

    } catch (error: unknown) {
      console.error(`[InsightEngine] Error persisting strategic updates for user ${userId}:`, error);
      throw error;
    }

    return newEntities;
  }

  /**
   * Publish embedding jobs for newly created entities
   * CRITICAL FIX: Only send content entities, not graph relationships
   */
  private async publishEmbeddingJobs(userId: string, newEntities: Array<{ id: string; type: string }>) {
    const embeddingJobs = [];
    
    // CRITICAL FIX: Filter out non-content entities
    const contentEntities = newEntities.filter(entity => 
      ['DerivedArtifact', 'ProactivePrompt', 'Community'].includes(entity.type)
    );
    
    console.log(`[InsightEngine] Filtered ${newEntities.length} total entities to ${contentEntities.length} content entities for embedding`);

    for (const entity of contentEntities) {
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
      } catch (error: unknown) {
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
      } catch (error: unknown) {
        console.error(`[InsightEngine] Error publishing embedding jobs for user ${userId}:`, error);
      }
    }
  }

  /**
   * Extract text content for embedding based on entity type
   * ENHANCED: Added content length validation and truncation warnings
   */
  private async extractTextContentForEntity(entityId: string, entityType: string): Promise<string | null> {
    try {
      let textContent: string | null = null;
      
      switch (entityType) {
        case 'DerivedArtifact':
          const artifact = await this.derivedArtifactRepository.findById(entityId);
          if (artifact) {
            textContent = `${artifact.title}\n\n${artifact.content_narrative}`;
          }
          break;
          
        case 'ProactivePrompt':
          const prompt = await this.proactivePromptRepository.findById(entityId);
          if (prompt) {
            textContent = prompt.prompt_text;
          }
          break;
          
        case 'MergedConcept':
          // MergedConcepts are stored in the concepts table, so use concept repository
          const concept = await this.conceptRepository.findById(entityId);
          if (concept) {
            textContent = concept.name; // Use only name for consistency with IngestionAnalyst
          }
          break;
          
        case 'Community':
          // For communities, aggregate content from member concepts
          try {
            // CRITICAL FIX: Generate proper content for embedding and Weaviate compatibility
            const community = await this.dbService.communityRepository.getByIdWithConcepts(entityId);
            if (community) {
              const memberCount = community.concepts?.length || 0;
              textContent = `${community.name}: ${community.description || 'Strategic community'}. Members: ${memberCount} concepts.`;
            } else {
              textContent = `Community ${entityId} - Strategic community with member concepts`;
            }
          } catch (error: unknown) {
            console.error(`[InsightEngine] Error extracting community content for ${entityId}:`, error);
            textContent = `Community ${entityId} - Strategic community`;
          }
          break;
          
        default:
          console.warn(`[InsightEngine] Unknown entity type for embedding: ${entityType}`);
          return null;
      }

      // ENHANCED: Validate content length and provide warnings
      if (textContent) {
        this.validateContentLength(textContent, entityType, entityId);
        return textContent;
      }
      
      return null;
    } catch (error: unknown) {
      console.error(`[InsightEngine] Error extracting text content for ${entityType} ${entityId}:`, error);
      return null;
    }
  }

  /**
   * CRITICAL FIX: Publish cycle artifacts to downstream workers
   * Only send content entities to card worker, all entities to graph worker
   */
  private async publishCycleArtifacts(userId: string, newEntities: Array<{ id: string; type: string }>) {
    if (newEntities.length === 0) {
      console.log(`[InsightEngine] No new entities to publish for user ${userId}`);
      return;
    }

    try {
      // CRITICAL FIX: Filter entities for different workers
      const contentEntities = newEntities.filter(entity => 
        ['DerivedArtifact', 'ProactivePrompt', 'Community'].includes(entity.type)
      );
      
      const graphEntities = newEntities; // Graph worker needs all entities for visualization

      // Publish to card queue - only content entities
      const cardEventPayload = {
        type: 'cycle_artifacts_created',
        userId,
        entities: contentEntities,
        source: 'InsightEngine'
      };
      await this.cardQueue.add('cycle_artifacts_created', cardEventPayload);
      console.log(`[InsightEngine] Published ${contentEntities.length} content entities to card-queue for user ${userId}`);

      // Publish to graph queue - all entities for visualization
      const graphEventPayload = {
        type: 'cycle_artifacts_created',
        userId,
        entities: graphEntities,
        source: 'InsightEngine'
      };
      await this.graphQueue.add('cycle_artifacts_created', graphEventPayload);
      console.log(`[InsightEngine] Published ${graphEntities.length} entities to graph-queue for user ${userId}`);
      
    } catch (error: unknown) {
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

      return recentQuests.map((quest: any) => ({
        prompt_text: quest.prompt_text,
        source_agent: quest.source_agent,
        status: quest.status,
        created_at: quest.created_at,
        metadata: quest.metadata
      }));
    } catch (error: unknown) {
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
        .map((conv: any) => conv.context_summary)
        .filter((summary: any): summary is string => summary !== null && summary.length > 10)
        .slice(0, 5);

      return patterns.length > 0 ? patterns : ['General inquiry patterns'];
    } catch (error: unknown) {
      console.error(`[InsightEngine] Error generating query patterns for user ${userId}:`, error);
      return ['General inquiry patterns'];
    }
  }

  /**
   * Execute Neo4j concept merging operations
   */
  private async executeConceptMerging(ontologyOptimizations: any): Promise<string[]> {
    if (!this.dbService.neo4j) {
      console.warn('[InsightEngine] Neo4j client not available, skipping concept merging');
      return [];
    }
    
    const session = this.dbService.neo4j.session();
    const mergedConceptIds: string[] = [];
    
    try {
      for (const merge of ontologyOptimizations.concepts_to_merge) {
        const cypher = `
          MATCH (primary:Concept {id: $primaryId}), (secondary:Concept {id: $secondaryId})
          WITH primary, secondary
          SET primary.name = $newName,
              primary.description = $newDescription,
              primary.merged_from = coalesce(primary.merged_from, []) + $secondaryId,
              primary.updatedAt = datetime()
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
          RETURN primary.id as mergedId
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
    } catch (error: unknown) {
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
  private async createStrategicRelationships(relationships: any[]): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[InsightEngine] Neo4j client not available, skipping strategic relationship creation');
      return;
    }
    
    const session = this.dbService.neo4j.session();
    
    try {
      for (const rel of relationships) {
        const cypher = `
          MATCH (source:Concept {id: $sourceId}), (target:Concept {id: $targetId})
          CREATE (source)-[r:STRATEGIC_RELATIONSHIP {
            type: $relationshipType,
            strength: $strength,
            strategic_value: $strength,
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
          console.log(`[InsightEngine] Created strategic relationship: ${rel.source_id} -> ${rel.target_id} (${rel.relationship_type})`);
        }
      }
    } catch (error: unknown) {
      console.error('[InsightEngine] Error creating strategic relationships:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * CRITICAL FIX: Update PostgreSQL concepts table for merged concepts
   * Improved error handling to prevent job failures
   */
  private async updatePostgreSQLConceptsForMerging(conceptsToMerge: any[]): Promise<void> {
    const errors: string[] = [];
    
    for (const merge of conceptsToMerge) {
      try {
        // Update secondary concepts to mark them as merged
        for (const secondaryId of merge.secondary_concept_ids) {
          try {
            await this.conceptRepository.update(secondaryId, {
              status: 'merged',
              merged_into_concept_id: merge.primary_concept_id
            });
            console.log(`[InsightEngine] Marked concept ${secondaryId} as merged into ${merge.primary_concept_id}`);
            
            // Sync status to Weaviate
            try {
              await this.weaviateService.updateConceptStatus(secondaryId, 'merged');
            } catch (weaviateError) {
              console.warn(`[InsightEngine] Failed to sync concept ${secondaryId} status to Weaviate:`, weaviateError);
            }
          } catch (updateError) {
            const errorMsg = `Failed to update secondary concept ${secondaryId}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`;
            console.error(`[InsightEngine] ${errorMsg}`);
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
          console.log(`[InsightEngine] Updated primary concept ${merge.primary_concept_id} with new name: ${merge.new_concept_name}`);
        } catch (updateError) {
          const errorMsg = `Failed to update primary concept ${merge.primary_concept_id}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`;
          console.error(`[InsightEngine] ${errorMsg}`);
          errors.push(errorMsg);
        }
      } catch (error: unknown) {
        const errorMsg = `Failed to process merge for primary concept ${merge.primary_concept_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[InsightEngine] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    // Log summary of any errors but don't fail the job
    if (errors.length > 0) {
      console.warn(`[InsightEngine] Completed concept merging with ${errors.length} errors:`, errors);
    } else {
      console.log(`[InsightEngine] Successfully completed all concept merging updates`);
    }
  }

  /**
   * CRITICAL FIX: Update user memory profile with comprehensive strategic insights
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
        },
        // CRITICAL FIX: Add key insights from derived artifacts
        key_insights: derived_artifacts?.map(artifact => ({
          title: artifact.title,
          content: artifact.content,
          type: artifact.artifact_type,
          confidence: artifact.confidence_score,
          actionability: artifact.actionability
        })) || [],
        // CRITICAL FIX: Add proactive guidance
        proactive_guidance: proactive_prompts?.map(prompt => ({
          title: prompt.title,
          prompt_text: prompt.prompt_text,
          type: prompt.prompt_type,
          timing: prompt.timing_suggestion,
          priority: prompt.priority_level
        })) || []
      };

      await this.userRepository.update(userId, {
        memory_profile: memoryProfileUpdate
      });
      
      console.log(`[InsightEngine] Updated comprehensive memory profile for user ${userId} with strategic insights`);
    } catch (error: unknown) {
      console.error('[InsightEngine] Error updating user memory profile:', error);
      throw error;
    }
  }

  /**
   * CRITICAL FIX: Archive concepts as specified by LLM
   * Improved error handling to prevent job failures
   */
  private async archiveConcepts(conceptsToArchive: Array<{ concept_id: string; archive_rationale: string; replacement_concept_id?: string | null }>): Promise<void> {
    const errors: string[] = [];
    
    for (const archive of conceptsToArchive) {
      try {
        // Update concept status to archived
        await this.conceptRepository.update(archive.concept_id, {
          status: 'archived',
          // Store archive rationale in description or metadata if available
          description: `ARCHIVED: ${archive.archive_rationale}${archive.replacement_concept_id ? ` (Replaced by: ${archive.replacement_concept_id})` : ''}`
        });
        console.log(`[InsightEngine] Archived concept ${archive.concept_id} with rationale: ${archive.archive_rationale}`);
        
        // Sync status to Weaviate
        try {
          await this.weaviateService.updateConceptStatus(archive.concept_id, 'archived');
        } catch (weaviateError) {
          console.warn(`[InsightEngine] Failed to sync concept ${archive.concept_id} status to Weaviate:`, weaviateError);
        }
      } catch (error: unknown) {
        const errorMsg = `Failed to archive concept ${archive.concept_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[InsightEngine] ${errorMsg}`);
        errors.push(errorMsg);
        // Continue with other concepts instead of failing the entire job
      }
    }
    
    // Log summary of any errors but don't fail the job
    if (errors.length > 0) {
      console.warn(`[InsightEngine] Completed concept archiving with ${errors.length} errors:`, errors);
    } else {
      console.log(`[InsightEngine] Successfully completed all concept archiving`);
    }
  }

  /**
   * Get concepts that need description synthesis (those updated within the cycle period)
   */
  private async getConceptsNeedingSynthesis(userId: string, cycleStartDate?: Date): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    salience: number;
    created_at: string;
    merged_into_concept_id?: string;
  }>> {
    try {
      console.log(`[InsightEngine] Fetching concepts needing synthesis for user ${userId}`);
      
      // Build where clause for concepts updated within the cycle period
      const whereClause: any = { 
        user_id: userId, 
        status: 'active'
      };
      
      // If cycleStartDate is provided, filter by last_updated_ts
      if (cycleStartDate) {
        whereClause.last_updated_ts = {
          gte: cycleStartDate
        };
      } else {
        // Fallback to text search if no date provided (for backward compatibility)
        whereClause.description = { contains: '[20' };
      }
      
      const concepts = await this.dbService.prisma.concepts.findMany({
        where: whereClause,
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

      console.log(`[InsightEngine] Found ${mappedConcepts.length} concepts needing description synthesis`);
      return mappedConcepts;

    } catch (error: unknown) {
      console.error(`[InsightEngine] Error fetching concepts needing synthesis for user ${userId}:`, error);
      return []; // Return empty array on error to prevent system failure
    }
  }

  /**
   * Synthesize concept descriptions with validation and fallback protection
   */
  private async synthesizeConceptDescriptions(conceptsToSynthesize: Array<{ concept_id: string; synthesized_description: string }>): Promise<void> {
    const errors: string[] = [];
    
    for (const concept of conceptsToSynthesize) {
      try {
        // Validate LLM output before updating
        if (!concept.concept_id || !concept.synthesized_description) {
          console.warn(`[InsightEngine] Skipping concept synthesis - missing concept_id or synthesized_description:`, concept);
          continue;
        }

        // Additional validation: ensure synthesized description is meaningful
        if (concept.synthesized_description.trim().length < 3) {
          console.warn(`[InsightEngine] Skipping concept ${concept.concept_id} - synthesized description too short: "${concept.synthesized_description}"`);
          continue;
        }

        // Only update if we have valid data
        await this.conceptRepository.update(concept.concept_id, {
          description: concept.synthesized_description
        });
        console.log(`[InsightEngine] Successfully synthesized description for concept ${concept.concept_id}`);
        
      } catch (error: unknown) {
        const errorMsg = `Failed to synthesize concept ${concept.concept_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[InsightEngine] ${errorMsg}`);
        errors.push(errorMsg);
        // Continue with other concepts instead of failing the entire job
        // Original description remains unchanged
      }
    }
    
    // Log summary of any errors but don't fail the job
    if (errors.length > 0) {
      console.warn(`[InsightEngine] Completed concept description synthesis with ${errors.length} errors:`, errors);
    } else {
      console.log(`[InsightEngine] Successfully completed all concept description synthesis`);
    }
  }

  /**
   * CRITICAL FIX: Create communities as specified by LLM
   */
  private async createCommunities(userId: string, communityStructures: Array<{ community_id: string; member_concept_ids: string[]; theme: string; strategic_importance: number }>): Promise<string[]> {
    const communityIds: string[] = [];
    
    try {
      for (const community of communityStructures) {
        // CRITICAL FIX: Generate a proper UUID instead of using the semantic ID from LLM
        const generatedCommunityId = randomUUID();
        
        // Create community in PostgreSQL using the repository
        const communityData = {
          community_id: generatedCommunityId, // Use generated UUID instead of semantic ID
          user_id: userId,
          name: community.theme, // Use theme as the community name
          description: `Strategic importance: ${community.strategic_importance}/10. Members: ${community.member_concept_ids.length} concepts.`,
          created_at: new Date(),
          last_analyzed_ts: new Date()
        };

        // Actually create the community in the database
        const createdCommunity = await this.dbService.communityRepository.create(communityData);
        
        // Assign concepts to this community
        if (community.member_concept_ids.length > 0) {
          await this.dbService.communityRepository.assignConceptsToCommunity(
            createdCommunity.community_id, 
            community.member_concept_ids
          );
        }

        // CRITICAL: Create Community node in Neo4j
        if (this.dbService.neo4j) {
          await this.createNeo4jCommunity(createdCommunity, community.member_concept_ids, generatedCommunityId);
        }

        console.log(`[InsightEngine] Created community: ${community.theme} with ID ${generatedCommunityId} and ${community.member_concept_ids.length} members`);
        communityIds.push(createdCommunity.community_id);
      }
    } catch (error: unknown) {
      console.error('[InsightEngine] Error creating communities:', error);
      throw error;
    }
    
    return communityIds;
  }


  /**
   * CRITICAL FIX: Update next conversation context package with forward-looking insights
   */
  private async updateNextConversationContext(userId: string, analysisOutput: StrategicSynthesisOutput): Promise<void> {
    try {
      const { derived_artifacts, proactive_prompts } = analysisOutput;
      
      const nextContextPackage = {
        last_updated: new Date().toISOString(),
        cycle_timestamp: new Date().toISOString(),
        // CRITICAL FIX: Include key insights for next conversation
        key_insights: derived_artifacts?.map(artifact => ({
          title: artifact.title,
          content: artifact.content,
          type: artifact.artifact_type,
          confidence: artifact.confidence_score,
          actionability: artifact.actionability
        })) || [],
        // CRITICAL FIX: Include proactive guidance
        proactive_guidance: proactive_prompts?.map(prompt => ({
          title: prompt.title,
          prompt_text: prompt.prompt_text,
          type: prompt.prompt_type,
          timing: prompt.timing_suggestion,
          priority: prompt.priority_level,
          context_explanation: prompt.context_explanation
        })) || [],
        // CRITICAL FIX: Include conversation starter suggestions
        conversation_starters: proactive_prompts
          ?.filter(prompt => prompt.timing_suggestion === 'next_conversation')
          ?.map(prompt => ({
            title: prompt.title,
            prompt_text: prompt.prompt_text,
            priority: prompt.priority_level,
            context: prompt.context_explanation
          })) || []
      };

      await this.userRepository.update(userId, {
        next_conversation_context_package: nextContextPackage
      });
      
      console.log(`[InsightEngine] Updated next conversation context package for user ${userId}`);
    } catch (error: unknown) {
      console.error('[InsightEngine] Error updating next conversation context package:', error);
      throw error;
    }
  }

  // ============================================================================
  // CRITICAL FIX: Missing Neo4j Synchronization Methods
  // ============================================================================

  /**
   * CRITICAL FIX: Create Community node in Neo4j with member concept relationships
   */
  private async createNeo4jCommunity(community: any, memberConceptIds: string[], generatedCommunityId: string): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[InsightEngine] Neo4j client not available, skipping community creation');
      return;
    }

    const session = this.dbService.neo4j.session();
    
    try {
      // Create Community node
      const createCommunityCypher = `
        CREATE (c:Community {
          community_id: $communityId,
          name: $name,
          description: $description,
          userId: $userId,
          created_at: datetime(),
          last_analyzed_ts: datetime(),
          strategic_importance: $strategicImportance
        })
        RETURN c.community_id as communityId
      `;

      const communityResult = await session.run(createCommunityCypher, {
        communityId: generatedCommunityId, // Use the generated UUID
        name: community.name,
        description: community.description,
        userId: community.user_id,
        strategicImportance: community.strategic_importance || 5
      });

      if (communityResult.records.length === 0) {
        throw new Error(`Failed to create Community node for ${generatedCommunityId}`);
      }

      console.log(`[InsightEngine] Created Community node in Neo4j: ${generatedCommunityId}`);

      // Create MEMBER_OF relationships with concepts
      if (memberConceptIds.length > 0) {
        const memberRelationshipsCypher = `
          MATCH (c:Community {community_id: $communityId})
          MATCH (concept:Concept {id: $conceptId})
          CREATE (concept)-[r:MEMBER_OF {
            joined_at: datetime(),
            community_id: $communityId
          }]->(c)
          RETURN r
        `;

        for (const conceptId of memberConceptIds) {
          try {
            await session.run(memberRelationshipsCypher, {
              communityId: generatedCommunityId,
              conceptId
            });
            console.log(`[InsightEngine] Created MEMBER_OF relationship: Concept ${conceptId} -> Community ${generatedCommunityId}`);
          } catch (error) {
            console.error(`[InsightEngine] Error creating MEMBER_OF relationship for concept ${conceptId}:`, error);
            // Continue with other concepts even if one fails
          }
        }
      }

      console.log(`[InsightEngine] Successfully created Neo4j Community ${generatedCommunityId} with ${memberConceptIds.length} member concepts`);

    } catch (error: unknown) {
      console.error(`[InsightEngine] Error creating Neo4j Community ${generatedCommunityId}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * CRITICAL FIX: Create DerivedArtifact node in Neo4j
   */
  private async createNeo4jArtifact(artifact: any): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[InsightEngine] Neo4j client not available, skipping artifact creation');
      return;
    }

    const session = this.dbService.neo4j.session();
    
    try {
      // Create DerivedArtifact node
      const createArtifactCypher = `
        CREATE (a:DerivedArtifact {
          artifact_id: $artifactId,
          title: $title,
          artifact_type: $artifactType,
          content_narrative: $contentNarrative,
          userId: $userId,
          created_at: datetime(),
          source_concept_ids: $sourceConceptIds,
          source_memory_unit_ids: $sourceMemoryUnitIds
        })
        RETURN a.artifact_id as artifactId
      `;

      const artifactResult = await session.run(createArtifactCypher, {
        artifactId: artifact.artifact_id,
        title: artifact.title,
        artifactType: artifact.artifact_type,
        contentNarrative: artifact.content_narrative,
        userId: artifact.user_id,
        sourceConceptIds: artifact.source_concept_ids || [],
        sourceMemoryUnitIds: artifact.source_memory_unit_ids || []
      });

      if (artifactResult.records.length === 0) {
        throw new Error(`Failed to create DerivedArtifact node for ${artifact.artifact_id}`);
      }

      console.log(`[InsightEngine] Created DerivedArtifact node in Neo4j: ${artifact.artifact_id}`);

      // Create DERIVED_FROM relationships with source concepts
      if (artifact.source_concept_ids && artifact.source_concept_ids.length > 0) {
        const sourceRelationshipCypher = `
          MATCH (a:DerivedArtifact {artifact_id: $artifactId})
          MATCH (c:Concept {id: $conceptId})
          CREATE (a)-[r:DERIVED_FROM {
            relationship_type: 'concept_source',
            created_at: datetime()
          }]->(c)
          RETURN r
        `;

        for (const conceptId of artifact.source_concept_ids) {
          try {
            await session.run(sourceRelationshipCypher, {
              artifactId: artifact.artifact_id,
              conceptId
            });
            console.log(`[InsightEngine] Created DERIVED_FROM relationship: Artifact ${artifact.artifact_id} -> Concept ${conceptId}`);
          } catch (error) {
            console.error(`[InsightEngine] Error creating DERIVED_FROM relationship for concept ${conceptId}:`, error);
          }
        }
      }

      // Create DERIVED_FROM relationships with source memory units
      if (artifact.source_memory_unit_ids && artifact.source_memory_unit_ids.length > 0) {
        const memoryRelationshipCypher = `
          MATCH (a:DerivedArtifact {artifact_id: $artifactId})
          MATCH (m:MemoryUnit {memory_unit_id: $memoryUnitId})
          CREATE (a)-[r:DERIVED_FROM {
            relationship_type: 'memory_source',
            created_at: datetime()
          }]->(m)
          RETURN r
        `;

        for (const memoryUnitId of artifact.source_memory_unit_ids) {
          try {
            await session.run(memoryRelationshipCypher, {
              artifactId: artifact.artifact_id,
              memoryUnitId
            });
            console.log(`[InsightEngine] Created DERIVED_FROM relationship: Artifact ${artifact.artifact_id} -> MemoryUnit ${memoryUnitId}`);
          } catch (error) {
            console.error(`[InsightEngine] Error creating DERIVED_FROM relationship for memory unit ${memoryUnitId}:`, error);
          }
        }
      }

      console.log(`[InsightEngine] Successfully created Neo4j DerivedArtifact ${artifact.artifact_id}`);

    } catch (error: unknown) {
      console.error(`[InsightEngine] Error creating Neo4j DerivedArtifact ${artifact.artifact_id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * CRITICAL FIX: Create ProactivePrompt node in Neo4j
   */
  private async createNeo4jPrompt(prompt: any): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[InsightEngine] Neo4j client not available, skipping prompt creation');
      return;
    }

    const session = this.dbService.neo4j.session();
    
    try {
      // Create ProactivePrompt node
      const createPromptCypher = `
        CREATE (p:ProactivePrompt {
          prompt_id: $promptId,
          prompt_text: $promptText,
          source_agent: $sourceAgent,
          prompt_type: $promptType,
          timing_suggestion: $timingSuggestion,
          priority_level: $priorityLevel,
          userId: $userId,
          created_at: datetime(),
          metadata: $metadata
        })
        RETURN p.prompt_id as promptId
      `;

      const promptResult = await session.run(createPromptCypher, {
        promptId: prompt.prompt_id,
        promptText: prompt.prompt_text,
        sourceAgent: prompt.source_agent,
        promptType: prompt.metadata?.prompt_type || 'general',
        timingSuggestion: prompt.metadata?.timing_suggestion || 'when_ready',
        priorityLevel: prompt.metadata?.priority_level || 'medium',
        userId: prompt.user_id,
        metadata: JSON.stringify(prompt.metadata || {})
      });

      if (promptResult.records.length === 0) {
        throw new Error(`Failed to create ProactivePrompt node for ${prompt.prompt_id}`);
      }

      console.log(`[InsightEngine] Created ProactivePrompt node in Neo4j: ${prompt.prompt_id}`);

      console.log(`[InsightEngine] Successfully created Neo4j ProactivePrompt ${prompt.prompt_id}`);

    } catch (error: unknown) {
      console.error(`[InsightEngine] Error creating Neo4j ProactivePrompt ${prompt.prompt_id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * CRITICAL FIX: Update concept status in Neo4j (archived/merged)
   */
  private async updateNeo4jConceptStatus(conceptId: string, status: string, metadata?: any): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[InsightEngine] Neo4j client not available, skipping concept status update');
      return;
    }

    const session = this.dbService.neo4j.session();
    
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
          archiveRationale: metadata?.archive_rationale || 'Archived by InsightEngine',
          replacementConceptId: metadata?.replacement_concept_id || null
        };
      } else if (status === 'merged') {
        cypher = `
          MATCH (c:Concept {id: $conceptId})
          SET c.status = $status,
              c.merged_at = datetime(),
              c.merged_into_concept_id = $mergedIntoConceptId
          RETURN c.id as conceptId
        `;
        
        params = {
          conceptId,
          status,
          mergedIntoConceptId: metadata?.merged_into_concept_id || null
        };
      } else {
        // Handle other status updates
        cypher = `
          MATCH (c:Concept {id: $conceptId})
          SET c.status = $status,
              c.updatedAt = datetime()
          RETURN c.id as conceptId
        `;
        
        params = {
          conceptId,
          status
        };
      }

      const result = await session.run(cypher, params);

      if (result.records.length === 0) {
        console.warn(`[InsightEngine] Concept ${conceptId} not found in Neo4j for status update`);
        return;
      }

      console.log(`[InsightEngine] Updated Neo4j concept ${conceptId} status to: ${status}`);

    } catch (error: unknown) {
      console.error(`[InsightEngine] Error updating Neo4j concept ${conceptId} status:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * CRITICAL FIX: Handle concept merging in Neo4j graph
   */
  private async updateNeo4jMergedConcepts(merge: any): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[InsightEngine] Neo4j client not available, skipping concept merge update');
      return;
    }

    const session = this.dbService.neo4j.session();
    
    try {
      // Update the primary concept with new properties
      const updatePrimaryCypher = `
        MATCH (c:Concept {id: $primaryId})
        SET c.name = $newName,
            c.description = $newDescription,
            c.updatedAt = datetime(),
            c.merge_count = COALESCE(c.merge_count, 0) + $mergeCount
        RETURN c.id as conceptId
      `;

      await session.run(updatePrimaryCypher, {
        primaryId: merge.primary_concept_id,
        newName: merge.new_concept_name,
        newDescription: merge.new_concept_description,
        mergeCount: merge.secondary_concept_ids.length
      });

      // Update secondary concepts to mark them as merged
      for (const secondaryId of merge.secondary_concept_ids) {
        const updateSecondaryCypher = `
          MATCH (c:Concept {id: $secondaryId})
          SET c.status = 'merged',
              c.merged_at = datetime(),
              c.merged_into_concept_id = $primaryId
          RETURN c.id as conceptId
        `;

        await session.run(updateSecondaryCypher, {
          secondaryId,
          primaryId: merge.primary_concept_id
        });
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
        console.log(`[InsightEngine] Redirected ${redirectedCount} relationships from concept ${secondaryId} to ${merge.primary_concept_id}`);
      }

      console.log(`[InsightEngine] Successfully updated Neo4j for concept merge: ${merge.primary_concept_id} absorbed ${merge.secondary_concept_ids.length} concepts`);

    } catch (error: unknown) {
      console.error(`[InsightEngine] Error updating Neo4j for concept merge:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update primary concept metadata to reflect merging operations
   */
  private async updatePrimaryConceptMetadata(merge: any): Promise<void> {
    // Update primary concept status and merged_into_concept_id in PostgreSQL
    // Note: We'll store merge information in the description field since metadata is not supported
    const mergeInfo = `Merged with: ${merge.secondary_concept_ids.join(', ')}. Rationale: ${merge.merge_rationale || 'Strategic consolidation'}`;
    
    await this.conceptRepository.update(merge.primary_concept_id, {
      description: mergeInfo,
      status: 'active' // Keep primary concept active
    });
    
    // Update primary concept metadata in Neo4j
    await this.updateNeo4jPrimaryConceptMetadata(merge.primary_concept_id, {
      merged_concepts: merge.secondary_concept_ids,
      merge_rationale: merge.merge_rationale,
      merged_at: new Date().toISOString(),
      total_merged_concepts: merge.secondary_concept_ids.length + 1
    });
  }

  /**
   * Update primary concept metadata in Neo4j
   */
  private async updateNeo4jPrimaryConceptMetadata(conceptId: string, metadata: any): Promise<void> {
    if (!this.dbService.neo4j) return;
    
    const session = this.dbService.neo4j.session();
    try {
      // Update primary concept metadata
      const result = await session.run(`
        MATCH (c:Concept {id: $conceptId})
        SET c.metadata = $metadata
        RETURN c
      `, {
        conceptId,
        metadata: JSON.stringify(metadata)
      });
      
      console.log(`[InsightEngine] Updated Neo4j Concept ${conceptId} metadata`);
    } finally {
      session.close();
    }
  }

  /**
   * CRITICAL FIX: Synchronize all Neo4j entities after PostgreSQL creation
   */
  private async synchronizeNeo4jEntities(userId: string, newEntities: Array<{ id: string; type: string }>): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[InsightEngine] Neo4j client not available, skipping Neo4j synchronization');
      return;
    }

    console.log(`[InsightEngine] Starting Neo4j synchronization for ${newEntities.length} entities`);

    try {
      for (const entity of newEntities) {
        try {
          switch (entity.type) {
            case 'Community':
              // Communities are already created in Neo4j during the createCommunities method
              console.log(`[InsightEngine] Community ${entity.id} already synchronized to Neo4j`);
              break;

            case 'DerivedArtifact':
              const artifact = await this.derivedArtifactRepository.findById(entity.id);
              if (artifact) {
                await this.createNeo4jArtifact(artifact);
              }
              break;

            case 'ProactivePrompt':
              const prompt = await this.proactivePromptRepository.findById(entity.id);
              if (prompt) {
                await this.createNeo4jPrompt(prompt);
              }
              break;

            case 'MergedConcept':
              // Merged concepts are already handled in Neo4j during the executeConceptMerging method
              console.log(`[InsightEngine] Merged concept ${entity.id} already synchronized to Neo4j`);
              break;

            case 'StrategicRelationship':
              // Strategic relationships are already created in Neo4j during the createStrategicRelationships method
              console.log(`[InsightEngine] Strategic relationship ${entity.id} already synchronized to Neo4j`);
              break;

            default:
              console.warn(`[InsightEngine] Unknown entity type for Neo4j sync: ${entity.type}`);
          }
        } catch (error) {
          console.error(`[InsightEngine] Error synchronizing ${entity.type} ${entity.id} to Neo4j:`, error);
          // Continue with other entities even if one fails
        }
      }

      console.log(`[InsightEngine] Completed Neo4j synchronization for user ${userId}`);

    } catch (error: unknown) {
      console.error(`[InsightEngine] Error during Neo4j synchronization for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * ENHANCED: Validate content length and provide warnings for potential truncation
   */
  private validateContentLength(content: string, fieldName: string, entityId: string): void {
    const contentLength = content.length;
    const maxRecommendedLength = 8000; // Conservative limit for embeddings
    const criticalLength = 15000; // Critical limit where truncation is likely
    
    if (contentLength > criticalLength) {
      console.warn(`[InsightEngine] ⚠️ CRITICAL: Very long content detected in ${fieldName} ${entityId}: ${contentLength} chars (may cause embedding truncation)`);
      
      // Log content preview for debugging
      const preview = content.substring(0, 200) + '...';
      console.warn(`[InsightEngine] Content preview: ${preview}`);
      
      // Suggest content optimization
      console.warn(`[InsightEngine] Consider: 1) Truncating to ${maxRecommendedLength} chars, 2) Chunking into smaller pieces, 3) Summarizing content`);
    } else if (contentLength > maxRecommendedLength) {
      console.warn(`[InsightEngine] ⚠️ WARNING: Long content detected in ${fieldName} ${entityId}: ${contentLength} chars (approaching recommended limit)`);
    } else if (contentLength < 50) {
      console.warn(`[InsightEngine] ⚠️ WARNING: Very short content detected in ${fieldName} ${entityId}: ${contentLength} chars (may not provide sufficient context for embeddings)`);
    } else {
      console.log(`[InsightEngine] ✅ Content length validation passed for ${fieldName} ${entityId}: ${contentLength} chars`);
    }
  }

  /**
   * ENHANCED: Validate LLM response quality and length
   */
  private validateLLMResponse(response: string, toolName: string): void {
    const responseLength = response.length;
    const minRecommendedLength = 100;
    const maxRecommendedLength = 50000;
    
    if (responseLength < minRecommendedLength) {
      console.warn(`[InsightEngine] ⚠️ WARNING: LLM response from ${toolName} is very short: ${responseLength} chars (likely truncated)`);
      
      // Log response preview for debugging
      const preview = response.substring(0, Math.min(200, responseLength));
      console.warn(`[InsightEngine] Response preview: ${preview}`);
      
      throw new Error(`LLM response from ${toolName} too short (${responseLength} chars), likely truncated. Check token limits and model configuration.`);
    }
    
    if (responseLength > maxRecommendedLength) {
      console.warn(`[InsightEngine] ⚠️ WARNING: LLM response from ${toolName} is very long: ${responseLength} chars (may indicate verbose output)`);
    }
    
    // Check for common truncation indicators
    const truncationIndicators = [
      '...', '…', 'truncated', 'cut off', 'incomplete', 'partial'
    ];
    
    const hasTruncationIndicator = truncationIndicators.some(indicator => 
      response.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasTruncationIndicator) {
      console.warn(`[InsightEngine] ⚠️ WARNING: LLM response from ${toolName} contains truncation indicators`);
    }
    
    console.log(`[InsightEngine] ✅ LLM response validation passed for ${toolName}: ${responseLength} chars`);
  }

}
