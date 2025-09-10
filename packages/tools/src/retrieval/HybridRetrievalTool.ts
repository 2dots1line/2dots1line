/**
 * HybridRetrievalTool.ts
 * V9.5 Lean orchestrator for six-stage hybrid retrieval pipeline
 * Delegates complex logic to specialized internal modules
 */

import { DatabaseService } from '@2dots1line/database';
import { WeaviateClient } from 'weaviate-ts-client';
// import { Driver as Neo4jDriver } from 'neo4j-driver'; // Commented out due to missing dependency
import { CypherBuilder, EntityScorer, HydrationAdapter } from './internal';
import { TextEmbeddingTool } from '../ai/TextEmbeddingTool';
import type { IExecutableTool, TTextEmbeddingInputPayload, TTextEmbeddingResult } from '@2dots1line/shared-types';
import { 
  HRTInput, 
  HRTExecutionContext, 
  SeedEntity, 
  CandidateEntity, 
  ScoredEntity,
  EntityMetadata,
  ScoringContext,
  ExtendedAugmentedMemoryContext,
  RetrievalWeights
} from './types';

export class HybridRetrievalTool {
  private weaviate: WeaviateClient;
  private neo4j: any; // Using any due to missing neo4j-driver dependency
  private db: DatabaseService;
  
  // Internal modules - the core architectural improvement
  private cypherBuilder: CypherBuilder | null = null;
  private entityScorer: EntityScorer | null = null;
  private hydrationAdapter: HydrationAdapter | null = null;
  private embeddingTool!: IExecutableTool<TTextEmbeddingInputPayload, TTextEmbeddingResult>;

  constructor(databaseService: DatabaseService, configService: any) {
    this.db = databaseService;
    this.weaviate = databaseService.weaviate;
    this.neo4j = databaseService.neo4j;
    
    // Initialize internal modules with loaded configurations
    this.initializeInternalModules(configService);
  }

  /**
   * Initialize internal modules with configurations
   */
  private async initializeInternalModules(configService: any): Promise<void> {
    try {
      // Load configurations
      const cypherTemplates = await configService.loadConfig('cypher_templates');
      const retrievalWeights = await configService.loadConfig('retrieval_weights');
      
      // Initialize modules
      this.cypherBuilder = new CypherBuilder(cypherTemplates);
      
      // Validate CypherBuilder initialization
      const availableTemplates = this.cypherBuilder.getAvailableTemplates();
      console.log('HybridRetrievalTool: Available Cypher templates:', availableTemplates);
      
      if (availableTemplates.length === 0) {
        throw new Error('HybridRetrievalTool: No Cypher templates loaded. Check cypher_templates.json configuration.');
      }
      
      // Validate critical templates exist
      const criticalTemplates = ['neighborhood', 'timeline', 'conceptual'];
      const missingTemplates = criticalTemplates.filter(t => !availableTemplates.includes(t));
      if (missingTemplates.length > 0) {
        console.warn(`HybridRetrievalTool: Missing critical templates: ${missingTemplates.join(', ')}`);
      }
      
      // Validate template default parameters
      for (const templateName of criticalTemplates) {
        const template = this.cypherBuilder!.getTemplate(templateName);
        if (template && template.defaultParams && template.defaultParams.limit !== undefined) {
          const limit = template.defaultParams.limit;
          if (typeof limit !== 'number' || !Number.isInteger(limit)) {
            console.warn(`HybridRetrievalTool: Template ${templateName} has non-integer limit: ${limit} (type: ${typeof limit})`);
          }
        }
      }
      
      const defaultWeights: RetrievalWeights = retrievalWeights?.scoring_weights?.profiles?.balanced || {
        alpha_semantic_similarity: 0.5,
        beta_recency: 0.3,
        gamma_salience: 0.2
      };
      this.entityScorer = new EntityScorer(defaultWeights);
      
      this.hydrationAdapter = new HydrationAdapter(this.db);
      
      // Initialize embedding tool for semantic search
      this.embeddingTool = TextEmbeddingTool;
      
      console.log('HybridRetrievalTool: Internal modules initialized successfully');
    } catch (error) {
      console.error('HybridRetrievalTool: Failed to initialize internal modules:', error);
      throw error;
    }
  }

  /**
   * V9.5 Six-Stage Retrieval Pipeline
   * Main orchestration method - delegates to internal modules
   */
  async execute(input: HRTInput): Promise<ExtendedAugmentedMemoryContext> {
          // Ensure modules are initialized
      if (!this.cypherBuilder || !this.entityScorer || !this.hydrationAdapter || !this.embeddingTool) {
        throw new Error('HybridRetrievalTool: Internal modules not initialized');
      }
      
      // Additional validation for CypherBuilder
      if (!this.cypherBuilder.getAvailableTemplates || this.cypherBuilder.getAvailableTemplates().length === 0) {
        throw new Error('HybridRetrievalTool: CypherBuilder not properly initialized with templates');
      }
      
      // Validate that all required methods exist
      const requiredMethods = ['buildNeighborhoodQuery', 'buildTimelineQuery', 'buildConceptualQuery'];
      const missingMethods = requiredMethods.filter(method => !(this.cypherBuilder as any)[method]);
      if (missingMethods.length > 0) {
        throw new Error(`HybridRetrievalTool: CypherBuilder missing required methods: ${missingMethods.join(', ')}`);
      }

    const context: HRTExecutionContext = this.createExecutionContext(input);
    
    try {
      console.log(`[HRT ${context.requestId}] Starting V9.5 six-stage retrieval pipeline`);
      
      // Stage 1: Key Phrase Processing
      const processedPhrases = await this.processKeyPhrases(input.keyPhrasesForRetrieval, context);
      
      // Stage 2: Semantic Grounding (Weaviate)
      const seedEntities = await this.semanticGrounding(processedPhrases, input.userId, context);
      
      // Stage 3: Graph Traversal (Neo4j) - USES CypherBuilder
      const candidateEntities = await this.graphTraversal(seedEntities, input.userId, input.retrievalScenario || 'neighborhood', context);
      
      // Stage 4: Pre-Hydration (PostgreSQL Metadata)
      const metadataMap = await this.preHydration(candidateEntities, input.userId, context);
      
      // Stage 5: Scoring & Prioritization - USES EntityScorer
      const scoredEntities = await this.scoringAndPrioritization(candidateEntities, seedEntities, metadataMap, context);
      
      // Stage 6: Full Content Hydration - USES HydrationAdapter
      const augmentedContext = await this.fullContentHydration(scoredEntities, input.userId, context);
      
      context.timings.totalDuration = Date.now() - context.startTime;
      
      console.log(`[HRT ${context.requestId}] Completed in ${context.timings.totalDuration}ms`);
      console.log(`[HRT ${context.requestId}] Final results: ${augmentedContext.retrievedMemoryUnits?.length || 0} memories, ${augmentedContext.retrievedConcepts?.length || 0} concepts`);
      
      return augmentedContext;
      
    } catch (error) {
      return this.handleFatalError(error, context);
    }
  }

  // Stage 1: Key Phrase Processing (simplified - no complex logic to extract)
  private async processKeyPhrases(keyPhrases: string[], context: HRTExecutionContext): Promise<string[]> {
    try {
      console.log(`[HRT ${context.requestId}] Stage 1: Processing ${keyPhrases.length} key phrases`);
      
      // Simple filtering and deduplication
      const processed = keyPhrases
        .filter(phrase => phrase && phrase.trim().length > 0)
        .map(phrase => phrase.trim().substring(0, 100))
        .slice(0, 5);
      
      const deduplicated = [...new Set(processed)];
      
      context.stageResults.keyPhraseProcessing = {
        success: true,
        processedCount: deduplicated.length
      };
      
      return deduplicated;
    } catch (error) {
      context.errors.push({
        stage: 'key_phrase_processing',
        error: error instanceof Error ? error : new Error(String(error)),
        impact: 'degraded'
      });
      return keyPhrases.slice(0, 5);
    }
  }

  // Stage 2: Semantic Grounding (Weaviate)
  private async semanticGrounding(phrases: string[], userId: string, context: HRTExecutionContext): Promise<SeedEntity[]> {
    const stageStart = Date.now();
    
    try {
      console.log(`[HRT ${context.requestId}] Stage 2: Semantic grounding with Weaviate using nearVector`);
      
      if (!this.embeddingTool) {
        throw new Error('Embedding tool not initialized');
      }
      
      const seedEntities: SeedEntity[] = [];
      
      for (const phrase of phrases) {
        try {
          console.log(`[HRT ${context.requestId}] Generating embedding for phrase: "${phrase}"`);
          
          // Generate embedding for the search phrase
          const embeddingResult = await this.embeddingTool.execute({
            payload: {
              text_to_embed: phrase
              // model_id will be determined by the TextEmbeddingTool from config
            }
          });
          
          if (!embeddingResult.result?.vector) {
            console.warn(`[HRT ${context.requestId}] Failed to generate embedding for phrase "${phrase}"`);
            continue;
          }
          
          const searchVector = embeddingResult.result.vector;
          console.log(`[HRT ${context.requestId}] Generated ${searchVector.length}-dimensional vector for phrase "${phrase}"`);
          
          // Use nearVector search instead of withNearText
          // For memory units, we don't filter by status since they don't have status in PostgreSQL
          // For concepts, we filter by status: 'active' or null to include existing concepts
          const whereClause = {
            operator: 'And' as const,
            operands: [
              {
                operator: 'Equal' as const,
                path: ['userId'],
                valueString: userId
              },
              {
                operator: 'Or' as const,
                operands: [
                  {
                    operator: 'Equal' as const,
                    path: ['sourceEntityType'],
                    valueString: 'MemoryUnit'
                  },
                  {
                    operator: 'And' as const,
                    operands: [
                      {
                        operator: 'Equal' as const,
                        path: ['sourceEntityType'],
                        valueString: 'Concept'
                      },
                        {
                          operator: 'Or' as const,
                          operands: [
                            {
                              operator: 'Equal' as const,
                              path: ['status'],
                              valueString: 'active'
                            },
                            {
                              operator: 'NotEqual' as const,
                              path: ['status'],
                              valueString: 'merged'
                            }
                          ]
                        }
                    ]
                  }
                ]
              }
            ]
          };

          const result = await this.weaviate
            .graphql
            .get()
            .withClassName('UserKnowledgeItem')
            .withFields('externalId sourceEntityType textContent _additional { distance }')
            .withWhere(whereClause)
            .withNearVector({ vector: searchVector })
            .withLimit(3)
            .do();
          
          if (result?.data?.Get?.UserKnowledgeItem) {
            for (const item of result.data.Get.UserKnowledgeItem) {
              // Validate that we have valid data before creating seed entity
              if (item.externalId && item.sourceEntityType) {
                const distance = item._additional?.distance || 1.0;
                const similarity = 1.0 - distance;
                
                if (similarity > 0.1) {
                  // Weaviate already filters by status='active', so all results are active
                  seedEntities.push({
                    id: item.externalId,
                    type: item.sourceEntityType,
                    weaviateScore: similarity
                  });
                }
              } else {
                console.warn(`[HRT ${context.requestId}] Skipping item with null externalId or sourceEntityType:`, item);
              }
            }
          }
        } catch (phraseError) {
          console.warn(`[HRT ${context.requestId}] Weaviate search failed for phrase "${phrase}":`, phraseError);
        }
      }
      
      const uniqueSeeds = this.deduplicateEntities(seedEntities);
      
      context.timings.weaviateLatency = Date.now() - stageStart;
      context.stageResults.semanticGrounding = {
        success: true,
        seedEntitiesFound: uniqueSeeds.length
      };
      
      return uniqueSeeds;
      
    } catch (error) {
      context.timings.weaviateLatency = Date.now() - stageStart;
      context.errors.push({
        stage: 'semantic_grounding',
        error: error instanceof Error ? error : new Error(String(error)),
        impact: 'degraded'
      });
      return [];
    }
  }

  // Stage 3: Graph Traversal (Neo4j) - USES CypherBuilder
  private async graphTraversal(
    seedEntities: SeedEntity[],
    userId: string,
    scenario: string,
    context: HRTExecutionContext
  ): Promise<CandidateEntity[]> {
    const stageStart = Date.now();
    
    try {
      console.log(`[HRT ${context.requestId}] Stage 3: Graph traversal (scenario: ${scenario})`);
      
      if (seedEntities.length === 0) {
        console.log(`[HRT ${context.requestId}] Stage 3: No seed entities, skipping graph traversal`);
        return [];
      }
      
      // USE CypherBuilder to construct safe query
      const seedEntityParams = seedEntities.map(e => ({ id: e.id, type: e.type }));
      
      // Validate parameters before query execution
      if (seedEntityParams.length === 0) {
        console.log(`[HRT ${context.requestId}] Stage 3: No valid seed entities, skipping graph traversal`);
        return [];
      }
      
      console.log(`[HRT ${context.requestId}] Stage 3: Executing graph traversal with ${seedEntityParams.length} seed entities`);
      console.log(`[HRT ${context.requestId}] Stage 3: Available templates: ${this.cypherBuilder!.getAvailableTemplates().join(', ')}`);
      console.log(`[HRT ${context.requestId}] Stage 3: Using scenario: ${scenario}`);
      
      // Debug template validation for the scenario
      const debugInfo = this.cypherBuilder!.getTemplateDebugInfo(scenario);
      console.log(`[HRT ${context.requestId}] Stage 3: Template debug info for '${scenario}':`, debugInfo);
      
      // Use the appropriate CypherBuilder method based on scenario
      let query;
      switch (scenario) {
        case 'neighborhood':
          query = this.cypherBuilder!.buildNeighborhoodQuery(seedEntityParams, userId, 20);
          break;
        case 'timeline':
          query = this.cypherBuilder!.buildTimelineQuery(seedEntityParams, userId, 20);
          break;
        case 'conceptual':
          query = this.cypherBuilder!.buildConceptualQuery(seedEntityParams, userId, 20);
          break;
        default:
          // Fallback to neighborhood if unknown scenario
          console.log(`[HRT ${context.requestId}] Stage 3: Unknown scenario '${scenario}', using neighborhood traversal`);
          query = this.cypherBuilder!.buildNeighborhoodQuery(seedEntityParams, userId, 20);
      }
      
      // Execute the query
      const session = this.neo4j.session();
      
      // Enhanced logging for debugging LIMIT parameter issues
      console.log(`[HRT ${context.requestId}] Stage 3: Executing Neo4j query with params:`, JSON.stringify(query.params, null, 2));
      console.log(`[HRT ${context.requestId}] Stage 3: Limit parameter type: ${typeof query.params.limit}, value: ${query.params.limit}`);
      
      const result = await session.run(query.cypher, query.params);
      await session.close();
      
      // Process results into candidate entities
      const candidateEntities: CandidateEntity[] = [];
      
      for (const record of result.records) {
        const entities = record.get('allRelevantEntities') || [];
        
        for (const entity of entities) {
          const seedEntity = seedEntities.find(s => s.id === entity.id);
          candidateEntities.push({
            id: entity.id,
            type: entity.type as 'MemoryUnit' | 'Concept' | 'DerivedArtifact',
            wasSeedEntity: !!seedEntity,
            hopDistance: seedEntity ? 0 : 1,
            weaviateScore: seedEntity?.weaviateScore
          });
        }
      }
      
      const uniqueCandidates = this.deduplicateEntities(candidateEntities);
      
      context.timings.neo4jLatency = Date.now() - stageStart;
      context.stageResults.graphTraversal = {
        success: true,
        candidatesFound: uniqueCandidates.length
      };
      
      return uniqueCandidates;
      
    } catch (error) {
      context.timings.neo4jLatency = Date.now() - stageStart;
      
      // Enhanced error logging for debugging
      console.error(`[HRT ${context.requestId}] Stage 3: Graph traversal failed:`, error);
      if (error instanceof Error) {
        console.error(`[HRT ${context.requestId}] Stage 3: Error details:`, error.message);
        console.error(`[HRT ${context.requestId}] Stage 3: Error stack:`, error.stack);
      }
      
      context.errors.push({
        stage: 'graph_traversal',
        error: error instanceof Error ? error : new Error(String(error)),
        impact: 'degraded'
      });
      
      // Fallback: return seed entities as candidates
      console.log(`[HRT ${context.requestId}] Stage 3: Falling back to seed entities due to graph traversal failure`);
      return seedEntities.map(e => ({
        id: e.id,
        type: e.type as 'MemoryUnit' | 'Concept' | 'DerivedArtifact',
        wasSeedEntity: true,
        hopDistance: 0,
        weaviateScore: e.weaviateScore
      }));
    }
  }

  // Stage 4: Pre-Hydration (PostgreSQL Metadata)
  private async preHydration(
    candidates: CandidateEntity[],
    userId: string,
    context: HRTExecutionContext
  ): Promise<Map<string, EntityMetadata>> {
    const stageStart = Date.now();
    
    try {
      console.log(`[HRT ${context.requestId}] Stage 4: Pre-hydration metadata fetch`);
      
      const metadataMap = new Map<string, EntityMetadata>();
      
      // Bucket entities by type
      const memoryUnitIds = candidates.filter(c => c.type === 'MemoryUnit').map(c => c.id);
      const conceptIds = candidates.filter(c => c.type === 'Concept').map(c => c.id);
      
      // Batch fetch metadata
      const promises: Promise<any>[] = [];
      
      if (memoryUnitIds.length > 0) {
        promises.push(
          this.db.prisma.memory_units.findMany({
            where: { muid: { in: memoryUnitIds }, user_id: userId },
            select: {
              muid: true,
              importance_score: true,
              creation_ts: true,
              last_modified_ts: true
            }
          }).then((results: any[]) => {
            results.forEach((mu: any) => {
              metadataMap.set(mu.muid, {
                entityId: mu.muid,
                entityType: 'MemoryUnit',
                importanceScore: mu.importance_score || 0,
                createdAt: mu.creation_ts,
                lastModified: mu.last_modified_ts || mu.creation_ts
              });
            });
          })
        );
      }
      
      if (conceptIds.length > 0) {
        promises.push(
          this.db.prisma.concepts.findMany({
            where: { concept_id: { in: conceptIds }, user_id: userId, status: 'active' },
            select: {
              concept_id: true,
              salience: true,
              created_at: true,
              last_updated_ts: true
            }
          }).then((results: any[]) => {
            results.forEach((concept: any) => {
              metadataMap.set(concept.concept_id, {
                entityId: concept.concept_id,
                entityType: 'Concept',
                salience: concept.salience || 0,
                createdAt: concept.created_at,
                lastModified: concept.last_updated_ts || concept.created_at
              });
            });
          })
        );
      }
      
      await Promise.all(promises);
      
      context.timings.postgresLatency += Date.now() - stageStart;
      context.stageResults.preHydration = {
        success: true,
        metadataFetched: metadataMap.size
      };
      
      return metadataMap;
      
    } catch (error) {
      context.timings.postgresLatency += Date.now() - stageStart;
      context.errors.push({
        stage: 'pre_hydration',
        error: error instanceof Error ? error : new Error(String(error)),
        impact: 'degraded'
      });
      return new Map();
    }
  }

  // Stage 5: Scoring & Prioritization - USES EntityScorer
  private async scoringAndPrioritization(
    candidates: CandidateEntity[],
    seedEntities: SeedEntity[],
    metadataMap: Map<string, EntityMetadata>,
    context: HRTExecutionContext
  ): Promise<ScoredEntity[]> {
    const stageStart = Date.now();
    
    try {
      console.log(`[HRT ${context.requestId}] Stage 5: Scoring ${candidates.length} candidates`);
      
      // USE EntityScorer for all scoring logic
      const scoringContext: ScoringContext = {
        seedEntitiesWithSimilarity: seedEntities,
        metadataMap
      };
      
      const topN = 10; // TODO: Load from config
      const prioritizedEntities = this.entityScorer!.scoreAndPrioritize(candidates, scoringContext, topN);
      
      context.timings.scoringDuration = Date.now() - stageStart;
      context.stageResults.scoring = {
        success: true,
        entitiesScored: prioritizedEntities.length
      };
      
      return prioritizedEntities;
      
    } catch (error) {
      context.timings.scoringDuration = Date.now() - stageStart;
      context.errors.push({
        stage: 'scoring',
        error: error instanceof Error ? error : new Error(String(error)),
        impact: 'degraded'
      });
      
      // Fallback: return candidates with default scores
      return candidates.slice(0, 10).map(c => ({
        id: c.id,
        type: c.type,
        finalScore: 0.5,
        scoreBreakdown: { semantic: 0.5, recency: 0.5, salience: 0.5 },
        wasSeedEntity: c.wasSeedEntity,
        hopDistance: c.hopDistance,
        weaviateScore: c.weaviateScore
      }));
    }
  }

  // Stage 6: Full Content Hydration - USES HydrationAdapter
  private async fullContentHydration(
    scoredEntities: ScoredEntity[],
    userId: string,
    context: HRTExecutionContext
  ): Promise<ExtendedAugmentedMemoryContext> {
    const stageStart = Date.now();
    
    try {
      console.log(`[HRT ${context.requestId}] Stage 6: Hydrating ${scoredEntities.length} entities`);
      
      // USE HydrationAdapter for all hydration logic
      const { retrievedMemoryUnits, retrievedConcepts } = await this.hydrationAdapter!.hydrateTopEntities(scoredEntities, userId);
      
      // Generate retrieval summary
      const retrievalSummary = `Retrieved ${(retrievedMemoryUnits || []).length} memories and ${(retrievedConcepts || []).length} concepts based on ${context.keyPhrasesCount} key phrases. Top results prioritized by semantic similarity, recency, and salience.`;
      
      context.timings.postgresLatency += Date.now() - stageStart;
      context.stageResults.hydration = {
        success: true,
        entitiesHydrated: (retrievedMemoryUnits || []).length + (retrievedConcepts || []).length
      };
      
      return {
        relevant_memories: [],
        contextual_insights: [],
        emotional_context: '',
        retrievedMemoryUnits: retrievedMemoryUnits || [],
        retrievedConcepts: retrievedConcepts || [],
        retrievedArtifacts: [],
        retrievalSummary,
        scoringDetails: {
          totalCandidatesEvaluated: scoredEntities.length,
          seedEntitiesFound: context.stageResults.semanticGrounding.seedEntitiesFound,
          averageScore: scoredEntities.reduce((sum, e) => sum + e.finalScore, 0) / scoredEntities.length,
          scoringWeights: this.entityScorer!.getWeights()
        },
        unmatched_key_phrases: [],
        errors: context.errors.map(e => ({
          stage: e.stage,
          error: e.error.message,
          impact: e.impact,
          timestamp: new Date().toISOString()
        })),
        performance_metadata: {
          total_execution_time_ms: Date.now() - context.startTime,
          stage_timings: context.timings,
          result_counts: {
            weaviate_candidates: context.stageResults.semanticGrounding.seedEntitiesFound,
            neo4j_candidates: context.stageResults.graphTraversal.candidatesFound,
            final_results_after_scoring: (retrievedMemoryUnits || []).length + (retrievedConcepts || []).length
          }
        }
      };
      
    } catch (error) {
      context.timings.postgresLatency += Date.now() - stageStart;
      context.errors.push({
        stage: 'hydration',
        error: error instanceof Error ? error : new Error(String(error)),
        impact: 'fatal'
      });
      throw error;
    }
  }

  // Helper methods
  private createExecutionContext(input: HRTInput): HRTExecutionContext {
    return {
      requestId: `hrt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: input.userId,
      startTime: Date.now(),
      keyPhrasesCount: input.keyPhrasesForRetrieval.length,
      retrievalScenario: input.retrievalScenario || 'neighborhood',
      stageResults: {
        keyPhraseProcessing: { success: false, processedCount: 0 },
        semanticGrounding: { success: false, seedEntitiesFound: 0 },
        graphTraversal: { success: false, candidatesFound: 0 },
        preHydration: { success: false, metadataFetched: 0 },
        scoring: { success: false, entitiesScored: 0 },
        hydration: { success: false, entitiesHydrated: 0 }
      },
      timings: {
        totalDuration: 0,
        weaviateLatency: 0,
        neo4jLatency: 0,
        postgresLatency: 0,
        scoringDuration: 0
      },
      errors: []
    };
  }

  private handleFatalError(error: any, context: HRTExecutionContext): ExtendedAugmentedMemoryContext {
    context.errors.push({
      stage: 'pipeline',
      error: error instanceof Error ? error : new Error(String(error)),
      impact: 'fatal'
    });
    
    console.error(`[HRT ${context.requestId}] Fatal error:`, error);
    
    return {
      relevant_memories: [],
      contextual_insights: [],
      emotional_context: '',
      retrievedMemoryUnits: [],
      retrievedConcepts: [],
      retrievedArtifacts: [],
      retrievalSummary: `Retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: context.errors.map(e => ({
        stage: e.stage,
        error: e.error.message,
        impact: e.impact,
        timestamp: new Date().toISOString()
      })),
      performance_metadata: {
        total_execution_time_ms: Date.now() - context.startTime,
        stage_timings: context.timings,
        result_counts: {
          weaviate_candidates: 0,
          neo4j_candidates: 0,
          final_results_after_scoring: 0
        }
      }
    };
  }

  private deduplicateEntities<T extends {id: string}>(entities: T[]): T[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      if (seen.has(entity.id)) return false;
      seen.add(entity.id);
      return true;
    });
  }
} 