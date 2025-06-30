import { Job } from 'bullmq';
import { HolisticAnalysisTool, HolisticAnalysisOutput } from '@2dots1line/tools';
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
import { Queue } from 'bullmq';

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
        knowledgeGraphSchema
      });

      console.log(`[IngestionAnalyst] Analysis completed with importance score: ${analysisOutput.persistence_payload.conversation_importance_score}`);

      // Phase III: Persistence & Graph Update
      const newEntities = await this.persistAnalysisResults(conversationId, userId, analysisOutput);

      // Phase IV: Event Publishing
      await this.publishEvents(userId, newEntities);

      console.log(`[IngestionAnalyst] Successfully processed conversation ${conversationId}, created ${newEntities.length} new entities`);
      
    } catch (error) {
      console.error(`[IngestionAnalyst] Error processing conversation ${conversationId}:`, error);
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
    
    // Check importance threshold
    if (persistence_payload.conversation_importance_score < 3) {
      console.log(`[IngestionAnalyst] Conversation importance score (${persistence_payload.conversation_importance_score}) below threshold, skipping entity creation`);
      
      // Just update conversation summary and status
      await this.conversationRepository.update(conversationId, {
        context_summary: persistence_payload.conversation_summary,
        importance_score: persistence_payload.conversation_importance_score,
        status: 'processed'
      });
      
      // Update forward-looking context
      await this.userRepository.update(userId, {
        next_conversation_context_package: forward_looking_context
      });
      
      return [];
    }

    // Start transaction for high-importance conversations
    const newEntities: Array<{ id: string; type: string }> = [];

    try {
      // Update conversation
      await this.conversationRepository.update(conversationId, {
        context_summary: persistence_payload.conversation_summary,
        importance_score: persistence_payload.conversation_importance_score,
        status: 'processed'
      });

      // Create memory units
      for (const memoryUnit of persistence_payload.extracted_memory_units) {
        const memoryData: CreateMemoryUnitData = {
          user_id: userId,
          title: memoryUnit.title,
          content: memoryUnit.content,
          creation_ts: new Date(memoryUnit.creation_ts),
          source_conversation_id: conversationId
        };

        const createdMemory = await this.memoryRepository.create(memoryData);
        newEntities.push({ id: createdMemory.muid, type: 'MemoryUnit' });
        
        console.log(`[IngestionAnalyst] Created memory unit: ${createdMemory.muid} - ${memoryUnit.title}`);
      }

      // Create concepts
      for (const concept of persistence_payload.extracted_concepts) {
        const conceptData: CreateConceptData = {
          user_id: userId,
          name: concept.name,
          type: concept.type,
          description: concept.description
        };

        const createdConcept = await this.conceptRepository.create(conceptData);
        newEntities.push({ id: createdConcept.concept_id, type: 'Concept' });
        
        console.log(`[IngestionAnalyst] Created concept: ${createdConcept.concept_id} - ${concept.name}`);
      }

      // Create growth events
      for (const growthEvent of persistence_payload.detected_growth_events) {
        const growthData: CreateGrowthEventData = {
          user_id: userId,
          entity_id: conversationId,
          entity_type: 'conversation',
          dim_key: growthEvent.dim_key,
          delta: growthEvent.delta,
          source: 'IngestionAnalyst',
          details: { rationale: growthEvent.rationale }
        };

        const createdGrowthEvent = await this.growthEventRepository.create(growthData);
        console.log(`[IngestionAnalyst] Created growth event: ${createdGrowthEvent.event_id} - ${growthEvent.dim_key} (${growthEvent.delta})`);
      }

      // Update user's next conversation context
      await this.userRepository.update(userId, {
        next_conversation_context_package: forward_looking_context
      });

      // TODO: Create Neo4j relationships (persistence_payload.new_relationships)
      // This would require Neo4j client integration

      console.log(`[IngestionAnalyst] Persistence completed for conversation ${conversationId}`);
      
    } catch (error) {
      console.error(`[IngestionAnalyst] Error during persistence:`, error);
      throw error;
    }

    return newEntities;
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
