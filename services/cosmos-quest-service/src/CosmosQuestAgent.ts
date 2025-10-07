/**
 * CosmosQuestAgent.ts
 * V11.0 - Specialized conversational AI for immersive memory exploration through 3D visualization.
 * Always retrieves memory and generates guided walkthroughs.
 */

import { ConversationRepository, UserRepository } from '@2dots1line/database';
import { 
  CosmosQuestInput,
  CosmosQuestResult,
  KeyPhraseCapsule,
  WalkthroughStep,
  VisualizationEntity,
  StageDirection
} from '@2dots1line/shared-types';
import { 
  LLMChatTool, 
  HybridRetrievalTool,
  KeyPhraseExtractionTool
} from '@2dots1line/tools';
import { ExtendedAugmentedMemoryContext } from '@2dots1line/tools/src/retrieval/types';
import { LLMRetryHandler, PromptCacheService } from '@2dots1line/core-utils';
import { Redis } from 'ioredis';

import { ConfigService, EnvironmentModelConfigService } from '@2dots1line/config-service';
import { CosmosQuestPromptBuilder } from './CosmosQuestPromptBuilder';

// Dependencies to be injected into the agent
export interface CosmosQuestAgentDependencies {
  configService: ConfigService;
  conversationRepository: ConversationRepository;
  userRepository: UserRepository;
  redisClient: Redis;
  promptBuilder: CosmosQuestPromptBuilder;
  llmChatTool: any;
  hybridRetrievalTool: HybridRetrievalTool;
  promptCacheService?: PromptCacheService; // Optional for backward compatibility
}

export class CosmosQuestAgent {
  // Store injected dependencies
  private configService: ConfigService;
  private modelConfigService: EnvironmentModelConfigService;
  private conversationRepo: ConversationRepository;
  private userRepo: UserRepository;
  private redis: Redis;
  private promptBuilder: CosmosQuestPromptBuilder;
  private llmChatTool: any;
  private hybridRetrievalTool: HybridRetrievalTool;
  private keyPhraseExtractionTool: KeyPhraseExtractionTool;
  private promptCacheService?: PromptCacheService;

  constructor(dependencies: CosmosQuestAgentDependencies) {
    this.configService = dependencies.configService;
    this.modelConfigService = EnvironmentModelConfigService.getInstance();
    this.conversationRepo = dependencies.conversationRepository;
    this.userRepo = dependencies.userRepository;
    this.redis = dependencies.redisClient;
    this.promptBuilder = dependencies.promptBuilder;
    this.llmChatTool = dependencies.llmChatTool;
    this.hybridRetrievalTool = dependencies.hybridRetrievalTool;
    this.keyPhraseExtractionTool = new KeyPhraseExtractionTool();
    this.promptCacheService = dependencies.promptCacheService;

    console.log("CosmosQuestAgent V11.0 initialized with KeyPhraseExtractionTool.");
  }

  /**
   * Main entry point for processing a quest request with progressive updates.
   * Always retrieves memory and generates guided walkthroughs.
   * V11.0: Now supports streaming narration via onUpdate('narration_chunk')
   */
  public async processQuestWithProgressiveUpdates(
    input: CosmosQuestInput, 
    onUpdate: (updateType: string, data: any) => void
  ): Promise<CosmosQuestResult> {
    const executionId = `cq_${Date.now()}`;
    console.log(`[${executionId}] Starting quest processing for user: ${input.userId}`);

    try {
      // --- PHASE I: LLM-BASED KEY PHRASE EXTRACTION ---
      console.log(`[${executionId}] 🔍 Phase 1: Extracting key phrases with LLM context`);
      
      // Callback for streaming narration during key phrase extraction
      const onNarrationChunk = (chunk: string) => {
        onUpdate('narration_chunk', { content: chunk });
      };
      
      const keyPhrases = await this.extractKeyPhrasesWithLLM(input, executionId, onNarrationChunk);
      
      // Send key phrases immediately
      onUpdate('key_phrases', { capsules: keyPhrases });
      
      // --- PHASE II: MEMORY RETRIEVAL ---
      console.log(`[${executionId}] 📊 Phase 2: Retrieving memory with key phrases:`, keyPhrases);
      const augmentedContext = await this.retrieveMemory(keyPhrases, input.userId, executionId);
      
      // --- PHASE III: PROGRESSIVE VISUALIZATION GENERATION ---
      console.log(`[${executionId}] 🎨 Phase 3: Generating progressive visualization`);
      const visualization = await this.generateProgressiveVisualization(augmentedContext, executionId);
      
      // Send visualization stages progressively
      onUpdate('visualization_stage_1', { 
        stage: 1, 
        entities: visualization.stage1 
      });
      
      onUpdate('visualization_stages_2_and_3', {
        stage2: visualization.stage2,
        stage3: visualization.stage3
      });
      
      // --- PHASE IV: FINAL RESPONSE & WALKTHROUGH ---
      console.log(`[${executionId}] 📝 Phase 4: Generating final response and walkthrough`);
      
      // Callback for stage directions
      const onStageDirection = (direction: StageDirection) => {
        onUpdate('stage_direction', { direction });
      };
      
      const finalResponse = await this.generateFinalResponse(
        input, 
        augmentedContext, 
        visualization, 
        executionId,
        onNarrationChunk,  // Pass streaming callback
        onStageDirection   // Pass stage direction callback
      );

      // Send final response
      onUpdate('final_response', {
        response_text: finalResponse.response_text,
        walkthrough_script: finalResponse.walkthrough_script,
        reflective_question: finalResponse.reflective_question
      });

      return {
        execution_id: executionId,
        key_phrases: keyPhrases,
        visualization_stages: visualization,
        response_text: finalResponse.response_text,
        walkthrough_script: finalResponse.walkthrough_script,
        reflective_question: finalResponse.reflective_question,
        metadata: {
          processing_time_ms: Date.now() - parseInt(executionId.split('_')[1]),
          memory_units_retrieved: augmentedContext.retrievedMemoryUnits?.length || 0,
          concepts_retrieved: augmentedContext.retrievedConcepts?.length || 0,
          artifacts_retrieved: augmentedContext.retrievedArtifacts?.length || 0
        }
      };

    } catch (error) {
      console.error(`[${executionId}] ❌ Quest processing failed:`, error);
      throw error;
    }
  }

  /**
   * Main entry point for processing a quest request.
   * Always retrieves memory and generates guided walkthroughs.
   */
  public async processQuest(input: CosmosQuestInput): Promise<CosmosQuestResult> {
    const executionId = `cq_${Date.now()}`;
    console.log(`[${executionId}] Starting quest processing for user: ${input.userId}`);

    try {
      // --- PHASE I: LLM-BASED KEY PHRASE EXTRACTION ---
      console.log(`[${executionId}] 🔍 Phase 1: Extracting key phrases with LLM context`);
      const keyPhrases = await this.extractKeyPhrasesWithLLM(input, executionId);
      
      // --- PHASE II: MEMORY RETRIEVAL ---
      console.log(`[${executionId}] 📊 Phase 2: Retrieving memory with key phrases:`, keyPhrases);
      const augmentedContext = await this.retrieveMemory(keyPhrases, input.userId, executionId);
      
      // --- PHASE III: PROGRESSIVE VISUALIZATION GENERATION ---
      console.log(`[${executionId}] 🎨 Phase 3: Generating progressive visualization`);
      const visualization = await this.generateProgressiveVisualization(augmentedContext, executionId);
      
      // --- PHASE IV: FINAL RESPONSE & WALKTHROUGH ---
      console.log(`[${executionId}] 📝 Phase 4: Generating final response and walkthrough`);
      const finalResponse = await this.generateFinalResponse(input, augmentedContext, visualization, executionId);

      return {
        execution_id: executionId,
        key_phrases: keyPhrases,
        visualization_stages: visualization,
        response_text: finalResponse.response_text,
        walkthrough_script: finalResponse.walkthrough_script,
        reflective_question: finalResponse.reflective_question,
        metadata: {
          processing_time_ms: Date.now() - parseInt(executionId.split('_')[1]),
          memory_units_retrieved: augmentedContext.retrievedMemoryUnits?.length || 0,
          concepts_retrieved: augmentedContext.retrievedConcepts?.length || 0,
          artifacts_retrieved: augmentedContext.retrievedArtifacts?.length || 0
        }
      };

    } catch (error) {
      console.error(`[${executionId}] ❌ Quest processing failed:`, error);
      throw error;
    }
  }

  /**
   * Extract key phrases using the dedicated KeyPhraseExtractionTool
   * V11.0: Now uses optimized KeyPhraseExtractionTool for consistency and performance
   */
  private async extractKeyPhrasesWithLLM(
    input: CosmosQuestInput, 
    executionId: string,
    onNarrationChunk?: (chunk: string) => void
  ): Promise<KeyPhraseCapsule[]> {
    console.log(`[${executionId}] 🤖 Extracting key phrases with KeyPhraseExtractionTool`);

    try {
      // Use the dedicated key phrase extraction tool
      const keyPhraseResult = await this.keyPhraseExtractionTool.execute({
        payload: {
          text: input.userQuestion,
          context: {
            userId: input.userId,
            conversationId: input.conversationId,
            agentType: 'quest'
          },
          options: {
            maxPhrases: 7,
            streaming: !!onNarrationChunk,
            onChunk: onNarrationChunk,
            temperature: 0.3
          }
        },
        request_id: `quest-keyphrase-${Date.now()}`
      });

      if (keyPhraseResult.status !== 'success' || !keyPhraseResult.result) {
        throw new Error(`Key phrase extraction failed: ${keyPhraseResult.error?.message || 'Unknown error'}`);
      }

      console.log(`[${executionId}] ✅ Key phrase extraction completed:`, {
        phrases: keyPhraseResult.result.keyPhrases,
        confidence: keyPhraseResult.result.confidence,
        processingTime: keyPhraseResult.result.processingTimeMs,
        modelUsed: keyPhraseResult.result.modelUsed
      });

      // Convert to KeyPhraseCapsule format
      return keyPhraseResult.result.keyPhrases.map((phrase: string, index: number) => ({
        phrase,
        confidence_score: keyPhraseResult.result!.confidence,
        color: this.getKeyPhraseColor(index)
      }));

    } catch (error) {
      console.error(`[${executionId}] ❌ Key phrase extraction failed:`, error);
      throw new Error(`Key phrase extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse LLM response to extract key phrases with confidence scores
   */
  private parseKeyPhraseResponse(llmResult: any, executionId: string): KeyPhraseCapsule[] {
    const rawText = llmResult.result.text;
    console.log(`[${executionId}] Raw LLM key phrase response (${rawText.length} chars):`, rawText);
    
    try {
      // Extract JSON from LLM response
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("No valid JSON found in LLM response");
      }
      
      const jsonText = rawText.substring(firstBrace, lastBrace + 1).trim();
      const parsed = JSON.parse(jsonText);
      
      // Extract key phrases from the parsed response
      const keyPhrases = parsed.key_phrases || [];
      
      // Convert to KeyPhraseCapsule format with confidence scores and colors
      return keyPhrases.map((phrase: string, index: number) => ({
        phrase: phrase.trim(),
        confidence_score: 0.8 + (Math.random() * 0.2), // 0.8-1.0 confidence
        color: this.getKeyPhraseColor(index)
      }));
      
    } catch (e) {
      console.error(`[${executionId}] Key phrase JSON parsing error:`, e);
      console.error(`[${executionId}] Raw LLM response:`, llmResult.result.text);
      
      // Fallback: extract phrases from raw text
      return this.fallbackKeyPhraseExtraction(rawText, executionId);
    }
  }

  /**
   * Fallback key phrase extraction from raw text
   */
  private fallbackKeyPhraseExtraction(rawText: string, executionId: string): KeyPhraseCapsule[] {
    console.log(`[${executionId}] Using fallback key phrase extraction`);
    
    // Simple extraction: look for quoted phrases or bullet points
    const phrases: string[] = [];
    
    // Extract quoted phrases
    const quotedMatches = rawText.match(/"([^"]+)"/g);
    if (quotedMatches) {
      phrases.push(...quotedMatches.map(match => match.replace(/"/g, '')));
    }
    
    // Extract bullet point phrases
    const bulletMatches = rawText.match(/[-•]\s*([^\n]+)/g);
    if (bulletMatches) {
      phrases.push(...bulletMatches.map(match => match.replace(/[-•]\s*/, '').trim()));
    }
    
    // If no structured phrases found, extract words from the question
    if (phrases.length === 0) {
      const words = rawText.toLowerCase().match(/\b\w{3,}\b/g) || [];
      phrases.push(...words.slice(0, 5)); // Take first 5 words
    }
    
    return phrases.slice(0, 5).map((phrase, index) => ({
      phrase: phrase.trim(),
      confidence_score: 0.7 + (Math.random() * 0.2), // 0.7-0.9 confidence for fallback
      color: this.getKeyPhraseColor(index)
    }));
  }

  /**
   * Get color for key phrase based on index
   */
  private getKeyPhraseColor(index: number): string {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    return colors[index % colors.length];
  }

  /**
   * Retrieve memory using hybrid retrieval tool
   */
  private async retrieveMemory(keyPhrases: KeyPhraseCapsule[], userId: string, executionId: string): Promise<ExtendedAugmentedMemoryContext> {
    console.log(`[${executionId}] 🔍 Executing memory retrieval with key phrases:`, keyPhrases.map(kp => kp.phrase));
    
    // Load user-specific HRT parameters
    const userParameters = await this.loadUserHRTParameters(userId);
    
    const augmentedContext = await this.hybridRetrievalTool.execute({
      keyPhrasesForRetrieval: keyPhrases.map(kp => kp.phrase),
      userId: userId,
      userParameters: userParameters
    });
    
    console.log(`[${executionId}] 📊 Memory retrieval results:`, {
      memoryUnits: augmentedContext.retrievedMemoryUnits?.length || 0,
      concepts: augmentedContext.retrievedConcepts?.length || 0,
      artifacts: augmentedContext.retrievedArtifacts?.length || 0,
      hasContext: !!augmentedContext
    });

    return augmentedContext;
  }

  /**
   * Generate progressive visualization stages
   */
  private async generateProgressiveVisualization(augmentedContext: ExtendedAugmentedMemoryContext, executionId: string): Promise<{
    stage1: VisualizationEntity[];
    stage2: VisualizationEntity[];
    stage3: VisualizationEntity[];
  }> {
    console.log(`[${executionId}] 🎨 Generating progressive visualization stages`);
    
    // Stage 1: Direct semantic matches (bright stars)
    const stage1 = this.generateStage1Entities(augmentedContext);
    
    // Stage 2: 1-hop connections (medium stars)
    const stage2 = this.generateStage2Entities(augmentedContext);
    
    // Stage 3: 2-hop connections (dim stars)
    const stage3 = this.generateStage3Entities(augmentedContext);
    
    console.log(`[${executionId}] ✅ Generated visualization: Stage1(${stage1.length}), Stage2(${stage2.length}), Stage3(${stage3.length})`);
    
    return { stage1, stage2, stage3 };
  }

  /**
   * Generate Stage 1 entities (highest relevance - direct semantic matches)
   */
  private generateStage1Entities(augmentedContext: ExtendedAugmentedMemoryContext): VisualizationEntity[] {
    const entities: VisualizationEntity[] = [];
    
    // Collect all entities with their relevance scores
    const allEntities: Array<{
      entity: any;
      type: 'MemoryUnit' | 'Concept' | 'Artifact';
      relevanceScore: number;
    }> = [];
    
    // Add memory units
    if (augmentedContext.retrievedMemoryUnits) {
      augmentedContext.retrievedMemoryUnits.forEach(unit => {
        allEntities.push({
          entity: unit,
          type: 'MemoryUnit',
          relevanceScore: unit.importance_score || 0.8
        });
      });
    }
    
    // Add concepts
    if (augmentedContext.retrievedConcepts) {
      augmentedContext.retrievedConcepts.forEach(concept => {
        allEntities.push({
          entity: concept,
          type: 'Concept',
          relevanceScore: concept.importance_score || 0.7
        });
      });
    }
    
    // Add artifacts
    if (augmentedContext.retrievedArtifacts) {
      augmentedContext.retrievedArtifacts.forEach(artifact => {
        allEntities.push({
          entity: artifact,
          type: 'Artifact',
          relevanceScore: artifact.importance_score || 0.6
        });
      });
    }
    
    // Sort by relevance score (highest first) and take top 40% for Stage 1
    allEntities.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const stage1Count = Math.max(1, Math.ceil(allEntities.length * 0.4));
    const stage1Entities = allEntities.slice(0, stage1Count);
    
    // Convert to visualization entities
    stage1Entities.forEach((item, index) => {
      entities.push({
        entityId: item.entity.entity_id, // Use raw UUID without prefix
        entityType: item.type,
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ],
        starTexture: 'bright_star',
        title: item.entity.title || `${item.type} ${index + 1}`,
        relevanceScore: item.relevanceScore,
        connectionType: undefined,
        connectedTo: undefined
      });
    });
    
    console.log(`[Stage1] Selected ${entities.length} entities as direct semantic matches (bright stars)`);
    return entities;
  }

  /**
   * Generate Stage 2 entities (medium relevance - 1-hop connections)
   */
  private generateStage2Entities(augmentedContext: ExtendedAugmentedMemoryContext): VisualizationEntity[] {
    const entities: VisualizationEntity[] = [];
    
    // Collect all entities with their relevance scores (same as Stage 1)
    const allEntities: Array<{
      entity: any;
      type: 'MemoryUnit' | 'Concept' | 'Artifact';
      relevanceScore: number;
    }> = [];
    
    // Add memory units
    if (augmentedContext.retrievedMemoryUnits) {
      augmentedContext.retrievedMemoryUnits.forEach(unit => {
        allEntities.push({
          entity: unit,
          type: 'MemoryUnit',
          relevanceScore: unit.importance_score || 0.8
        });
      });
    }
    
    // Add concepts
    if (augmentedContext.retrievedConcepts) {
      augmentedContext.retrievedConcepts.forEach(concept => {
        allEntities.push({
          entity: concept,
          type: 'Concept',
          relevanceScore: concept.importance_score || 0.7
        });
      });
    }
    
    // Add artifacts
    if (augmentedContext.retrievedArtifacts) {
      augmentedContext.retrievedArtifacts.forEach(artifact => {
        allEntities.push({
          entity: artifact,
          type: 'Artifact',
          relevanceScore: artifact.importance_score || 0.6
        });
      });
    }
    
    // Sort by relevance score and take middle 40% for Stage 2
    allEntities.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const stage1Count = Math.max(1, Math.ceil(allEntities.length * 0.4));
    const stage2Count = Math.max(1, Math.ceil(allEntities.length * 0.4));
    const stage2Entities = allEntities.slice(stage1Count, stage1Count + stage2Count);
    
    // Convert to visualization entities
    stage2Entities.forEach((item, index) => {
      entities.push({
        entityId: item.entity.entity_id, // Use raw UUID without prefix
        entityType: item.type,
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ],
        starTexture: 'medium_star',
        title: item.entity.title || `${item.type} ${index + 1}`,
        relevanceScore: item.relevanceScore,
        connectionType: '1_hop',
        connectedTo: [allEntities[0].entity.entity_id] // Connect to first Stage 1 entity (raw UUID)
      });
    });
    
    console.log(`[Stage2] Selected ${entities.length} entities as 1-hop connections (medium stars)`);
    return entities;
  }

  /**
   * Generate Stage 3 entities (lowest relevance - 2-hop connections)
   */
  private generateStage3Entities(augmentedContext: ExtendedAugmentedMemoryContext): VisualizationEntity[] {
    const entities: VisualizationEntity[] = [];
    
    // Collect all entities with their relevance scores (same as Stage 1 & 2)
    const allEntities: Array<{
      entity: any;
      type: 'MemoryUnit' | 'Concept' | 'Artifact';
      relevanceScore: number;
    }> = [];
    
    // Add memory units
    if (augmentedContext.retrievedMemoryUnits) {
      augmentedContext.retrievedMemoryUnits.forEach(unit => {
        allEntities.push({
          entity: unit,
          type: 'MemoryUnit',
          relevanceScore: unit.importance_score || 0.8
        });
      });
    }
    
    // Add concepts
    if (augmentedContext.retrievedConcepts) {
      augmentedContext.retrievedConcepts.forEach(concept => {
        allEntities.push({
          entity: concept,
          type: 'Concept',
          relevanceScore: concept.importance_score || 0.7
        });
      });
    }
    
    // Add artifacts
    if (augmentedContext.retrievedArtifacts) {
      augmentedContext.retrievedArtifacts.forEach(artifact => {
        allEntities.push({
          entity: artifact,
          type: 'Artifact',
          relevanceScore: artifact.importance_score || 0.6
        });
      });
    }
    
    // Sort by relevance score and take bottom 20% for Stage 3
    allEntities.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const stage1Count = Math.max(1, Math.ceil(allEntities.length * 0.4));
    const stage2Count = Math.max(1, Math.ceil(allEntities.length * 0.4));
    const stage3Entities = allEntities.slice(stage1Count + stage2Count);
    
    // Convert to visualization entities
    stage3Entities.forEach((item, index) => {
      entities.push({
        entityId: item.entity.entity_id, // Use raw UUID without prefix
        entityType: item.type,
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ],
        starTexture: 'dim_star',
        title: item.entity.title || `${item.type} ${index + 1}`,
        relevanceScore: item.relevanceScore,
        connectionType: '2_hop',
        connectedTo: [allEntities[stage1Count].entity.entity_id] // Connect to first Stage 2 entity (raw UUID)
      });
    });
    
    console.log(`[Stage3] Selected ${entities.length} entities as 2-hop connections (dim stars)`);
    return entities;
  }

  /**
   * Generate final response and walkthrough
   * V11.0: Now supports streaming narration with flash/pro models and stage directions
   */
  private async generateFinalResponse(
    input: CosmosQuestInput, 
    augmentedContext: ExtendedAugmentedMemoryContext, 
    visualization: any,
    executionId: string,
    onNarrationChunk?: (chunk: string) => void,
    onStageDirection?: (direction: StageDirection) => void
  ): Promise<{
    response_text: string;
    walkthrough_script: WalkthroughStep[];
    reflective_question: string;
  }> {
    console.log(`[${executionId}] 📝 Generating final response and walkthrough (flash + streaming)`);
    
    // Build final response prompt
    const promptOutput = await this.promptBuilder.buildFinalResponsePrompt({
      userId: input.userId,
      conversationId: input.conversationId,
      userQuestion: input.userQuestion,
      augmentedContext,
      visualization
    });

    const llmToolInput = {
      payload: {
        userId: input.userId,
        sessionId: input.conversationId,
        workerType: 'cosmos-quest-service',
        workerJobId: `quest-final-${Date.now()}`,
        conversationId: input.conversationId,
        messageId: `msg-${Date.now()}`,
        sourceEntityId: input.conversationId,
        systemPrompt: promptOutput.systemPrompt,
        userMessage: promptOutput.userPrompt,
        history: promptOutput.conversationHistory,
        temperature: 0.7,
        maxTokens: 50000,
        // V11.0: Use flash for quality synthesis (pro for complex cases)
        modelOverride: 'gemini-2.0-flash',
        // V11.0: Enable streaming if callback provided
        enableStreaming: !!onNarrationChunk,
        onChunk: onNarrationChunk
      },
      request_id: `quest-final-${Date.now()}`
    };

    // Enhanced LLM call with retry logic
    const llmResult = await LLMRetryHandler.executeWithRetry(
      this.llmChatTool,
      llmToolInput,
      { 
        maxAttempts: 3, 
        baseDelay: 1000,
        callType: 'final_response'
      }
    );

    // Parse final response
    const parsedResponse = this.parseFinalResponse(llmResult, executionId, visualization);
    
    // V11.0: Generate and emit stage directions based on visualization entities
    if (onStageDirection && visualization.stage1?.length > 0) {
      this.emitBasicStageDirections(visualization, onStageDirection, executionId);
    }
    
    return parsedResponse;
  }

  /**
   * Emit basic stage directions based on visualization
   * V11.0: Temporary implementation until LLM can generate stage directions
   * TODO: In Phase 2.2 full implementation, parse stage_directions from LLM JSON response
   */
  private emitBasicStageDirections(
    visualization: any,
    onStageDirection: (direction: StageDirection) => void,
    executionId: string
  ): void {
    console.log(`[${executionId}] 🎬 Emitting basic stage directions`);
    
    // Stage 1: Focus on first bright star, dim others
    if (visualization.stage1?.[0]) {
      const firstEntity = visualization.stage1[0];
      
      // Camera focus
      onStageDirection({
        action: 'camera_focus',
        entity_id: firstEntity.entityId,
        offset: [10, 5, 10],
        ease_ms: 800
      });
      
      // Highlight first entity
      onStageDirection({
        action: 'highlight_nodes',
        ids: [firstEntity.entityId],
        mode: 'spotlight',
        dim_others: true,
        ease_ms: 600
      });
    }
    
    // Stage 2: Reveal connections
    if (visualization.stage2?.length > 0) {
      setTimeout(() => {
        const stage2Entity = visualization.stage2[0];
        
        // Reveal stage 2 entity
        onStageDirection({
          action: 'reveal_entities',
          ids: [stage2Entity.entityId],
          layout_hint: visualization.stage1?.[0]?.entityId,
          ease_ms: 1000
        });
        
        // Highlight edge if connected
        if (visualization.stage1?.[0]) {
          onStageDirection({
            action: 'highlight_edges',
            pairs: [[visualization.stage1[0].entityId, stage2Entity.entityId]],
            strength: 1.0,
            ease_ms: 500
          });
        }
      }, 1500); // Delay for narrative pacing
    }
    
    // Stage 3: Dim background for focus
    setTimeout(() => {
      onStageDirection({
        action: 'environment',
        starfield: 'dim',
        vignette_opacity: 0.3,
        fade_ms: 500
      });
    }, 3000);
  }

  /**
   * Parse final response from LLM
   */
  private parseFinalResponse(llmResult: any, executionId: string, visualization: any): {
    response_text: string;
    walkthrough_script: WalkthroughStep[];
    reflective_question: string;
  } {
    const rawText = llmResult.result.text;
    console.log(`[${executionId}] Raw LLM final response (${rawText.length} chars):`, rawText);
    
    try {
      // Extract JSON from LLM response
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("No valid JSON found in LLM response");
      }
      
      let jsonText = rawText.substring(firstBrace, lastBrace + 1).trim();
      
      // Handle truncated JSON by attempting to fix common issues
      if (!jsonText.endsWith('}')) {
        // Try to find the last complete field
        const lastCompleteField = jsonText.lastIndexOf('",');
        if (lastCompleteField > 0) {
          jsonText = jsonText.substring(0, lastCompleteField + 1) + '}';
        }
      }
      
      // Try to fix incomplete reflective_question field
      if (jsonText.includes('"reflective_question": "') && !jsonText.includes('"reflective_question": "', jsonText.lastIndexOf('"reflective_question": "'))) {
        const reflectiveStart = jsonText.lastIndexOf('"reflective_question": "');
        if (reflectiveStart > 0) {
          const beforeReflective = jsonText.substring(0, reflectiveStart);
          const afterReflective = jsonText.substring(reflectiveStart);
          const lastQuote = afterReflective.lastIndexOf('"');
          if (lastQuote > 0) {
            jsonText = beforeReflective + afterReflective.substring(0, lastQuote + 1) + '}';
          } else {
            // If no closing quote, add a default question and close
            jsonText = beforeReflective + '"reflective_question": "What patterns do you notice in these connections?"}';
          }
        }
      }
      
      const parsed = JSON.parse(jsonText);
      
      return {
        response_text: parsed.response_text || "I've explored your memories and found some interesting connections.",
        walkthrough_script: parsed.walkthrough_script || this.generateWalkthroughFromEntities(visualization),
        reflective_question: parsed.reflective_question || "What patterns do you notice in these connections?"
      };
      
    } catch (e) {
      console.error(`[${executionId}] Final response JSON parsing error:`, e);
      console.error(`[${executionId}] Raw response text:`, rawText.substring(0, 500) + '...');
      
      // Fallback response
      return {
        response_text: "I've explored your memories and found some interesting connections. Let me guide you through what I discovered.",
        walkthrough_script: this.generateWalkthroughFromEntities(visualization),
        reflective_question: "What patterns do you notice in these connections?"
      };
    }
  }

  /**
   * Generate walkthrough steps based on actual visualization entities
   */
  private generateWalkthroughFromEntities(visualization: {
    stage1: VisualizationEntity[];
    stage2: VisualizationEntity[];
    stage3: VisualizationEntity[];
  }): WalkthroughStep[] {
    const steps: WalkthroughStep[] = [];
    
    // Step 1: Overview
    steps.push({
      step_number: 1,
      title: "Welcome to Your Memory Cosmos",
      description: "Let's begin our journey through your memories. I'll guide you through the most relevant connections I found.",
      focus_entity_id: "overview",
      duration_seconds: 3,
      camera_position: [0, 0, 50],
      camera_target: [0, 0, 0],
      highlight_color: "#4ecdc4"
    });
    
    // Step 2: Stage 1 entities (bright stars - direct matches)
    if (visualization.stage1.length > 0) {
      const firstEntity = visualization.stage1[0];
      steps.push({
        step_number: 2,
        title: "Exploring Key Connections",
        description: `This bright star represents "${firstEntity.title}" - one of the most relevant memories to your question.`,
        focus_entity_id: firstEntity.entityId,
        duration_seconds: 4,
        camera_position: [
          firstEntity.position[0] + 5,
          firstEntity.position[1] + 5,
          firstEntity.position[2] + 10
        ],
        camera_target: firstEntity.position,
        highlight_color: "#ff6b6b"
      });
    }
    
    // Step 3: Stage 2 entities (medium stars - 1-hop connections)
    if (visualization.stage2.length > 0) {
      const firstEntity = visualization.stage2[0];
      steps.push({
        step_number: 3,
        title: "Discovering Related Memories",
        description: `Now let's explore "${firstEntity.title}" - a connected memory that provides additional context.`,
        focus_entity_id: firstEntity.entityId,
        duration_seconds: 4,
        camera_position: [
          firstEntity.position[0] + 5,
          firstEntity.position[1] + 5,
          firstEntity.position[2] + 10
        ],
        camera_target: firstEntity.position,
        highlight_color: "#45b7d1"
      });
    }
    
    // Step 4: Stage 3 entities (dim stars - 2-hop connections)
    if (visualization.stage3.length > 0) {
      const firstEntity = visualization.stage3[0];
      steps.push({
        step_number: 4,
        title: "Exploring Deeper Connections",
        description: `Let's look at "${firstEntity.title}" - a deeper connection that reveals interesting patterns.`,
        focus_entity_id: firstEntity.entityId,
        duration_seconds: 4,
        camera_position: [
          firstEntity.position[0] + 5,
          firstEntity.position[1] + 5,
          firstEntity.position[2] + 10
        ],
        camera_target: firstEntity.position,
        highlight_color: "#96ceb4"
      });
    }
    
    // Step 5: Final overview
    steps.push({
      step_number: steps.length + 1,
      title: "Reflecting on Patterns",
      description: "Take a moment to observe the patterns and connections between these memories. What insights emerge?",
      focus_entity_id: "overview",
      duration_seconds: 5,
      camera_position: [0, 20, 30],
      camera_target: [0, 0, 0],
      highlight_color: "#feca57"
    });
    
    return steps;
  }

  /**
   * Generate default walkthrough steps with interactive camera movements
   */
  private generateDefaultWalkthrough(): WalkthroughStep[] {
    return [
      {
        step_number: 1,
        title: "Welcome to Your Memory Cosmos",
        description: "Let's begin our journey through your memories. I'll guide you through the most relevant connections I found.",
        focus_entity_id: "overview", // Special ID for overview
        duration_seconds: 3,
        camera_position: [0, 0, 50], // High overview position
        camera_target: [0, 0, 0], // Look at center
        highlight_color: "#4ecdc4"
      },
      {
        step_number: 2,
        title: "Exploring Key Connections",
        description: "These bright stars represent the most relevant memories to your question. Let me show you the first one.",
        focus_entity_id: "stage1_first", // Will be replaced with actual entity ID
        duration_seconds: 4,
        camera_position: [10, 5, 15], // Closer to entities
        camera_target: [0, 0, 0], // Look at entities
        highlight_color: "#ff6b6b"
      },
      {
        step_number: 3,
        title: "Discovering Related Memories",
        description: "Now let's explore the connected memories that provide additional context.",
        focus_entity_id: "stage2_first", // Will be replaced with actual entity ID
        duration_seconds: 4,
        camera_position: [-10, 5, 15], // Different angle
        camera_target: [0, 0, 0],
        highlight_color: "#45b7d1"
      },
      {
        step_number: 4,
        title: "Reflecting on Patterns",
        description: "Take a moment to observe the patterns and connections between these memories.",
        focus_entity_id: "overview", // Back to overview
        duration_seconds: 5,
        camera_position: [0, 20, 30], // High overview
        camera_target: [0, 0, 0],
        highlight_color: "#96ceb4"
      }
    ];
  }

  /**
   * Load user-specific HRT parameters from Redis
   */
  private async loadUserHRTParameters(userId: string): Promise<any> {
    try {
      const key = `hrt_parameters:${userId}`;
      const storedParams = await this.redis.get(key);

      if (!storedParams) {
        // Return default parameters if none found
        return this.getDefaultHRTParameters();
      }

      const parameters = JSON.parse(storedParams);
      
      // Validate the loaded parameters
      this.validateHRTParameters(parameters);
      
      return parameters;
    } catch (error) {
      console.error('Failed to load HRT parameters for user:', userId, error);
      // Return default parameters on error
      return this.getDefaultHRTParameters();
    }
  }

  /**
   * Get default HRT parameters
   */
  private getDefaultHRTParameters(): any {
    return {
      weaviate: {
        resultsPerPhrase: 3,
        similarityThreshold: 0.1,
        timeoutMs: 5000,
      },
      neo4j: {
        maxResultLimit: 100,
        maxGraphHops: 3,
        maxSeedEntities: 10,
        queryTimeoutMs: 10000,
      },
      scoring: {
        topNCandidatesForHydration: 10,
        recencyDecayRate: 0.1,
        diversityThreshold: 0.3,
      },
      scoringWeights: {
        alphaSemanticSimilarity: 0.5,
        betaRecency: 0.3,
        gammaImportanceScore: 0.2,
      },
      performance: {
        maxRetrievalTimeMs: 5000,
        enableParallelProcessing: true,
        cacheResults: true,
      },
      qualityFilters: {
        minimumRelevanceScore: 0.1,
        dedupeSimilarResults: true,
        boostRecentContent: true,
      },
    };
  }

  /**
   * Validate HRT parameters
   */
  private validateHRTParameters(parameters: any): void {
    // Basic validation - ensure required fields exist
    if (!parameters.weaviate || !parameters.neo4j || !parameters.scoring || !parameters.scoringWeights) {
      throw new Error('Invalid HRT parameters: missing required sections');
    }

    // Validate scoring weights sum to 1.0
    const { alphaSemanticSimilarity, betaRecency, gammaImportanceScore } = parameters.scoringWeights;
    const total = alphaSemanticSimilarity + betaRecency + gammaImportanceScore;
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Invalid scoring weights: must sum to 1.0 (current: ${total.toFixed(3)})`);
    }
  }
}
