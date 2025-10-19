/**
 * InsightWorkflowOrchestrator - V11.1 Two-Stage Insight Worker
 * 
 * Orchestrates the two-stage insight generation process:
 * - Stage 1: Foundation Analysis (Insight Worker - Sequential)
 * - Stage 2: Strategic Insights (Insight Worker - Sequential)
 * 
 * Handles dependencies, failure recovery, and result integration.
 * 
 * Architecture:
 * - Foundation and Strategic maintain their conversation continuity for maximum cache hit rates
 * - Ontology optimization is handled by dedicated Ontology Optimization Worker (triggered asynchronously)
 * - Clean separation of concerns: Insight Worker focuses on content analysis, Ontology Worker handles knowledge graph optimization
 */

import { 
  DatabaseService, 
  ConversationRepository, 
  UserRepository,
  MemoryRepository,
  ConceptRepository,
  DerivedArtifactRepository,
  ProactivePromptRepository,
  UserCycleRepository,
  WeaviateService,
  CommunityRepository,
  GrowthEventRepository,
  UnifiedPersistenceService
} from '@2dots1line/database';
import type { 
  CreateDerivedArtifactData,
  CreateProactivePromptData,
  CreateUserCycleData,
  CreateGrowthEventData,
  StandardizedEntity,
  EntityType
} from '@2dots1line/database';
import { 
  FoundationStageTool, 
  FoundationStageResult,
  StrategicStageTool, 
  HybridRetrievalTool, 
  LLMChatTool,
  FoundationStageOutput
} from '@2dots1line/tools';
import { ConfigService } from '@2dots1line/config-service';
import { LLMRetryHandler, getEntityTypeMapping, RelationshipUtils, PromptCacheService } from '@2dots1line/core-utils';
import { Job, Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import type { ExtendedAugmentedMemoryContext } from '@2dots1line/tools';

export interface InsightJobData {
  userId: string;
}

export interface CycleDates {
  cycleStartDate: Date;
  cycleEndDate: Date;
}

export interface StageResults {
  foundation?: any;
  strategic?: any;
  integration?: any;
}

export interface CycleResult {
  cycleId: string;
  status: 'completed' | 'failed' | 'partial';
  stages: {
    foundation: 'success' | 'failed' | 'pending';
    strategic: 'success' | 'failed' | 'pending';
  };
  results?: any;
  error?: string;
  partialResults?: Partial<StageResults>;
}

export class InsightWorkflowOrchestrator {
  private conversationRepository: ConversationRepository;
  private userRepository: UserRepository;
  private memoryRepository: MemoryRepository;
  private conceptRepository: ConceptRepository;
  private derivedArtifactRepository: DerivedArtifactRepository;
  private proactivePromptRepository: ProactivePromptRepository;
  private userCycleRepository: UserCycleRepository;
  private weaviateService: WeaviateService;
  private communityRepository: CommunityRepository;
  private growthEventRepository: GrowthEventRepository;
  private unifiedPersistenceService: UnifiedPersistenceService;
  

  constructor(
    private foundationStageTool: FoundationStageTool,
    private strategicStageTool: StrategicStageTool,
    private hybridRetrievalTool: HybridRetrievalTool,
    private configService: ConfigService,
    private dbService: DatabaseService,
    private cardQueue: Queue,
    private graphQueue: Queue,
    private embeddingQueue: Queue,
    private notificationQueue: Queue,
    private promptCacheService?: PromptCacheService
  ) {
    // Initialize repositories
    this.conversationRepository = new ConversationRepository(dbService);
    this.userRepository = new UserRepository(dbService);
    this.memoryRepository = new MemoryRepository(dbService);
    this.conceptRepository = new ConceptRepository(dbService);
    this.derivedArtifactRepository = new DerivedArtifactRepository(dbService);
    this.proactivePromptRepository = new ProactivePromptRepository(dbService);
    this.userCycleRepository = new UserCycleRepository(dbService);
    this.weaviateService = new WeaviateService(dbService);
    this.communityRepository = new CommunityRepository(dbService);
    this.growthEventRepository = new GrowthEventRepository(dbService);
    this.unifiedPersistenceService = new UnifiedPersistenceService(dbService);
  }

  async executeUserCycle(job: Job<InsightJobData>): Promise<CycleResult> {
    const { userId } = job.data;
    const cycleId = randomUUID();
    const startTime = Date.now();
    const results: Partial<StageResults> = {};
    
      console.log(`[InsightWorkflowOrchestrator] Starting 2-stage cycle ${cycleId} for user ${userId}`);
    
    try {
      // Calculate cycle dates
      const cycleDates = this.calculateCycleDates();
      
      // Create user cycle record first
      await this.userCycleRepository.create({
        cycle_id: cycleId,
        user_id: userId,
        type: 'insight_cycle',
        created_at: new Date()
      });
      console.log(`[InsightWorkflowOrchestrator] Created user cycle record ${cycleId} for user ${userId}`);
      
      // Stage 1: Foundation (Critical - must succeed for strategic stage)
      console.log(`[InsightWorkflowOrchestrator] Stage 1: Foundation analysis for user ${userId}`);
      const foundationResult = await this.executeFoundationStage(userId, cycleDates, cycleId);
      results.foundation = foundationResult.results.foundation_results;
      
      // ✅ Persist foundation results immediately
      await this.persistFoundationResults(userId, foundationResult.results, cycleId);
      console.log(`[InsightWorkflowOrchestrator] Stage 1 completed and persisted for user ${userId}`);
      
      // Stage 2: Strategic (Depends on Foundation only) - Pass foundation prompt for KV caching
      console.log(`[InsightWorkflowOrchestrator] Stage 2: Strategic insights for user ${userId}`);
      results.strategic = await this.executeStrategicStage(userId, foundationResult.results, foundationResult.prompt, cycleDates, cycleId);
      await this.persistStageResults(cycleId, 'strategic', results.strategic);
      console.log(`[InsightWorkflowOrchestrator] Stage 2 completed for user ${userId}`);
      
      // Update cycle record with completion data - PORTED FROM ORIGINAL INSIGHTENGINE
      const processingDuration = Date.now() - startTime;
      const artifactsCreated = results.strategic?.derived_artifacts?.length || 0;
      const promptsCreated = results.strategic?.proactive_prompts?.length || 0;
      const growthEventsCreated = results.strategic?.growth_events?.length || 0;
      const memoryProfileCreated = results.foundation?.foundation_results?.memory_profile ? 1 : 0;
      const openingCreated = results.foundation?.foundation_results?.opening ? 1 : 0;

      await this.userCycleRepository.update(cycleId, {
        status: 'completed',
        ended_at: new Date()
      });

      console.log(`[InsightWorkflowOrchestrator] Successfully completed strategic cycle for user ${userId}, created ${artifactsCreated + promptsCreated + growthEventsCreated + memoryProfileCreated + openingCreated} new entities`);
      
      // Send completion notification
      try {
        await this.notificationQueue.add('insight_generation_complete', {
          type: 'insight_generation_complete',
          userId,
          cycleId,
          artifactsCreated,
          promptsCreated,
          growthEventsCreated,
          memoryProfileCreated,
          openingCreated,
          totalEntitiesCreated: artifactsCreated + promptsCreated + growthEventsCreated + memoryProfileCreated + openingCreated,
          processingDurationMs: processingDuration,
          message: `Insight generation completed! Created ${artifactsCreated + promptsCreated + growthEventsCreated + memoryProfileCreated + openingCreated} new insights and artifacts.`
        });
        console.log(`[InsightWorkflowOrchestrator] Sent completion notification for user ${userId}`);
      } catch (notifyError) {
        console.error(`[InsightWorkflowOrchestrator] Failed to send completion notification for user ${userId}:`, notifyError);
        // Don't fail the job if notification fails
      }
      
          return {
            cycleId,
            status: 'completed',
            stages: {
              foundation: 'success',
              strategic: 'success'
            },
            results: results
          };
      
    } catch (error) {
      console.error(`[InsightWorkflowOrchestrator] 🔴 CYCLE PROCESSING FAILED - DETAILED ERROR ANALYSIS:`);
      console.error(`[InsightWorkflowOrchestrator] ================================================`);
      console.error(`[InsightWorkflowOrchestrator] User ID: ${userId}`);
      console.error(`[InsightWorkflowOrchestrator] Cycle ID: ${cycleId}`);
      console.error(`[InsightWorkflowOrchestrator] Error type: ${error instanceof Error ? error.name : 'Unknown'}`);
      console.error(`[InsightWorkflowOrchestrator] Error message: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[InsightWorkflowOrchestrator] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace available');
      console.error(`[InsightWorkflowOrchestrator] ================================================`);
      
        // Update cycle record with failure status
        try {
          await this.userCycleRepository.update(cycleId, {
            status: 'failed'
          });
        } catch (updateError) {
          console.error(`[InsightWorkflowOrchestrator] Failed to update cycle status:`, updateError);
        }
      
      return {
        cycleId,
        status: 'failed',
        stages: this.getStageStatus(results),
        error: error instanceof Error ? error.message : String(error),
        partialResults: results
      };
    }
  }

  /**
   * Stage 2: Foundation Analysis
   */
  private async executeFoundationStage(userId: string, cycleDates: CycleDates, cycleId: string): Promise<FoundationStageResult> {
    try {
      // Gather comprehensive context
      const { strategicInput } = await this.gatherComprehensiveContext(userId, cycleId, cycleDates, cycleId);
      
      // Build context strings for FoundationStageTool (keep for backward compatibility)
      const analysisContext = this.buildAnalysisContextString(strategicInput);
      const consolidatedKnowledgeGraph = this.buildKnowledgeGraphString(strategicInput);
      const recentConversations = this.buildConversationsString(strategicInput);
      
      // Execute foundation stage with both structured data and strings
      const foundationResult = await this.foundationStageTool.execute({
        userId,
        userName: strategicInput.userName,
        cycleId,
        userMemoryProfile: strategicInput.userMemoryProfile,
        analysisContext: analysisContext,
        consolidatedKnowledgeGraph: consolidatedKnowledgeGraph,
        recentConversations: recentConversations,
        cycleDates: {
          cycleStartDate: cycleDates.cycleStartDate.toISOString(),
          cycleEndDate: cycleDates.cycleEndDate.toISOString()
        },
        // Pass the rich structured data directly
        structuredContext: {
          currentKnowledgeGraph: strategicInput.currentKnowledgeGraph,
          recentGrowthEvents: strategicInput.recentGrowthEvents,
          strategicContext: strategicInput.strategicContext,
          previousKeyPhrases: strategicInput.previousKeyPhrases
        }
      });
      
      // ENHANCED: Validate LLM response quality - PORTED FROM ORIGINAL INSIGHTENGINE
      if (foundationResult) {
        const outputString = JSON.stringify(foundationResult);
        this.validateLLMResponse(outputString, 'FoundationStageTool');
      }
      
      return foundationResult;
    } catch (error) {
      console.error(`[InsightWorkflowOrchestrator] 🔴 FOUNDATION STAGE FAILED - LLM ERROR:`);
      console.error(`[InsightWorkflowOrchestrator] Error type: ${error instanceof Error ? error.name : 'Unknown'}`);
      console.error(`[InsightWorkflowOrchestrator] Error message: ${error instanceof Error ? error.message : String(error)}`);
      
      // Check if this is a retryable LLM error that should have been handled by LLMRetryHandler
      if (error instanceof Error) {
        if (error.message.includes('503') || error.message.includes('server overload')) {
          console.error(`[InsightWorkflowOrchestrator] LLM service overload - this should have been retried by LLMRetryHandler`);
        } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
          console.error(`[InsightWorkflowOrchestrator] LLM rate limit - this should have been retried by LLMRetryHandler`);
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          console.error(`[InsightWorkflowOrchestrator] LLM network error - this should have been retried by LLMRetryHandler`);
        } else {
          console.error(`[InsightWorkflowOrchestrator] Non-retryable LLM error - manual investigation required`);
        }
      }
      
      throw error;
    }
  }


  /**
   * Get user memory profile for ontology context
   */
  private async getUserMemoryProfile(userId: string): Promise<string> {
    try {
      // Get recent memory units to build a simple profile
      const recentMemories = await this.memoryRepository.findRecentByUserId(userId, 20);
      
      if (!recentMemories || recentMemories.length === 0) {
        return 'No recent memory data available';
      }
      
      // Build a simple memory profile from recent memories
      const memoryTypes = recentMemories.map(m => m.type).filter((type, index, arr) => arr.indexOf(type) === index);
      const memoryCount = recentMemories.length;
      
      return `User has ${memoryCount} recent memories across ${memoryTypes.length} types: ${memoryTypes.join(', ')}`;
    } catch (error) {
      console.error(`[InsightWorkflowOrchestrator] Error getting memory profile for user ${userId}:`, error);
      return 'Memory profile unavailable';
    }
  }

  /**
   * Stage 3: Strategic Insights (Sequential) - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async executeStrategicStage(userId: string, foundationResults: any, foundationPrompt: string, cycleDates: CycleDates, cycleId: string): Promise<any> {
    try {
      // Execute strategic stage as TRUE FOLLOW-UP to Foundation Stage
      // No need to gather context again - reuse Foundation prompt which already contains user context
      const strategicResult = await this.strategicStageTool.execute({
        // Core identification (minimal - user context is already in foundationPrompt)
        userId,
        cycleId: cycleId,
        cycleStartDate: cycleDates.cycleStartDate.toISOString(),
        cycleEndDate: cycleDates.cycleEndDate.toISOString(),
        
        // Foundation prompt from Stage 1 (contains ALL user context - this is the key!)
        foundationPrompt: foundationPrompt,
        
        // Foundation results from Stage 1 (LLM's response)
        foundationResults: foundationResults.foundation_results
      });
      
      // ENHANCED: Validate LLM response quality - PORTED FROM ORIGINAL INSIGHTENGINE
      if (strategicResult) {
        const outputString = JSON.stringify(strategicResult);
        this.validateLLMResponse(outputString, 'StrategicStageTool');
      }
      
      return strategicResult;
    } catch (error) {
      console.error(`[InsightWorkflowOrchestrator] 🔴 STRATEGIC STAGE FAILED - LLM ERROR:`);
      console.error(`[InsightWorkflowOrchestrator] Error type: ${error instanceof Error ? error.name : 'Unknown'}`);
      console.error(`[InsightWorkflowOrchestrator] Error message: ${error instanceof Error ? error.message : String(error)}`);
      
      // Check if this is a retryable LLM error that should have been handled by LLMRetryHandler
      if (error instanceof Error) {
        if (error.message.includes('503') || error.message.includes('server overload')) {
          console.error(`[InsightWorkflowOrchestrator] LLM service overload - this should have been retried by LLMRetryHandler`);
        } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
          console.error(`[InsightWorkflowOrchestrator] LLM rate limit - this should have been retried by LLMRetryHandler`);
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          console.error(`[InsightWorkflowOrchestrator] LLM network error - this should have been retried by LLMRetryHandler`);
        } else {
          console.error(`[InsightWorkflowOrchestrator] Non-retryable LLM error - manual investigation required`);
        }
      }
      
      throw error;
    }
  }



  /**
   * Gather comprehensive context for stages - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async gatherComprehensiveContext(userId: string, jobId: string, cycleDates: CycleDates, cycleId: string): Promise<{ strategicInput: any }> {
    // Get user information
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    console.log(`[InsightWorkflowOrchestrator] Compiling data for cycle from ${cycleDates.cycleStartDate} to ${cycleDates.cycleEndDate}`);

    // Get conversation summaries directly from database (pre-filtered by importance)
    const conversationSummaries = await this.dbService.prisma.conversations.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: cycleDates.cycleStartDate,
          lte: cycleDates.cycleEndDate
        },
        importance_score: { gte: 5 } // Pre-filter for high importance conversations
      },
      select: {
        content: true
      },
      orderBy: { importance_score: 'desc' }
    });

    // Build knowledge graph data for key phrase generation
    const knowledgeGraph = {
      conversations: conversationSummaries
        .filter((conv: { content: string | null }) => conv.content)
        .map((conv: { content: string | null }) => ({
          content: conv.content || 'No content available'
        })),
      memoryUnits: await this.getUserMemoryUnits(userId, cycleDates),
      concepts: await this.getUserConcepts(userId, cycleDates),
      recentGrowthEvents: await (async () => {
        const growthEvents = await this.dbService.prisma.growth_events.findMany({
          where: {
            user_id: userId,
            created_at: {
              gte: cycleDates.cycleStartDate,
              lte: cycleDates.cycleEndDate
            }
          },
          orderBy: { created_at: 'desc' },
          take: 20
        });
        return growthEvents.map((event: any) => ({
          id: event.entity_id,
          content: event.content
        }));
      })()
    };

    // Get previous cycle key phrases for continuity
    const previousKeyPhrasesRaw = await this.getPreviousKeyPhrases(userId);
    
    // Transform previous key phrases to match Strategic Stage schema
    const previousKeyPhrases = Object.entries(previousKeyPhrasesRaw).map(([category, phrases]) => ({
      category,
      phrases: Array.isArray(phrases) ? phrases : []
    }));

    // Use HRT to retrieve strategic context based on previous key phrases
    const hrtContext = await this.retrieveStrategicContextWithPreviousKeyPhrases(userId, previousKeyPhrasesRaw);

    // Build StrategicSynthesisInput with simplified data structures
    const strategicInput = {
      // Core identification
      userId,
      userName: user.name || 'User',
      userMemoryProfile: user.memory_profile || undefined,
      cycleId: cycleId,
      cycleStartDate: cycleDates.cycleStartDate,
      cycleEndDate: cycleDates.cycleEndDate,
      
      // Current cycle data
      currentKnowledgeGraph: {
        conversations: knowledgeGraph.conversations,
        memoryUnits: knowledgeGraph.memoryUnits,
        concepts: knowledgeGraph.concepts,
        conceptsNeedingSynthesis: await this.getConceptsNeedingSynthesis(userId, cycleDates.cycleStartDate)
      },
      
      // Growth events (recent cycle activity)
      recentGrowthEvents: knowledgeGraph.recentGrowthEvents,
      
      // HRT-retrieved strategic context (historical data)
      strategicContext: hrtContext,
      
      // Previous cycle continuity
      previousKeyPhrases: previousKeyPhrases,
      
      // System metadata
      workerType: 'insight-worker',
      workerJobId: jobId
    };

    return { strategicInput };
  }

  /**
   * Build analysis context string for FoundationStageTool
   */
  private buildAnalysisContextString(strategicInput: any): string {
    const user_name = strategicInput.userName || 'User';
    
    return `**ANALYSIS CONTEXT:**
User: ${user_name}
Cycle ID: ${strategicInput.cycleId}
Analysis Timestamp: ${new Date().toISOString()}
Cycle Period: ${strategicInput.cycleStartDate} to ${strategicInput.cycleEndDate}

**USER MEMORY PROFILE:**
${strategicInput.userMemoryProfile || 'No memory profile available'}`;
  }

  /**
   * Build knowledge graph string for FoundationStageTool
   */
  private buildKnowledgeGraphString(strategicInput: any): string {
    const sections = [];
    
    // Memory units
    if (strategicInput.currentKnowledgeGraph.memoryUnits.length > 0) {
      sections.push(`**USER MEMORY UNITS:**
${strategicInput.currentKnowledgeGraph.memoryUnits.map((mem: any) => `- ${mem.id}: ${mem.content}`).join('\n')}`);
    }
    
    // Concepts
    if (strategicInput.currentKnowledgeGraph.concepts.length > 0) {
      sections.push(`**USER CONCEPTS:**
${strategicInput.currentKnowledgeGraph.concepts.map((concept: any) => `- ${concept.title}: ${concept.content}`).join('\n')}`);
    }
    
    // Growth events
    if (strategicInput.recentGrowthEvents.length > 0) {
      sections.push(`**RECENT GROWTH EVENTS:**
${strategicInput.recentGrowthEvents.map((event: any) => `- ${event.id}: ${event.content}`).join('\n')}`);
    }
    
    // Strategic context
    if (strategicInput.strategicContext?.retrievalSummary) {
      sections.push(`**STRATEGIC CONTEXT (HRT RETRIEVED):**
${strategicInput.strategicContext.retrievalSummary}`);
    }
    
    return sections.join('\n\n');
  }

  /**
   * Build conversations string for FoundationStageTool
   */
  private buildConversationsString(strategicInput: any): string {
    if (strategicInput.currentKnowledgeGraph.conversations.length > 0) {
      return `**RELEVANT CONTEXT FROM USER'S PAST:**
${strategicInput.currentKnowledgeGraph.conversations.map((conv: any) => conv.content || 'No content available').join('\n\n')}`;
    } else {
      return `**RELEVANT CONTEXT FROM USER'S PAST:**
No memories provided.`;
    }
  }

  /**
   * Get user memory units for the cycle period - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async getUserMemoryUnits(userId: string, cycleDates: CycleDates): Promise<any[]> {
    const memoryUnits = await this.dbService.prisma.memory_units.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: cycleDates.cycleStartDate,
          lte: cycleDates.cycleEndDate
        }
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    
    return memoryUnits.map((unit: any) => ({
      id: unit.entity_id,
      title: unit.title,
      content: unit.content
    }));
  }

  /**
   * Get user concepts for the cycle period - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async getUserConcepts(userId: string, cycleDates: CycleDates): Promise<any[]> {
    const concepts = await this.dbService.prisma.concepts.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: cycleDates.cycleStartDate,
          lte: cycleDates.cycleEndDate
        }
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    
    return concepts.map((concept: any) => ({
      id: concept.entity_id,
      title: concept.title,
      content: concept.content
    }));
  }

  /**
   * Get previous cycle key phrases for continuity - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async getPreviousKeyPhrases(userId: string): Promise<any> {
    const user = await this.dbService.prisma.users.findUnique({
      where: { user_id: userId },
      select: { key_phrases: true }
    });
    
    return user?.key_phrases || {
      values_and_goals: [],
      emotional_drivers: [],
      important_relationships: [],
      growth_patterns: [],
      knowledge_domains: [],
      life_context: [],
      hidden_connections: []
    };
  }

  /**
   * Retrieve strategic context with previous key phrases - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async retrieveStrategicContextWithPreviousKeyPhrases(userId: string, previousKeyPhrases: any): Promise<any> {
    try {
      // Flatten key phrases for HRT
      const flatKeyPhrases = [
        ...(previousKeyPhrases.values_and_goals || []),
        ...(previousKeyPhrases.emotional_drivers || []),
        ...(previousKeyPhrases.important_relationships || []),
        ...(previousKeyPhrases.growth_patterns || []),
        ...(previousKeyPhrases.knowledge_domains || []),
        ...(previousKeyPhrases.life_context || []),
        ...(previousKeyPhrases.hidden_connections || [])
      ].filter(phrase => phrase && phrase.trim().length > 0);

      if (flatKeyPhrases.length === 0) {
        console.log(`[InsightWorkflowOrchestrator] No previous key phrases found for user ${userId}`);
        return { 
          retrievedMemoryUnits: [],
          retrievedConcepts: [],
          retrievedArtifacts: [],
          retrievalSummary: 'No previous key phrases found'
        };
      }

      const hrtResult = await this.hybridRetrievalTool.execute({
        userId,
        keyPhrasesForRetrieval: flatKeyPhrases,
        retrievalScenario: 'neighborhood',
        maxResults: 20
      });

      // Ensure HRT result has the expected structure for Strategic Stage
      const structuredHrtResult = {
        retrievedMemoryUnits: (hrtResult.retrievedMemoryUnits || []).map((unit: any) => ({
          id: unit.id || unit.entity_id || '',
          title: unit.title || '',
          content: unit.content || '',
          finalScore: unit.finalScore || unit.score || 0
        })),
        retrievedConcepts: (hrtResult.retrievedConcepts || []).map((concept: any) => ({
          id: concept.id || concept.entity_id || '',
          title: concept.title || '',
          content: concept.content || '',
          finalScore: concept.finalScore || concept.score || 0
        })),
        retrievedArtifacts: (hrtResult.retrievedArtifacts || []).map((artifact: any) => ({
          id: artifact.id || artifact.entity_id || '',
          title: artifact.title || '',
          content: artifact.content || '',
          type: artifact.type || '',
          finalScore: artifact.finalScore || artifact.score || 0
        })),
        retrievalSummary: hrtResult.retrievalSummary || 'No summary available'
      };
      
      return structuredHrtResult;
    } catch (error) {
      console.warn(`[InsightWorkflowOrchestrator] HRT retrieval failed for user ${userId}:`, error);
      return { 
        retrievedMemoryUnits: [],
        retrievedConcepts: [],
        retrievedArtifacts: [],
        retrievalSummary: 'HRT retrieval failed'
      };
    }
  }

  /**
   * Get concepts needing synthesis - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async getConceptsNeedingSynthesis(userId: string, cycleStartDate: Date): Promise<any[]> {
    const conceptsNeedingSynthesis = await this.dbService.prisma.concepts.findMany({
      where: {
        user_id: userId,
        created_at: {
          lt: cycleStartDate
        },
        content: {
          contains: 'timestamp' // Simple heuristic for concepts needing synthesis
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });
    
    return conceptsNeedingSynthesis.map((concept: any) => ({
      id: concept.entity_id,
      title: concept.title,
      content: concept.content
    }));
  }

  /**
   * Persist stage results
   */
  private async persistStageResults(cycleId: string, stage: string, results: any): Promise<void> {
    // Store stage results in database for recovery and monitoring
    console.log(`[InsightWorkflowOrchestrator] Persisting ${stage} stage results for cycle ${cycleId}`);
    
    // Get userId from cycleId (we need to look up the cycle to get the user)
    const cycle = await this.userCycleRepository.findById(cycleId);
    if (!cycle) {
      throw new Error(`Cycle ${cycleId} not found`);
    }
    const userId = cycle.user_id;

    switch (stage) {
      case 'foundation':
        await this.persistFoundationResults(userId, results, cycleId);
        break;
      case 'strategic':
        await this.persistStrategicResults(userId, results, cycleId);
        break;
      case 'integration':
        // Integration results are handled by the final integration step
        console.log(`[InsightWorkflowOrchestrator] Integration results handled by final integration step`);
        break;
      default:
        console.warn(`[InsightWorkflowOrchestrator] Unknown stage: ${stage}`);
    }
  }

  /**
   * Persist foundation stage results - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async persistFoundationResults(userId: string, foundationResults: any, cycleId: string): Promise<void> {
    console.log(`[InsightWorkflowOrchestrator] Persisting foundation results for user ${userId}`);
    
    try {
      // Persist memory profile to users table
      if (foundationResults.foundation_results.memory_profile) {
        await this.userRepository.update(userId, {
          memory_profile: foundationResults.foundation_results.memory_profile.content
        });
        console.log(`[InsightWorkflowOrchestrator] ✅ Updated memory profile for user ${userId}`);
      }

      // Persist memory profile as derived artifact
      if (foundationResults.foundation_results.memory_profile) {
        const memoryProfileData = {
          entity_id: randomUUID(),
          user_id: userId,
          title: "The way I see you",
          content: foundationResults.foundation_results.memory_profile.content,
          type: 'memory_profile',
          status: 'active',
          cycle_id: cycleId,
          source_concept_ids: foundationResults.foundation_results.memory_profile.source_concept_ids || [],
          source_memory_unit_ids: foundationResults.foundation_results.memory_profile.source_memory_unit_ids || [],
          metadata: {},
          created_at: new Date(),
          updated_at: undefined
        } as StandardizedEntity;

        await this.unifiedPersistenceService.persistBatch([{
          type: 'DerivedArtifact' as EntityType,
          data: memoryProfileData
        }]);
        console.log(`[InsightWorkflowOrchestrator] ✅ Created memory profile artifact: ${memoryProfileData.entity_id}`);
      }

      // Persist opening artifact
      if (foundationResults.foundation_results.opening) {
        const openingData = {
          entity_id: randomUUID(),
          user_id: userId,
          title: foundationResults.foundation_results.opening.title,
          content: foundationResults.foundation_results.opening.content,
          type: 'opening',
          status: 'active',
          cycle_id: cycleId,
          source_concept_ids: foundationResults.foundation_results.opening.source_concept_ids || [],
          source_memory_unit_ids: foundationResults.foundation_results.opening.source_memory_unit_ids || [],
          metadata: {},
          created_at: new Date(),
          updated_at: undefined
        } as StandardizedEntity;

        await this.unifiedPersistenceService.persistBatch([{
          type: 'DerivedArtifact' as EntityType,
          data: openingData
        }]);
        console.log(`[InsightWorkflowOrchestrator] ✅ Created opening artifact: ${openingData.entity_id}`);
      }

      // Persist key phrases
      if (foundationResults.foundation_results.key_phrases) {
        await this.saveKeyPhrasesFromLLMOutput(userId, foundationResults.foundation_results.key_phrases);
        console.log(`[InsightWorkflowOrchestrator] ✅ Saved key phrases for user ${userId}`);
      }

    } catch (error) {
      console.error(`[InsightWorkflowOrchestrator] Error persisting foundation results for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Persist strategic stage results - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async persistStrategicResults(userId: string, strategicResults: any, cycleId: string): Promise<void> {
    console.log(`[InsightWorkflowOrchestrator] Persisting strategic results for user ${userId}`);

    try {
      // Create Derived Artifacts using V11.0 Unified Persistence
      if (strategicResults.derived_artifacts && strategicResults.derived_artifacts.length > 0) {
        const artifactEntities = strategicResults.derived_artifacts.map((artifact: any) => ({
          type: 'DerivedArtifact' as EntityType,
          data: {
            entity_id: randomUUID(),
            user_id: userId,
            title: artifact.title || `${artifact.type} Artifact`,
            content: artifact.content,
            type: artifact.type,
            status: 'active',
            cycle_id: cycleId,
            source_concept_ids: artifact.source_concept_ids || [],
            source_memory_unit_ids: artifact.source_memory_unit_ids || [],
            metadata: {
              confidence_score: artifact.confidence_score,
              supporting_evidence: artifact.supporting_evidence,
              actionability: artifact.actionability
            },
            created_at: new Date(),
            updated_at: undefined
          } as StandardizedEntity
        }));

        const batchResult = await this.unifiedPersistenceService.persistBatch(artifactEntities);
        
        for (let i = 0; i < batchResult.results.length; i++) {
          const result = batchResult.results[i];
          const entity = artifactEntities[i];
          
          if (result.success && result.postgresResult) {
            console.log(`[InsightWorkflowOrchestrator] ✅ Created derived artifact: ${result.postgresResult.entity_id}`);
          } else {
            console.error(`[InsightWorkflowOrchestrator] ❌ Failed to create derived artifact:`, result.errors);
          }
        }
      }

      // Create Proactive Prompts using V11.0 Unified Persistence
      if (strategicResults.proactive_prompts && strategicResults.proactive_prompts.length > 0) {
        const promptEntities = strategicResults.proactive_prompts.map((prompt: any) => ({
          type: 'ProactivePrompt' as EntityType,
          data: {
            entity_id: randomUUID(),
            user_id: userId,
            title: prompt.title || `${prompt.type} Prompt`,
            content: prompt.content,
            type: prompt.type,
            status: 'pending',
            cycle_id: cycleId,
            metadata: {
              context_explanation: prompt.context_explanation,
              timing_suggestion: prompt.timing_suggestion,
              priority_level: prompt.priority_level
            },
            created_at: new Date(),
            updated_at: undefined
          } as StandardizedEntity
        }));

        const batchResult = await this.unifiedPersistenceService.persistBatch(promptEntities);
        
        for (let i = 0; i < batchResult.results.length; i++) {
          const result = batchResult.results[i];
          const entity = promptEntities[i];
          
          if (result.success && result.postgresResult) {
            console.log(`[InsightWorkflowOrchestrator] ✅ Created proactive prompt: ${result.postgresResult.entity_id} - ${entity.data.title}`);
          } else {
            console.error(`[InsightWorkflowOrchestrator] ❌ Failed to create proactive prompt:`, result.errors);
          }
        }
      }

      // Create strategic growth events using V11.0 Unified Persistence
      if (strategicResults.growth_events && strategicResults.growth_events.length > 0) {
        const growthEventEntities = strategicResults.growth_events.map((growthEvent: any) => ({
          type: 'GrowthEvent' as EntityType,
          data: {
            entity_id: randomUUID(),
            user_id: userId,
            title: growthEvent.title || `${growthEvent.type} Growth Event`,
            content: growthEvent.content,
            type: growthEvent.type,
            status: 'active',
            source: 'InsightWorker',
            delta_value: growthEvent.delta_value,
            source_concept_ids: growthEvent.supporting_concept_ids || [],
            source_memory_unit_ids: growthEvent.supporting_memory_unit_ids || [],
            metadata: {
              confidence_score: growthEvent.confidence_score,
              actionability: growthEvent.actionability,
              cycle_id: cycleId
            },
            created_at: new Date(),
            updated_at: undefined
          } as StandardizedEntity
        }));

        const batchResult = await this.unifiedPersistenceService.persistBatch(growthEventEntities);
        
        for (let i = 0; i < batchResult.results.length; i++) {
          const result = batchResult.results[i];
          const entity = growthEventEntities[i];
          
          if (result.success && result.postgresResult) {
            console.log(`[InsightWorkflowOrchestrator] ✅ Created growth event: ${result.postgresResult.entity_id}`);
          } else {
            console.error(`[InsightWorkflowOrchestrator] ❌ Failed to create growth event:`, result.errors);
          }
        }
      }

    } catch (error) {
      console.error(`[InsightWorkflowOrchestrator] Error persisting strategic results for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Save key phrases from LLM output - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private async saveKeyPhrasesFromLLMOutput(userId: string, keyPhrases: any): Promise<void> {
    try {
      // Update user's key_phrases field with the new key phrases
      await this.dbService.prisma.users.update({
        where: { user_id: userId },
        data: {
          key_phrases: keyPhrases
        }
      });
      console.log(`[InsightWorkflowOrchestrator] Updated key phrases for user ${userId}`);
    } catch (error) {
      console.error(`[InsightWorkflowOrchestrator] Error saving key phrases for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Validate LLM response quality - PORTED FROM ORIGINAL INSIGHTENGINE
   */
  private validateLLMResponse(response: string, toolName: string): void {
    const responseLength = response.length;
    const minRecommendedLength = 100;
    const maxRecommendedLength = 50000;
    
    if (responseLength < minRecommendedLength) {
      console.warn(`[InsightWorkflowOrchestrator] ⚠️ WARNING: LLM response from ${toolName} is very short: ${responseLength} chars (likely truncated)`);
      
      // Log response preview for debugging
      const preview = response.substring(0, Math.min(200, responseLength));
      console.warn(`[InsightWorkflowOrchestrator] Response preview: ${preview}`);
      
      throw new Error(`LLM response from ${toolName} too short (${responseLength} chars), likely truncated. Check token limits and model configuration.`);
    }
    
    if (responseLength > maxRecommendedLength) {
      console.warn(`[InsightWorkflowOrchestrator] ⚠️ WARNING: LLM response from ${toolName} is very long: ${responseLength} chars (may indicate verbose output)`);
    }
    
    // Check for common truncation indicators
    const truncationIndicators = [
      '...', '…', 'truncated', 'cut off', 'incomplete', 'partial'
    ];
    
    const hasTruncationIndicator = truncationIndicators.some(indicator => 
      response.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasTruncationIndicator) {
      console.warn(`[InsightWorkflowOrchestrator] ⚠️ WARNING: LLM response from ${toolName} contains truncation indicators`);
    }
    
    console.log(`[InsightWorkflowOrchestrator] ✅ LLM response validation passed for ${toolName}: ${responseLength} chars`);
  }

  /**
   * Schedule ontology retry
   */
  private async scheduleOntologyRetry(userId: string, cycleId: string): Promise<void> {
    console.log(`[InsightWorkflowOrchestrator] Scheduling ontology retry for user ${userId}, cycle ${cycleId}`);
    // Implementation would schedule a retry job
  }



  /**
   * Calculate cycle dates
   */
  private calculateCycleDates(): CycleDates {
    const now = new Date();
    const cycleStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const cycleEndDate = now;
    
    return { cycleStartDate, cycleEndDate };
  }

  /**
   * Get stage status from results
   */
  private getStageStatus(results: Partial<StageResults>): CycleResult['stages'] {
    return {
      foundation: results.foundation ? 'success' : 'failed',
      strategic: results.strategic ? 'success' : 'failed'
    };
  }
}
