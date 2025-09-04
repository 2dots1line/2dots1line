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
  private derivedArtifactRepository: DerivedArtifactRepository;
  private communityRepository: CommunityRepository;
  private proactivePromptRepository: ProactivePromptRepository;

  constructor(
    private holisticAnalysisTool: HolisticAnalysisTool,
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

      // Phase III: Persistence & Graph Update
      const newEntities = await this.persistAnalysisResults(conversationId, userId, analysisOutput);

      // Phase IV: Update Conversation Title
      await this.updateConversationTitle(conversationId, analysisOutput.persistence_payload.conversation_title);
      
      // Phase V: Event Publishing
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
    const userName = user?.name || 'User';

    return {
      fullConversationTranscript,
      userMemoryProfile,
      knowledgeGraphSchema,
      userName
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
            importance_score: memoryUnit.importance_score || persistence_payload.conversation_importance_score || 5, // Use memory-specific score or fallback to conversation score
            sentiment_score: memoryUnit.sentiment_score || 0, // Use memory-specific sentiment or neutral
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
            creation_ts: new Date().toISOString(), // Always use current time
            source_conversation_id: createdMemory.source_conversation_id,
            source: 'IngestionAnalyst'
          });
          
          console.log(`[IngestionAnalyst] Created memory unit: ${createdMemory.muid} - ${memoryUnit.title}`);
        }
      } else {
        console.log(`🔍 [IngestionAnalyst] DEBUG: No memory units to create`);
      }

      // PHASE 1: Create ALL concepts (including those referenced in relationships)
      const allConcepts = new Set<string>();
      
      // Add explicitly extracted concepts
      if (persistence_payload.extracted_concepts && persistence_payload.extracted_concepts.length > 0) {
        persistence_payload.extracted_concepts.forEach(concept => allConcepts.add(concept.name));
      }
      
      // Add concepts referenced in relationships
      if (persistence_payload.new_relationships && persistence_payload.new_relationships.length > 0) {
        for (const relationship of persistence_payload.new_relationships) {
          // Skip user names (they're handled separately)
          const user = await this.userRepository.findById(userId);
          if (user && (user.name === relationship.source_entity_id_or_name || user.name === relationship.target_entity_id_or_name)) {
            continue;
          }
          
          allConcepts.add(relationship.source_entity_id_or_name);
          allConcepts.add(relationship.target_entity_id_or_name);
        }
      }
      
      console.log(`🔍 [IngestionAnalyst] DEBUG: Creating ${allConcepts.size} concepts (including relationship-referenced ones)`);
      
      // Create all concepts first
      for (const conceptName of allConcepts) {
        // Skip if it's a user name
        const user = await this.userRepository.findById(userId);
        if (user && user.name === conceptName) {
          continue;
        }
        
        // Check if concept already exists
        const existingConcepts = await this.conceptRepository.findByUserId(userId);
        const existingConcept = existingConcepts.find(c => c.name === conceptName);
        
        if (existingConcept) {
          console.log(`🔍 [IngestionAnalyst] DEBUG: Concept already exists: ${conceptName}`);
          continue;
        }
        
        // Find the concept data from extracted concepts if available
        const extractedConcept = persistence_payload.extracted_concepts?.find(c => c.name === conceptName);
        
        const conceptData: CreateConceptData = {
          user_id: userId,
          name: conceptName,
          type: extractedConcept?.type || 'theme', // Default to 'theme' for auto-created concepts
          description: extractedConcept?.description || `Concept extracted from conversation: ${conceptName}`,
          salience: extractedConcept ? this.calculateConceptSalience(extractedConcept, persistence_payload) : 0.5
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
          salience: conceptData.salience,
          status: createdConcept.status,
          created_at: createdConcept.created_at.toISOString(),
          community_id: createdConcept.community_id,
          source: 'IngestionAnalyst'
        });
        
        console.log(`[IngestionAnalyst] Created concept: ${createdConcept.concept_id} - ${conceptName}`);
      }

      // Create growth events
      if (persistence_payload.detected_growth_events && persistence_payload.detected_growth_events.length > 0) {
        console.log(`🔍 [IngestionAnalyst] DEBUG: Creating ${persistence_payload.detected_growth_events.length} growth events`);
        
        for (const growthEvent of persistence_payload.detected_growth_events) {
          // Collect related entity IDs that were created in this conversation
          const relatedMemoryUnitIds = persistence_payload.extracted_memory_units?.map(mu => mu.temp_id) || [];
          const relatedConceptIds = persistence_payload.extracted_concepts?.map(concept => concept.name) || [];
          
          const growthData: CreateGrowthEventData = {
            user_id: userId,
            related_memory_units: relatedMemoryUnitIds,
            related_concepts: relatedConceptIds,
            growth_dimensions: [], // Keep empty for now, will remove later
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
          
          // CRITICAL FIX: Add growth event to newEntities so it gets published to graph queue
          newEntities.push({ id: createdGrowthEvent.event_id, type: 'GrowthEvent' });
          
          console.log(`[IngestionAnalyst] Created growth event: ${createdGrowthEvent.event_id} - ${growthEvent.dim_key} (${growthEvent.delta})`);
          
          // CRITICAL FIX: Create Neo4j node for growth event
          await this.createNeo4jNode('GrowthEvent', {
            id: createdGrowthEvent.event_id,
            userId: userId,
            dimension_key: growthEvent.dim_key,
            delta_value: growthEvent.delta,
            rationale: growthEvent.rationale,
            source: 'IngestionAnalyst',
            created_at: createdGrowthEvent.created_at.toISOString(),
            related_memory_units: relatedMemoryUnitIds,
            related_concepts: relatedConceptIds
          });
          
          console.log(`[IngestionAnalyst] Created Neo4j GrowthEvent node: ${createdGrowthEvent.event_id}`);
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
        
        // Transform relationship data structure from HolisticAnalysisTool format
        const sourceId = relationship.source_entity_id_or_name || relationship.source_id;
        const targetId = relationship.target_entity_id_or_name || relationship.target_id;
        const relationshipDescription = relationship.relationship_description || relationship.type || 'general';
        const context = relationship.relationship_description || relationship.context || 'Inferred from conversation analysis';
        
        console.log(`🔍 [IngestionAnalyst] DEBUG: Transformed relationship - sourceId: ${sourceId}, targetId: ${targetId}, description: ${relationshipDescription}`);
        
        // FIXED: Map relationship IDs to actual node IDs by querying the database
        const actualSourceId = await this.mapRelationshipIdToNodeId(sourceId, userId);
        const actualTargetId = await this.mapRelationshipIdToNodeId(targetId, userId);
        
        if (!actualSourceId || !actualTargetId) {
          console.warn(`[IngestionAnalyst] ⚠️ Could not map relationship IDs: source=${sourceId} -> ${actualSourceId}, target=${targetId} -> ${actualTargetId}`);
          continue;
        }

        console.log(`🔍 [IngestionAnalyst] DEBUG: Mapped IDs - actualSourceId: ${actualSourceId}, actualTargetId: ${actualTargetId}`);

        // CRITICAL FIX: Use emergent relationship labels based on LLM description instead of generic 'RELATED_TO'
        // Transform the LLM description into a valid Neo4j relationship label
        const relationshipLabel = this.transformToValidRelationshipLabel(relationshipDescription);
        
        const cypher = `
          MATCH (source), (target)
          WHERE (source.muid = $sourceId OR source.concept_id = $sourceId OR source.id = $sourceId)
          AND (target.muid = $targetId OR target.concept_id = $targetId OR target.id = $targetId)
          AND source.userId = $userId AND target.userId = $userId
          MERGE (source)-[r:${relationshipLabel}]->(target)
          SET r.relationship_description = $relationshipDescription,
              r.context = $context,
              r.source_agent = 'IngestionAnalyst',
              r.created_at = datetime(),
              r.updated_at = datetime(),
              r.original_description = $relationshipDescription
          RETURN r
        `;

        console.log(`🔍 [IngestionAnalyst] DEBUG: Creating relationship with cypher: ${cypher}`);
        console.log(`🔍 [IngestionAnalyst] DEBUG: Relationship parameters: ${JSON.stringify({
          sourceId: actualSourceId,
          targetId: actualTargetId,
          userId,
          relationshipDescription,
          context
        }, null, 2)}`);

        const result = await session.run(cypher, {
          sourceId: actualSourceId,
          targetId: actualTargetId,
          userId,
          relationshipDescription,
          context
        });

        if (result.records.length > 0) {
          console.log(`[IngestionAnalyst] ✅ Created relationship: ${sourceId} --[${relationshipDescription}]--> ${targetId}`);
        } else {
          console.warn(`[IngestionAnalyst] ⚠️ Failed to create relationship: ${sourceId} -> ${targetId}`);
        }
      }
      
      console.log(`[IngestionAnalyst] ✅ Created ${relationships.length} Neo4j relationships`);
      
    } catch (error) {
      console.error(`[IngestionAnalyst] ❌ Error creating Neo4j relationships:`, error);
      // Don't throw - allow ingestion to continue even if relationship creation fails
    } finally {
      await session.close();
      console.log(`🔍 [IngestionAnalyst] DEBUG: Neo4j session closed for relationships`);
    }
  }

  /**
   * Transform LLM relationship description into valid Neo4j relationship label
   * Neo4j relationship labels must be valid identifiers (alphanumeric + underscore)
   */
  private transformToValidRelationshipLabel(description: string): string {
    // Convert to lowercase and replace spaces/special chars with underscores
    let label = description.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .trim();
    
    // Ensure it starts with a letter
    if (!/^[a-z]/.test(label)) {
      label = 'rel_' + label;
    }
    
    // Ensure it's not empty
    if (!label) {
      label = 'related_to';
    }
    
    // Limit length for Neo4j compatibility
    if (label.length > 50) {
      label = label.substring(0, 50);
    }
    
    console.log(`🔍 [IngestionAnalyst] DEBUG: Transformed relationship label: "${description}" -> "${label}"`);
    return label;
  }

  /**
   * Map relationship ID to actual node ID by querying the database
   * V11.1.1 ENHANCEMENT: Map user names to User concepts instead of skipping
   */
  private async mapRelationshipIdToNodeId(relationshipId: string, userId: string): Promise<string | null> {
    try {
      // V11.1.1 ENHANCEMENT: Map user names to User concepts instead of skipping
      // Get the user's name to check if this relationshipId is the user's name
      const user = await this.userRepository.findById(userId);
      if (user && (user.name === relationshipId || user.email?.includes(relationshipId))) {
        // Instead of skipping, find or create the User concept
        const userConcept = await this.findOrCreateUserConcept(userId, user.name || 'User');
        if (userConcept) {
          console.log(`[IngestionAnalyst] ℹ️ Mapped user name "${relationshipId}" to User concept: ${userConcept.concept_id}`);
          return userConcept.concept_id;
        }
      }
      
      // First try to find by memory unit temp_id
      if (relationshipId.startsWith('mem_')) {
        // This is a memory unit temp_id, find the actual memory unit
        const memoryUnits = await this.memoryRepository.findByUserId(userId);
        const memoryUnit = memoryUnits.find(mu => mu.muid === relationshipId);
        if (memoryUnit) {
          return memoryUnit.muid;
        }
      }
      
      // Try to find by concept name
      const concepts = await this.conceptRepository.findByUserId(userId);
      const concept = concepts.find(c => c.name === relationshipId);
      if (concept) {
        return concept.concept_id;
      }
      
      // Try to find by exact ID match (in case it's already a UUID)
      const memoryUnit = await this.memoryRepository.findById(relationshipId);
      if (memoryUnit && memoryUnit.user_id === userId) {
        return memoryUnit.muid;
      }
      
      const conceptById = await this.conceptRepository.findById(relationshipId);
      if (conceptById && conceptById.user_id === userId) {
        return conceptById.concept_id;
      }
      
      // V11.1.2 ENHANCEMENT: Auto-create missing concepts for relationships
      console.log(`[IngestionAnalyst] ℹ️ Concept "${relationshipId}" not found, attempting to auto-create...`);
      const autoCreatedConcept = await this.findOrCreateConceptByName(userId, relationshipId);
      if (autoCreatedConcept) {
        return autoCreatedConcept.concept_id;
      }
      
      console.warn(`[IngestionAnalyst] ⚠️ Could not map relationship ID: ${relationshipId}`);
      return null;
      
    } catch (error) {
      console.error(`[IngestionAnalyst] ❌ Error mapping relationship ID ${relationshipId}:`, error);
      return null;
    }
  }

  /**
   * V11.1.1 NEW: Find or create a User concept for the user
   */
  private async findOrCreateUserConcept(userId: string, userName: string): Promise<any | null> {
    try {
      // First try to find existing User concept
      const concepts = await this.conceptRepository.findByUserId(userId);
      const userConcept = concepts.find(c => c.name === userName && c.type === 'person');
      
      if (userConcept) {
        return userConcept;
      }

      // Create User concept if it doesn't exist
      const userConceptData = {
        user_id: userId,
        name: userName,
        type: 'person',
        description: `The user (${userName}) in this knowledge graph - the central person whose experiences, interests, and growth are being tracked.`,
        salience: 10 // High salience since user is central to their own knowledge graph
      };

      const createdUserConcept = await this.conceptRepository.create(userConceptData);
      console.log(`[IngestionAnalyst] ✅ Created User concept for ${userName}: ${createdUserConcept.concept_id}`);
      
      return createdUserConcept;

    } catch (error) {
      console.error(`[IngestionAnalyst] ❌ Error finding/creating User concept for ${userName}:`, error);
      return null;
    }
  }

  /**
   * V11.1.2 NEW: Find or create any concept by name
   */
  private async findOrCreateConceptByName(userId: string, conceptName: string, conceptType: string = 'theme'): Promise<any | null> {
    try {
      // First try to find existing concept
      const concepts = await this.conceptRepository.findByUserId(userId);
      const existingConcept = concepts.find(c => c.name === conceptName);
      
      if (existingConcept) {
        return existingConcept;
      }

      // Create concept if it doesn't exist
      const conceptData = {
        user_id: userId,
        name: conceptName,
        type: conceptType,
        description: `Concept extracted from conversation: ${conceptName}`,
        salience: 0.5 // Default salience for auto-created concepts
      };

      const createdConcept = await this.conceptRepository.create(conceptData);
      console.log(`[IngestionAnalyst] ✅ Auto-created concept for relationship: ${conceptName} (${createdConcept.concept_id})`);
      
      return createdConcept;

    } catch (error) {
      console.error(`[IngestionAnalyst] ❌ Error finding/creating concept for ${conceptName}:`, error);
      return null;
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
      } else if (entity.type === 'GrowthEvent') {
        const growthEvent = await this.growthEventRepository.findById(entity.id);
        if (growthEvent) {
          const details = growthEvent.details as any;
          textContent = `${growthEvent.dimension_key} Growth Event: ${details?.rationale || growthEvent.rationale || 'Growth event recorded'}`;
        }
      } else if (entity.type === 'DerivedArtifact') {
        // CRITICAL FIX: Add support for DerivedArtifact entities
        const artifact = await this.derivedArtifactRepository.findById(entity.id);
        if (artifact) {
          textContent = `${artifact.title}\n\n${artifact.content_narrative || 'Derived artifact content'}`;
        }
      } else if (entity.type === 'Community') {
        // CRITICAL FIX: Add support for Community entities
        // Note: CommunityRepository doesn't have findById, so we'll use a direct Prisma query
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
        // CRITICAL FIX: Add support for ProactivePrompt entities
        const prompt = await this.proactivePromptRepository.findById(entity.id);
        if (prompt) {
          textContent = `Proactive Prompt: ${prompt.prompt_text || 'Prompt content'}`;
        }
      } else if (entity.type === 'User') {
        // CRITICAL FIX: Add support for User entities
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
   * Calculate concept salience based on context and importance
   * Salience ranges from 0.0 to 1.0, where higher values indicate more important concepts
   */
  private calculateConceptSalience(concept: any, persistencePayload: any): number {
    let salience = 0.5; // Base salience
    
    // Boost salience based on concept type
    if (concept.type === 'person' || concept.type === 'knowledge') {
      salience += 0.2; // People and knowledge are generally more salient
    } else if (concept.type === 'skill' || concept.type === 'location') {
      salience += 0.15; // Skills and locations are moderately salient
    } else if (concept.type === 'emotion' || concept.type === 'experience') {
      salience += 0.1; // Emotions and experiences have some salience
    }
    
    // Boost salience if concept appears in multiple contexts
    if (persistencePayload.extracted_memory_units && persistencePayload.extracted_memory_units.length > 0) {
      salience += 0.1; // Concept mentioned in memory units
    }
    
    if (persistencePayload.new_relationships && persistencePayload.new_relationships.length > 0) {
      salience += 0.1; // Concept has relationships
    }
    
    // Ensure salience stays within bounds
    return Math.min(Math.max(salience, 0.1), 1.0);
  }

  /**
   * V11.1: Generate smart, user-facing conversation title using LLM
   * This replaces the generic timestamp-based titles with meaningful descriptions
   */
  private async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      console.log(`[IngestionAnalyst] Updating conversation title: "${title}"`);
      
      // Clean up the title
      let cleanTitle = title.trim();
      
      // Remove quotes if present
      if ((cleanTitle.startsWith('"') && cleanTitle.endsWith('"')) ||
          (cleanTitle.startsWith("'") && cleanTitle.endsWith("'"))) {
        cleanTitle = cleanTitle.slice(1, -1);
      }
      
      // Ensure it's not too long
      if (cleanTitle.length > 50) {
        cleanTitle = cleanTitle.substring(0, 47) + '...';
      }
      
      // Fallback if empty
      if (!cleanTitle || cleanTitle.trim() === '') {
        cleanTitle = 'New Conversation';
      }
      
      // Update the conversation with the title
      await this.conversationRepository.update(conversationId, {
        title: cleanTitle
      });
      
      console.log(`[IngestionAnalyst] Successfully updated conversation title: "${cleanTitle}"`);
      
    } catch (error) {
      console.error(`[IngestionAnalyst] Failed to update conversation title:`, error);
      
      // Set a fallback title
      await this.conversationRepository.update(conversationId, {
        title: 'New Conversation'
      });
    }
  }
}
