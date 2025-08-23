import { 
  DatabaseService, 
  ConversationRepository, 
  UserRepository,
  MemoryRepository,
  ConceptRepository,
  GrowthEventRepository
} from '@2dots1line/database';
import type { 
  CreateMemoryUnitData, 
  CreateConceptData, 
  CreateGrowthEventData 
} from '@2dots1line/database';
import { HolisticAnalysisTool, HolisticAnalysisOutput } from '@2dots1line/tools';
import { Job , Queue } from 'bullmq';

export interface IngestionJobData {
  conversationId: string;
  userId: string;
}

export class IngestionAnalyst {
  private conversationRepository: ConversationRepository;
  private userRepository: UserRepository;
  private memoryRepository: MemoryRepository;
  private conceptRepository: ConceptRepository;
  private growthEventRepository: GrowthEventRepository;

  constructor(
    private holisticAnalysisTool: HolisticAnalysisTool,
    private dbService: DatabaseService,
    private embeddingQueue: Queue,
    private cardAndGraphQueue: Queue
  ) {
    this.conversationRepository = new ConversationRepository(dbService);
    this.userRepository = new UserRepository(dbService);
    this.memoryRepository = new MemoryRepository(dbService);
    this.conceptRepository = new ConceptRepository(dbService);
    this.growthEventRepository = new GrowthEventRepository(dbService);
  }

  async processConversation(job: Job<IngestionJobData>) {
    const { conversationId, userId } = job.data;
    
    console.log(`[IngestionAnalyst] Processing conversation ${conversationId} for user ${userId}`);

    try {
      // Phase I: Data Gathering & Preparation
      const { fullConversationTranscript, userMemoryProfile, knowledgeGraphSchema } = 
        await this.gatherContextData(conversationId, userId);

      // Phase II: The "Single Synthesis" LLM Call
      const analysisOutput = await this.holisticAnalysisTool.execute({
        userId,
        fullConversationTranscript,
        userMemoryProfile,
        knowledgeGraphSchema,
        workerType: 'ingestion-worker',
        workerJobId: job.id || 'unknown',
        conversationId,
        messageId: undefined // Not applicable for conversation-level analysis
      });

      console.log(`[IngestionAnalyst] Analysis completed with importance score: ${analysisOutput.persistence_payload.conversation_importance_score}`);

      // Phase III: Persistence & Graph Update
      const newEntities = await this.persistAnalysisResults(conversationId, userId, analysisOutput);

      // Phase IV: Event Publishing
      await this.publishEvents(userId, newEntities);

      console.log(`[IngestionAnalyst] Successfully processed conversation ${conversationId}, created ${newEntities.length} new entities`);
      
    } catch (error) {
      console.error(`[IngestionAnalyst] Error processing conversation ${conversationId}:`, error);
      
      // Handle validation errors specifically
      if (error instanceof Error && error.name === 'ValidationError') {
        console.error(`[IngestionAnalyst] Validation error details:`, error);
        
        // Update conversation with error information
        await this.conversationRepository.update(conversationId, {
          context_summary: `Analysis failed - validation error: ${error.message}`,
          importance_score: 0,
          status: 'failed'
        });
        
        console.log(`[IngestionAnalyst] Conversation ${conversationId} marked as failed due to validation error`);
        return; // Don't throw, just return to prevent job retry
      }
      
      // For other errors, update conversation and re-throw
      await this.conversationRepository.update(conversationId, {
        context_summary: `Analysis failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
        importance_score: 0,
        status: 'failed'
      });
      
      throw error;
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

    return {
      fullConversationTranscript,
      userMemoryProfile,
      knowledgeGraphSchema
    };
  }

  private async persistAnalysisResults(
    conversationId: string, 
    userId: string, 
    analysisOutput: HolisticAnalysisOutput
  ): Promise<Array<{ id: string; type: string }>> {
    const { persistence_payload, forward_looking_context } = analysisOutput;
    
    console.log(`🔍 [IngestionAnalyst] DEBUG: Starting persistence for conversation ${conversationId}`);
    console.log(`🔍 [IngestionAnalyst] DEBUG: Importance score: ${persistence_payload.conversation_importance_score}`);
    console.log(`🔍 [IngestionAnalyst] DEBUG: Memory units to create: ${persistence_payload.extracted_memory_units?.length || 0}`);
    console.log(`🔍 [IngestionAnalyst] DEBUG: Concepts to create: ${persistence_payload.extracted_concepts?.length || 0}`);
    console.log(`🔍 [IngestionAnalyst] DEBUG: Growth events to create: ${persistence_payload.detected_growth_events?.length || 0}`);

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

      // Create memory units
      if (persistence_payload.extracted_memory_units && persistence_payload.extracted_memory_units.length > 0) {
        console.log(`🔍 [IngestionAnalyst] DEBUG: Creating ${persistence_payload.extracted_memory_units.length} memory units`);
        
        for (const memoryUnit of persistence_payload.extracted_memory_units) {
          console.log(`🔍 [IngestionAnalyst] DEBUG: Processing memory unit: ${memoryUnit.title}`);
          
          const memoryData: CreateMemoryUnitData = {
            user_id: userId,
            title: memoryUnit.title,
            content: memoryUnit.content,
            creation_ts: new Date(memoryUnit.creation_ts),
            source_conversation_id: conversationId
          };

          const createdMemory = await this.memoryRepository.create(memoryData);
          newEntities.push({ id: createdMemory.muid, type: 'MemoryUnit' });
          
          console.log(`🔍 [IngestionAnalyst] DEBUG: Memory unit created in PostgreSQL: ${createdMemory.muid}`);
          console.log(`🔍 [IngestionAnalyst] DEBUG: About to create Neo4j node for memory unit: ${createdMemory.muid}`);
          
          // Create Neo4j node for memory unit
          await this.createNeo4jNode('MemoryUnit', {
            id: createdMemory.muid,
            userId: userId,
            title: createdMemory.title,
            content: createdMemory.content,
            importance_score: createdMemory.importance_score,
            sentiment_score: createdMemory.sentiment_score,
            creation_ts: createdMemory.creation_ts.toISOString(),
            source_conversation_id: createdMemory.source_conversation_id,
            source: 'IngestionAnalyst'
          });
          
          console.log(`[IngestionAnalyst] Created memory unit: ${createdMemory.muid} - ${memoryUnit.title}`);
        }
      } else {
        console.log(`🔍 [IngestionAnalyst] DEBUG: No memory units to create`);
      }

      // Create concepts
      if (persistence_payload.extracted_concepts && persistence_payload.extracted_concepts.length > 0) {
        console.log(`🔍 [IngestionAnalyst] DEBUG: Creating ${persistence_payload.extracted_concepts.length} concepts`);
        
        for (const concept of persistence_payload.extracted_concepts) {
          console.log(`🔍 [IngestionAnalyst] DEBUG: Processing concept: ${concept.name}`);
          
          const conceptData: CreateConceptData = {
            user_id: userId,
            name: concept.name,
            type: concept.type,
            description: concept.description
          };

          const createdConcept = await this.conceptRepository.create(conceptData);
          newEntities.push({ id: createdConcept.concept_id, type: 'Concept' });
          
          console.log(`🔍 [IngestionAnalyst] DEBUG: Concept created in PostgreSQL: ${createdConcept.concept_id}`);
          console.log(`🔍 [IngestionAnalyst] DEBUG: About to create Neo4j node for concept: ${createdConcept.concept_id}`);
          
          // Create Neo4j node for concept
          await this.createNeo4jNode('Concept', {
            id: createdConcept.concept_id,
            userId: userId,
            name: createdConcept.name,
            description: createdConcept.description,
            type: createdConcept.type,
            salience: createdConcept.salience,
            status: createdConcept.status,
            created_at: createdConcept.created_at.toISOString(),
            community_id: createdConcept.community_id,
            source: 'IngestionAnalyst'
          });
          
          console.log(`[IngestionAnalyst] Created concept: ${createdConcept.concept_id} - ${concept.name}`);
        }
      } else {
        console.log(`🔍 [IngestionAnalyst] DEBUG: No concepts to create`);
      }

      // Create growth events
      if (persistence_payload.detected_growth_events && persistence_payload.detected_growth_events.length > 0) {
        console.log(`🔍 [IngestionAnalyst] DEBUG: Creating ${persistence_payload.detected_growth_events.length} growth events`);
        
        for (const growthEvent of persistence_payload.detected_growth_events) {
          const growthData: CreateGrowthEventData = {
            user_id: userId,
            related_memory_units: [], // Provide actual IDs if available
            related_concepts: [],     // Provide actual IDs if available
            growth_dimensions: [],    // Provide actual dimensions if available
            source: 'IngestionAnalyst',
            details: {
              rationale: growthEvent.rationale,
              entity_id: conversationId,
              entity_type: 'conversation',
              dim_key: growthEvent.dim_key,
              delta: growthEvent.delta
            }
          };

          const createdGrowthEvent = await this.growthEventRepository.create(growthData);
          console.log(`[IngestionAnalyst] Created growth event: ${createdGrowthEvent.event_id} - ${growthEvent.dim_key} (${growthEvent.delta})`);
        }
      } else {
        console.log(`🔍 [IngestionAnalyst] DEBUG: No growth events to create`);
      }

      // Update user's next conversation context
      await this.userRepository.update(userId, {
        next_conversation_context_package: forward_looking_context
      });

      console.log(`🔍 [IngestionAnalyst] DEBUG: About to create Neo4j relationships`);

      // IMPLEMENTED: Create Neo4j relationships
      if (persistence_payload.new_relationships && persistence_payload.new_relationships.length > 0) {
        console.log(`🔍 [IngestionAnalyst] DEBUG: Creating ${persistence_payload.new_relationships.length} Neo4j relationships`);
        await this.createNeo4jRelationships(userId, persistence_payload.new_relationships);
      } else {
        console.log(`🔍 [IngestionAnalyst] DEBUG: No Neo4j relationships to create`);
      }

      console.log(`[IngestionAnalyst] Persistence completed for conversation ${conversationId}`);
      
    } catch (error) {
      console.error(`[IngestionAnalyst] Error during persistence:`, error);
      throw error;
    }

    return newEntities;
  }

  /**
   * IMPLEMENTED: Create nodes in Neo4j knowledge graph
   */
  private async createNeo4jNode(nodeType: string, properties: Record<string, any>): Promise<void> {
    console.log(`🔍 [IngestionAnalyst] DEBUG: createNeo4jNode called for ${nodeType} with id: ${properties.id}`);
    
    if (!this.dbService.neo4j) {
      console.warn(`[IngestionAnalyst] Neo4j client not available, skipping node creation`);
      console.log(`🔍 [IngestionAnalyst] DEBUG: dbService.neo4j is: ${this.dbService.neo4j}`);
      console.log(`🔍 [IngestionAnalyst] DEBUG: dbService object keys: ${Object.keys(this.dbService)}`);
      return;
    }

    console.log(`🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with node creation`);
    console.log(`🔍 [IngestionAnalyst] DEBUG: Node type: ${nodeType}`);
    console.log(`🔍 [IngestionAnalyst] DEBUG: Properties: ${JSON.stringify(properties, null, 2)}`);

    const session = this.dbService.neo4j.session();
    
    try {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Neo4j session created successfully`);
      
      // Clean properties to only include primitive types
      const cleanProperties = this.cleanNeo4jProperties(properties);
      console.log(`🔍 [IngestionAnalyst] DEBUG: Cleaned properties: ${JSON.stringify(cleanProperties, null, 2)}`);
      
      const cypher = `
        MERGE (n:${nodeType} {id: $id, userId: $userId})
        SET n += $properties
        SET n.updatedAt = datetime()
        RETURN n
      `;
      
      console.log(`🔍 [IngestionAnalyst] DEBUG: Cypher query: ${cypher}`);
      console.log(`🔍 [IngestionAnalyst] DEBUG: Query parameters: ${JSON.stringify({
        id: properties.id,
        userId: properties.userId,
        properties: cleanProperties
      }, null, 2)}`);
      
      const result = await session.run(cypher, {
        id: properties.id,
        userId: properties.userId,
        properties: cleanProperties
      });
      
      console.log(`🔍 [IngestionAnalyst] DEBUG: Cypher query executed successfully`);
      console.log(`🔍 [IngestionAnalyst] DEBUG: Result records length: ${result.records.length}`);
      
      if (result.records.length > 0) {
        console.log(`[IngestionAnalyst] ✅ Created ${nodeType} node: ${properties.id}`);
      } else {
        console.warn(`[IngestionAnalyst] ⚠️ Failed to create ${nodeType} node: ${properties.id}`);
      }
      
    } catch (error) {
      console.error(`[IngestionAnalyst] ❌ Error creating ${nodeType} node:`, error);
      console.log(`🔍 [IngestionAnalyst] DEBUG: Error details: ${JSON.stringify(error, null, 2)}`);
      // Don't throw - allow ingestion to continue even if node creation fails
    } finally {
      await session.close();
      console.log(`🔍 [IngestionAnalyst] DEBUG: Neo4j session closed`);
    }
  }

  /**
   * Clean properties to only include primitive types for Neo4j
   */
  private cleanNeo4jProperties(properties: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      // Skip id and userId as they're handled separately
      if (key === 'id' || key === 'userId') continue;
      
      // Only include primitive types
      if (value === null || value === undefined) {
        continue;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        clean[key] = value;
      } else if (Array.isArray(value)) {
        // Convert arrays to strings for Neo4j
        clean[key] = JSON.stringify(value);
      } else if (typeof value === 'object') {
        // Convert objects to strings for Neo4j
        clean[key] = JSON.stringify(value);
      }
    }
    
    return clean;
  }

  /**
   * IMPLEMENTED: Create relationships in Neo4j knowledge graph
   */
  private async createNeo4jRelationships(userId: string, relationships: any[]): Promise<void> {
    console.log(`🔍 [IngestionAnalyst] DEBUG: createNeo4jRelationships called for ${relationships.length} relationships`);
    
    if (!this.dbService.neo4j) {
      console.warn(`[IngestionAnalyst] Neo4j client not available, skipping relationship creation`);
      return;
    }

    console.log(`🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with relationship creation`);

    const session = this.dbService.neo4j.session();
    
    try {
      console.log(`🔍 [IngestionAnalyst] DEBUG: Neo4j session created for relationships`);
      
      for (const relationship of relationships) {
        console.log(`🔍 [IngestionAnalyst] DEBUG: Processing relationship: ${JSON.stringify(relationship, null, 2)}`);
        
        const cypher = `
          MATCH (source), (target)
          WHERE (source.muid = $sourceId OR source.concept_id = $sourceId) 
            AND (target.muid = $targetId OR target.concept_id = $targetId)
            AND source.user_id = $userId AND target.user_id = $userId
          CREATE (source)-[r:RELATED_TO {
            type: $relationshipType,
            strength: $strength,
            context: $context,
            created_at: datetime(),
            source: 'IngestionAnalyst'
          }]->(target)
          RETURN r
        `;
        
        console.log(`🔍 [IngestionAnalyst] DEBUG: Relationship Cypher query: ${cypher}`);
        console.log(`🔍 [IngestionAnalyst] DEBUG: Relationship parameters: ${JSON.stringify({
          sourceId: relationship.source_id,
          targetId: relationship.target_id,
          userId: userId,
          relationshipType: relationship.type || 'general',
          strength: relationship.strength || 0.5,
          context: relationship.context || 'Inferred from conversation analysis'
        }, null, 2)}`);
        
        const result = await session.run(cypher, {
          sourceId: relationship.source_id,
          targetId: relationship.target_id,
          userId: userId,
          relationshipType: relationship.type || 'general',
          strength: relationship.strength || 0.5,
          context: relationship.context || 'Inferred from conversation analysis'
        });
        
        console.log(`🔍 [IngestionAnalyst] DEBUG: Relationship query executed, records: ${result.records.length}`);
        
        if (result.records.length > 0) {
          console.log(`[IngestionAnalyst] ✅ Created relationship: ${relationship.source_id} -> ${relationship.target_id} (${relationship.type || 'general'})`);
        } else {
          console.warn(`[IngestionAnalyst] ⚠️ Failed to create relationship: ${relationship.source_id} -> ${relationship.target_id} (nodes not found)`);
        }
      }
      
      console.log(`[IngestionAnalyst] ✅ Created ${relationships.length} Neo4j relationships successfully`);
      
    } catch (error) {
      console.error(`[IngestionAnalyst] ❌ Error creating Neo4j relationships:`, error);
      console.log(`🔍 [IngestionAnalyst] DEBUG: Relationship error details: ${JSON.stringify(error, null, 2)}`);
      // Don't throw - allow ingestion to continue even if relationship creation fails
    } finally {
      await session.close();
      console.log(`🔍 [IngestionAnalyst] DEBUG: Neo4j session closed for relationships`);
    }
  }

  private async publishEvents(userId: string, newEntities: Array<{ id: string; type: string }>) {
    // Publish embedding jobs for each new entity
    for (const entity of newEntities) {
      let textContent = '';
      
      if (entity.type === 'MemoryUnit') {
        const memory = await this.memoryRepository.findById(entity.id);
        textContent = memory ? `${memory.title}\n${memory.content}` : '';
      } else if (entity.type === 'Concept') {
        const concept = await this.conceptRepository.findById(entity.id);
        textContent = concept ? `${concept.name}: ${concept.description || ''}` : '';
      }

      if (textContent) {
        await this.embeddingQueue.add('create_embedding', {
          entityId: entity.id,
          entityType: entity.type,
          textContent,
          userId
        });
        
        console.log(`[IngestionAnalyst] Queued embedding job for ${entity.type} ${entity.id}`);
      }
    }

    // Publish presentation event for CardWorker
    if (newEntities.length > 0) {
      await this.cardAndGraphQueue.add('new_entities_created', {
        type: 'new_entities_created',
        userId,
        entities: newEntities,
        source: 'IngestionAnalyst'
      });
      
      console.log(`[IngestionAnalyst] Published new_entities_created event for ${newEntities.length} entities`);
    }
  }
}
