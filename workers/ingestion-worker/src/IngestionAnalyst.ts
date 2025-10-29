import { 
  DatabaseService, 
  ConversationRepository, 
  UserRepository,
  MemoryRepository,
  ConceptRepository,
  GrowthEventRepository,
  DerivedArtifactRepository,
  CommunityRepository,
  ProactivePromptRepository
} from '@2dots1line/database';
import { ConfigService } from '@2dots1line/config-service';
import type { 
  CreateMemoryUnitData, 
  CreateConceptData, 
  CreateGrowthEventData 
} from '@2dots1line/database';
import { HolisticAnalysisTool, HolisticAnalysisOutput, SemanticSimilarityTool } from '@2dots1line/tools';
import type { SemanticSimilarityInput, SemanticSimilarityResult } from '@2dots1line/tools';
import { getEntityTypeMapping, RelationshipUtils } from '@2dots1line/core-utils';
import { Job , Queue } from 'bullmq';

export interface IngestionJobData {
  conversationId: string;
  userId: string;
}

// HRT Deduplication Types
export interface DeduplicationDecision {
  candidate: any;
  existingEntity: any; // Hydrated entity from HRT, not just ScoredEntity
  similarityScore: number;
}

export interface DeduplicationDecisions {
  conceptsToCreate: any[];
  conceptsToReuse: DeduplicationDecision[];
  memoryUnitsToCreate: any[];
  memoryUnitsToReuse: DeduplicationDecision[];
  entityMappings: Map<string, string>; // Maps candidate entity names to actual entity IDs
}

export class IngestionAnalyst {
  private conversationRepository: ConversationRepository;
  private userRepository: UserRepository;
  private memoryRepository: MemoryRepository;
  private conceptRepository: ConceptRepository;
  private growthEventRepository: GrowthEventRepository;
  private derivedArtifactRepository: DerivedArtifactRepository;
  private communityRepository: CommunityRepository;
  private proactivePromptRepository: ProactivePromptRepository;
  private configService: ConfigService;

  constructor(
    private holisticAnalysisTool: HolisticAnalysisTool,
    private semanticSimilarityTool: SemanticSimilarityTool,
    private dbService: DatabaseService,
    private embeddingQueue: Queue,
    private cardQueue: Queue,
    private graphQueue: Queue
  ) {
    this.conversationRepository = new ConversationRepository(dbService);
    this.userRepository = new UserRepository(dbService);
    this.memoryRepository = new MemoryRepository(dbService);
    this.conceptRepository = new ConceptRepository(dbService);
    this.growthEventRepository = new GrowthEventRepository(dbService);
    this.derivedArtifactRepository = new DerivedArtifactRepository(dbService);
    this.communityRepository = new CommunityRepository(dbService);
    this.proactivePromptRepository = new ProactivePromptRepository(dbService);
    this.configService = new ConfigService();
  }

  async initialize(): Promise<void> {
    await this.configService.initialize();
  }

  async processConversation(job: Job<IngestionJobData>) {
    const { conversationId, userId } = job.data;
    
    console.log(`[IngestionAnalyst] Processing conversation ${conversationId} for user ${userId}`);

    try {
      // First verify the conversation exists
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        console.error(`[IngestionAnalyst] Conversation ${conversationId} not found - skipping processing`);
        return;
      }
      
      console.log(`[IngestionAnalyst] Conversation found, status: ${conversation.status}`);
      // Phase I: Data Gathering & Preparation
      const { fullConversationTranscript, userMemoryProfile, userName } = 
        await this.gatherContextData(conversationId, userId);

      // Phase II: The "Single Synthesis" LLM Call (LLMRetryHandler handles LLM retries internally)
      const analysisOutput = await this.holisticAnalysisTool.execute({
        userId,
        userName,
        fullConversationTranscript,
        userMemoryProfile,
        workerType: 'ingestion-worker',
        workerJobId: job.id || 'unknown',
        conversationId,
        messageId: undefined // Not applicable for conversation-level analysis
      });

      console.log(`[IngestionAnalyst] Analysis completed with importance score: ${analysisOutput.persistence_payload.conversation_importance_score}`);

      // Phase III: Semantic Similarity Deduplication
      const deduplicationDecisions = await this.performSemanticDeduplication(userId, analysisOutput);

      // Phase IV: Enhanced Persistence with Deduplication
      const newEntities = await this.persistAnalysisResultsWithDeduplication(conversationId, userId, analysisOutput, deduplicationDecisions);

      // Phase V: Update Conversation Title
      await this.updateConversationTitle(conversationId, analysisOutput.persistence_payload.conversation_title);
      
      // Phase VI: Event Publishing
      await this.publishEvents(userId, newEntities);

      console.log(`[IngestionAnalyst] Successfully processed conversation ${conversationId}, created ${newEntities.length} new entities`);
      
    } catch (error) {
      console.error(`[IngestionAnalyst] Error processing conversation ${conversationId}:`, error);
      
        // Update conversation with error information
        await this.conversationRepository.update(conversationId, {
        content: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
          importance_score: 0,
          status: 'failed'
        });
        
      // All errors are non-retryable at BullMQ level - only LLM retries are handled by LLMRetryHandler
      console.error(`[IngestionAnalyst] 🔴 JOB FAILED - BullMQ retries disabled`);
      console.error(`[IngestionAnalyst] Error type: ${error instanceof Error ? error.name : 'Unknown'}`);
      console.error(`[IngestionAnalyst] Error message: ${error instanceof Error ? error.message : String(error)}`);
      
      // Log specific error categorization for debugging
      if (error instanceof Error) {
        if (error.message.includes('503') || error.message.includes('server overload')) {
          console.error(`[IngestionAnalyst] LLM service overload - this should have been retried by LLMRetryHandler`);
        } else if (error.message.includes('database') || error.message.includes('postgres') || error.message.includes('neo4j')) {
          console.error(`[IngestionAnalyst] Database error - this is NOT retryable at BullMQ level`);
        } else if (error.message.includes('validation') || error.message.includes('schema')) {
          console.error(`[IngestionAnalyst] Validation error - this is NOT retryable at BullMQ level`);
        } else {
          console.error(`[IngestionAnalyst] Unknown error type - manual investigation required`);
        }
      }
      
      const nonRetryableError = new Error(`NON_RETRYABLE: ${error instanceof Error ? error.message : String(error)}`);
      nonRetryableError.name = 'NonRetryableError';
      throw nonRetryableError;
    }
  }

  private async gatherContextData(conversationId: string, userId: string) {
    // Fetch full transcript with media content
    const messages = await this.conversationRepository.getMessages(conversationId);
    
    // Build comprehensive transcript including media content
    const fullConversationTranscript = messages
      .map(msg => {
        let messageContent = `${msg.type.toUpperCase()}: ${msg.content}`;
        
        // Add media information if present
        if (msg.media_ids && msg.media_ids.length > 0) {
          messageContent += `\n[Media attachments: ${msg.media_ids.length} file(s)]`;
        }
        
        return messageContent;
      })
      .join('\n');

    console.log(`[IngestionAnalyst] Built transcript with ${messages.length} messages (${fullConversationTranscript.length} chars)`);

    // Fetch user context
    const user = await this.userRepository.findById(userId);
    const userMemoryProfile = user?.memory_profile || null;
    const userName = user?.name || 'User';

    return {
      fullConversationTranscript,
      userMemoryProfile,
      userName
    };
  }


  /**
   * Enhanced persistence with deduplication decisions
   * This method modifies the existing persistAnalysisResults to handle entity reuse
   */
  private async persistAnalysisResultsWithDeduplication(
    conversationId: string, 
    userId: string, 
    analysisOutput: HolisticAnalysisOutput,
    deduplicationDecisions: DeduplicationDecisions
  ): Promise<Array<{ id: string; type: string }>> {
    
    const { persistence_payload, forward_looking_context } = analysisOutput;
    
    console.log(`🔍 [IngestionAnalyst] DEBUG: Starting enhanced persistence for conversation ${conversationId}`);
    console.log(`🔍 [IngestionAnalyst] DEBUG: Importance score: ${persistence_payload.conversation_importance_score}`);
    console.log(`🔍 [IngestionAnalyst] DEBUG: Concepts to create: ${deduplicationDecisions.conceptsToCreate.length}, to reuse: ${deduplicationDecisions.conceptsToReuse.length}`);
    console.log(`🔍 [IngestionAnalyst] DEBUG: Memory units to create: ${deduplicationDecisions.memoryUnitsToCreate.length}, to reuse: ${deduplicationDecisions.memoryUnitsToReuse.length}`);

    // Check importance score threshold
    const minThreshold = await this.configService.getOperationalParameter('ingestion.min_importance_score_threshold', 1);
    if (persistence_payload.conversation_importance_score < minThreshold) {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Importance score ${persistence_payload.conversation_importance_score} below threshold ${minThreshold}, skipping entity creation`);
      
      // Update conversation with context fields
      await this.conversationRepository.update(conversationId, {
        content: persistence_payload.conversation_summary,
        importance_score: persistence_payload.conversation_importance_score,
        status: 'processed',
        proactive_greeting: forward_looking_context.proactive_greeting,
        forward_looking_context: forward_looking_context
      });
      
      return [];
    }

    console.log(`🔍 [IngestionAnalyst] DEBUG: Importance score above threshold, proceeding with entity creation`);

    // Start transaction for high-importance conversations
    const newEntities: Array<{ id: string; type: string }> = [];

    try {
      // Update conversation
      await this.conversationRepository.update(conversationId, {
        content: persistence_payload.conversation_summary,
        importance_score: persistence_payload.conversation_importance_score,
        status: 'processed'
      });

      console.log(`🔍 [IngestionAnalyst] DEBUG: Conversation updated successfully`);

      // Use existing Neo4j transaction pattern
      if (!this.dbService.neo4j) {
        console.warn(`[IngestionAnalyst] Neo4j client not available, skipping Neo4j operations`);
        return [];
      }

      const neo4jSession = this.dbService.neo4j.session();
      const neo4jTransaction = neo4jSession.beginTransaction();

      try {
        // ENHANCED: Process memory units with deduplication decisions
        for (const memoryUnit of deduplicationDecisions.memoryUnitsToCreate) {
          const createdMemory = await this.createEntityWithNeo4j(
            'MemoryUnit',
            {
              user_id: userId,
              title: memoryUnit.title,
              content: memoryUnit.content,
              importance_score: memoryUnit.importance_score || persistence_payload.conversation_importance_score || 5,
              sentiment_score: memoryUnit.sentiment_score || 0,
              source_conversation_id: conversationId
            },
            neo4jTransaction,
            userId
          );
          
          newEntities.push({ id: createdMemory.entity_id, type: 'MemoryUnit' });
          
          // Update entity mapping - map title to the actual memory unit ID
          deduplicationDecisions.entityMappings.set(memoryUnit.title, createdMemory.entity_id);
        }

        // ENHANCED: Process memory units to reuse (update existing)
        for (const decision of deduplicationDecisions.memoryUnitsToReuse) {
          // Get the correct memory unit ID from the existing entity
          const memoryUnitId = decision.existingEntity.entityId;
          
          console.log(`🔍 [IngestionAnalyst] DEBUG: Reusing memory unit ${decision.candidate.title} with ID: ${memoryUnitId}`);
          
          if (!memoryUnitId) {
            console.warn(`🔍 [IngestionAnalyst] WARNING: No memory unit ID found for ${decision.candidate.title}, skipping update`);
            continue;
          }
          
          // Update existing memory unit with incremental insights
          await this.memoryRepository.update(memoryUnitId, {
            content: `${decision.candidate.content}`, // Use the new content
            importance_score: Math.max(0, decision.candidate.importance_score || 0)
          });
          
          // Update entity mapping - map title to the actual memory unit ID
          deduplicationDecisions.entityMappings.set(decision.candidate.title, memoryUnitId);
        }

        // ENHANCED: Process concepts with deduplication decisions
        for (const concept of deduplicationDecisions.conceptsToCreate) {
          const createdConcept = await this.createEntityWithNeo4j(
            'Concept',
            {
              user_id: userId,
              title: concept.title,
              type: concept.type || 'theme',
              content: concept.content || `Concept extracted from conversation: ${concept.title}`,
              importance_score: concept.importance_score || 0.5
            },
            neo4jTransaction,
            userId
          );
          
          newEntities.push({ id: createdConcept.entity_id, type: 'Concept' });
          
          // Update entity mapping
          deduplicationDecisions.entityMappings.set(concept.title, createdConcept.entity_id);
        }

        // ENHANCED: Process concepts to reuse (update existing)
        for (const decision of deduplicationDecisions.conceptsToReuse) {
          // Get the correct concept ID from the existing entity
          const conceptId = decision.existingEntity.entityId;
          
          console.log(`🔍 [IngestionAnalyst] DEBUG: Reusing concept ${decision.candidate.title} with ID: ${conceptId}`);
          
          if (!conceptId) {
            console.warn(`🔍 [IngestionAnalyst] WARNING: No concept ID found for ${decision.candidate.title}, skipping update`);
            continue;
          }
          
          // Update existing concept with incremental insights - append with timestamp
          // Only update active concepts, not merged ones
          const currentConcept = await this.conceptRepository.findById(conceptId);
          if (!currentConcept) {
            console.warn(`🔍 [IngestionAnalyst] WARNING: Concept ${conceptId} not found, skipping description update`);
            continue;
          }
          
          const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          const newDescription = currentConcept.content 
            ? `${currentConcept.content}\n[${timestamp}] ${decision.candidate.content}`
            : `[${timestamp}] ${decision.candidate.content}`;

          await this.conceptRepository.update(conceptId, {
            content: newDescription,
            updated_at: new Date()
          });
          
          // Update entity mapping
          deduplicationDecisions.entityMappings.set(decision.candidate.title, conceptId);
        }

        // ENHANCED: Process relationships with entity mapping
        if (persistence_payload.new_relationships && persistence_payload.new_relationships.length > 0) {
          await this.createNeo4jRelationshipsInTransactionWithMapping(
            neo4jTransaction, 
            userId, 
            persistence_payload.new_relationships,
            deduplicationDecisions.entityMappings
          );
        }

        // Process growth events (unchanged - always created as new)
        if (persistence_payload.detected_growth_events && persistence_payload.detected_growth_events.length > 0) {
          for (const growthEvent of persistence_payload.detected_growth_events) {
            const growthData: CreateGrowthEventData = {
              user_id: userId,
              title: growthEvent.title, // Include title from LLM output
              source_memory_unit_ids: growthEvent.source_memory_unit_ids || [],
              source_concept_ids: growthEvent.source_concept_ids || [],
              source: 'IngestionAnalyst',
              metadata: {
                entity_id: conversationId,
                entity_type: 'conversation'
              },
              type: growthEvent.type,
              delta_value: growthEvent.delta,
              content: growthEvent.content
            };

            const createdGrowthEvent = await this.growthEventRepository.create(growthData);
            newEntities.push({ id: createdGrowthEvent.entity_id, type: 'GrowthEvent' });
          }
        }

        // Commit Neo4j transaction
        await neo4jTransaction.commit();

      } catch (error) {
        await neo4jTransaction.rollback();
        throw error;
      } finally {
        await neo4jSession.close();
      }

      // Update conversation with context fields
      await this.conversationRepository.update(conversationId, {
        proactive_greeting: forward_looking_context.proactive_greeting,
        forward_looking_context: forward_looking_context
      });

      return newEntities;
      
    } catch (error) {
      console.error(`[IngestionAnalyst] Error in enhanced persistence:`, error);
      
      // Handle specific conversation not found error
      if (error instanceof Error && error.message.includes('not found')) {
        console.error(`[IngestionAnalyst] Conversation ${conversationId} not found - this may indicate a race condition or data inconsistency`);
        // Don't throw the error, just log it and continue
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Enhanced relationship creation with entity mapping
   */
  private async createNeo4jRelationshipsInTransactionWithMapping(
    transaction: any, 
    userId: string, 
    relationships: any[],
    entityMappings: Map<string, string>
  ): Promise<void> {
    
    for (const relationship of relationships) {
      const sourceId = this.resolveEntityIdWithMapping(relationship.source_entity_id_or_name, entityMappings);
      const targetId = this.resolveEntityIdWithMapping(relationship.target_entity_id_or_name, entityMappings);
      
      // Use existing relationship creation logic with resolved IDs
      await this.createNeo4jRelationshipsInTransaction(transaction, [{
        source_entity_id_or_name: sourceId,
        target_entity_id_or_name: targetId,
        relationship_type: relationship.relationship_type,
        relationship_description: relationship.relationship_description
      }], entityMappings, userId);
    }
  }

  private resolveEntityIdWithMapping(entityNameOrId: string, entityMappings: Map<string, string>): string {
    // If it's already an ID, return as-is
    if (entityNameOrId.startsWith('concept_') || entityNameOrId.startsWith('memory_')) {
      return entityNameOrId;
    }
    
    // If it's a UUID, treat it as an existing entity ID
    if (this.isUUID(entityNameOrId)) {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Entity "${entityNameOrId}" is a UUID, treating as existing entity ID`);
      return entityNameOrId;
    }
    
    // Otherwise, look up in entity mappings
    return entityMappings.get(entityNameOrId) || entityNameOrId;
  }


  /**
   * Check if an entity name is a growth dimension
   * Growth dimensions are the HRT framework dimensions: act_self, know_world, etc.
   */
  private isGrowthDimension(entityName: string): boolean {
    const growthDimensions = ['act_self', 'know_world', 'act_world', 'know_self'];
    return growthDimensions.includes(entityName);
  }

  /**
   * Check if a string is a valid UUID
   */
  private isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Perform semantic deduplication to identify entities to reuse vs create
   */
  private async performSemanticDeduplication(
    userId: string, 
    analysisOutput: HolisticAnalysisOutput
  ): Promise<DeduplicationDecisions> {
    console.log(`🔍 [IngestionAnalyst] Starting semantic deduplication for user ${userId}`);
    
    const decisions: DeduplicationDecisions = {
      conceptsToCreate: [],
      conceptsToReuse: [],
      memoryUnitsToCreate: [],
      memoryUnitsToReuse: [],
      entityMappings: new Map()
    };

    try {
      // Process concepts
      if (analysisOutput.persistence_payload.extracted_concepts) {
        const conceptNames = analysisOutput.persistence_payload.extracted_concepts.map(c => c.title);
        const conceptResults = await this.semanticSimilarityTool.execute({
          candidateNames: conceptNames,
          entityTypes: ['concept'],
          userId
        });
        
        this.processSemanticSimilarityResults(conceptResults, decisions, 'concept', analysisOutput);
      }

      // Process memory units
      if (analysisOutput.persistence_payload.extracted_memory_units) {
        const memoryTextContent = analysisOutput.persistence_payload.extracted_memory_units.map(m => `${m.title}\n${m.content}`);
        const memoryResults = await this.semanticSimilarityTool.execute({
          candidateNames: memoryTextContent,
          entityTypes: ['memory_unit'],
          userId
        });

        this.processSemanticSimilarityResults(memoryResults, decisions, 'memory_unit', analysisOutput);
      }

      console.log(`🔍 [IngestionAnalyst] Deduplication complete: ${decisions.conceptsToCreate.length} concepts to create, ${decisions.conceptsToReuse.length} to reuse, ${decisions.memoryUnitsToCreate.length} memory units to create, ${decisions.memoryUnitsToReuse.length} to reuse`);
      
      return decisions;
    } catch (error) {
      console.error(`[IngestionAnalyst] Error in semantic deduplication:`, error);
      throw error;
    }
  }

  /**
   * Process semantic similarity results and populate deduplication decisions
   */
  private processSemanticSimilarityResults(
    results: any[], 
    decisions: DeduplicationDecisions, 
    entityType: 'concept' | 'memory_unit',
    analysisOutput: HolisticAnalysisOutput
  ): void {
    if (!results || results.length === 0) {
      console.log(`🔍 [IngestionAnalyst] No similarity results for ${entityType}`);
      return;
    }

    for (const similarityResult of results) {
      if (similarityResult.bestMatch && similarityResult.bestMatch.similarityScore > 0.8) {
        // Reuse existing entity
        if (entityType === 'concept') {
          // Find the original concept data by title
          const originalConcept = analysisOutput.persistence_payload.extracted_concepts?.find(c => c.title === similarityResult.candidateName);
          if (originalConcept) {
            decisions.conceptsToReuse.push({
              candidate: originalConcept,
              existingEntity: similarityResult.bestMatch,
              similarityScore: similarityResult.bestMatch.similarityScore
            });
            // Map candidate name to the existing entity ID
            decisions.entityMappings.set(similarityResult.candidateName, similarityResult.bestMatch.entityId);
          }
        } else {
          // Find the original memory unit data by textContent
          const originalMemory = analysisOutput.persistence_payload.extracted_memory_units?.find(m => `${m.title}\n${m.content}` === similarityResult.candidateName);
          if (originalMemory) {
            decisions.memoryUnitsToReuse.push({
              candidate: originalMemory,
              existingEntity: similarityResult.bestMatch,
              similarityScore: similarityResult.bestMatch.similarityScore
            });
            // Map candidate name to the existing entity ID
            decisions.entityMappings.set(similarityResult.candidateName, similarityResult.bestMatch.entityId);
          }
        }
      } else {
        // Create new entity - we'll need to find the original entity data
        if (entityType === 'concept') {
          // Find the original concept data by title
          const originalConcept = analysisOutput.persistence_payload.extracted_concepts?.find(c => c.title === similarityResult.candidateName);
          if (originalConcept) {
            decisions.conceptsToCreate.push(originalConcept);
            // Map title to placeholder ID
            decisions.entityMappings.set(originalConcept.title, `new_concept_${originalConcept.title}`);
          }
        } else {
          // Find the original memory unit data by textContent
          const originalMemory = analysisOutput.persistence_payload.extracted_memory_units?.find(m => `${m.title}\n${m.content}` === similarityResult.candidateName);
          if (originalMemory) {
            decisions.memoryUnitsToCreate.push(originalMemory);
            // Map title to placeholder ID
            decisions.entityMappings.set(originalMemory.title, `new_memory_${originalMemory.title}`);
          }
        }
      }
    }
  }

  /**
   * Update conversation title
   */
  private async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      await this.conversationRepository.update(conversationId, {
        title: title
      });
      console.log(`🔍 [IngestionAnalyst] Updated conversation title: ${title}`);
    } catch (error) {
      console.error(`[IngestionAnalyst] Error updating conversation title:`, error);
      throw error;
    }
  }

  /**
   * Generic method to fetch entity by type and ID
   */
  private async fetchEntityByType(entityType: string, entityId: string): Promise<any> {
    try {
      switch (entityType) {
        case 'MemoryUnit':
          return await this.memoryRepository.findById(entityId);
        case 'Concept':
          return await this.conceptRepository.findById(entityId);
        case 'GrowthEvent':
          return await this.growthEventRepository.findById(entityId);
        case 'DerivedArtifact':
          return await this.derivedArtifactRepository.findById(entityId);
        case 'Community':
          return await this.dbService.prisma.communities.findUnique({
            where: { entity_id: entityId }
          });
        case 'ProactivePrompt':
          return await this.proactivePromptRepository.findById(entityId);
        case 'User':
          return await this.userRepository.findById(entityId);
        default:
          console.warn(`[IngestionAnalyst] Unknown entity type: ${entityType}`);
          return null;
      }
    } catch (error) {
      console.error(`[IngestionAnalyst] Error fetching ${entityType} ${entityId}:`, error);
      return null;
    }
  }

  /**
   * Generic method to extract text content from any entity
   */
  private extractTextContent(entity: any, entityType: string): string {
    if (!entity) return '';

    switch (entityType) {
      case 'MemoryUnit':
        return `${entity.title}\n${entity.content}`;
      case 'Concept':
        return entity.title || '';
      case 'GrowthEvent':
        const details = entity.metadata as any;
        return `${entity.type} Growth Event: ${details?.content || entity.content || 'Growth event recorded'}`;
      case 'DerivedArtifact':
        return `${entity.title}\n\n${entity.content || 'Derived artifact content'}`;
      case 'Community':
        return `${entity.title}: ${entity.content || 'Community description'}`;
      case 'ProactivePrompt':
        return `Proactive Prompt: ${entity.content || 'Prompt content'}`;
      case 'User':
        return `${entity.name || entity.email}: User profile`;
      default:
        return '';
    }
  }

  /**
   * Publish events for new entities
   */
  private async publishEvents(userId: string, newEntities: Array<{ id: string; type: string }>) {
    // Publish embedding jobs for each new entity
    for (const entity of newEntities) {
      const entityData = await this.fetchEntityByType(entity.type, entity.id);
      const textContent = this.extractTextContent(entityData, entity.type);

      if (textContent) {
        await this.embeddingQueue.add('create_embedding', {
          entityId: entity.id,
          entityType: entity.type,
          textContent,
          userId
        });
        
        console.log(`[IngestionAnalyst] Queued embedding job for ${entity.type} ${entity.id}`);
      } else {
        console.warn(`[IngestionAnalyst] ⚠️ No text content found for ${entity.type} ${entity.id}, skipping embedding`);
      }
    }

    // Publish new_entities_created event for both card and graph generation
    if (newEntities.length > 0) {
      const eventPayload = {
        type: 'new_entities_created',
        userId,
        entities: newEntities,
        source: 'IngestionAnalyst'
      };

      // Publish to card queue (cards can be created immediately)
      await this.cardQueue.add('new_entities_created', eventPayload);
      console.log(`[IngestionAnalyst] Published new_entities_created event to card-queue for ${newEntities.length} entities`);

      // Publish to graph queue (graph projection will wait for embeddings)
      await this.graphQueue.add('new_entities_created', eventPayload);
      console.log(`[IngestionAnalyst] Published new_entities_created event to graph-queue for ${newEntities.length} entities`);
    }
  }

  /**
   * Generic method to create entity with Neo4j node in transaction
   */
  private async createEntityWithNeo4j(
    entityType: string, 
    entityData: any, 
    neo4jTransaction: any, 
    userId: string
  ): Promise<any> {
    let createdEntity;
    
    // Create entity in database
    switch (entityType) {
      case 'MemoryUnit':
        createdEntity = await this.memoryRepository.create(entityData);
        break;
      case 'Concept':
        createdEntity = await this.conceptRepository.create(entityData);
        break;
      case 'GrowthEvent':
        createdEntity = await this.growthEventRepository.create(entityData);
        break;
      case 'DerivedArtifact':
        createdEntity = await this.derivedArtifactRepository.create(entityData);
        break;
      case 'Community':
        createdEntity = await this.dbService.prisma.communities.create({
          data: entityData
        });
        break;
      case 'ProactivePrompt':
        createdEntity = await this.proactivePromptRepository.create(entityData);
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    // Create Neo4j node with standardized properties (V11.0 schema compliance)
    const neo4jProperties = {
      entity_id: createdEntity.entity_id,  // ✅ FIXED: Use entity_id instead of id
      user_id: userId,                     // ✅ FIXED: Use user_id instead of userId
      entity_type: entityType,             // ✅ FIXED: Add missing entity_type field
      title: createdEntity.title,
      content: createdEntity.content,
      importance_score: createdEntity.importance_score,
      created_at: new Date().toISOString(),
      source: 'IngestionAnalyst',
      ...entityData // Include any additional properties
    };
    
    // Add type-specific properties
    if (entityType === 'MemoryUnit') {
      neo4jProperties.sentiment_score = createdEntity.sentiment_score;
      neo4jProperties.source_conversation_id = createdEntity.source_conversation_id;
    } else if (entityType === 'Concept') {
      neo4jProperties.type = createdEntity.type;
      neo4jProperties.status = createdEntity.status;
      neo4jProperties.community_id = createdEntity.community_id;
    }
    
    await this.createNeo4jNodeInTransaction(neo4jTransaction, entityType, neo4jProperties);
    
    return createdEntity;
  }

  /**
   * Create Neo4j node in transaction
   */
  private async createNeo4jNodeInTransaction(transaction: any, label: string, properties: any): Promise<void> {
    const cypher = `CREATE (n:${label} $props)`;
    await transaction.run(cypher, { props: properties });
  }

  /**
   * Validate relationship type and description coherence
   */
  private validateRelationshipCoherence(type: string, description: string): boolean {
    const coherenceMap: Record<string, string[]> = {
      'INFLUENCES': ['influenced by', 'influences', 'shapes', 'affects', 'impacts'],
      'CAUSES': ['causes', 'leads to', 'results in', 'brings about', 'triggers'],
      'IS_SIMILAR_TO': ['similar to', 'like', 'resembles', 'comparable to', 'analogous to'],
      'INSPIRES': ['inspires', 'is inspired by', 'motivates', 'encourages'],
      'CONTRIBUTES_TO': ['contributes to', 'evidences', 'supports', 'demonstrates', 'shows'],
      'IS_A_TYPE_OF': ['is a type of', 'is a kind of', 'is a form of', 'is a variety of'],
      'IS_PART_OF': ['is part of', 'belongs to', 'is included in', 'is a component of'],
      'PRECEDES': ['precedes', 'comes before', 'happens before', 'leads up to'],
      'FOLLOWS': ['follows', 'comes after', 'happens after', 'succeeds'],
      'ENABLES': ['enables', 'allows', 'makes possible', 'facilitates'],
      'PREVENTS': ['prevents', 'stops', 'blocks', 'hinders', 'avoids'],
      'EXEMPLIFIES_TRAIT': ['exemplifies', 'demonstrates', 'shows', 'represents'],
      'SUPPORTS_VALUE': ['supports', 'aligns with', 'reinforces', 'upholds'],
      'IS_MILESTONE_FOR': ['is a milestone for', 'marks', 'represents a milestone in'],
      'IS_METAPHOR_FOR': ['is a metaphor for', 'represents', 'symbolizes'],
      'REPRESENTS_SYMBOLICALLY': ['represents symbolically', 'symbolizes', 'stands for'],
      'RELATED_TO': [] // RELATED_TO can have any description
    };
    
    const allowedPatterns = coherenceMap[type];
    if (!allowedPatterns || allowedPatterns.length === 0) {
      return true; // Allow RELATED_TO and unknown types
    }
    
    const descriptionLower = description.toLowerCase();
    return allowedPatterns.some(pattern => descriptionLower.includes(pattern));
  }

  /**
   * Create Neo4j relationships in transaction
   */
  private async createNeo4jRelationshipsInTransaction(
    transaction: any, 
    relationships: Array<{
      source_entity_id_or_name: string;
      target_entity_id_or_name: string;
      relationship_type: string;
      relationship_description: string;
      strength?: number;
    }>,
    entityMappings: Map<string, string>,
    userId: string
  ): Promise<void> {
    for (const relationship of relationships) {
      const sourceId = this.resolveEntityIdWithMapping(relationship.source_entity_id_or_name, entityMappings);
      const targetId = this.resolveEntityIdWithMapping(relationship.target_entity_id_or_name, entityMappings);

      if (sourceId && targetId) {
        // Validate relationship type and description coherence
        const isCoherent = this.validateRelationshipCoherence(
          relationship.relationship_type, 
          relationship.relationship_description
        );
        
        if (!isCoherent) {
          console.warn(`[IngestionAnalyst] ⚠️ Relationship type-description mismatch: "${relationship.relationship_type}" vs "${relationship.relationship_description}"`);
          // Continue with creation but log the warning
        }
        
        // Generate complete relationship properties
        const relationshipProps = RelationshipUtils.createRelationshipProps(
          relationship.relationship_type,
          'ingestion',
          userId,
          { 
            strength: relationship.strength ?? 0.5, // Use LLM-provided strength or default
            description: relationship.relationship_description 
          }
        );
        
        const cypher = `
          MATCH (source), (target)
          WHERE (source.entity_id = $sourceId)
            AND (target.entity_id = $targetId)
          CREATE (source)-[r:${relationship.relationship_type} {
            relationship_id: $relationshipId,
            relationship_type: $relationshipType,
            created_at: $createdAt,
            user_id: $userId,
            source_agent: $sourceAgent,
            strength: $strength,
            description: $description
          }]->(target)
        `;
        
        await transaction.run(cypher, {
          sourceId,
          targetId,
          relationshipId: relationshipProps.relationship_id,
          relationshipType: relationshipProps.relationship_type,
          createdAt: relationshipProps.created_at,
          userId: relationshipProps.user_id,
          sourceAgent: relationshipProps.source_agent,
          strength: relationshipProps.strength,
          description: relationshipProps.description
        });
        
        console.log(`[IngestionAnalyst] ✅ Created relationship: ${sourceId} -[${relationship.relationship_type}]-> ${targetId} (ID: ${relationshipProps.relationship_id})`);
      }
    }
  }

  /**
   * Map relationship ID to actual node ID using centralized entity mapping
   */
  private async mapRelationshipIdToNodeId(entityIdOrName: string, userId: string): Promise<string | null> {
    // If it's already an ID, return as-is
    if (entityIdOrName.startsWith('concept_')) {
      return entityIdOrName;
    }

    // If it's a UUID, it's likely a concept ID, so return it directly
    if (this.isUUID(entityIdOrName)) {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Mapped ID "${entityIdOrName}" is a UUID, treating as concept ID`);
      return entityIdOrName;
    }

    // Don't create concepts for growth dimensions
    if (this.isGrowthDimension(entityIdOrName)) {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Skipping concept creation for growth dimension: ${entityIdOrName}`);
      return null;
    }

    // Try to find existing entity by name using generic search
    const entityId = await this.findExistingEntityByName(entityIdOrName, userId);
    if (entityId) {
      return entityId;
    }
    
    // Auto-create concept as fallback
    console.log(`🔍 [IngestionAnalyst] DEBUG: Auto-creating concept for: ${entityIdOrName}`);
    const createdConcept = await this.conceptRepository.create({
      user_id: userId,
      title: entityIdOrName,
      type: 'auto_generated',
      content: `Auto-generated concept from relationship: ${entityIdOrName}`,
      importance_score: 0.5
    });

    return createdConcept.entity_id;
  }

  /**
   * Generic method to find existing entity by name
   */
  private async findExistingEntityByName(entityName: string, userId: string): Promise<string | null> {
    // Try to find existing concept by name
    const concepts = await this.conceptRepository.searchByName(userId, entityName, 1);
    if (concepts.length > 0) {
      return concepts[0].entity_id;
    }

    // Try to find existing memory unit by title
    const memories = await this.memoryRepository.searchByContent(userId, entityName, 1);
    if (memories.length > 0) {
      return memories[0].entity_id;
    }

    // Try to find existing growth event by entity_id
    const growthEvent = await this.growthEventRepository.findById(entityName);
    if (growthEvent) {
      return growthEvent.entity_id;
    }

    return null;
  }



}
