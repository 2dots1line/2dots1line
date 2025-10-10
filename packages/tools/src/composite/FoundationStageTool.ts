/**
 * FoundationStageTool - V11.1 Multi-Stage Insight Worker
 * 
 * Handles Stage 1: Foundation Analysis - Essential building blocks for user growth cycles.
 * Generates memory profile, opening artifact, key phrases, and template selection.
 * 
 * Architecture: Focused tool for foundation stage with prompt caching integration.
 */

import { z } from 'zod';
import { ConfigService } from '@2dots1line/config-service';
import type { TToolInput, TToolOutput } from '@2dots1line/shared-types';
import { LLMChatTool, type LLMChatInput } from '../ai/LLMChatTool';
import { LLMRetryHandler, PromptCacheService, MultiStagePromptCacheManager } from '@2dots1line/core-utils';

// Input validation schema
export const FoundationStageInputSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  cycleId: z.string(),
  userMemoryProfile: z.any().optional(),
  analysisContext: z.string().optional(),
  consolidatedKnowledgeGraph: z.string().optional(),
  recentConversations: z.string().optional(),
  cycleDates: z.object({
    cycleStartDate: z.string(),
    cycleEndDate: z.string()
  }),
  structuredContext: z.object({
    currentKnowledgeGraph: z.object({
      conversations: z.array(z.object({
        content: z.string()
      })),
      memoryUnits: z.array(z.object({
        id: z.string(),
        content: z.string()
      })),
      concepts: z.array(z.object({
        title: z.string(),
        content: z.string()
      })),
      conceptsNeedingSynthesis: z.array(z.any()).optional()
    }),
    recentGrowthEvents: z.array(z.object({
      id: z.string(),
      content: z.string()
    })),
    strategicContext: z.any().optional(),
    previousKeyPhrases: z.array(z.object({
      category: z.string(),
      phrases: z.array(z.string())
    })).optional()
  }).optional()
});

// Output validation schema
export const FoundationStageOutputSchema = z.object({
  foundation_results: z.object({
    memory_profile: z.object({
      type: z.literal('memory_profile'),
      content: z.string()
    }),
    opening: z.object({
      type: z.literal('opening'),
      title: z.string(),
      content: z.string()
    }),
    key_phrases: z.object({
      // Strategic key phrases for next cycle's HRT retrieval (no hard quota)
      values_and_goals: z.array(z.string()),
      emotional_drivers: z.array(z.string()),
      important_relationships: z.array(z.string()),
      growth_patterns: z.array(z.string()),
      knowledge_domains: z.array(z.string()),
      life_context: z.array(z.string()),
      hidden_connections: z.array(z.string())
    })
  })
});

export type FoundationStageInput = z.infer<typeof FoundationStageInputSchema>;
export type FoundationStageOutput = z.infer<typeof FoundationStageOutputSchema>;

// Enhanced return type that includes both results and prompt for KV caching
export interface FoundationStageResult {
  results: FoundationStageOutput;
  prompt: string;
}

// Error classes
export class FoundationStageError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'FoundationStageError';
  }
}

export class FoundationStageValidationError extends FoundationStageError {
  constructor(message: string, public readonly validationErrors: any[]) {
    super(message);
    this.name = 'FoundationStageValidationError';
  }
}

export class FoundationStageTool {
  private llmChatTool: any;
  private retryHandler: typeof LLMRetryHandler;
  private multiStageCacheManager?: MultiStagePromptCacheManager;

  constructor(
    private configService: ConfigService,
    private promptCacheService?: PromptCacheService // Optional for backward compatibility
  ) {
    this.llmChatTool = LLMChatTool; // Use the exported instance
    this.retryHandler = LLMRetryHandler;
    
    // Initialize multi-stage cache manager if cache service is available
    if (this.promptCacheService) {
      this.multiStageCacheManager = new MultiStagePromptCacheManager(this.promptCacheService, this.configService);
    }
  }

  async execute(input: FoundationStageInput): Promise<FoundationStageResult> {
    console.log(`[FoundationStageTool] Starting foundation analysis for user ${input.userId}`);
    
    try {
      // Validate input
      const validatedInput = FoundationStageInputSchema.parse(input);
      
      // Build foundation analysis prompt with caching
      const prompt = await this.buildFoundationPrompt(validatedInput);
      
      // Execute LLM call with retry logic
      const llmResult = await this.retryHandler.executeWithRetry(
        this.llmChatTool,
        { 
          payload: { 
            systemPrompt: prompt, 
            userMessage: `Please perform foundation analysis for user ${validatedInput.userId}.`,
            workerType: 'insight-worker',
            workerJobId: validatedInput.cycleId,
            userId: validatedInput.userId,
            sessionId: `foundation-${validatedInput.cycleId}`,
            conversationId: `foundation-${validatedInput.cycleId}`,
            messageId: `foundation-${validatedInput.cycleId}-${Date.now()}`
          } 
        },
        { maxAttempts: 2, baseDelay: 1000 }
      );
      
      // Parse and validate response
      console.log(`[FoundationStageTool] DEBUG - llmResult type:`, typeof llmResult);
      console.log(`[FoundationStageTool] DEBUG - llmResult.result type:`, typeof llmResult.result);
      console.log(`[FoundationStageTool] DEBUG - llmResult.result.text type:`, typeof llmResult.result.text);
      console.log(`[FoundationStageTool] DEBUG - llmResult.result.text preview:`, llmResult.result.text?.substring(0, 100));
      
      const parsedOutput = this.parseLLMResponse(llmResult.result.text);
      const validatedOutput = FoundationStageOutputSchema.parse(parsedOutput);
      
      console.log(`[FoundationStageTool] Foundation analysis completed for user ${input.userId}`);
      return {
        results: validatedOutput,
        prompt: prompt
      };
      
    } catch (error) {
      console.error(`[FoundationStageTool] Foundation analysis failed for user ${input.userId}:`, error);
      
      if (error instanceof z.ZodError) {
        throw new FoundationStageValidationError(
          `Foundation stage validation failed: ${error.message}`,
          error.errors
        );
      }
      
      throw new FoundationStageError(
        `Foundation stage execution failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Build foundation analysis prompt with OPTIMIZED multi-stage caching
   */
  private async buildFoundationPrompt(input: FoundationStageInput): Promise<string> {
    // Use optimized multi-stage caching if available
    if (this.multiStageCacheManager) {
      return this.buildFoundationPromptOptimized(input);
    }
    
    // Fallback to legacy caching
    return this.buildFoundationPromptLegacy(input);
  }

  /**
   * Build foundation prompt with optimized multi-stage caching
   */
  private async buildFoundationPromptOptimized(input: FoundationStageInput): Promise<string> {
    const user_name = input.userName || 'User';
    
    // Use structured context if available, otherwise parse from strings
    let context: any;
    
    if (input.structuredContext) {
      // Use the rich structured data directly
      context = {
        userName: input.userName,
        cycleId: input.cycleId,
        cycleStartDate: input.cycleDates.cycleStartDate,
        cycleEndDate: input.cycleDates.cycleEndDate,
        userMemoryProfile: input.userMemoryProfile ? JSON.stringify(input.userMemoryProfile) : 'No memory profile available',
        currentKnowledgeGraph: input.structuredContext.currentKnowledgeGraph,
        recentGrowthEvents: input.structuredContext.recentGrowthEvents,
        strategicContext: input.structuredContext.strategicContext,
        previousKeyPhrases: input.structuredContext.previousKeyPhrases,
        // Include the raw strings for fallback
        analysisContext: input.analysisContext,
        consolidatedKnowledgeGraph: input.consolidatedKnowledgeGraph,
        recentConversations: input.recentConversations
      };
    } else {
      // Fallback: Parse the structured data from the input strings back into objects
      context = {
        userName: input.userName,
        cycleId: input.cycleId,
        cycleStartDate: input.cycleDates.cycleStartDate,
        cycleEndDate: input.cycleDates.cycleEndDate,
        userMemoryProfile: input.userMemoryProfile ? JSON.stringify(input.userMemoryProfile) : 'No memory profile available',
        currentKnowledgeGraph: {
          concepts: this.parseConceptsFromString(input.consolidatedKnowledgeGraph || ''),
          memoryUnits: this.parseMemoryUnitsFromString(input.consolidatedKnowledgeGraph || ''),
          conversations: input.recentConversations ? [{ content: input.recentConversations }] : []
        },
        recentGrowthEvents: this.parseGrowthEventsFromString(input.consolidatedKnowledgeGraph || ''),
        // Include the raw strings for fallback
        analysisContext: input.analysisContext,
        consolidatedKnowledgeGraph: input.consolidatedKnowledgeGraph,
        recentConversations: input.recentConversations
      };
    }
    
    // Use new optimized caching strategy for Foundation stage
    const masterPrompt = await this.multiStageCacheManager!.getFoundationPrompt(
      input.userId,
      user_name,
      context // Pass the rich structured context
    );

    console.log(`[FoundationStageTool] Built foundation prompt with optimized caching (${masterPrompt.length} characters)`);
    
    return masterPrompt;
  }

  /**
   * Build foundation prompt with legacy caching (fallback)
   */
  private async buildFoundationPromptLegacy(input: FoundationStageInput): Promise<string> {
    // Load prompt templates from config
    const templates = this.configService.getAllTemplates();
    
    // Build the foundation prompt with caching
    const user_name = input.userName || 'User';
    
    // Cache the core identity section (95% hit rate)
    const coreIdentity = await this.getCachedSection('core_identity', input.userId, user_name, templates.insight_worker_core_identity);
    
    // Cache the operational config section (70% hit rate)
    const operationalConfig = await this.getCachedSection('operational_config', input.userId, user_name, templates.insight_worker_operational_config);
    
    // Build dynamic context (10-95% cache hit rate)
    const dynamicContext = this.buildDynamicContext(input);
    
    // Get foundation stage template
    const foundationTemplate = templates.insight_worker_foundation_stage;
    
    const masterPrompt = `${coreIdentity}

${operationalConfig}

${dynamicContext}

${foundationTemplate}`;

    console.log(`[FoundationStageTool] Built foundation prompt with legacy caching (${masterPrompt.length} characters)`);
    return masterPrompt;
  }

  /**
   * Parse concepts from knowledge graph string
   */
  private parseConceptsFromString(knowledgeGraphString: string): any[] {
    const concepts: any[] = [];
    
    // Look for concepts section in the string
    const conceptsMatch = knowledgeGraphString.match(/\*\*USER CONCEPTS:\*\*\s*([\s\S]*?)(?=\*\*|$)/);
    if (conceptsMatch) {
      const conceptsText = conceptsMatch[1];
      const conceptLines = conceptsText.split('\n').filter(line => line.trim().startsWith('- '));
      
      conceptLines.forEach(line => {
        const match = line.match(/^- (.+?): (.+)$/);
        if (match) {
          concepts.push({
            title: match[1].trim(),
            content: match[2].trim()
          });
        }
      });
    }
    
    return concepts;
  }

  /**
   * Parse memory units from knowledge graph string
   */
  private parseMemoryUnitsFromString(knowledgeGraphString: string): any[] {
    const memoryUnits: any[] = [];
    
    // Look for memory units section in the string
    const memoryUnitsMatch = knowledgeGraphString.match(/\*\*USER MEMORY UNITS:\*\*\s*([\s\S]*?)(?=\*\*|$)/);
    if (memoryUnitsMatch) {
      const memoryUnitsText = memoryUnitsMatch[1];
      const memoryUnitLines = memoryUnitsText.split('\n').filter(line => line.trim().startsWith('- '));
      
      memoryUnitLines.forEach(line => {
        const match = line.match(/^- (.+?): (.+)$/);
        if (match) {
          memoryUnits.push({
            id: match[1].trim(),
            content: match[2].trim()
          });
        }
      });
    }
    
    return memoryUnits;
  }

  /**
   * Parse growth events from knowledge graph string
   */
  private parseGrowthEventsFromString(knowledgeGraphString: string): any[] {
    const growthEvents: any[] = [];
    
    // Look for growth events section in the string
    const growthEventsMatch = knowledgeGraphString.match(/\*\*RECENT GROWTH EVENTS:\*\*\s*([\s\S]*?)(?=\*\*|$)/);
    if (growthEventsMatch) {
      const growthEventsText = growthEventsMatch[1];
      const growthEventLines = growthEventsText.split('\n').filter(line => line.trim().startsWith('- '));
      
      growthEventLines.forEach(line => {
        const match = line.match(/^- (.+?): (.+)$/);
        if (match) {
          growthEvents.push({
            id: match[1].trim(),
            content: match[2].trim()
          });
        }
      });
    }
    
    return growthEvents;
  }

  /**
   * Build dynamic context section
   */
  private buildDynamicContext(input: FoundationStageInput): string {
    return `=== SECTION 3: DYNAMIC CONTEXT ===

**3.1 Analysis Context:**
- User: ${input.userName || 'User'}
- Cycle ID: ${input.cycleId}
- Analysis Timestamp: ${new Date().toISOString()}
- Cycle Period: ${input.cycleDates.cycleStartDate} to ${input.cycleDates.cycleEndDate}

**3.2 User Memory Profile:**
${input.userMemoryProfile ? JSON.stringify(input.userMemoryProfile, null, 2) : 'No existing memory profile'}

**3.3 Consolidated Knowledge Graph:**
${input.consolidatedKnowledgeGraph || 'No knowledge graph available'}

**3.4 Recent Conversations:**
${input.recentConversations || 'No recent conversations'}

**3.5 Analysis Context:**
${input.analysisContext || 'No analysis context available'}`;
  }

  /**
   * Get cached section or build and cache it
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
   * Execute LLM call
   */
  private async executeLLMCall(prompt: string, userId: string): Promise<string> {
    const llmInput = {
      payload: {
        userId,
        sessionId: `foundation-${userId}-${Date.now()}`,
        systemPrompt: prompt,
        userMessage: `Please perform foundation analysis for user ${userId}.`,
        history: [],
        modelOverride: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 8192 // Reduced for foundation stage
      }
    };

    const result = await this.llmChatTool.execute(llmInput);
    return result.text;
  }

  /**
   * Parse LLM response and extract JSON
   */
  private parseLLMResponse(response: string): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in LLM response');
      }

      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[FoundationStageTool] JSON parsing failed:', error);
      console.error('[FoundationStageTool] Raw response:', response);
      throw new FoundationStageError(`Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get tool manifest
   */
  getManifest(): { name: string; description: string; version: string } {
    return {
      name: 'FoundationStageTool',
      description: 'Generates foundation building blocks for user growth cycles (memory profile, opening artifact, key phrases, template selection)',
      version: '11.1.0'
    };
  }
}
