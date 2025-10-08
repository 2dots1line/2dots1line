/**
 * OntologyStageTool.ts
 * V11.1 - Dedicated tool for ontology optimization stage
 * 
 * Migrated from InsightEngine with battle-tested ontology optimization methods:
 * - Concept Merging
 * - Concept Archiving  
 * - Strategic Relationships
 * - Community Structures
 * - Concept Description Synthesis
 * 
 * Architecture: Composite tool using injected atomic tools for ontology analysis.
 */

import { z } from 'zod';
import { ConfigService } from '@2dots1line/config-service';
import type { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import { LLMChatTool, type LLMChatInput } from '../ai/LLMChatTool';
import { LLMRetryHandler, PromptCacheService, RelationshipUtils, MultiStagePromptCacheManager } from '@2dots1line/core-utils';
import { ConceptMerger, ConceptArchiver, CommunityCreator } from '@2dots1line/ontology-core';
import { ConceptRepository, WeaviateService } from '@2dots1line/database';

// Input validation schema - STANDALONE ontology optimization
export const OntologyStageInputSchema = z.object({
  // Core identification
  userId: z.string(),
  userName: z.string(),
  userMemoryProfile: z.string().optional(),
  workerJobId: z.string().optional(), // Unique identifier for this ontology optimization job
  
  // Date range for filtering entities (optional - defaults to last 7 days)
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  
  // Knowledge graph data - STRUCTURED
  currentKnowledgeGraph: z.object({
    conversations: z.array(z.object({
      content: z.string().optional()
    })),
    memoryUnits: z.array(z.object({
      id: z.string(),
      content: z.string()
    })),
    concepts: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string()
    })),
    conceptsNeedingSynthesis: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string()
    }))
  }),
  
  // Growth events (recent cycle activity)
  recentGrowthEvents: z.array(z.object({
    id: z.string(),
    content: z.string()
  })),
  
  // HRT-retrieved strategic context (historical data) - ADDED for rich context
  strategicContext: z.object({
    retrievedMemoryUnits: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      finalScore: z.number()
    })).optional(),
    retrievedConcepts: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      finalScore: z.number()
    })).optional(),
    retrievedArtifacts: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      type: z.string(),
      finalScore: z.number()
    })).optional(),
    retrievalSummary: z.string().optional()
  }).optional(),
  
  // Previous cycle continuity - ADDED for rich context
  previousKeyPhrases: z.array(z.object({
    category: z.string(),
    phrases: z.array(z.string())
  })).optional(),
  
  // System metadata
  workerType: z.string().optional()
});

// Output validation schema - matches InsightEngine ontology_optimizations structure
// V11.1 FIX: Relaxed character limits to accommodate comprehensive LLM responses
export const OntologyStageOutputSchema = z.object({
  ontology_optimizations: z.object({
    concepts_to_merge: z.array(z.object({
      primary_entity_id: z.string(),
      secondary_entity_ids: z.array(z.string()),
      merge_rationale: z.string().min(1), // Removed max limit to allow comprehensive rationales
      new_concept_title: z.string().min(1), // Removed max limit to allow descriptive titles
      new_concept_content: z.string().min(1) // Keep content detailed for concept synthesis
    })),
    concepts_to_archive: z.array(z.object({
      entity_id: z.string(),
      archive_rationale: z.string().min(1), // Removed max limit to allow detailed rationales
      replacement_entity_id: z.string().nullable()
    })),
    new_strategic_relationships: z.array(z.object({
      // Support both naming conventions that LLM might use
      source_entity_id_or_name: z.string().optional(),
      target_entity_id_or_name: z.string().optional(),
      source_id: z.string().optional(),
      target_id: z.string().optional(),
      relationship_type: z.enum([
        'IS_A_TYPE_OF', 'IS_PART_OF', 'IS_INSTANCE_OF',
        'CAUSES', 'INFLUENCES', 'ENABLES', 'PREVENTS', 'CONTRIBUTES_TO',
        'PRECEDES', 'FOLLOWS', 'CO_OCCURS_WITH',
        'IS_SIMILAR_TO', 'IS_OPPOSITE_OF', 'IS_ANALOGOUS_TO',
        'INSPIRES', 'SUPPORTS_VALUE', 'EXEMPLIFIES_TRAIT', 'IS_MILESTONE_FOR',
        'IS_METAPHOR_FOR', 'REPRESENTS_SYMBOLICALLY', 'RELATED_TO',
        // Custom relationship types that LLM generates
        'STRATEGIC_ALIGNMENT', 'KNOWLEDGE_BRIDGE', 'GROWTH_CATALYST', 'SYNERGY_POTENTIAL'
      ]),
      relationship_description: z.string().optional(),
      strength: z.number().min(0.0).max(1.0).optional(),
      strategic_value: z.string().optional()
    }).refine((data) => {
      // Ensure at least one source-target pair is provided
      const hasSource1 = data.source_entity_id_or_name && data.target_entity_id_or_name;
      const hasSource2 = data.source_id && data.target_id;
      return hasSource1 || hasSource2;
    }, {
      message: "Either source_entity_id_or_name/target_entity_id_or_name OR source_id/target_id must be provided"
    })),
    community_structures: z.array(z.object({
      entity_id: z.string().optional(), // Prisma: entity_id (primary key)
      title: z.string().min(1), // Prisma: title (REQUIRED field)
      content: z.string().optional(), // Prisma: content (optional)
      type: z.string().optional(), // Prisma: type (optional)
      // Note: member_entity_ids is not stored in communities table
      // Relationships are handled via concepts.community_id foreign key
      member_entity_ids: z.array(z.string()).optional() // For LLM output compatibility
    })),
    concept_description_synthesis: z.array(z.object({
      entity_id: z.string(),
      synthesized_content: z.string()
    }))
  })
});

export type OntologyStageInput = z.infer<typeof OntologyStageInputSchema>;
export type OntologyStageOutput = z.infer<typeof OntologyStageOutputSchema>;

// Individual component validators for partial processing
export const ConceptMergeSchema = z.object({
  primary_entity_id: z.string(),
  secondary_entity_ids: z.array(z.string()),
  merge_rationale: z.string().min(1),
  new_concept_title: z.string().min(1),
  new_concept_content: z.string().min(1)
});

export const ConceptArchiveSchema = z.object({
  entity_id: z.string(),
  archive_rationale: z.string().min(1),
  replacement_entity_id: z.string().nullable()
});

export const StrategicRelationshipSchema = z.object({
  source_entity_id_or_name: z.string().optional(),
  target_entity_id_or_name: z.string().optional(),
  source_id: z.string().optional(),
  target_id: z.string().optional(),
  relationship_type: z.enum([
    'IS_A_TYPE_OF', 'IS_PART_OF', 'IS_INSTANCE_OF',
    'CAUSES', 'INFLUENCES', 'ENABLES', 'PREVENTS', 'CONTRIBUTES_TO',
    'PRECEDES', 'FOLLOWS', 'CO_OCCURS_WITH',
    'IS_SIMILAR_TO', 'IS_OPPOSITE_OF', 'IS_ANALOGOUS_TO',
    'INSPIRES', 'SUPPORTS_VALUE', 'EXEMPLIFIES_TRAIT', 'IS_MILESTONE_FOR',
    'IS_METAPHOR_FOR', 'REPRESENTS_SYMBOLICALLY', 'RELATED_TO',
    'STRATEGIC_ALIGNMENT', 'KNOWLEDGE_BRIDGE', 'GROWTH_CATALYST', 'SYNERGY_POTENTIAL'
  ]),
  relationship_description: z.string().optional(),
  strength: z.number().min(0.0).max(1.0).optional(),
  strategic_value: z.string().optional()
}).refine((data) => {
  const hasSource1 = data.source_entity_id_or_name && data.target_entity_id_or_name;
  const hasSource2 = data.source_id && data.target_id;
  return hasSource1 || hasSource2;
}, {
  message: "Either source_entity_id_or_name/target_entity_id_or_name OR source_id/target_id must be provided"
});

export const CommunityStructureSchema = z.object({
  entity_id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().optional(),
  type: z.string().optional(),
  member_entity_ids: z.array(z.string()).optional(),
  // Legacy fields for backward compatibility
  community_id: z.string().optional(),
  theme: z.string().optional(),
  community_name: z.string().optional(),
  community_description: z.string().optional(),
  community_type: z.string().optional(),
  strategic_importance: z.number().min(1).max(10).optional(),
  strategic_value: z.string().optional()
});

export const ConceptSynthesisSchema = z.object({
  entity_id: z.string(),
  synthesized_content: z.string()
});

// Component processing result types
export interface ComponentProcessingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  componentType: string;
  componentIndex: number;
}

export interface PartialProcessingResult {
  totalComponents: number;
  successfulComponents: number;
  failedComponents: number;
  results: ComponentProcessingResult<any>[];
  summary: string;
}

// Custom error classes
export class OntologyStageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OntologyStageValidationError';
  }
}

export class OntologyStageTool {
  // Shared ontology components - same as InsightEngine
  private conceptMerger: ConceptMerger;
  private conceptArchiver: ConceptArchiver;
  private communityCreator: CommunityCreator;
  private multiStageCacheManager?: MultiStagePromptCacheManager;
  
  // Repository instances - same as InsightEngine
  private conceptRepository: ConceptRepository;
  private weaviateService: WeaviateService;

  constructor(
    private configService: ConfigService,
    private dbService: any, // DatabaseService type
    private promptCacheService?: PromptCacheService // Optional for backward compatibility
  ) {
    // Initialize repositories - same as InsightEngine
    this.conceptRepository = new ConceptRepository(this.dbService);
    this.weaviateService = new WeaviateService(this.dbService);
    
    // Initialize shared ontology components - EXACT same pattern as InsightEngine
    this.conceptMerger = new ConceptMerger(
      this.conceptRepository,
      this.dbService,
      this.weaviateService
    );
    
    this.conceptArchiver = new ConceptArchiver(
      this.conceptRepository,
      this.weaviateService
    );
    
    this.communityCreator = new CommunityCreator(
      this.dbService.communityRepository,
      this.dbService
    );
    
    // Initialize multi-stage cache manager if cache service is available
    if (this.promptCacheService) {
      this.multiStageCacheManager = new MultiStagePromptCacheManager(this.promptCacheService, this.configService);
    }
  }

  async execute(input: OntologyStageInput): Promise<OntologyStageOutput> {
    console.log(`[OntologyStageTool] Starting ontology optimization for user ${input.userId}`);
    console.log(`[OntologyStageTool] Analyzing ${input.currentKnowledgeGraph.concepts.length} concepts`);
    console.log(`[OntologyStageTool] Analyzing ${input.currentKnowledgeGraph.memoryUnits.length} memory units`);
    
    try {
      // Force reinitialization of LLMChatTool to ensure it uses the latest model configuration
      LLMChatTool.forceReinitialize();
      
      // Build the ontology-focused prompt (instructions only)
      const systemPrompt = await this.buildOntologySystemPrompt(input);
      
      // Build the user message (data only)
      const userMessage = await this.buildOntologyUserMessage(input);
      
      // Check if user prompt is too large and apply sampling if needed
      const maxUserPromptTokens = await this.configService.getOperationalParameter('ontology_optimization.max_user_prompt_tokens', 20000);
      const maxTotalTokens = await this.configService.getOperationalParameter('ontology_optimization.max_total_tokens', 50000);
      const maxOutputTokens = await this.configService.getOperationalParameter('ontology_optimization.max_output_tokens', 30000);
      
      // Rough estimation: 1 token ≈ 4 characters for English text
      const estimatedUserPromptTokens = Math.ceil(userMessage.length / 4);
      
      console.log(`[OntologyStageTool] Prompt lengths - System: ${systemPrompt.length} chars, User: ${userMessage.length} chars (est. ${estimatedUserPromptTokens} tokens), Total: ${systemPrompt.length + userMessage.length} chars`);
      
      let finalUserMessage = userMessage;
      if (estimatedUserPromptTokens > maxUserPromptTokens) {
        console.log(`[OntologyStageTool] User prompt too large (${estimatedUserPromptTokens} tokens > ${maxUserPromptTokens} limit), applying sampling...`);
        finalUserMessage = await this.sampleUserPrompt(input, maxUserPromptTokens);
        console.log(`[OntologyStageTool] After sampling - User: ${finalUserMessage.length} chars (est. ${Math.ceil(finalUserMessage.length / 4)} tokens)`);
      }
      
      // Prepare LLM input
      const llmInput: LLMChatInput = {
        payload: {
          userId: input.userId,
          sessionId: `ontology-optimization-${input.workerJobId}`,
          workerType: input.workerType || 'ontology-optimization-worker',
          workerJobId: input.workerJobId,
          sourceEntityId: input.workerJobId,
          systemPrompt: systemPrompt, // Instructions only
          history: [], // No previous history for ontology analysis tasks
          userMessage: finalUserMessage, // Data only (potentially sampled)
          temperature: 0.4, // Lower temperature for consistent ontology decisions
          maxTokens: maxOutputTokens, // Set explicit token limit to prevent truncation
          modelOverride: 'gemini-2.5-flash-lite' // Use Lite model for speed (same as key phrase extraction)
        }
      };

      // Enhanced LLM call with retry logic - same pattern as InsightEngine
      const llmResult = await LLMRetryHandler.executeWithRetry(
        LLMChatTool,
        llmInput,
        { 
          maxAttempts: 3, 
          baseDelay: 1000,
          callType: 'ontology-optimization'
        }
      );
      
      // Check for premature truncation due to MAX_TOKENS finish reason
      if (llmResult.result.finish_reason === 'MAX_TOKENS') {
        console.warn(`[OntologyStageTool] ⚠️ WARNING: LLM response truncated with MAX_TOKENS finish reason`);
        console.warn(`[OntologyStageTool] Response length: ${llmResult.result.text.length} chars`);
        console.warn(`[OntologyStageTool] Output tokens used: ${llmResult.result.usage?.output_tokens || 'unknown'}`);
        console.warn(`[OntologyStageTool] Max tokens configured: ${maxOutputTokens}`);
        
        // Check if response is actually complete JSON
        const isCompleteJson = this.isCompleteJsonResponse(llmResult.result.text);
        if (!isCompleteJson) {
          console.error(`[OntologyStageTool] ❌ ERROR: Response is incomplete JSON due to premature truncation`);
          throw new Error(`LLM response was prematurely truncated with MAX_TOKENS finish reason. Response length: ${llmResult.result.text.length} chars, but JSON is incomplete.`);
        } else {
          console.log(`[OntologyStageTool] ✅ Response appears complete despite MAX_TOKENS finish reason`);
        }
      }
      
      console.log(`[OntologyStageTool] LLM response received, length: ${llmResult.result.text.length}`);
      
      // ENHANCED: Validate LLM response quality - PORTED FROM OTHER STAGE TOOLS
      if (llmResult.result.text) {
        this.validateLLMResponse(llmResult.result.text, 'OntologyStageTool');
      }
      
      // Parse and validate LLM output
      const parsedOutput = this.validateAndParseOutput(llmResult.result.text);
      
      console.log(`[OntologyStageTool] Ontology optimization completed successfully`);
      console.log(`[OntologyStageTool] Generated ${parsedOutput.ontology_optimizations.concepts_to_merge.length} concept merges`);
      console.log(`[OntologyStageTool] Generated ${parsedOutput.ontology_optimizations.concepts_to_archive.length} concept archives`);
      console.log(`[OntologyStageTool] Generated ${parsedOutput.ontology_optimizations.new_strategic_relationships.length} strategic relationships`);
      console.log(`[OntologyStageTool] Generated ${parsedOutput.ontology_optimizations.community_structures.length} community structures`);
      console.log(`[OntologyStageTool] Generated ${parsedOutput.ontology_optimizations.concept_description_synthesis.length} concept syntheses`);
      
      return parsedOutput;
      
    } catch (error: unknown) {
      console.error(`[OntologyStageTool] Ontology optimization failed for user ${input.userId}:`, error);
      
      if (error instanceof OntologyStageValidationError) {
        throw error;
      }
      
      // For other errors, provide a fallback response
      console.warn(`[OntologyStageTool] Returning empty ontology optimizations due to error`);
      return {
        ontology_optimizations: {
          concepts_to_merge: [],
          concepts_to_archive: [],
          new_strategic_relationships: [],
          community_structures: [],
          concept_description_synthesis: []
        }
      };
    }
  }

  /**
   * Build the ontology system prompt (instructions only)
   */
  private async buildOntologySystemPrompt(input: OntologyStageInput): Promise<string> {
    // Load prompt templates from config
    const templates = this.configService.getAllTemplates();
    const user_name = input.userName || 'User';
    
    // Get core identity and ontology instructions only
    const coreIdentityWithUserName = await this.getCachedSection('core_identity', input.userId, user_name, templates.insight_worker_core_identity);
    const ontologyConfigSection = await this.getCachedSection('ontology_stage', input.userId, user_name, templates.ontology_optimization_stage);
    
    // Return only the instructions, not the data
    return `${coreIdentityWithUserName}

${ontologyConfigSection}`;
  }

  /**
   * Build the ontology user message (data only)
   */
  private async buildOntologyUserMessage(input: OntologyStageInput): Promise<string> {
    // Consolidate entities
    const consolidatedEntities = this.consolidateEntities(input);
    
    // Define date range for filtering (configurable default, or use provided dates)
    const endDate = input.endDate ? new Date(input.endDate) : new Date();
    const defaultDays = await this.configService.getOperationalParameter('ontology_optimization.default_date_range_days', 7);
    const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000);
    
    console.log(`[OntologyStageTool] Using date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} (${defaultDays} days from config)`);
    
    // Apply unified date filtering to all entity types
    const filteredEntities = this.filterAllEntitiesByDateRange(consolidatedEntities, startDate, endDate, input);
    
    // Build ontology context data - focused only on ontology-relevant data
    const ontologyContextData = {
      analysis_context: {
        user_name: input.userName || 'User',
        job_id: input.workerJobId,
        analysis_timestamp: new Date().toISOString(),
        date_range: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        date_filter_applied: true,
        total_entities_before_filter: {
          concepts: consolidatedEntities.concepts.length,
          memory_units: consolidatedEntities.memoryUnits.length,
          growth_events: (input.recentGrowthEvents || []).length,
          key_phrases: (input.previousKeyPhrases || []).length
        }
      },
      user_memory_profile: {
        memory_profile: this.summarizeMemoryProfile(input.userMemoryProfile || 'No memory profile available')
      },
      consolidated_knowledge_graph: {
        concepts: filteredEntities.concepts,
        memory_units: filteredEntities.memoryUnits,
        concepts_needing_synthesis: filteredEntities.conceptsNeedingSynthesis,
        recent_growth_events: filteredEntities.recentGrowthEvents,
        previous_key_phrases: filteredEntities.previousKeyPhrases
      }
    };

    // Process ontology context template
    return this.buildOntologyContextSimple(ontologyContextData);
  }

  /**
   * Filter all entity types by date range based on created_at
   * Unified approach for all entity types with same table structure
   */
  private filterAllEntitiesByDateRange(entities: any, startDate: Date, endDate: Date, input: OntologyStageInput): any {
    const filterByDate = (item: any) => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    };

    return {
      concepts: entities.concepts.filter(filterByDate),
      memoryUnits: entities.memoryUnits.filter(filterByDate),
      conceptsNeedingSynthesis: (input.currentKnowledgeGraph.conceptsNeedingSynthesis || []).filter(filterByDate),
      recentGrowthEvents: (input.recentGrowthEvents || []).filter(filterByDate),
      previousKeyPhrases: (input.previousKeyPhrases || []).filter(filterByDate)
    };
  }

  /**
   * Summarize memory profile to reduce prompt size
   */
  private summarizeMemoryProfile(memoryProfile: string): string {
    if (!memoryProfile || memoryProfile === 'No memory profile available') {
      return 'No memory profile available';
    }

    // If memory profile is too long, truncate it to first 500 characters
    if (memoryProfile.length > 500) {
      return memoryProfile.substring(0, 500) + '... [truncated for ontology optimization]';
    }

    return memoryProfile;
  }

  /**
   * Sample user prompt to fit within token limits using entity ID hash-based sampling
   */
  private async sampleUserPrompt(input: OntologyStageInput, maxUserPromptTokens: number): Promise<string> {
    const maxUserPromptChars = maxUserPromptTokens * 4; // Rough estimation: 1 token ≈ 4 chars
    
    // Consolidate entities
    const consolidatedEntities = this.consolidateEntities(input);
    
    // Define date range for filtering
    const endDate = input.endDate ? new Date(input.endDate) : new Date();
    const defaultDays = await this.configService.getOperationalParameter('ontology_optimization.default_date_range_days', 7);
    const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000);
    
    // Sample entities using hash-based sampling for consistency
    const sampledEntities = this.sampleEntitiesByHash(consolidatedEntities, maxUserPromptChars, startDate, endDate);
    
    // Build ontology context data with sampled entities
    const ontologyContextData = {
      analysis_context: {
        user_name: input.userName || 'User',
        job_id: input.workerJobId,
        analysis_timestamp: new Date().toISOString(),
        date_range: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        date_filter_applied: true,
        sampling_applied: true,
        total_entities_before_sampling: {
          concepts: consolidatedEntities.concepts.length,
          memory_units: consolidatedEntities.memoryUnits.length,
          growth_events: (input.recentGrowthEvents || []).length,
          key_phrases: (input.previousKeyPhrases || []).length
        },
        sampled_entities: {
          concepts: sampledEntities.concepts.length,
          memory_units: sampledEntities.memoryUnits.length,
          growth_events: sampledEntities.recentGrowthEvents.length,
          key_phrases: sampledEntities.previousKeyPhrases.length
        }
      },
      user_memory_profile: {
        memory_profile: this.summarizeMemoryProfile(input.userMemoryProfile || 'No memory profile available')
      },
      consolidated_knowledge_graph: {
        concepts: sampledEntities.concepts,
        memory_units: sampledEntities.memoryUnits,
        concepts_needing_synthesis: sampledEntities.conceptsNeedingSynthesis,
        recent_growth_events: sampledEntities.recentGrowthEvents,
        previous_key_phrases: sampledEntities.previousKeyPhrases
      }
    };

    return this.buildOntologyContextSimple(ontologyContextData);
  }

  /**
   * Sample entities using hash-based sampling for consistent results
   */
  private sampleEntitiesByHash(entities: any, maxChars: number, startDate: Date, endDate: Date): any {
    const filterByDate = (item: any) => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    };

    // Filter by date first
    const filteredEntities = {
      concepts: entities.concepts.filter(filterByDate),
      memoryUnits: entities.memoryUnits.filter(filterByDate),
      conceptsNeedingSynthesis: (entities.conceptsNeedingSynthesis || []).filter(filterByDate),
      recentGrowthEvents: (entities.recentGrowthEvents || []).filter(filterByDate),
      previousKeyPhrases: (entities.previousKeyPhrases || []).filter(filterByDate)
    };

    // Simple hash function for consistent sampling
    const hash = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    };

    // Sample concepts (most important for ontology optimization)
    const sampledConcepts = this.sampleEntitiesByHashAndSize(
      filteredEntities.concepts, 
      maxChars * 0.6, // 60% of budget for concepts
      (item) => hash(item.id || item.entity_id || JSON.stringify(item))
    );

    // Sample memory units
    const sampledMemoryUnits = this.sampleEntitiesByHashAndSize(
      filteredEntities.memoryUnits,
      maxChars * 0.3, // 30% of budget for memory units
      (item) => hash(item.id || item.entity_id || JSON.stringify(item))
    );

    // Sample other entities with remaining budget
    const remainingChars = maxChars - this.estimateEntitySize(sampledConcepts) - this.estimateEntitySize(sampledMemoryUnits);
    const sampledOtherEntities = this.sampleEntitiesByHashAndSize(
      [...filteredEntities.conceptsNeedingSynthesis, ...filteredEntities.recentGrowthEvents, ...filteredEntities.previousKeyPhrases],
      remainingChars,
      (item) => hash(item.id || item.entity_id || JSON.stringify(item))
    );

    return {
      concepts: sampledConcepts,
      memoryUnits: sampledMemoryUnits,
      conceptsNeedingSynthesis: sampledOtherEntities.filter(item => item.title), // concepts have title
      recentGrowthEvents: sampledOtherEntities.filter(item => item.type), // growth events have type
      previousKeyPhrases: sampledOtherEntities.filter(item => item.category) // key phrases have category
    };
  }

  /**
   * Sample entities by hash and size constraints
   */
  private sampleEntitiesByHashAndSize(entities: any[], maxChars: number, hashFn: (item: any) => number): any[] {
    if (entities.length === 0) return [];

    // Sort by hash for consistent sampling
    const sortedEntities = entities.sort((a, b) => hashFn(a) - hashFn(b));
    
    const sampled: any[] = [];
    let currentSize = 0;
    
    for (const entity of sortedEntities) {
      const entitySize = this.estimateEntitySize([entity]);
      if (currentSize + entitySize <= maxChars) {
        sampled.push(entity);
        currentSize += entitySize;
      } else {
        break; // Stop when we hit the size limit
      }
    }
    
    return sampled;
  }

  /**
   * Estimate the size of entities in characters
   */
  private estimateEntitySize(entities: any[]): number {
    return entities.reduce((total, entity) => {
      return total + JSON.stringify(entity).length;
    }, 0);
  }

  /**
   * Build the ontology optimization prompt with OPTIMIZED multi-stage caching
   */
  private async buildOntologyOptimizationPrompt(input: OntologyStageInput): Promise<string> {
    // For standalone ontology worker, use legacy caching to avoid multi-stage complexity
    // The ontology worker is independent and doesn't need foundation/strategic context
    return this.buildOntologyPromptLegacy(input);
  }

  /**
   * Build ontology prompt with optimized multi-stage caching
   */
  private async buildOntologyPromptOptimized(input: OntologyStageInput): Promise<string> {
    const user_name = input.userName || 'User';
    
    // Get all prompt sections with optimized caching
    const cacheResult = await this.multiStageCacheManager!.getMultiStagePrompts(
      input.userId,
      user_name,
      null,  // foundation context (not needed for ontology)
      null,  // strategic context (not needed for ontology)
      input  // ontology context
    );
    
    const masterPrompt = `${cacheResult.shared.coreIdentity}

${cacheResult.shared.operationalConfig}

${cacheResult.ontology.dynamicContext}

${cacheResult.ontology.stageTemplate}`;

    console.log(`[OntologyStageTool] Built ontology prompt with optimized caching (${masterPrompt.length} characters)`);
    console.log(`[OntologyStageTool] Cache metrics: ${JSON.stringify(cacheResult.cacheMetrics)}`);
    
    return masterPrompt;
  }

  /**
   * Build ontology prompt with legacy caching (fallback)
   */
  private async buildOntologyPromptLegacy(input: OntologyStageInput): Promise<string> {
    // Load prompt templates from config
    const templates = this.configService.getAllTemplates();
    
    // Build the master prompt following the same structure as InsightEngine
    const user_name = input.userName || 'User';
    
    // FIXED: Use correct cache keys
    const coreIdentityWithUserName = await this.getCachedSection('core_identity', input.userId, user_name, templates.insight_worker_core_identity);
    
    // FIXED: Use correct cache key for ontology stage
    const ontologyConfigSection = await this.getCachedSection('ontology_stage', input.userId, user_name, templates.ontology_optimization_stage);
    
    // Consolidate entities - same logic as InsightEngine
    const consolidatedEntities = this.consolidateEntities(input);
    
    console.log(`[OntologyStageTool] Building ontology prompt with ${input.currentKnowledgeGraph.conversations?.length || 0} conversations, ${consolidatedEntities.memoryUnits.length} memory units, ${consolidatedEntities.concepts.length} concepts`);
    
    // Build ontology context data - focused only on ontology-relevant data
    const ontologyContextData = {
      analysis_context: {
        user_name: user_name,
        job_id: input.workerJobId,
        analysis_timestamp: new Date().toISOString(),
        date_range: `${input.startDate || `last ${await this.configService.getOperationalParameter('ontology_optimization.default_date_range_days', 7)} days`} to ${input.endDate || 'now'}`
      },
      user_memory_profile: {
        memory_profile: input.userMemoryProfile || 'No memory profile available'
      },
      consolidated_knowledge_graph: {
        concepts: consolidatedEntities.concepts,
        memory_units: consolidatedEntities.memoryUnits,
        concepts_needing_synthesis: input.currentKnowledgeGraph.conceptsNeedingSynthesis || [],
        recent_growth_events: input.recentGrowthEvents || [], // ENHANCED: Use rich context
        previous_key_phrases: input.previousKeyPhrases || [] // ENHANCED: Use rich context
      }
    };

    // Process ontology context template - same pattern as InsightEngine
    const ontologyContextProcessed = this.buildOntologyContextSimple(ontologyContextData);

    // Build prompt - focused only on ontology optimization
    const masterPrompt = `${coreIdentityWithUserName}

${ontologyConfigSection}

${ontologyContextProcessed}`;

    console.log(`[OntologyStageTool] Built ontology prompt with legacy caching (${masterPrompt.length} characters)`);
    return masterPrompt;
  }

  /**
   * Get cached section or build and cache it
   * Same pattern as other tools with caching support
   */
  private async getCachedSection(
    sectionType: string, 
    userId: string, 
    userName: string, 
    template: string
  ): Promise<string> {
    // If no cache service, fall back to direct rendering
    if (!this.promptCacheService) {
      return template.replace(/\{\{user_name\}\}/g, userName);
    }

    // Try to get from cache
    const cached = await this.promptCacheService.getCachedSection(sectionType, userId);
    if (cached) {
      return cached.content;
    }

    // Build and cache
    const content = template.replace(/\{\{user_name\}\}/g, userName);
    await this.promptCacheService.setCachedSection(sectionType, userId, content);
    
    return content;
  }

  /**
   * Consolidate entities - EXACT same logic as InsightEngine
   */
  private consolidateEntities(input: OntologyStageInput): { concepts: any[], memoryUnits: any[] } {
    const concepts = input.currentKnowledgeGraph.concepts || [];
    const memoryUnits = input.currentKnowledgeGraph.memoryUnits || [];
    
    return { concepts, memoryUnits };
  }

  /**
   * Build ontology context - simplified version focused on ontology data
   */
  private buildOntologyContextSimple(data: any): string {
    const concepts = data.consolidated_knowledge_graph.concepts || [];
    const memoryUnits = data.consolidated_knowledge_graph.memory_units || [];
    const conceptsNeedingSynthesis = data.consolidated_knowledge_graph.concepts_needing_synthesis || [];
    const recentGrowthEvents = data.consolidated_knowledge_graph.recent_growth_events || [];
    const previousKeyPhrases = data.consolidated_knowledge_graph.previous_key_phrases || [];

    return `
<analysis_context>
User: ${data.analysis_context.user_name}
Job ID: ${data.analysis_context.job_id}
Date Range: ${data.analysis_context.date_range}
Timestamp: ${data.analysis_context.analysis_timestamp}
Date filter applied: ${data.analysis_context.date_filter_applied}
</analysis_context>

<user_memory_profile>
${data.user_memory_profile.memory_profile}
</user_memory_profile>

<knowledge_graph_summary>
Date filter applied: ${data.analysis_context.date_filter_applied}
Sampling applied: ${data.analysis_context.sampling_applied || false}
Period: ${data.analysis_context.date_range}

Before filtering:
- Total concepts: ${data.analysis_context.total_entities_before_filter?.concepts || data.analysis_context.total_entities_before_sampling?.concepts || 'N/A'}
- Total memory units: ${data.analysis_context.total_entities_before_filter?.memory_units || data.analysis_context.total_entities_before_sampling?.memory_units || 'N/A'}
- Total growth events: ${data.analysis_context.total_entities_before_filter?.growth_events || data.analysis_context.total_entities_before_sampling?.growth_events || 'N/A'}
- Total key phrases: ${data.analysis_context.total_entities_before_filter?.key_phrases || data.analysis_context.total_entities_before_sampling?.key_phrases || 'N/A'}

After processing:
- Final concepts: ${concepts.length}
- Final memory units: ${memoryUnits.length}
- Final concepts needing synthesis: ${conceptsNeedingSynthesis.length}
- Final growth events: ${recentGrowthEvents.length}
- Final key phrases: ${previousKeyPhrases.length}
</knowledge_graph_summary>

<concepts_for_analysis>
${JSON.stringify(concepts, null, 2)}
</concepts_for_analysis>

<memory_units_for_analysis>
${JSON.stringify(memoryUnits, null, 2)}
</memory_units_for_analysis>

<concepts_needing_synthesis>
${JSON.stringify(data.consolidated_knowledge_graph.concepts_needing_synthesis, null, 2)}
</concepts_needing_synthesis>
</consolidated_knowledge_graph>`;
  }

  /**
   * Validate LLM response quality - PORTED FROM OTHER STAGE TOOLS
   */
  private validateLLMResponse(response: string, toolName: string): void {
    const responseLength = response.length;
    const minRecommendedLength = 100;
    const maxRecommendedLength = 50000;
    
    if (responseLength < minRecommendedLength) {
      console.warn(`[OntologyStageTool] ⚠️ WARNING: LLM response from ${toolName} is very short: ${responseLength} chars (likely truncated)`);
      
      // Log response preview for debugging
      const preview = response.substring(0, Math.min(200, responseLength));
      console.warn(`[OntologyStageTool] Response preview: ${preview}`);
      
      throw new Error(`LLM response from ${toolName} too short (${responseLength} chars), likely truncated. Check token limits and model configuration.`);
    }
    
    if (responseLength > maxRecommendedLength) {
      console.warn(`[OntologyStageTool] ⚠️ WARNING: LLM response from ${toolName} is very long: ${responseLength} chars (may indicate verbose output)`);
    }
    
    // Check for common truncation indicators
    const truncationIndicators = [
      '...', '…', 'truncated', 'cut off', 'incomplete', 'partial'
    ];
    
    const hasTruncationIndicator = truncationIndicators.some(indicator => 
      response.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasTruncationIndicator) {
      console.warn(`[OntologyStageTool] ⚠️ WARNING: LLM response from ${toolName} contains truncation indicators`);
    }
    
    console.log(`[OntologyStageTool] ✅ LLM response validation passed for ${toolName}: ${responseLength} chars`);
  }

  /**
   * Parse and validate LLM output according to schema
   * Enhanced to handle truncated responses
   */
  private validateAndParseOutput(llmJsonResponse: string): OntologyStageOutput {
    try {
      // Clean the response - same pattern as InsightEngine
      let cleanedResponse = llmJsonResponse.trim();
      
      // Remove any markdown code blocks
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Check for truncation indicators
      const isTruncated = this.detectTruncation(cleanedResponse);
      if (isTruncated) {
        console.warn(`[OntologyStageTool] Detected truncated response, attempting to repair...`);
        cleanedResponse = this.repairTruncatedJson(cleanedResponse);
      }
      
      // Parse JSON
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate against schema
      const validated = OntologyStageOutputSchema.parse(parsed);
      
      return validated;
      
    } catch (error) {
      console.error(`[OntologyStageTool] Failed to parse LLM response:`, error);
      console.error(`[OntologyStageTool] Raw response:`, llmJsonResponse);
      
      // Try to extract partial results from truncated response
      try {
        const partialResult = this.extractPartialResults(llmJsonResponse);
        console.warn(`[OntologyStageTool] Returning partial results due to parsing error`);
        return partialResult;
      } catch (extractError) {
        throw new OntologyStageValidationError(`Invalid LLM response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Check if the response is complete JSON (not truncated)
   */
  private isCompleteJsonResponse(response: string): boolean {
    try {
      // Clean the response first
      let cleanedResponse = response.trim();
      
      // Remove any markdown code blocks
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to parse as JSON
      JSON.parse(cleanedResponse);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect if response was truncated
   */
  private detectTruncation(response: string): boolean {
    const truncationIndicators = [
      'strength', // Common field that gets cut off
      'strategic_value', // Another common field
      'community_name', // Community structures often get truncated
      'member_concept_ids' // Array fields often incomplete
    ];
    
    // Check if response ends abruptly (no closing braces)
    const openBraces = (response.match(/\{/g) || []).length;
    const closeBraces = (response.match(/\}/g) || []).length;
    const isUnbalanced = openBraces !== closeBraces;
    
    // Check if response ends with incomplete field
    const endsWithIncomplete = /[,\s]*"[^"]*":\s*[^,}\]]*$/.test(response.trim());
    
    return isUnbalanced || endsWithIncomplete;
  }

  /**
   * Attempt to repair truncated JSON
   */
  private repairTruncatedJson(response: string): string {
    let repaired = response.trim();
    
    // Remove trailing comma if present
    repaired = repaired.replace(/,\s*$/, '');
    
    // Close incomplete objects/arrays
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']';
    }
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}';
    }
    
    return repaired;
  }

  /**
   * Extract partial results from failed parsing
   */
  private extractPartialResults(response: string): OntologyStageOutput {
    console.warn(`[OntologyStageTool] Attempting to extract partial results from failed response`);
    
    // Return empty structure as fallback
    return {
      ontology_optimizations: {
        concepts_to_merge: [],
        concepts_to_archive: [],
        new_strategic_relationships: [],
        community_structures: [],
        concept_description_synthesis: []
      }
    };
  }

  /**
   * Execute concept merging - EXACT same method as InsightEngine
   */
  async executeConceptMerging(conceptsToMerge: any[]): Promise<string[]> {
    const mergedConceptIds: string[] = [];
    
    for (const merge of conceptsToMerge) {
      try {
        // Use the shared ConceptMerger component - same as InsightEngine
        await this.conceptMerger.executeConceptMerge(merge);
        
        // Update Neo4j if available - same logic as InsightEngine
        if (this.dbService.neo4j) {
          await this.conceptMerger.updateNeo4jMergedConcepts(merge);
        }
        
        mergedConceptIds.push(merge.primary_entity_id);
        console.log(`[OntologyStageTool] Successfully merged concept ${merge.primary_entity_id}`);
      } catch (error: unknown) {
        console.error(`[OntologyStageTool] Error merging concept ${merge.primary_entity_id}:`, error);
        // Continue with other merges - same error handling as InsightEngine
      }
    }
    
    return mergedConceptIds;
  }

  /**
   * Create strategic relationships - EXACT same method as InsightEngine
   */
  async createStrategicRelationships(relationships: any[], userId: string): Promise<void> {
    if (!this.dbService.neo4j) {
      console.warn('[OntologyStageTool] Neo4j client not available, skipping strategic relationship creation');
      return;
    }
    
    const session = this.dbService.neo4j.session();
    
    try {
      for (const rel of relationships) {
        // Generate complete relationship properties - same as InsightEngine
        const relationshipProps = RelationshipUtils.createRelationshipProps(
          'STRATEGIC_RELATIONSHIP',
          'insight',
          userId,
          { 
            strength: rel.strength ?? 0.7, // Use LLM-provided strength or default for strategic relationships
            description: rel.strategic_value || `Strategic relationship between ${rel.source_id} and ${rel.target_id}` 
          }
        );
        
        // Create relationship in Neo4j - same Cypher as InsightEngine
        const cypher = `
          MATCH (source), (target)
          WHERE (source.id = $sourceId OR source.title = $sourceId) 
            AND (target.id = $targetId OR target.title = $targetId)
          CREATE (source)-[r:${rel.relationship_type} $relationshipProps]->(target)
          RETURN r
        `;
        
        await session.run(cypher, {
          sourceId: rel.source_id || rel.source_entity_id_or_name,
          targetId: rel.target_id || rel.target_entity_id_or_name,
          relationshipProps
        });
        
        console.log(`[OntologyStageTool] Created strategic relationship: ${rel.source_id || rel.source_entity_id_or_name} -> ${rel.target_id || rel.target_entity_id_or_name}`);
      }
    } finally {
      await session.close();
    }
  }

  /**
   * Synthesize concept descriptions - EXACT same method as InsightEngine
   */
  async synthesizeConceptDescriptions(conceptsToSynthesize: Array<{ entity_id: string; synthesized_content: string }>): Promise<void> {
    const errors: string[] = [];
    
    for (const concept of conceptsToSynthesize) {
      try {
        // Validate LLM output before updating - same validation as InsightEngine
        if (!concept.entity_id || !concept.synthesized_content) {
          console.warn(`[OntologyStageTool] Skipping concept synthesis - missing entity_id or synthesized_content:`, concept);
          continue;
        }

        // Additional validation: ensure synthesized description is meaningful - same as InsightEngine
        if (concept.synthesized_content.trim().length < 3) {
          console.warn(`[OntologyStageTool] Skipping concept ${concept.entity_id} - synthesized description too short: "${concept.synthesized_content}"`);
          continue;
        }

        // Only update if we have valid data - same logic as InsightEngine
        await this.conceptRepository.update(concept.entity_id, {
          content: concept.synthesized_content
        });
        
        console.log(`[OntologyStageTool] Successfully synthesized description for concept ${concept.entity_id}`);
      } catch (error: unknown) {
        const errorMsg = `Failed to synthesize concept ${concept.entity_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[OntologyStageTool] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    if (errors.length > 0) {
      console.warn(`[OntologyStageTool] Concept synthesis completed with ${errors.length} errors:`, errors);
    }
  }

  /**
   * Execute concept archiving - uses shared ConceptArchiver component
   */
  async executeConceptArchiving(conceptsToArchive: any[]): Promise<void> {
    await this.conceptArchiver.executeConceptArchives(conceptsToArchive);
    console.log(`[OntologyStageTool] Archived ${conceptsToArchive.length} concepts`);
  }

  /**
   * Execute community creation - uses shared CommunityCreator component
   */
  async executeCommunityCreation(communityStructures: any[], userId: string): Promise<string[]> {
    // Normalize the community data to match the old schema expected by CommunityCreator
    const normalizedStructures = communityStructures.map(community => ({
      community_id: community.entity_id || community.community_id,
      member_entity_ids: community.member_entity_ids || [],
      theme: community.title || community.theme || community.community_name || 'Untitled Community',
      strategic_importance: community.strategic_importance || 5, // Default to 5 if not provided
      strategic_value: community.strategic_value || community.content || ''
    }));
    
    const communityIds = await this.communityCreator.executeCommunityCreations(normalizedStructures, userId);
    console.log(`[OntologyStageTool] Created ${communityStructures.length} communities`);
    return communityIds;
  }

  /**
   * Process LLM response with partial processing - handle each component separately
   * This ensures we make use of everything that's usable, even if some parts fail validation
   */
  async processWithPartialValidation(rawResponse: string, userId: string): Promise<PartialProcessingResult> {
    console.log(`[OntologyStageTool] Starting partial processing for user ${userId}`);
    
    const results: ComponentProcessingResult<any>[] = [];
    let totalComponents = 0;
    let successfulComponents = 0;
    let failedComponents = 0;

    try {
      // Parse the raw JSON response
      const parsedResponse = JSON.parse(rawResponse);
      const ontologyOptimizations = parsedResponse.ontology_optimizations;

      if (!ontologyOptimizations) {
        throw new Error('No ontology_optimizations found in LLM response');
      }

      // Process concepts_to_merge
      if (ontologyOptimizations.concepts_to_merge) {
        console.log(`[OntologyStageTool] Processing ${ontologyOptimizations.concepts_to_merge.length} concept merges`);
        for (let i = 0; i < ontologyOptimizations.concepts_to_merge.length; i++) {
          totalComponents++;
          const result = await this.processComponent(
            ontologyOptimizations.concepts_to_merge[i],
            ConceptMergeSchema,
            'concept_merge',
            i,
            async (data) => {
              // Execute the merge
              await this.conceptMerger.executeConceptMerge(data);
              return { merged: true, primaryEntityId: data.primary_entity_id };
            }
          );
          results.push(result);
          if (result.success) successfulComponents++; else failedComponents++;
        }
      }

      // Process concepts_to_archive
      if (ontologyOptimizations.concepts_to_archive) {
        console.log(`[OntologyStageTool] Processing ${ontologyOptimizations.concepts_to_archive.length} concept archives`);
        for (let i = 0; i < ontologyOptimizations.concepts_to_archive.length; i++) {
          totalComponents++;
          const result = await this.processComponent(
            ontologyOptimizations.concepts_to_archive[i],
            ConceptArchiveSchema,
            'concept_archive',
            i,
            async (data) => {
              // Execute the archive
              await this.conceptArchiver.executeConceptArchive(data);
              return { archived: true, entityId: data.entity_id };
            }
          );
          results.push(result);
          if (result.success) successfulComponents++; else failedComponents++;
        }
      }

      // Process new_strategic_relationships
      if (ontologyOptimizations.new_strategic_relationships) {
        console.log(`[OntologyStageTool] Processing ${ontologyOptimizations.new_strategic_relationships.length} strategic relationships`);
        for (let i = 0; i < ontologyOptimizations.new_strategic_relationships.length; i++) {
          totalComponents++;
          const result = await this.processComponent(
            ontologyOptimizations.new_strategic_relationships[i],
            StrategicRelationshipSchema,
            'strategic_relationship',
            i,
            async (data) => {
              // Execute the relationship creation
              await this.createStrategicRelationships([data], userId);
              return { relationshipCreated: true };
            }
          );
          results.push(result);
          if (result.success) successfulComponents++; else failedComponents++;
        }
      }

      // Process community_structures
      if (ontologyOptimizations.community_structures) {
        console.log(`[OntologyStageTool] Processing ${ontologyOptimizations.community_structures.length} community structures`);
        for (let i = 0; i < ontologyOptimizations.community_structures.length; i++) {
          totalComponents++;
          const result = await this.processComponent(
            ontologyOptimizations.community_structures[i],
            CommunityStructureSchema,
            'community_structure',
            i,
            async (data) => {
              // Normalize the data to match Prisma schema
              const normalizedData = this.normalizeCommunityData(data);
              // Execute the community creation
              const communityIds = await this.executeCommunityCreation([normalizedData], userId);
              return { communityCreated: true, communityIds };
            }
          );
          results.push(result);
          if (result.success) successfulComponents++; else failedComponents++;
        }
      }

      // Process concept_description_synthesis
      if (ontologyOptimizations.concept_description_synthesis) {
        console.log(`[OntologyStageTool] Processing ${ontologyOptimizations.concept_description_synthesis.length} concept syntheses`);
        for (let i = 0; i < ontologyOptimizations.concept_description_synthesis.length; i++) {
          totalComponents++;
          const result = await this.processComponent(
            ontologyOptimizations.concept_description_synthesis[i],
            ConceptSynthesisSchema,
            'concept_synthesis',
            i,
            async (data) => {
              // Execute the synthesis
              await this.synthesizeConceptDescriptions([data]);
              return { synthesized: true, entityId: data.entity_id };
            }
          );
          results.push(result);
          if (result.success) successfulComponents++; else failedComponents++;
        }
      }

    } catch (error) {
      console.error(`[OntologyStageTool] Error in partial processing:`, error);
      return {
        totalComponents,
        successfulComponents,
        failedComponents,
        results,
        summary: `Partial processing failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    const summary = `Processed ${totalComponents} components: ${successfulComponents} successful, ${failedComponents} failed`;
    console.log(`[OntologyStageTool] ${summary}`);

    return {
      totalComponents,
      successfulComponents,
      failedComponents,
      results,
      summary
    };
  }

  /**
   * Process a single component with validation and execution
   */
  private async processComponent<T>(
    componentData: any,
    schema: z.ZodSchema<T>,
    componentType: string,
    componentIndex: number,
    executor: (data: T) => Promise<any>
  ): Promise<ComponentProcessingResult<T>> {
    try {
      // Validate the component
      const validatedData = schema.parse(componentData);
      
      // Execute the component
      const result = await executor(validatedData);
      
      console.log(`[OntologyStageTool] ✅ ${componentType}[${componentIndex}] processed successfully`);
      
      return {
        success: true,
        data: validatedData,
        componentType,
        componentIndex
      };
    } catch (error) {
      console.warn(`[OntologyStageTool] ❌ ${componentType}[${componentIndex}] failed:`, error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        componentType,
        componentIndex
      };
    }
  }

  /**
   * Normalize community data to match Prisma schema
   */
  private normalizeCommunityData(data: any): any {
    return {
      entity_id: data.entity_id || data.community_id,
      title: data.title || data.theme || data.community_name || 'Untitled Community',
      content: data.content || data.community_description,
      type: data.type || data.community_type,
      member_entity_ids: data.member_entity_ids || []
    };
  }
}
