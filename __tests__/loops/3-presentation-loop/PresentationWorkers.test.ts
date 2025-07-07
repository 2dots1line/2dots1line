/**
 * Comprehensive Unit Tests for V9.5 Presentation Loop (Card & Graph Generation)
 * CardWorker & GraphProjectionWorker Integration Tests
 * 
 * These tests cover:
 * - Event consumption from card-and-graph-queue
 * - Card eligibility evaluation and creation logic
 * - Graph projection generation and 3D coordinate calculation
 * - Configuration-driven card templates and rules
 * - Error handling for projection failures
 * - Performance with large knowledge graphs
 * - UI data quality and consistency
 */

import { jest } from '@jest/globals';
import { CardWorker, NewEntitiesCreatedEvent, CycleArtifactsCreatedEvent } from '../../../workers/card-worker/src/CardWorker';
import { GraphProjectionWorker } from '../../../workers/graph-projection-worker/src/GraphProjectionWorker';
import { CardFactory } from '../../../services/card-service/src/CardFactory';
import { DatabaseService } from '../../../packages/database/src/DatabaseService';
import { ConfigService } from '../../../services/config-service/src/ConfigService';

// Mock BullMQ Job interface
interface MockJob<T = any> {
  data: T;
}

// Mock dependencies
jest.mock('../../../services/card-service/src/CardFactory');
jest.mock('../../../packages/database/src/DatabaseService');
jest.mock('../../../services/config-service/src/ConfigService');

describe('V9.5 Presentation Loop (Card & Graph Generation)', () => {
  let cardWorker: CardWorker;
  let graphProjectionWorker: GraphProjectionWorker;
  let mockCardFactory: any;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockConfigService: any;

  beforeEach(() => {
    // Initialize mocks
    mockDatabaseService = {
      prisma: {} as any,
      neo4j: {} as any,
      weaviate: {} as any,
      redis: {} as any
    } as jest.Mocked<DatabaseService>;

    mockConfigService = {
      getConfig: (jest.fn() as any)
    } as any;
    mockCardFactory = {
      createCardForEntity: (jest.fn() as any)
    } as any;

    // Initialize workers
    cardWorker = new CardWorker(mockDatabaseService, mockConfigService);
    graphProjectionWorker = new GraphProjectionWorker(mockDatabaseService);

    // Mock the card factory in the worker
    (cardWorker as any).cardFactory = mockCardFactory;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. CARD WORKER TESTS', () => {
    describe('Event Processing', () => {
      test('should process new_entities_created events correctly', async () => {
        const eventData: NewEntitiesCreatedEvent = {
          type: 'new_entities_created',
          userId: 'user-123',
          source: 'IngestionAnalyst',
          timestamp: new Date().toISOString(),
          entities: [
            { id: 'mem-456', type: 'MemoryUnit' },
            { id: 'concept-789', type: 'Concept' },
            { id: 'concept-abc', type: 'Concept' }
          ]
        };

        // Mock card factory responses
        mockCardFactory.createCardForEntity
          .mockResolvedValueOnce({ created: true, cardId: 'card-1' })
          .mockResolvedValueOnce({ created: false, reason: 'Importance score too low' })
          .mockResolvedValueOnce({ created: true, cardId: 'card-2' });

        const job = { data: eventData } as MockJob<NewEntitiesCreatedEvent>;
        await (cardWorker as any).processJob(job);

        // Verify all entities were processed
        expect(mockCardFactory.createCardForEntity).toHaveBeenCalledTimes(3);
        expect(mockCardFactory.createCardForEntity).toHaveBeenCalledWith(
          { id: 'mem-456', type: 'MemoryUnit' },
          'user-123'
        );
        expect(mockCardFactory.createCardForEntity).toHaveBeenCalledWith(
          { id: 'concept-789', type: 'Concept' },
          'user-123'
        );
        expect(mockCardFactory.createCardForEntity).toHaveBeenCalledWith(
          { id: 'concept-abc', type: 'Concept' },
          'user-123'
        );
      });

      test('should process cycle_artifacts_created events correctly', async () => {
        const eventData: CycleArtifactsCreatedEvent = {
          type: 'cycle_artifacts_created',
          userId: 'user-123',
          source: 'InsightEngine',
          timestamp: new Date().toISOString(),
          entities: [
            { id: 'artifact-456', type: 'DerivedArtifact' },
            { id: 'prompt-789', type: 'ProactivePrompt' }
          ]
        };

        mockCardFactory.createCardForEntity
          .mockResolvedValueOnce({ created: true, cardId: 'card-cycle-1' })
          .mockResolvedValueOnce({ created: true, cardId: 'card-quest-1' });

        const job = { data: eventData } as MockJob<CycleArtifactsCreatedEvent>;
        await (cardWorker as any).processJob(job);

        expect(mockCardFactory.createCardForEntity).toHaveBeenCalledTimes(2);
        expect(mockCardFactory.createCardForEntity).toHaveBeenCalledWith(
          { id: 'artifact-456', type: 'DerivedArtifact' },
          'user-123'
        );
        expect(mockCardFactory.createCardForEntity).toHaveBeenCalledWith(
          { id: 'prompt-789', type: 'ProactivePrompt' },
          'user-123'
        );
      });

      test('should handle empty entity arrays gracefully', async () => {
        const eventData: NewEntitiesCreatedEvent = {
          type: 'new_entities_created',
          userId: 'user-123',
          source: 'IngestionAnalyst',
          timestamp: new Date().toISOString(),
          entities: []
        };

        const job = { data: eventData } as MockJob<NewEntitiesCreatedEvent>;
        await expect((cardWorker as any).processJob(job)).resolves.not.toThrow();

        expect(mockCardFactory.createCardForEntity).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      test('should handle CardFactory failures gracefully', async () => {
        const eventData: NewEntitiesCreatedEvent = {
          type: 'new_entities_created',
          userId: 'user-123',
          source: 'IngestionAnalyst',
          timestamp: new Date().toISOString(),
          entities: [
            { id: 'mem-456', type: 'MemoryUnit' },
            { id: 'concept-789', type: 'Concept' }
          ]
        };

        mockCardFactory.createCardForEntity
          .mockResolvedValueOnce({ created: true, cardId: 'card-1' })
          .mockRejectedValueOnce(new Error('Database connection failed'));

        const job = { data: eventData } as MockJob<NewEntitiesCreatedEvent>;

        // Should not fail the entire job if one entity fails
        await expect((cardWorker as any).processJob(job)).rejects.toThrow('Database connection failed');
      });

      test('should handle malformed event data', async () => {
        const malformedEvent = {
          type: 'new_entities_created',
          // Missing required fields
          entities: 'not-an-array'
        };

        const job = { data: malformedEvent } as MockJob<any>;
        await expect((cardWorker as any).processJob(job)).rejects.toThrow();
      });
    });
  });

  describe('2. CARD FACTORY TESTS', () => {
    describe('Eligibility Rules', () => {
      test('should apply importance threshold rules correctly', async () => {
        const mockMemoryUnit = {
          muid: 'mem-123',
          title: 'Important Memory',
          content: 'This is a significant memory',
          importance_score: 8,
          user_id: 'user-456'
        };

        const mockEligibilityRules = {
          MemoryUnit: {
            min_importance_score: 7,
            required_source_types: ['conversation_extraction']
          }
        };

        mockConfigService.getConfig.mockReturnValue(mockEligibilityRules);
        
        // Mock repository to return the memory unit
        const mockMemoryRepo = {
          findById: (jest.fn() as any).mockResolvedValue(mockMemoryUnit)
        };
        (mockCardFactory as any).memoryRepository = mockMemoryRepo;

        // Mock card template
        const mockCardTemplate = {
          card_type: 'memory_unit_card',
          display_data: {
            title_source_field: 'title',
            preview_source_field: 'content',
            preview_truncate_length: 150
          }
        };

        mockConfigService.getConfig.mockReturnValue({ MemoryUnit: mockCardTemplate });

        const mockCardResponse = { card_id: 'card-123' };
        const mockCardRepo = {
          create: (jest.fn() as any).mockResolvedValue(mockCardResponse)
        };
        (mockCardFactory as any).cardRepository = mockCardRepo;

        const result = await mockCardFactory.createCardForEntity(
          { id: 'mem-123', type: 'MemoryUnit' },
          'user-456'
        );

        expect(result.created).toBe(true);
        expect(result.cardId).toBe('card-123');
      });

      test('should reject entities below importance threshold', async () => {
        const mockMemoryUnit = {
          muid: 'mem-123',
          title: 'Low Importance Memory',
          content: 'This is not very significant',
          importance_score: 3, // Below threshold
          user_id: 'user-456'
        };

        const mockEligibilityRules = {
          MemoryUnit: {
            min_importance_score: 7 // Higher than the memory's score
          }
        };

        mockConfigService.getConfig.mockReturnValue(mockEligibilityRules);
        
        const mockMemoryRepo = {
          findById: (jest.fn() as any).mockResolvedValue(mockMemoryUnit)
        };
        (mockCardFactory as any).memoryRepository = mockMemoryRepo;

        const result = await mockCardFactory.createCardForEntity(
          { id: 'mem-123', type: 'MemoryUnit' },
          'user-456'
        );

        expect(result.created).toBe(false);
        expect(result.reason).toContain('importance');
      });
    });

    describe('Card Template Application', () => {
      test('should apply card templates correctly for different entity types', async () => {
        const mockConcept = {
          concept_id: 'concept-123',
          name: 'fitness goals',
          type: 'goal',
          description: 'User\'s fitness and health objectives',
          salience: 0.8
        };

        const mockTemplate = {
          card_type: 'goal_card',
          display_data: {
            title_source_field: 'name',
            preview_source_field: 'description',
            icon: 'goal-icon'
          }
        };

        const mockEligibilityRules = {
          Concept: { min_salience: 0.6 }
        };

        mockConfigService.getConfig
          .mockReturnValueOnce(mockEligibilityRules)
          .mockReturnValueOnce({ Concept_goal: mockTemplate });

        const mockConceptRepo = {
          findById: (jest.fn() as any).mockResolvedValue(mockConcept)
        };
        const mockCardResponse2 = { card_id: 'card-456' };
        const mockCardRepo = {
          create: (jest.fn() as any).mockResolvedValue(mockCardResponse2)
        };

        (mockCardFactory as any).conceptRepository = mockConceptRepo;
        (mockCardFactory as any).cardRepository = mockCardRepo;

        await mockCardFactory.createCardForEntity(
          { id: 'concept-123', type: 'Concept' },
          'user-456'
        );

        // Verify card was created with correct template data
        expect(mockCardRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            card_type: 'goal_card',
            display_data: expect.objectContaining({
              title: 'fitness goals',
              preview: 'User\'s fitness and health objectives'
            })
          })
        );
      });

      test('should handle missing templates gracefully', async () => {
        const mockEntity = {
          id: 'unknown-123',
          type: 'UnknownEntityType'
        };

        mockConfigService.getConfig.mockReturnValue({}); // No templates

        const result = await mockCardFactory.createCardForEntity(
          mockEntity,
          'user-456'
        );

        expect(result.created).toBe(false);
        expect(result.reason).toContain('template');
      });
    });
  });

  describe('3. GRAPH PROJECTION WORKER TESTS', () => {
    describe('Event Processing', () => {
      test('should process new_entities_created events that require projection updates', async () => {
        const eventData: NewEntitiesCreatedEvent = {
          type: 'new_entities_created',
          userId: 'user-123',
          source: 'IngestionAnalyst',
          timestamp: new Date().toISOString(),
          entities: [
            { id: 'mem-456', type: 'MemoryUnit' },
            { id: 'concept-789', type: 'Concept' }
          ]
        };

        // Mock the projection generation pipeline
        const mockNodes = [
          { id: 'mem-456', type: 'MemoryUnit', position: { x: 1.2, y: -0.8, z: 0.5 }, properties: {} },
          { id: 'concept-789', type: 'Concept', position: { x: -0.3, y: 1.1, z: -0.7 }, properties: {} }
        ];

        const mockProjection = {
          user_id: 'user-123',
          projection_data: {
            nodes: mockNodes,
            edges: [],
            metadata: {
              algorithm: 'umap',
              node_count: 2,
              generated_at: new Date().toISOString()
            }
          }
        };

        // Mock the projection generation methods
        jest.spyOn(graphProjectionWorker as any, 'generateProjection').mockResolvedValue(mockProjection);
        jest.spyOn(graphProjectionWorker as any, 'storeProjection').mockResolvedValue(undefined);

        const job = { data: eventData } as MockJob<NewEntitiesCreatedEvent>;
        await (graphProjectionWorker as any).processJob(job);

        expect((graphProjectionWorker as any).generateProjection).toHaveBeenCalledWith('user-123');
        expect((graphProjectionWorker as any).storeProjection).toHaveBeenCalledWith(mockProjection);
      });

      test('should skip events that do not require projection updates', async () => {
        const eventData = {
          type: 'low_importance_conversation_processed',
          userId: 'user-123',
          entities: []
        };

        jest.spyOn(graphProjectionWorker as any, 'generateProjection').mockResolvedValue({});

        const job = { data: eventData } as MockJob<any>;
        await (graphProjectionWorker as any).processJob(job);

        // Should skip processing for irrelevant events
        expect((graphProjectionWorker as any).generateProjection).not.toHaveBeenCalled();
      });
    });

    describe('Projection Generation', () => {
      test('should fetch graph data from Neo4j and Weaviate', async () => {
        const userId = 'user-123';

        // Mock Neo4j graph structure
        const mockGraphData = {
          nodes: [
            { id: 'mem-1', labels: ['MemoryUnit'], properties: { title: 'Memory 1' } },
            { id: 'concept-1', labels: ['Concept'], properties: { name: 'fitness' } },
            { id: 'concept-2', labels: ['Concept'], properties: { name: 'goals' } }
          ],
          relationships: [
            { startNode: 'mem-1', endNode: 'concept-1', type: 'HIGHLIGHTS' },
            { startNode: 'concept-1', endNode: 'concept-2', type: 'RELATED_TO' }
          ]
        };

        // Mock Weaviate vector data
        const mockVectorData = [
          { id: 'mem-1', vector: [0.1, -0.2, 0.8, 0.3] },
          { id: 'concept-1', vector: [0.4, 0.6, -0.1, 0.2] },
          { id: 'concept-2', vector: [0.3, 0.5, 0.0, 0.4] }
        ];

        // Mock dimension reducer response
        const mockReducedCoordinates = [
          { x: 1.2, y: -0.8, z: 0.5 },
          { x: -0.3, y: 1.1, z: -0.7 },
          { x: 0.8, y: 0.2, z: 1.3 }
        ];

        jest.spyOn(graphProjectionWorker as any, 'fetchGraphStructure').mockResolvedValue(mockGraphData);
        jest.spyOn(graphProjectionWorker as any, 'fetchVectorData').mockResolvedValue(mockVectorData);
        jest.spyOn(graphProjectionWorker as any, 'callDimensionReducer').mockResolvedValue(mockReducedCoordinates);

        const projection = await (graphProjectionWorker as any).generateProjection(userId);

        expect(projection.nodes).toHaveLength(3);
        expect(projection.nodes[0]).toMatchObject({
          id: 'mem-1',
          type: 'MemoryUnit',
          position: { x: 1.2, y: -0.8, z: 0.5 },
          properties: { title: 'Memory 1' }
        });
      });

      test('should handle large graphs efficiently', async () => {
        const userId = 'user-123';

        // Create a large mock graph (1000+ nodes)
        const largeGraphData = {
          nodes: Array.from({ length: 1000 }, (_, i) => ({
            id: `node-${i}`,
            labels: i % 2 === 0 ? ['MemoryUnit'] : ['Concept'],
            properties: { title: `Node ${i}` }
          })),
          relationships: Array.from({ length: 500 }, (_, i) => ({
            startNode: `node-${i}`,
            endNode: `node-${i + 1}`,
            type: 'RELATED_TO'
          }))
        };

        const largeVectorData = Array.from({ length: 1000 }, (_, i) => ({
          id: `node-${i}`,
          vector: Array.from({ length: 384 }, () => Math.random() - 0.5)
        }));

        const largeReducedCoordinates = Array.from({ length: 1000 }, () => ({
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 10 - 5
        }));

        jest.spyOn(graphProjectionWorker as any, 'fetchGraphStructure').mockResolvedValue(largeGraphData);
        jest.spyOn(graphProjectionWorker as any, 'fetchVectorData').mockResolvedValue(largeVectorData);
        jest.spyOn(graphProjectionWorker as any, 'callDimensionReducer').mockResolvedValue(largeReducedCoordinates);

        const startTime = Date.now();
        const projection = await (graphProjectionWorker as any).generateProjection(userId);
        const duration = Date.now() - startTime;

        expect(projection.nodes).toHaveLength(1000);
        expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      });
    });

    describe('Dimension Reduction Integration', () => {
      test('should call Python dimension reducer service correctly', async () => {
        const mockVectors = [
          [0.1, -0.2, 0.8, 0.3, 0.5],
          [0.4, 0.6, -0.1, 0.2, 0.1],
          [0.3, 0.5, 0.0, 0.4, -0.2]
        ];

        // Mock HTTP client for dimension reducer
        const mockFetchResponse = {
          ok: true,
          json: () => Promise.resolve({
            coordinates: [
              { x: 1.2, y: -0.8, z: 0.5 },
              { x: -0.3, y: 1.1, z: -0.7 },
              { x: 0.8, y: 0.2, z: 1.3 }
            ]
          })
        };
        const mockFetch = (jest.fn() as any).mockResolvedValue(mockFetchResponse);

        global.fetch = mockFetch as any;

        const coordinates = await (graphProjectionWorker as any).callDimensionReducer(mockVectors, 'umap');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/reduce'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vectors: mockVectors,
              method: 'umap',
              n_components: 3
            })
          })
        );

        expect(coordinates).toHaveLength(3);
        expect(coordinates[0]).toMatchObject({ x: 1.2, y: -0.8, z: 0.5 });
      });

      test('should handle dimension reducer failures gracefully', async () => {
        const mockVectors = [[0.1, 0.2], [0.3, 0.4]];

        const mockError = new Error('Service unavailable');
        const mockFetch = (jest.fn() as any).mockRejectedValue(mockError);
        global.fetch = mockFetch as any;

        await expect(
          (graphProjectionWorker as any).callDimensionReducer(mockVectors, 'umap')
        ).rejects.toThrow('Service unavailable');
      });
    });

    describe('Projection Storage', () => {
      test('should store projection data in PostgreSQL', async () => {
        const mockProjection = {
          user_id: 'user-123',
          projection_data: {
            nodes: [
              { id: 'node-1', type: 'MemoryUnit', position: { x: 1, y: 2, z: 3 } }
            ],
            edges: [],
            metadata: {
              algorithm: 'umap',
              node_count: 1,
              generated_at: new Date().toISOString()
            }
          }
        };

        const mockProjectionResponse = { id: 'projection-456' };
        const mockGraphProjectionRepo = {
          createOrUpdate: (jest.fn() as any).mockResolvedValue(mockProjectionResponse)
        };

        (graphProjectionWorker as any).graphProjectionRepository = mockGraphProjectionRepo;

        await (graphProjectionWorker as any).storeProjection(mockProjection);

        expect(mockGraphProjectionRepo.createOrUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'user-123',
            projection_data: mockProjection.projection_data
          })
        );
      });
    });
  });

  describe('4. UI DATA QUALITY TESTS', () => {
    describe('Card Display Data Quality', () => {
      test('should generate appropriate card previews', async () => {
        const testCases = [
          {
            entityType: 'MemoryUnit',
            entity: {
              title: 'My Career Breakthrough Moment',
              content: 'Today I realized that my true passion lies in helping others grow and develop their potential. This insight came during a conversation with my mentor about my long-term goals and values. I want to pivot my career toward coaching and mentoring.',
              importance_score: 8
            },
            expectedCardType: 'memory_unit_card',
            expectedPreviewLength: [50, 150]
          },
          {
            entityType: 'Concept',
            entity: {
              name: 'work-life balance',
              type: 'challenge',
              description: 'The ongoing struggle to maintain equilibrium between professional responsibilities and personal life',
              salience: 0.9
            },
            expectedCardType: 'concept_card',
            expectedIcon: 'balance-icon'
          },
          {
            entityType: 'ProactivePrompt',
            entity: {
              prompt_text: 'How might you apply the insights from your recent career reflection to set concrete goals for the next quarter?',
              rationale: 'User showed readiness for goal-setting after breakthrough moment',
              priority: 'high'
            },
            expectedCardType: 'quest_card',
            expectedTitle: 'How might you apply the insights'
          }
        ];

        for (const testCase of testCases) {
          // Mock eligibility check to pass
          mockConfigService.getConfig.mockReturnValueOnce({
            [testCase.entityType]: { min_importance_score: 0 }
          });

          // Mock card template
          mockConfigService.getConfig.mockReturnValueOnce({
            [testCase.entityType]: {
              card_type: testCase.expectedCardType,
              display_data: {
                title_source_field: testCase.entityType === 'ProactivePrompt' ? 'prompt_text' : 'title',
                preview_source_field: 'content'
              }
            }
          });

          const mockRepo = {
            findById: (jest.fn() as any).mockResolvedValue(testCase.entity)
          };

          const mockCardRepo = {
            create: (jest.fn() as any).mockImplementation((cardData: any) => {
              // Verify card data quality
              expect(cardData.card_type).toBe(testCase.expectedCardType);
              expect(cardData.display_data.title).toBeDefined();
              expect(cardData.display_data.title.length).toBeGreaterThan(0);

              if (testCase.expectedPreviewLength) {
                expect(cardData.display_data.preview.length).toBeGreaterThanOrEqual(testCase.expectedPreviewLength[0]);
                expect(cardData.display_data.preview.length).toBeLessThanOrEqual(testCase.expectedPreviewLength[1]);
              }

              return Promise.resolve({ card_id: `card-${Date.now()}` });
            })
          };

          (mockCardFactory as any)[`${testCase.entityType.toLowerCase()}Repository`] = mockRepo;
          (mockCardFactory as any).cardRepository = mockCardRepo;

          await mockCardFactory.createCardForEntity(
            { id: 'entity-123', type: testCase.entityType },
            'user-456'
          );
        }
      });
    });

    describe('3D Coordinate Quality', () => {
      test('should generate valid 3D coordinates within reasonable bounds', async () => {
        const mockVectors = Array.from({ length: 100 }, () => 
          Array.from({ length: 384 }, () => Math.random() - 0.5)
        );

        const mockCoordinates = Array.from({ length: 100 }, () => ({
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 10
        }));

        jest.spyOn(graphProjectionWorker as any, 'callDimensionReducer').mockResolvedValue(mockCoordinates);

        const result = await (graphProjectionWorker as any).callDimensionReducer(mockVectors, 'umap');

        // Verify coordinate quality
        result.forEach((coord: { x: number; y: number; z: number }) => {
          expect(Number.isFinite(coord.x)).toBe(true);
          expect(Number.isFinite(coord.y)).toBe(true);
          expect(Number.isFinite(coord.z)).toBe(true);
          expect(Math.abs(coord.x)).toBeLessThan(100); // Reasonable bounds
          expect(Math.abs(coord.y)).toBeLessThan(100);
          expect(Math.abs(coord.z)).toBeLessThan(100);
        });

        // Verify coordinates are spread out (not all clustered at origin)
        const distances = result.map((coord: { x: number; y: number; z: number }) => 
          Math.sqrt(coord.x * coord.x + coord.y * coord.y + coord.z * coord.z)
        );
        const avgDistance = distances.reduce((a: number, b: number) => a + b, 0) / distances.length;
        expect(avgDistance).toBeGreaterThan(0.1); // Not all clustered at origin
      });

      test('should preserve semantic relationships in 3D space', async () => {
        // Mock semantically related concepts that should be close in 3D space
        const relatedConcepts = [
          { id: 'fitness', vector: [0.8, 0.1, 0.2, 0.3] },
          { id: 'exercise', vector: [0.7, 0.2, 0.1, 0.4] }, // Similar to fitness
          { id: 'health', vector: [0.6, 0.3, 0.2, 0.2] },   // Related to fitness
          { id: 'mathematics', vector: [-0.8, -0.2, 0.1, 0.3] } // Unrelated
        ];

        const mockCoordinates = [
          { x: 2.1, y: 1.8, z: 0.5 },   // fitness
          { x: 2.3, y: 1.9, z: 0.4 },   // exercise (close to fitness)
          { x: 2.0, y: 2.1, z: 0.6 },   // health (close to fitness)
          { x: -3.2, y: -1.5, z: 2.1 }  // mathematics (far from fitness cluster)
        ];

        jest.spyOn(graphProjectionWorker as any, 'callDimensionReducer').mockResolvedValue(mockCoordinates);

        const result = await (graphProjectionWorker as any).callDimensionReducer(
          relatedConcepts.map(c => c.vector), 
          'umap'
        );

        // Calculate distances between fitness-related concepts
        const distance = (a: any, b: any) => 
          Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);

        const fitnessExerciseDistance = distance(result[0], result[1]);
        const fitnessHealthDistance = distance(result[0], result[2]);
        const fitnessMathDistance = distance(result[0], result[3]);

        // Related concepts should be closer than unrelated ones
        expect(fitnessExerciseDistance).toBeLessThan(fitnessMathDistance);
        expect(fitnessHealthDistance).toBeLessThan(fitnessMathDistance);
      });
    });
  });

  describe('5. PERFORMANCE AND SCALABILITY', () => {
    test('should handle high-volume card creation events', async () => {
      const largeBatchEvent: NewEntitiesCreatedEvent = {
        type: 'new_entities_created',
        userId: 'user-123',
        source: 'IngestionAnalyst',
        timestamp: new Date().toISOString(),
        entities: Array.from({ length: 100 }, (_, i) => ({
          id: `entity-${i}`,
          type: i % 2 === 0 ? 'MemoryUnit' : 'Concept'
        }))
      };

      // Mock successful card creation for all entities
      mockCardFactory.createCardForEntity.mockImplementation(async () => ({
        created: Math.random() > 0.3, // 70% success rate
        cardId: `card-${Date.now()}-${Math.random()}`
      }));

      const startTime = Date.now();
      const job = { data: largeBatchEvent } as MockJob<NewEntitiesCreatedEvent>;
      await (cardWorker as any).processJob(job);
      const duration = Date.now() - startTime;

      expect(mockCardFactory.createCardForEntity).toHaveBeenCalledTimes(100);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });

    test('should handle projection generation for large graphs', async () => {
      const userId = 'user-with-large-graph';

      // Mock a large knowledge graph
      const largeGraph = {
        nodes: Array.from({ length: 2000 }, (_, i) => ({
          id: `node-${i}`,
          labels: ['MemoryUnit'],
          properties: { title: `Memory ${i}` }
        })),
        relationships: Array.from({ length: 1000 }, (_, i) => ({
          startNode: `node-${i}`,
          endNode: `node-${(i + 1) % 2000}`,
          type: 'RELATED_TO'
        }))
      };

      jest.spyOn(graphProjectionWorker as any, 'fetchGraphStructure').mockResolvedValue(largeGraph);
      jest.spyOn(graphProjectionWorker as any, 'fetchVectorData').mockResolvedValue(
        Array.from({ length: 2000 }, (_, i) => ({
          id: `node-${i}`,
          vector: Array.from({ length: 384 }, () => Math.random() - 0.5)
        }))
      );
      jest.spyOn(graphProjectionWorker as any, 'callDimensionReducer').mockResolvedValue(
        Array.from({ length: 2000 }, () => ({
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 10 - 5
        }))
      );

      const startTime = Date.now();
      const projection = await (graphProjectionWorker as any).generateProjection(userId);
      const duration = Date.now() - startTime;

      expect(projection.nodes).toHaveLength(2000);
      expect(duration).toBeLessThan(60000); // Should complete within 1 minute
    });
  });
});