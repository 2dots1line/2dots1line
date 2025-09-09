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
import type { 
  CreateMemoryUnitData, 
  CreateConceptData, 
  CreateGrowthEventData 
} from '@2dots1line/database';
import { HolisticAnalysisTool, HolisticAnalysisOutput, SemanticSimilarityTool } from '@2dots1line/tools';
import type { SemanticSimilarityInput, SemanticSimilarityResult } from '@2dots1line/tools';
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
  }

  async processConversation(job: Job<IngestionJobData>) {
    const { conversationId, userId } = job.data;
    
    console.log(`[IngestionAnalyst] Processing conversation ${conversationId} for user ${userId}`);

    try {
      // Phase I: Data Gathering & Preparation
      const { fullConversationTranscript, userMemoryProfile, knowledgeGraphSchema, userName } = 
        await this.gatherContextData(conversationId, userId);

      // Phase II: The "Single Synthesis" LLM Call
      const analysisOutput = await this.holisticAnalysisTool.execute({
        userId,
        userName,
        fullConversationTranscript,
        userMemoryProfile,
        knowledgeGraphSchema,
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
        context_summary: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
          importance_score: 0,
          status: 'failed'
        });
        
      // All errors should be treated as non-retryable at the BullMQ level
      // LLM retries are handled by LLMChatTool internally
      // Database/validation errors shouldn't be retried
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
        let messageContent = `${msg.role.toUpperCase()}: ${msg.content}`;
        
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
    const knowledgeGraphSchema = user?.knowledge_graph_schema || null;
    const userName = user?.name || 'User';

    return {
      fullConversationTranscript,
      userMemoryProfile,
      knowledgeGraphSchema,
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
    if (persistence_payload.conversation_importance_score < 1) {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Importance score ${persistence_payload.conversation_importance_score} below threshold, skipping entity creation`);
      
      // Update conversation only
      await this.conversationRepository.update(conversationId, {
        context_summary: persistence_payload.conversation_summary,
        importance_score: persistence_payload.conversation_importance_score,
        status: 'processed'
      });

      // Update user's next conversation context
      await this.userRepository.update(userId, {
        next_conversation_context_package: forward_looking_context
      });
      
      return [];
    }

    console.log(`🔍 [IngestionAnalyst] DEBUG: Importance score above threshold, proceeding with entity creation`);

    // Start transaction for high-importance conversations
    const newEntities: Array<{ id: string; type: string }> = [];

    try {
      // Update conversation
      await this.conversationRepository.update(conversationId, {
        context_summary: persistence_payload.conversation_summary,
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
            const memoryData: CreateMemoryUnitData = {
              user_id: userId,
              title: memoryUnit.title,
              content: memoryUnit.content,
            importance_score: memoryUnit.importance_score || persistence_payload.conversation_importance_score || 5,
            sentiment_score: memoryUnit.sentiment_score || 0,
              source_conversation_id: conversationId
            };

            const createdMemory = await this.memoryRepository.create(memoryData);
            newEntities.push({ id: createdMemory.muid, type: 'MemoryUnit' });
            
          // Update entity mapping - map both title and temp_id to the actual memory unit ID
          deduplicationDecisions.entityMappings.set(memoryUnit.title, createdMemory.muid);
          deduplicationDecisions.entityMappings.set(memoryUnit.temp_id, createdMemory.muid);
            
          // Create Neo4j node
            await this.createNeo4jNodeInTransaction(neo4jTransaction, 'MemoryUnit', {
              id: createdMemory.muid,
              userId: userId,
              title: createdMemory.title,
              content: createdMemory.content,
              importance_score: createdMemory.importance_score,
              sentiment_score: createdMemory.sentiment_score,
            creation_ts: new Date().toISOString(),
              source_conversation_id: createdMemory.source_conversation_id,
              source: 'IngestionAnalyst'
            });
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
          
          // Update entity mapping - map both title and temp_id to the actual memory unit ID
          deduplicationDecisions.entityMappings.set(decision.candidate.title, memoryUnitId);
          if (decision.candidate.temp_id) {
            deduplicationDecisions.entityMappings.set(decision.candidate.temp_id, memoryUnitId);
          }
        }

        // ENHANCED: Process concepts with deduplication decisions
        for (const concept of deduplicationDecisions.conceptsToCreate) {
        const conceptData: CreateConceptData = {
          user_id: userId,
            name: concept.name,
            type: concept.type || 'theme',
            description: concept.description || `Concept extracted from conversation: ${concept.name}`,
            salience: concept.salience || 0.5
        };

        const createdConcept = await this.conceptRepository.create(conceptData);
        newEntities.push({ id: createdConcept.concept_id, type: 'Concept' });
        
          // Update entity mapping
          deduplicationDecisions.entityMappings.set(concept.name, createdConcept.concept_id);
        
          // Create Neo4j node
        await this.createNeo4jNodeInTransaction(neo4jTransaction, 'Concept', {
          id: createdConcept.concept_id,
          userId: userId,
          name: createdConcept.name,
          description: createdConcept.description,
          type: createdConcept.type,
          salience: conceptData.salience,
          status: createdConcept.status,
          created_at: createdConcept.created_at.toISOString(),
          community_id: createdConcept.community_id,
          source: 'IngestionAnalyst'
        });
        }

        // ENHANCED: Process concepts to reuse (update existing)
        for (const decision of deduplicationDecisions.conceptsToReuse) {
          // Get the correct concept ID from the existing entity
          const conceptId = decision.existingEntity.entityId;
          
          console.log(`🔍 [IngestionAnalyst] DEBUG: Reusing concept ${decision.candidate.name} with ID: ${conceptId}`);
          
          if (!conceptId) {
            console.warn(`🔍 [IngestionAnalyst] WARNING: No concept ID found for ${decision.candidate.name}, skipping update`);
            continue;
          }
          
          // Update existing concept with incremental insights
          await this.conceptRepository.update(conceptId, {
            description: `${decision.candidate.description}` // Use the new description
          });
          
          // Update entity mapping
          deduplicationDecisions.entityMappings.set(decision.candidate.name, conceptId);
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
              related_memory_units: [],
              related_concepts: [],
              growth_dimensions: [],
            source: 'IngestionAnalyst',
            details: {
              entity_id: conversationId,
              entity_type: 'conversation'
            },
            dimension_key: growthEvent.dim_key,
            delta_value: growthEvent.delta,
            rationale: growthEvent.rationale
          };

          const createdGrowthEvent = await this.growthEventRepository.create(growthData);
          newEntities.push({ id: createdGrowthEvent.event_id, type: 'GrowthEvent' });
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

      // Update user's next conversation context
      await this.userRepository.update(userId, {
        next_conversation_context_package: forward_looking_context
      });

      return newEntities;
      
    } catch (error) {
      console.error(`[IngestionAnalyst] Error in enhanced persistence:`, error);
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
      }], entityMappings);
    }
  }

  private resolveEntityIdWithMapping(entityNameOrId: string, entityMappings: Map<string, string>): string {
    // If it's already an ID, return as-is
    if (entityNameOrId.startsWith('concept_') || entityNameOrId.startsWith('memory_')) {
      return entityNameOrId;
    }
    
    // FIX: If it's a UUID, treat it as an existing entity ID
    if (this.isUUID(entityNameOrId)) {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Entity "${entityNameOrId}" is a UUID, treating as existing entity ID`);
      return entityNameOrId;
    }
    
    // Otherwise, look up in entity mappings
    return entityMappings.get(entityNameOrId) || entityNameOrId;
  }

  /**
   * Check if an entity name is a memory unit temp_id
   * Memory unit temp_ids start with 'mem_' and contain only alphanumeric characters and underscores
   */
  private isMemoryUnitTempId(entityName: string): boolean {
    return entityName.startsWith('mem_') && /^mem_[a-zA-Z0-9_]+$/.test(entityName);
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
        const conceptNames = analysisOutput.persistence_payload.extracted_concepts.map(c => c.name);
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
          // Find the original concept data by name
          const originalConcept = analysisOutput.persistence_payload.extracted_concepts?.find(c => c.name === similarityResult.candidateName);
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
          // Find the original concept data by name
          const originalConcept = analysisOutput.persistence_payload.extracted_concepts?.find(c => c.name === similarityResult.candidateName);
          if (originalConcept) {
            decisions.conceptsToCreate.push(originalConcept);
            // Map name to placeholder ID
            decisions.entityMappings.set(originalConcept.name, `new_concept_${originalConcept.name}`);
          }
        } else {
          // Find the original memory unit data by textContent
          const originalMemory = analysisOutput.persistence_payload.extracted_memory_units?.find(m => `${m.title}\n${m.content}` === similarityResult.candidateName);
          if (originalMemory) {
            decisions.memoryUnitsToCreate.push(originalMemory);
            // Map both title and temp_id to placeholder IDs
            decisions.entityMappings.set(originalMemory.title, `new_memory_${originalMemory.title}`);
            if (originalMemory.temp_id) {
              decisions.entityMappings.set(originalMemory.temp_id, `new_memory_${originalMemory.title}`);
            }
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
   * Publish events for new entities
   */
  private async publishEvents(userId: string, newEntities: Array<{ id: string; type: string }>) {
    // Publish embedding jobs for each new entity
    for (const entity of newEntities) {
      let textContent = '';
      
      if (entity.type === 'MemoryUnit') {
        const memory = await this.memoryRepository.findById(entity.id);
        textContent = memory ? `${memory.title}\n${memory.content}` : '';
      } else if (entity.type === 'Concept') {
        const concept = await this.conceptRepository.findById(entity.id);
        textContent = concept ? concept.name : '';
      } else if (entity.type === 'GrowthEvent') {
        const growthEvent = await this.growthEventRepository.findById(entity.id);
        if (growthEvent) {
          const details = growthEvent.details as any;
          textContent = `${growthEvent.dimension_key} Growth Event: ${details?.rationale || growthEvent.rationale || 'Growth event recorded'}`;
        }
      } else if (entity.type === 'DerivedArtifact') {
        const artifact = await this.derivedArtifactRepository.findById(entity.id);
        if (artifact) {
          textContent = `${artifact.title}\n\n${artifact.content_narrative || 'Derived artifact content'}`;
        }
      } else if (entity.type === 'Community') {
        try {
          const community = await this.dbService.prisma.communities.findUnique({
            where: { community_id: entity.id }
          });
          if (community) {
            textContent = `${community.name}: ${community.description || 'Community description'}`;
          }
        } catch (error) {
          console.warn(`[IngestionAnalyst] ⚠️ Error fetching community ${entity.id}:`, error);
        }
      } else if (entity.type === 'ProactivePrompt') {
        const prompt = await this.proactivePromptRepository.findById(entity.id);
        if (prompt) {
          textContent = `Proactive Prompt: ${prompt.prompt_text || 'Prompt content'}`;
        }
      } else if (entity.type === 'User') {
        const user = await this.userRepository.findById(entity.id);
        if (user) {
          textContent = `${user.name || user.email}: User profile`;
        }
      }

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
  }

  /**
   * Create Neo4j node in transaction
   */
  private async createNeo4jNodeInTransaction(transaction: any, label: string, properties: any): Promise<void> {
    const cypher = `CREATE (n:${label} $props)`;
    await transaction.run(cypher, { props: properties });
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
    }>,
    entityMappings: Map<string, string>
  ): Promise<void> {
    for (const relationship of relationships) {
      const sourceId = this.resolveEntityIdWithMapping(relationship.source_entity_id_or_name, entityMappings);
      const targetId = this.resolveEntityIdWithMapping(relationship.target_entity_id_or_name, entityMappings);

      if (sourceId && targetId) {
        const cypher = `
          MATCH (source), (target)
          WHERE (source.muid = $sourceId OR source.concept_id = $sourceId OR source.event_id = $sourceId)
            AND (target.muid = $targetId OR target.concept_id = $targetId OR target.event_id = $targetId)
          CREATE (source)-[r:${relationship.relationship_type} {description: $description}]->(target)
        `;
        
        await transaction.run(cypher, {
          sourceId,
          targetId,
          description: relationship.relationship_description
        });
      }
    }
  }

  /**
   * Map relationship ID to actual node ID
   */
  private async mapRelationshipIdToNodeId(entityIdOrName: string, userId: string): Promise<string | null> {
    // If it's already an ID, return as-is
    if (entityIdOrName.startsWith('concept_') || entityIdOrName.startsWith('memory_')) {
      return entityIdOrName;
    }

    // FIX: If it's a UUID, it's likely a concept ID, so return it directly
    if (this.isUUID(entityIdOrName)) {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Mapped ID "${entityIdOrName}" is a UUID, treating as concept ID`);
      return entityIdOrName;
    }

    // Try to find existing concept by name
    const concepts = await this.conceptRepository.searchByName(userId, entityIdOrName, 1);
    if (concepts.length > 0) {
      return concepts[0].concept_id;
    }

    // Try to find existing memory unit by title
    const memories = await this.memoryRepository.searchByContent(userId, entityIdOrName, 1);
    if (memories.length > 0) {
      return memories[0].muid;
    }

    // Try to find existing growth event by event_id
    const growthEvent = await this.growthEventRepository.findById(entityIdOrName);
    if (growthEvent) {
      return growthEvent.event_id;
    }

    // FIX: Don't create concepts for memory unit temp_ids or growth dimensions
    if (this.isMemoryUnitTempId(entityIdOrName)) {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Skipping concept creation for memory unit temp_id: ${entityIdOrName}`);
      return null;
    }
    
    if (this.isGrowthDimension(entityIdOrName)) {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Skipping concept creation for growth dimension: ${entityIdOrName}`);
      return null;
    }
    
    // Auto-create concept as fallback
    console.log(`🔍 [IngestionAnalyst] DEBUG: Auto-creating concept for: ${entityIdOrName}`);
    const createdConcept = await this.conceptRepository.create({
            user_id: userId,
      name: entityIdOrName,
      type: 'auto_generated',
      description: `Auto-generated concept from relationship: ${entityIdOrName}`,
      salience: 0.5
    });

    return createdConcept.concept_id;
  }



}
