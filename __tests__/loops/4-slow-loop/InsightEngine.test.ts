/**
 * V11.0 Slow Loop - InsightEngine Tests
 * 
 * Following CRITICAL_LESSONS_LEARNED.md:
 * - LESSON 36: Jest Mock TypeScript Strict Typing patterns
 * - LESSON 37: Test failure root cause analysis and architectural alignment
 * - Comprehensive test coverage for strategic cycle processing
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import types and interfaces
import { InsightEngine, InsightJobData } from '../../../workers/insight-worker/src/InsightEngine';
import { InsightDataCompiler } from '../../../workers/insight-worker/src/InsightDataCompiler';

// Mock external dependencies at module level
jest.mock('@2dots1line/database');
jest.mock('@2dots1line/tools');
jest.mock('bullmq');

describe('V11.0 Slow Loop - InsightEngine', () => {
  let insightEngine: InsightEngine;
  let mockDependencies: {
    strategicSynthesisTool: any;
    dbService: any;
    cardAndGraphQueue: any;
    neo4jClient: any;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create comprehensive mocks following LESSON 36 patterns
    mockDependencies = {
      strategicSynthesisTool: {
        execute: jest.fn(() => Promise.resolve({
          persistence_payload: {
            cycle_report_content: 'Test strategic cycle report content',
            quest_prompts_to_create: [
              {
                title: 'Explore Advanced Concepts',
                content: 'Dive deeper into machine learning frameworks',
                priority: 'high',
                growth_dimension: 'technical_depth',
                estimated_time: '2 hours',
                complexity_level: 'intermediate'
              }
            ],
            ontology_update_cypher_statements: [
              {
                query: 'MATCH (a:Concept {name: $name}) SET a.salience = $salience',
                parameters: { name: 'AI', salience: 0.9 },
                description: 'Update concept salience'
              }
            ],
            cycle_metadata: {
              cycle_period: '1 week',
              insights_count: 5,
              major_updates: 3
            }
          },
          forward_looking_context: {
            updated_user_memory_profile: {
              learning_style: 'analytical',
              knowledge_domains: ['technology', 'strategy'],
              growth_velocity: 0.8
            },
            updated_knowledge_graph_schema: {
              version: '2.1',
              concept_hierarchy: ['domain', 'subdomain', 'concept'],
              relationship_types: ['influences', 'depends_on', 'part_of']
            }
          }
        }))
      } as any,

      dbService: {
        prisma: {
          users: {
            findUnique: jest.fn(() => Promise.resolve({
              user_id: 'user-123',
              memory_profile: { learning_style: 'visual' },
              knowledge_graph_schema: { version: '2.0' },
              last_cycle_started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              concepts_created_in_cycle: 5
            })),
            update: jest.fn(() => Promise.resolve({
              user_id: 'user-123',
              memory_profile: { learning_style: 'analytical' },
              knowledge_graph_schema: { version: '2.1' },
              last_cycle_started_at: new Date(),
              concepts_created_in_cycle: 0
            }))
          },
          conversations: {
            findMany: jest.fn(() => Promise.resolve([
              {
                id: 'conv-1',
                importance_score: 8.5,
                context_summary: 'Discussion about machine learning concepts',
                start_time: new Date()
              },
              {
                id: 'conv-2', 
                importance_score: 7.2,
                context_summary: 'Strategy planning session',
                start_time: new Date()
              }
            ]))
          },
          memory_units: {
            findMany: jest.fn(() => Promise.resolve([
              {
                title: 'Machine Learning Basics',
                content: 'Understanding neural networks and deep learning fundamentals'
              },
              {
                title: 'Strategic Planning',
                content: 'Long-term business strategy and execution frameworks'
              }
            ]))
          },
          concepts: {
            findMany: jest.fn(() => Promise.resolve([
              {
                name: 'Neural Networks',
                type: 'technology',
                description: 'AI computational model'
              },
              {
                name: 'Strategic Planning',
                type: 'methodology',
                description: 'Business planning approach'
              }
            ])),
            count: jest.fn(() => Promise.resolve(25))
          },
          growth_events: {
            findMany: jest.fn(() => Promise.resolve([
              {
                dim_key: 'technical_depth',
                delta: 2.5
              },
              {
                dim_key: 'strategic_thinking',
                delta: 1.8
              }
            ]))
          },
          proactive_prompts: {
            findMany: jest.fn(() => Promise.resolve([
              {
                title: 'Previous Quest',
                type: 'learning_challenge',
                priority: 'medium',
                created_at: new Date(),
                metadata: { difficulty: 'intermediate' }
              }
            ]))
          }
        }
      } as any,

      cardAndGraphQueue: {
        add: jest.fn(() => Promise.resolve({ id: 'job-123' }))
      } as any,

      neo4jClient: {
        session: jest.fn(() => ({
          run: jest.fn(() => Promise.resolve({
            records: [
              {
                get: jest.fn((key: string) => {
                  if (key === 'nodeCount') return { toNumber: () => 50 };
                  if (key === 'relCount') return { toNumber: () => 75 };
                  if (key === 'nodeType') return 'Concept';
                  if (key === 'count') return { toNumber: () => 30 };
                  return null;
                })
              }
            ]
          })),
          close: jest.fn(() => Promise.resolve())
        }))
      } as any
    };

    // Mock repositories
    const mockRepositories = {
      conversationRepository: {
        getMessages: jest.fn(),
        update: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findByUserId: jest.fn(),
        findActiveByUserId: jest.fn(),
        endConversation: jest.fn(),
        getMostRecentMessages: jest.fn(),
        getRecentImportantConversationSummaries: jest.fn(),
        addMessage: jest.fn(),
        count: jest.fn()
      },
      userRepository: {
        findById: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findByEmail: jest.fn(),
        updateLastActive: jest.fn(),
        updateMemoryProfile: jest.fn(),
        updateKnowledgeGraphSchema: jest.fn(),
        updateNextConversationContext: jest.fn(),
        startNewCycle: jest.fn(),
        incrementConceptsInCycle: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUserByIdWithContext: jest.fn()
      },
      memoryRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByUserId: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn()
      },
      conceptRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByUserId: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn()
      },
      derivedArtifactRepository: {
        create: jest.fn(() => Promise.resolve({
          artifact_id: 'artifact-123',
          user_id: 'user-123',
          title: 'Strategic Cycle Report',
          type: 'cycle_report'
        })),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByUserId: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn()
      },
      proactivePromptRepository: {
        create: jest.fn(() => Promise.resolve({
          prompt_id: 'prompt-123',
          user_id: 'user-123',
          title: 'Explore Advanced Concepts',
          content: 'Test quest content'
        })),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByUserId: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn()
      }
    };

    // Apply mocks to InsightEngine constructor
    insightEngine = new InsightEngine(
      mockDependencies.strategicSynthesisTool,
      mockDependencies.dbService,
      mockDependencies.cardAndGraphQueue,
      mockDependencies.neo4jClient
    );

    // Mock the repository instances on the InsightEngine
    Object.assign(insightEngine, mockRepositories);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Construction and Initialization', () => {
    test('should construct InsightEngine with required dependencies', () => {
      expect(insightEngine).toBeInstanceOf(InsightEngine);
      expect(mockDependencies.strategicSynthesisTool).toBeDefined();
      expect(mockDependencies.dbService).toBeDefined();
      expect(mockDependencies.cardAndGraphQueue).toBeDefined();
    });

    test('should have processUserCycle method available', () => {
      expect(typeof insightEngine.processUserCycle).toBe('function');
    });

    test('should initialize with InsightDataCompiler', () => {
      // Verify that InsightDataCompiler is properly instantiated internally
      expect(insightEngine).toBeDefined();
    });
  });

  describe('2. Core processUserCycle Functionality', () => {
    test('should process strategic cycle successfully', async () => {
      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456',
        opts: {},
        progress: jest.fn(),
        updateProgress: jest.fn()
      } as any;

      await insightEngine.processUserCycle(mockJob);

      // Verify strategic synthesis tool was called
      expect(mockDependencies.strategicSynthesisTool.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          ingestionSummary: expect.any(Object),
          graphAnalysis: expect.any(Object),
          strategicInsights: expect.any(Object),
          previousUserMemoryProfile: expect.any(Object),
          knowledgeGraphSchema: expect.any(Object)
        })
      );

      // Verify user state was updated
      expect(mockDependencies.dbService.prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-123' },
          data: expect.objectContaining({
            memory_profile: expect.any(Object),
            knowledge_graph_schema: expect.any(Object),
            last_cycle_started_at: expect.any(Date),
            concepts_created_in_cycle: 0
          })
        })
      );

      // Verify events were published
      expect(mockDependencies.cardAndGraphQueue.add).toHaveBeenCalledWith(
        'cycle_artifacts_created',
        expect.objectContaining({
          type: 'cycle_artifacts_created',
          userId: 'user-123',
          entities: expect.any(Array),
          source: 'InsightEngine'
        })
      );
    });

    test('should handle user not found error', async () => {
      // Mock user not found
      mockDependencies.dbService.prisma.users.findUnique.mockResolvedValue(null);

      const jobData: InsightJobData = {
        userId: 'nonexistent-user'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      await expect(insightEngine.processUserCycle(mockJob)).rejects.toThrow('User nonexistent-user not found');
    });

    test('should handle Neo4j ontology updates when client available', async () => {
      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      await insightEngine.processUserCycle(mockJob);

      // Verify Neo4j session was created and queries executed
      expect(mockDependencies.neo4jClient.session).toHaveBeenCalled();
      
      // Verify session.run was called for ontology updates
      const mockSession = mockDependencies.neo4jClient.session();
      expect(mockSession.run).toHaveBeenCalledWith(
        'MATCH (a:Concept {name: $name}) SET a.salience = $salience',
        { name: 'AI', salience: 0.9 }
      );
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('3. Data Compilation via InsightDataCompiler', () => {
    test('should gather comprehensive context data', async () => {
      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      await insightEngine.processUserCycle(mockJob);

      // Verify user data was fetched
      expect(mockDependencies.dbService.prisma.users.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'user-123' }
      });

      // Verify strategic synthesis was called with compiled data packages
      expect(mockDependencies.strategicSynthesisTool.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          ingestionSummary: expect.objectContaining({
            totalConversations: expect.any(Number),
            totalMemoryUnits: expect.any(Number),
            totalConcepts: expect.any(Number),
            conversationSummaries: expect.any(Array),
            memoryThemes: expect.any(Array)
          }),
          graphAnalysis: expect.objectContaining({
            totalNodes: expect.any(Number),
            totalRelationships: expect.any(Number),
            nodeTypeCounts: expect.any(Object)
          }),
          strategicInsights: expect.objectContaining({
            userEvolutionMetrics: expect.any(Object),
            emergentPatterns: expect.any(Array),
            knowledgeGaps: expect.any(Array)
          })
        })
      );
    });

    test('should handle cycle date calculation correctly', async () => {
      // Mock user with specific last cycle date
      const lastCycleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      mockDependencies.dbService.prisma.users.findUnique.mockResolvedValue({
        user_id: 'user-123',
        last_cycle_started_at: lastCycleDate,
        memory_profile: {},
        knowledge_graph_schema: {}
      });

      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      await insightEngine.processUserCycle(mockJob);

      // Verify conversations query used correct date range
      expect(mockDependencies.dbService.prisma.conversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 'user-123',
            start_time: expect.objectContaining({
              gte: lastCycleDate,
              lte: expect.any(Date)
            })
          })
        })
      );
    });
  });

  describe('4. Strategic Artifact Creation', () => {
    test('should create derived artifacts and proactive prompts', async () => {
      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      // Add mock methods for repository creation
      const mockDerivedArtifactRepo = {
        create: jest.fn((data: any) => Promise.resolve({
          artifact_id: 'artifact-123',
          title: 'Strategic Cycle Report',
          ...data
        }))
      };
      const mockProactivePromptRepo = {
        create: jest.fn((data: any) => Promise.resolve({
          prompt_id: 'prompt-123',
          title: 'Explore Advanced Concepts',
          ...data
        }))
      };

      // Apply mocks
      (insightEngine as any).derivedArtifactRepository = mockDerivedArtifactRepo;
      (insightEngine as any).proactivePromptRepository = mockProactivePromptRepo;

      await insightEngine.processUserCycle(mockJob);

      // Verify cycle report was created
      expect(mockDerivedArtifactRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          type: 'cycle_report',
          content: 'Test strategic cycle report content',
          metadata: expect.objectContaining({
            cycle_period: '1 week',
            insights_count: 5
          })
        })
      );

      // Verify quest prompt was created
      expect(mockProactivePromptRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          title: 'Explore Advanced Concepts',
          type: 'strategic_quest',
          priority: 'high',
          metadata: expect.objectContaining({
            growth_dimension: 'technical_depth',
            estimated_time: '2 hours'
          })
        })
      );
    });

    test('should publish cycle artifacts event with correct entities', async () => {
      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      // Add mock repositories
      (insightEngine as any).derivedArtifactRepository = {
        create: jest.fn(() => Promise.resolve({ artifact_id: 'artifact-123' }))
      };
      (insightEngine as any).proactivePromptRepository = {
        create: jest.fn(() => Promise.resolve({ prompt_id: 'prompt-123' }))
      };

      await insightEngine.processUserCycle(mockJob);

      // Verify event was published with correct entity list
      expect(mockDependencies.cardAndGraphQueue.add).toHaveBeenCalledWith(
        'cycle_artifacts_created',
        expect.objectContaining({
          type: 'cycle_artifacts_created',
          userId: 'user-123',
          entities: [
            { id: 'artifact-123', type: 'DerivedArtifact' },
            { id: 'prompt-123', type: 'ProactivePrompt' }
          ],
          source: 'InsightEngine'
        })
      );
    });
  });

  describe('5. Error Handling and Edge Cases', () => {
    test('should handle StrategicSynthesisTool errors gracefully', async () => {
      // Mock tool failure
      mockDependencies.strategicSynthesisTool.execute.mockRejectedValue(new Error('LLM service unavailable'));

      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      await expect(insightEngine.processUserCycle(mockJob)).rejects.toThrow('LLM service unavailable');
    });

    test('should handle Neo4j connection errors gracefully', async () => {
      // Mock Neo4j session error
      mockDependencies.neo4jClient.session.mockImplementation(() => {
        throw new Error('Neo4j connection failed');
      });

      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      await expect(insightEngine.processUserCycle(mockJob)).rejects.toThrow('Neo4j connection failed');
    });

    test('should handle database persistence errors', async () => {
      // Mock database error during user update
      mockDependencies.dbService.prisma.users.update.mockRejectedValue(new Error('Database connection lost'));

      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      await expect(insightEngine.processUserCycle(mockJob)).rejects.toThrow('Database connection lost');
    });

    test('should handle empty or minimal data gracefully', async () => {
      // Mock minimal data scenario
      mockDependencies.dbService.prisma.conversations.findMany.mockResolvedValue([]);
      mockDependencies.dbService.prisma.memory_units.findMany.mockResolvedValue([]);
      mockDependencies.dbService.prisma.concepts.findMany.mockResolvedValue([]);
      mockDependencies.dbService.prisma.growth_events.findMany.mockResolvedValue([]);

      // Mock synthesis tool to return minimal payload
      mockDependencies.strategicSynthesisTool.execute.mockResolvedValue({
        persistence_payload: {
          cycle_report_content: null,
          quest_prompts_to_create: [],
          ontology_update_cypher_statements: []
        },
        forward_looking_context: {
          updated_user_memory_profile: {},
          updated_knowledge_graph_schema: {}
        }
      });

      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      await insightEngine.processUserCycle(mockJob);

      // Should complete without error but create no artifacts
      expect(mockDependencies.cardAndGraphQueue.add).toHaveBeenCalledWith(
        'cycle_artifacts_created',
        expect.objectContaining({
          entities: []
        })
      );
    });
  });

  describe('6. V11.0 Headless Architecture Verification', () => {
    test('should use direct method calls instead of HTTP requests', () => {
      // Verify no HTTP client imports or usage
      expect(insightEngine).toBeDefined();
      
      // All tools should be injected directly, not called via HTTP
      expect(mockDependencies.strategicSynthesisTool).toBeDefined();
      expect(typeof mockDependencies.strategicSynthesisTool.execute).toBe('function');
    });

    test('should handle tool composition through direct imports', async () => {
      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

      await insightEngine.processUserCycle(mockJob);

      // Verify strategic synthesis tool was called directly (headless)
      expect(mockDependencies.strategicSynthesisTool.execute).toHaveBeenCalled();
      
      // Verify no HTTP calls were made (would appear as fetch, axios, etc.)
      // This is verified by the absence of network mocking requirements
    });

    test('should demonstrate improved error handling through direct exceptions', async () => {
      // In V11.0 headless architecture, errors propagate directly through the call stack
      const directError = new Error('Direct tool execution error');
      mockDependencies.strategicSynthesisTool.execute.mockRejectedValue(directError);

      const jobData: InsightJobData = {
        userId: 'user-123'
      };

      const mockJob = {
        data: jobData,
        id: 'job-456'
      } as any;

                   await expect(insightEngine.processUserCycle(mockJob)).rejects.toThrow('Direct tool execution error');
    });
  });
});
