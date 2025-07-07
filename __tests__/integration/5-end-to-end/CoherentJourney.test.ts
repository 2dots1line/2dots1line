/**
 * V9.5 End-to-End Integration Tests: Coherent User Journey Across All System Loops
 * 
 * This test suite follows a single user through a complete conversation lifecycle,
 * validating that all 4 V9.5 system loops work together cohesively:
 * 
 * 1. Real-Time Conversation Loop (DialogueAgent + PromptBuilder)
 * 2. Fast Loop (IngestionAnalyst + HolisticAnalysisTool)
 * 3. Presentation Loop (CardWorker + GraphProjectionWorker)
 * 4. Slow Loop (InsightEngine + StrategicSynthesisTool)
 * 
 * Tests use realistic conversation data and validate natural data progression
 * through the entire V9.5 architecture.
 */

import { jest } from '@jest/globals';
import { DialogueAgent } from '../../../services/dialogue-service/src/DialogueAgent';
import { IngestionAnalyst } from '../../../workers/ingestion-worker/src/IngestionAnalyst';
import { CardWorker } from '../../../workers/card-worker/src/CardWorker';
import { GraphProjectionWorker } from '../../../workers/graph-projection-worker/src/GraphProjectionWorker';
import { InsightEngine } from '../../../workers/insight-worker/src/InsightEngine';
import { DatabaseService } from '../../../packages/database/src/DatabaseService';
import { BullMQService } from '../../../packages/database/src/services/BullMQService';

// Real conversation data for testing
const REALISTIC_CONVERSATION_TRANSCRIPT = {
  userId: 'journey-user-456',
  messages: [
    {
      role: 'user',
      content: 'I\'ve been thinking about making a career change from software engineering to product management. I love the technical side, but I\'m more excited about understanding user problems and driving product strategy.',
      timestamp: '2024-01-15T10:00:00Z'
    },
    {
      role: 'assistant', 
      content: 'That\'s an exciting transition to consider! Your engineering background gives you a strong foundation for PM work. What specific aspects of product strategy appeal to you most?',
      timestamp: '2024-01-15T10:01:00Z'
    },
    {
      role: 'user',
      content: 'I think it\'s the combination of user empathy and data-driven decision making. In my current role, I see a lot of features built without really understanding if users need them. I want to be the person who connects those dots.',
      timestamp: '2024-01-15T10:03:00Z'
    },
    {
      role: 'assistant',
      content: 'You\'ve identified a crucial gap - the space between what we can build and what users actually need. That user-centric mindset is fundamental to great product management. Have you started exploring any specific PM domains or companies?',
      timestamp: '2024-01-15T10:04:00Z'
    },
    {
      role: 'user', 
      content: 'I\'m particularly interested in B2B SaaS products. I think my technical background would be valuable there. I\'ve been reading "Inspired" by Marty Cagan and considering taking a product management course.',
      timestamp: '2024-01-15T10:06:00Z'
    },
    {
      role: 'assistant',
      content: 'Excellent choices! B2B SaaS is a great fit for your technical background, and "Inspired" is foundational reading. A structured course could help you learn frameworks for discovery, prioritization, and stakeholder management. What\'s your timeline for making this transition?',
      timestamp: '2024-01-15T10:07:00Z'
    }
  ],
  conversationMetadata: {
    startedAt: '2024-01-15T10:00:00Z',
    endedAt: '2024-01-15T10:08:00Z',
    estimatedImportanceScore: 8.2,
    primaryTopics: ['career_transition', 'product_management', 'professional_development']
  }
};

describe('V9.5 End-to-End Integration: Complete User Journey', () => {
  let dialogueAgent: DialogueAgent;
  let ingestionAnalyst: IngestionAnalyst;
  let cardWorker: CardWorker;
  let graphProjectionWorker: GraphProjectionWorker;
  let insightEngine: InsightEngine;
  let databaseService: DatabaseService;
  let bullMQService: BullMQService;

  // Shared state that will be modified throughout the journey
  let journeyState: {
    conversationId: string;
    userId: string;
    createdEntities: {
      concepts: Array<{ id: string; name: string; type: string; }>;
      memoryUnits: Array<{ id: string; title: string; }>;
      growthEvents: Array<{ id: string; dimension: string; delta: number; }>;
      cards: Array<{ id: string; type: string; }>;
      artifacts: Array<{ id: string; type: string; }>;
    };
    userState: {
      memoryProfile: any;
      knowledgeGraphSchema: any;
      lastCycleDate: Date;
    };
  };

  beforeAll(async () => {
    // Initialize all services and workers
    databaseService = new DatabaseService();
    bullMQService = new BullMQService();
    
    dialogueAgent = new DialogueAgent(databaseService);
    ingestionAnalyst = new IngestionAnalyst(databaseService, bullMQService);
    cardWorker = new CardWorker(databaseService, bullMQService);
    graphProjectionWorker = new GraphProjectionWorker(databaseService, bullMQService);
    insightEngine = new InsightEngine(databaseService, bullMQService);

    // Initialize journey state
    journeyState = {
      conversationId: '',
      userId: REALISTIC_CONVERSATION_TRANSCRIPT.userId,
      createdEntities: {
        concepts: [],
        memoryUnits: [],
        growthEvents: [],
        cards: [],
        artifacts: []
      },
      userState: {
        memoryProfile: null,
        knowledgeGraphSchema: null,
        lastCycleDate: new Date('2024-01-01T00:00:00Z')
      }
    };

    await databaseService.connect();
  });

  afterAll(async () => {
    await databaseService.disconnect();
  });

  describe('Phase 1: Real-Time Conversation Loop', () => {
    test('should handle multi-turn conversation with context preservation', async () => {
      const messages = REALISTIC_CONVERSATION_TRANSCRIPT.messages;
      let conversationContext = '';

      // Process each message turn
      for (let i = 0; i < messages.length; i += 2) {
        const userMessage = messages[i];
        const expectedResponse = messages[i + 1];

        if (userMessage?.role === 'user') {
          const response = await dialogueAgent.processMessage({
            userId: journeyState.userId,
            message: userMessage.content,
            conversationId: journeyState.conversationId || undefined,
            context: conversationContext
          });

          // Validate response structure
          expect(response).toHaveProperty('content');
          expect(response).toHaveProperty('conversationId');
          expect(response.content).toBeTruthy();
          expect(response.content.length).toBeGreaterThan(10);

          // Update conversation context and ID
          conversationContext += `Human: ${userMessage.content}\nAssistant: ${response.content}\n`;
          journeyState.conversationId = response.conversationId;

          // Validate conversation flows naturally (not too robotic)
          expect(response.content).not.toMatch(/^I am an AI|As an AI assistant/);
          expect(response.content).toMatch(/\b(you|your|that's|what|how)\b/i); // Natural language markers
        }
      }

      expect(journeyState.conversationId).toBeTruthy();
    });

    test('should demonstrate appropriate response tone and engagement', async () => {
      const response = await dialogueAgent.processMessage({
        userId: journeyState.userId,
        message: 'I\'m feeling uncertain about this career change. What if I\'m not good at product management?',
        conversationId: journeyState.conversationId
      });

      // Should demonstrate empathy and supportiveness
      expect(response.content).toMatch(/\b(understand|natural|common|experience|learn|develop)\b/i);
      expect(response.content).not.toMatch(/\b(wrong|bad|shouldn't|can't|won't work)\b/i);
      
      // Should be encouraging but realistic
      expect(response.content.length).toBeGreaterThan(50);
      expect(response.content.length).toBeLessThan(300); // Not too verbose
    });

    test('should properly end conversation and trigger ingestion', async () => {
      // Simulate conversation ending
      const endResponse = await dialogueAgent.endConversation({
        conversationId: journeyState.conversationId,
        userId: journeyState.userId
      });

      expect(endResponse).toHaveProperty('summary');
      expect(endResponse.summary).toContain('career');
      expect(endResponse.summary).toContain('product management');

      // Should have triggered ingestion queue job
      const queueJobs = await bullMQService.getJobsInQueue('ingestion-queue');
      const ingestionJob = queueJobs.find(job => 
        job.data.conversationId === journeyState.conversationId
      );
      
      expect(ingestionJob).toBeDefined();
      expect(ingestionJob.data).toMatchObject({
        conversationId: journeyState.conversationId,
        userId: journeyState.userId,
        trigger: 'conversation_ended'
      });
    });
  });

  describe('Phase 2: Fast Loop (Post-Conversation Ingestion)', () => {
    test('should process conversation and extract meaningful knowledge entities', async () => {
      const ingestionJob = {
        data: {
          conversationId: journeyState.conversationId,
          userId: journeyState.userId,
          trigger: 'conversation_ended'
        }
      };

      const result = await ingestionAnalyst.processJob(ingestionJob);

      expect(result).toHaveProperty('entitiesCreated');
      expect(result.entitiesCreated).toHaveProperty('concepts');
      expect(result.entitiesCreated).toHaveProperty('memoryUnits');
      expect(result.entitiesCreated).toHaveProperty('growthEvents');

      // Validate realistic entity extraction
      const concepts = result.entitiesCreated.concepts;
      expect(concepts.length).toBeGreaterThan(2);
      
      const conceptNames = concepts.map(c => c.name.toLowerCase());
      expect(conceptNames.some(name => name.includes('product management'))).toBe(true);
      expect(conceptNames.some(name => name.includes('career'))).toBe(true);

      // Update journey state
      journeyState.createdEntities.concepts = concepts;
      journeyState.createdEntities.memoryUnits = result.entitiesCreated.memoryUnits;
      journeyState.createdEntities.growthEvents = result.entitiesCreated.growthEvents;
    });

    test('should assign appropriate importance scores and trigger growth events', async () => {
      const growthEvents = journeyState.createdEntities.growthEvents;
      
      expect(growthEvents.length).toBeGreaterThan(0);
      
      const professionalGrowthEvent = growthEvents.find(event => 
        event.dimension === 'professional_growth'
      );
      
      expect(professionalGrowthEvent).toBeDefined();
      expect(professionalGrowthEvent.delta).toBeGreaterThan(0);
      expect(professionalGrowthEvent.delta).toBeLessThan(1);
    });

    test('should create Neo4j relationships with human-readable labels', async () => {
      // Verify that relationships were created with natural language labels
      const relationships = await databaseService.neo4j.query(`
        MATCH ()-[r:RELATED_TO]->() 
        WHERE r.userId = $userId 
        RETURN r.relationship_label as label, count(r) as count
      `, { userId: journeyState.userId });

      expect(relationships.length).toBeGreaterThan(0);
      
      const labels = relationships.map(r => r.label);
      expect(labels.some(label => 
        label.includes('interested in') || 
        label.includes('considers') || 
        label.includes('wants to')
      )).toBe(true);
    });

    test('should publish events to trigger presentation layer', async () => {
      // Check that card-and-graph-queue received new entities event
      const queueJobs = await bullMQService.getJobsInQueue('card-and-graph-queue');
      const newEntitiesJob = queueJobs.find(job => 
        job.data.type === 'new_entities_created' && 
        job.data.userId === journeyState.userId
      );

      expect(newEntitiesJob).toBeDefined();
      expect(newEntitiesJob.data.entities.length).toBeGreaterThan(0);
      
      const entityTypes = newEntitiesJob.data.entities.map(e => e.type);
      expect(entityTypes).toContain('Concept');
      expect(entityTypes).toContain('MemoryUnit');
    });
  });

  describe('Phase 3: Presentation Loop (Card & Graph Generation)', () => {
    test('should generate appropriate cards for new entities', async () => {
      const cardJob = {
        data: {
          type: 'new_entities_created',
          userId: journeyState.userId,
          entities: [
            ...journeyState.createdEntities.concepts.map(c => ({ id: c.id, type: 'Concept' })),
            ...journeyState.createdEntities.memoryUnits.map(m => ({ id: m.id, type: 'MemoryUnit' }))
          ]
        }
      };

      const cardResult = await cardWorker.processJob(cardJob);
      
      expect(cardResult).toHaveProperty('cardsCreated');
      expect(cardResult.cardsCreated.length).toBeGreaterThan(0);

      // Validate card content quality
      const cards = cardResult.cardsCreated;
      journeyState.createdEntities.cards = cards;

      cards.forEach(card => {
        expect(card).toHaveProperty('preview_content');
        expect(card).toHaveProperty('ui_actions');
        expect(card.preview_content.length).toBeGreaterThan(10);
        expect(card.preview_content).not.toMatch(/undefined|null|\[object Object\]/);
      });
    });

    test('should generate 3D graph projections with reasonable coordinates', async () => {
      const projectionJob = {
        data: {
          type: 'new_entities_created',
          userId: journeyState.userId,
          entities: journeyState.createdEntities.concepts.map(c => ({ id: c.id, type: 'Concept' }))
        }
      };

      const projectionResult = await graphProjectionWorker.processJob(projectionJob);
      
      expect(projectionResult).toHaveProperty('projection_generated');
      expect(projectionResult.projection_generated).toBe(true);

      // Validate coordinate bounds and relationships
      const projection = await databaseService.getGraphProjection(journeyState.userId);
      expect(projection).toHaveProperty('nodes');
      expect(projection).toHaveProperty('edges');
      
      projection.nodes.forEach(node => {
        expect(node.position.x).toBeGreaterThan(-100);
        expect(node.position.x).toBeLessThan(100);
        expect(node.position.y).toBeGreaterThan(-100);
        expect(node.position.y).toBeLessThan(100);
        expect(node.position.z).toBeGreaterThan(-100);
        expect(node.position.z).toBeLessThan(100);
      });
    });

    test('should create cohesive UI data for frontend consumption', async () => {
      // Validate that cards and projections work together
      const cards = journeyState.createdEntities.cards;
      const projection = await databaseService.getGraphProjection(journeyState.userId);

      // Cards should reference entities that exist in the projection
      cards.forEach(card => {
        if (card.linked_entity_id) {
          const nodeExists = projection.nodes.some(node => 
            node.id === card.linked_entity_id
          );
          expect(nodeExists).toBe(true);
        }
      });

      // UI actions should be valid and actionable
      cards.forEach(card => {
        if (card.ui_actions.length > 0) {
          card.ui_actions.forEach(action => {
            expect(action).toHaveProperty('type');
            expect(action).toHaveProperty('label');
            expect(['explore', 'reflect', 'connect', 'plan'].includes(action.type)).toBe(true);
          });
        }
      });
    });
  });

  describe('Phase 4: Slow Loop (Strategic Cyclical Analysis)', () => {
    test('should determine user eligibility for strategic cycle', async () => {
      // First, simulate passing enough time and activity
      await databaseService.userRepository.updateById(journeyState.userId, {
        last_cycle_started_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        concepts_created_in_cycle: 5
      });

      const isEligible = await insightEngine.checkUserCycleEligibility(journeyState.userId);
      expect(isEligible).toBe(true);
    });

    test('should perform comprehensive strategic analysis', async () => {
      const cycleJob = {
        data: { userId: journeyState.userId }
      };

      const cycleResult = await insightEngine.processJob(cycleJob);
      
      expect(cycleResult).toHaveProperty('strategic_insights_generated');
      expect(cycleResult).toHaveProperty('ontology_updates_applied');
      expect(cycleResult).toHaveProperty('artifacts_created');

      // Validate strategic outputs
      const artifacts = cycleResult.artifacts_created;
      journeyState.createdEntities.artifacts = artifacts;

      expect(artifacts.some(a => a.type === 'cycle_report')).toBe(true);
      expect(artifacts.some(a => a.type === 'quest_prompt')).toBe(true);
    });

    test('should generate contextually relevant quest prompts', async () => {
      const questPrompts = journeyState.createdEntities.artifacts.filter(
        a => a.type === 'quest_prompt'
      );

      expect(questPrompts.length).toBeGreaterThan(0);
      
      questPrompts.forEach(quest => {
        expect(quest.content).toMatch(/\b(product management|career|transition|learn|skill)\b/i);
        expect(quest.content.endsWith('?')).toBe(true); // Should be questions
        expect(quest.content.length).toBeGreaterThan(20);
        expect(quest.content.length).toBeLessThan(200);
      });
    });

    test('should update user memory profile with strategic insights', async () => {
      const user = await databaseService.userRepository.findById(journeyState.userId);
      
      expect(user.memory_profile).toBeTruthy();
      expect(user.memory_profile).toHaveProperty('dominant_themes');
      
      const themes = user.memory_profile.dominant_themes;
      expect(themes.some(theme => 
        theme.includes('career') || theme.includes('product')
      )).toBe(true);

      journeyState.userState.memoryProfile = user.memory_profile;
      journeyState.userState.knowledgeGraphSchema = user.knowledge_graph_schema;
    });
  });

  describe('Cross-Loop Integration and Data Consistency', () => {
    test('should maintain data consistency across all loops', async () => {
      // Verify that entities created in Fast Loop are properly represented in Presentation Loop
      const allConcepts = await databaseService.conceptRepository.findByUserId(journeyState.userId);
      const allCards = await databaseService.cardRepository.findByUserId(journeyState.userId);
      
      expect(allConcepts.length).toBeGreaterThan(0);
      expect(allCards.length).toBeGreaterThan(0);

      // Each important concept should have corresponding UI representation
      const importantConcepts = allConcepts.filter(c => c.importance_score > 7);
      importantConcepts.forEach(concept => {
        const hasCard = allCards.some(card => 
          card.linked_entity_id === concept.id && 
          card.linked_entity_type === 'Concept'
        );
        expect(hasCard).toBe(true);
      });
    });

    test('should show natural progression of user understanding', async () => {
      // Validate that the knowledge graph reflects the conversation progression
      const userGraph = await databaseService.getUserKnowledgeGraph(journeyState.userId);
      
      // Should show career transition as central theme
      const careerConcepts = userGraph.nodes.filter(node =>
        node.name.toLowerCase().includes('career') ||
        node.name.toLowerCase().includes('product management')
      );
      
      expect(careerConcepts.length).toBeGreaterThan(1);
      
      // Should show relationships between related concepts
      const relationships = userGraph.edges.filter(edge =>
        careerConcepts.some(c => c.id === edge.source) ||
        careerConcepts.some(c => c.id === edge.target)
      );
      
      expect(relationships.length).toBeGreaterThan(0);
    });

    test('should demonstrate contextual memory in follow-up conversations', async () => {
      // Simulate a follow-up conversation days later
      const followUpResponse = await dialogueAgent.processMessage({
        userId: journeyState.userId,
        message: 'I\'ve been thinking more about our discussion on product management.',
        conversationId: undefined // New conversation
      });

      // Should reference previous context appropriately
      expect(followUpResponse.content).not.toMatch(/I don't recall|I'm not sure what you're referring to/);
      
      // Should build on previous understanding
      expect(followUpResponse.content.length).toBeGreaterThan(30);
      
      // May reference relevant concepts or suggest next steps
      const relevantTerms = ['product management', 'transition', 'experience', 'skills', 'next steps'];
      const hasRelevantContent = relevantTerms.some(term => 
        followUpResponse.content.toLowerCase().includes(term)
      );
      expect(hasRelevantContent).toBe(true);
    });

    test('should validate end-to-end performance within acceptable limits', async () => {
      // Test complete pipeline latency
      const start = Date.now();
      
      // Simulate quick message -> ingestion -> presentation cycle
      const quickMessage = await dialogueAgent.processMessage({
        userId: journeyState.userId,
        message: 'Quick question about PM certifications',
        conversationId: undefined
      });
      
      const conversationLatency = Date.now() - start;
      expect(conversationLatency).toBeLessThan(5000); // Should respond within 5 seconds
      
      // Background processing should complete reasonably quickly
      const ingestionStart = Date.now();
      await dialogueAgent.endConversation({
        conversationId: quickMessage.conversationId,
        userId: journeyState.userId
      });
      
      // Allow some time for background processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const backgroundLatency = Date.now() - ingestionStart;
      expect(backgroundLatency).toBeLessThan(10000); // Background processing within 10 seconds
    });
  });

  describe('User Experience Quality Validation', () => {
    test('should demonstrate coherent personality and tone across interactions', async () => {
      const responses = [];
      
      const testMessages = [
        'Tell me about product management frameworks',
        'I\'m worried about the salary cut during transition',
        'What skills should I focus on developing?'
      ];

      for (const message of testMessages) {
        const response = await dialogueAgent.processMessage({
          userId: journeyState.userId,
          message,
          conversationId: undefined
        });
        responses.push(response.content);
      }

      // All responses should maintain consistent helpful, encouraging tone
      responses.forEach(response => {
        expect(response).toMatch(/\b(you|your|can|will|help|consider|explore)\b/i);
        expect(response).not.toMatch(/\b(should|must|need to|have to)\b/gi); // Less prescriptive
      });

      // Should show progressive understanding
      expect(responses[responses.length - 1]).not.toBe(responses[0]);
    });

    test('should generate high-quality cards with actionable insights', async () => {
      const userCards = await databaseService.cardRepository.findByUserId(journeyState.userId);
      
      userCards.forEach(card => {
        // Content should be specific and valuable
        expect(card.preview_content).not.toMatch(/^This is|^Here is|^The following/);
        expect(card.preview_content.length).toBeGreaterThan(20);
        
        // UI actions should be contextually appropriate
        if (card.ui_actions.length > 0) {
          const actionLabels = card.ui_actions.map(a => a.label);
          expect(actionLabels.some(label => 
            label.includes('explore') || 
            label.includes('learn') || 
            label.includes('connect')
          )).toBe(true);
        }
      });
    });

    test('should show measurable knowledge growth over time', async () => {
      const user = await databaseService.userRepository.findById(journeyState.userId);
      const totalConcepts = await databaseService.conceptRepository.countByUserId(journeyState.userId);
      const totalMemoryUnits = await databaseService.memoryUnitRepository.countByUserId(journeyState.userId);
      
      expect(totalConcepts).toBeGreaterThan(3);
      expect(totalMemoryUnits).toBeGreaterThan(1);
      
      // Growth events should show positive progression
      const growthEvents = await databaseService.growthEventRepository.findByUserId(journeyState.userId);
      const totalGrowth = growthEvents.reduce((sum, event) => sum + event.delta, 0);
      
      expect(totalGrowth).toBeGreaterThan(0);
    });
  });
}); 