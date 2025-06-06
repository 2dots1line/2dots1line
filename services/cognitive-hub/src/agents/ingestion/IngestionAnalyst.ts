import { BaseAgent, ToolRegistry, DatabaseService } from '@2dots1line/agent-framework';
import { MemoryRepository, ConceptRepository, GrowthEventRepository } from '@2dots1line/database';
import { 
  TAgentInput, 
  TAgentOutput, 
  TAgentContext,
  TIngestionAnalystInputPayload,
  TIngestionAnalystResult,
  TIngestionContentItem,
  TNERToolInput, 
  TNERToolOutput, 
  TExtractedEntity
} from '@2dots1line/shared-types';
import * as fs from 'fs';
import * as path from 'path';

// Configuration interfaces
interface NERRulesConfig {
  strategic_entity_types: string[];
  metadata_entity_types: string[];
  entity_type_mappings: Record<string, string>;
  concept_growth_mappings: Record<string, Array<{ dimKey: string; delta: number }>>;
  default_growth_mapping: Array<{ dimKey: string; delta: number }>;
}

interface GrowthModelConfig {
  dimensions: Record<string, {
    name: string;
    description: string;
    side: string;
    actionType: string;
    activation_rules: {
      emotion_keywords?: string[];
      reflection_patterns?: string[];
      introspection_patterns?: string[];
      action_keywords?: string[];
      commitment_patterns?: string[];
      achievement_patterns?: string[];
      expression_keywords?: string[];
      creation_patterns?: string[];
      vulnerability_patterns?: string[];
      learning_keywords?: string[];
      knowledge_patterns?: string[];
      source_patterns?: string[];
      contribution_keywords?: string[];
      impact_patterns?: string[];
      change_patterns?: string[];
      teaching_keywords?: string[];
      influence_patterns?: string[];
      platform_patterns?: string[];
      base_delta: number;
      source_multipliers: Record<string, number>;
    };
  }>;
}

export class IngestionAnalyst extends BaseAgent<
  TAgentInput<TIngestionAnalystInputPayload>,
  TAgentOutput<TIngestionAnalystResult>
> {
  private memoryRepository: MemoryRepository;
  private conceptRepository: ConceptRepository;
  private growthEventRepository: GrowthEventRepository;

  // Configuration loaded from external files
  private nerRulesConfig: NERRulesConfig = {
    strategic_entity_types: [],
    metadata_entity_types: [],
    entity_type_mappings: {},
    concept_growth_mappings: {},
    default_growth_mapping: []
  };
  private growthModelConfig: GrowthModelConfig = {
    dimensions: {}
  };

  constructor(databaseService: DatabaseService, toolRegistry: ToolRegistry) {
    super('IngestionAnalyst', toolRegistry, databaseService);
    
    // Initialize repositories
    this.memoryRepository = new MemoryRepository(databaseService);
    this.conceptRepository = new ConceptRepository(databaseService);
    this.growthEventRepository = new GrowthEventRepository(databaseService);

    // Load configurations from external files
    this.loadConfigurations();
  }

  /**
   * Helper method to extract text content from TIngestionContentItem
   */
  private getTextContent(item: TIngestionContentItem): string {
    return item.text_content || '';
  }

  /**
   * Helper method to extract timestamp from TIngestionContentItem  
   */
  private getTimestamp(item: TIngestionContentItem): string {
    return item.creation_timestamp;
  }

  private loadConfigurations(): void {
    try {
      const configDir = path.join(__dirname, '../../../config');
      
      // Load NER rules configuration
      const nerRulesPath = path.join(configDir, 'ner_rules.json');
      this.nerRulesConfig = JSON.parse(fs.readFileSync(nerRulesPath, 'utf8'));
      
      // Load growth model configuration
      const growthModelPath = path.join(configDir, 'growth_model_rules.json');
      this.growthModelConfig = JSON.parse(fs.readFileSync(growthModelPath, 'utf8'));
      
      this.log('Configurations loaded successfully');
    } catch (error) {
      this.log('Failed to load configurations, using fallback defaults:', error);
      this.loadFallbackConfigurations();
    }
  }

  private loadFallbackConfigurations(): void {
    // Fallback configurations if files can't be loaded
    this.nerRulesConfig = {
      strategic_entity_types: ['PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'emotion', 'value', 'goal', 'skill', 'interest', 'struggle', 'life_event_theme'],
      metadata_entity_types: ['EMAIL', 'PHONE', 'URL'],
      entity_type_mappings: {
        'PERSON': 'person',
        'ORGANIZATION': 'organization',
        'LOCATION': 'location',
        'DATE': 'date',
        'emotion': 'emotion',
        'value': 'value',
        'goal': 'goal',
        'skill': 'skill',
        'interest': 'interest',
        'struggle': 'struggle',
        'life_event_theme': 'life_event'
      },
      concept_growth_mappings: {
        'person': [{ dimKey: 'world_act', delta: 0.1 }],
        'emotion': [{ dimKey: 'self_know', delta: 0.15 }],
        'value': [{ dimKey: 'self_know', delta: 0.2 }],
        'goal': [{ dimKey: 'self_show', delta: 0.15 }, { dimKey: 'world_act', delta: 0.1 }],
        'skill': [{ dimKey: 'self_act', delta: 0.15 }],
        'struggle': [{ dimKey: 'self_know', delta: 0.1 }],
        'life_event': [{ dimKey: 'self_show', delta: 0.1 }]
      },
      default_growth_mapping: [{ dimKey: 'world_know', delta: 0.05 }]
    };

    this.growthModelConfig = {
      dimensions: {
        self_know: {
          name: 'Self Knowledge',
          description: 'Understanding one\'s inner world',
          side: 'self',
          actionType: 'know',
          activation_rules: {
            emotion_keywords: ['grateful', 'anxious', 'excited', 'confused', 'proud', 'frustrated', 'hopeful', 'worried', 'passionate'],
            reflection_patterns: ['I feel', 'I realize', 'I understand', 'I am', 'my emotion', 'my value', 'me understand', 'helped me understand', 'understand my', 'understand myself', 'my purpose', 'helped me', 'made me understand'],
            introspection_patterns: ['why do I', 'what makes me', 'how do I', 'what am I', 'who am I'],
            base_delta: 0.15,
            source_multipliers: { 'journal_entry': 1.2, 'reflection': 1.5, 'conversation': 0.8, 'voice_note': 1.0 }
          }
        },
        self_act: {
          name: 'Self Action',
          description: 'Taking initiative and action in personal matters',
          side: 'self',
          actionType: 'act',
          activation_rules: {
            action_keywords: ['goal', 'plan', 'practice', 'improve', 'learn', 'discipline', 'habit', 'routine'],
            commitment_patterns: ['I will', 'I want to', 'I\'m going to', 'I plan', 'I commit', 'I decided'],
            achievement_patterns: ['I did', 'I took', 'I started', 'I completed', 'I achieved', 'I practiced'],
            base_delta: 0.12,
            source_multipliers: { 'goal_setting': 2.0, 'habit_tracking': 1.2, 'challenge_completion': 1.5, 'journal_entry': 1.0 }
          }
        },
        self_show: {
          name: 'Self Expression',
          description: 'Authentic self-expression and creativity',
          side: 'self',
          actionType: 'show',
          activation_rules: {
            expression_keywords: ['creative', 'artistic', 'authentic', 'express myself', 'my style', 'my voice'],
            creation_patterns: ['I created', 'I expressed', 'I wrote', 'I drew', 'I designed', 'I composed'],
            vulnerability_patterns: ['vulnerability', 'openness', 'honest', 'transparent', 'share feeling'],
            base_delta: 0.10,
            source_multipliers: { 'creative_work': 1.8, 'voice_note': 1.3, 'shared_content': 1.4, 'journal_entry': 1.0 }
          }
        },
        world_know: {
          name: 'World Knowledge',
          description: 'Understanding external systems, topics, and concepts',
          side: 'world',
          actionType: 'know',
          activation_rules: {
            learning_keywords: ['research', 'study', 'learn about', 'understand', 'discover', 'analyze'],
            knowledge_patterns: ['fact', 'data', 'evidence', 'theory', 'concept', 'system', 'knowledge'],
            source_patterns: ['book', 'article', 'documentary', 'course', 'lecture', 'expert', 'authority'],
            base_delta: 0.08,
            source_multipliers: { 'research_note': 1.3, 'book_highlight': 1.2, 'course_completion': 1.5, 'conversation': 0.9 }
          }
        },
        world_act: {
          name: 'World Action',
          description: 'Taking action in the world and contributing externally',
          side: 'world',
          actionType: 'act',
          activation_rules: {
            contribution_keywords: ['helped', 'contributed', 'volunteered', 'donated', 'organized', 'led'],
            impact_patterns: ['community', 'society', 'environment', 'cause', 'charity', 'activism'],
            change_patterns: ['impact', 'change', 'improve', 'solve', 'fix', 'address', 'tackle'],
            base_delta: 0.14,
            source_multipliers: { 'volunteer_work': 1.6, 'project_completion': 1.4, 'community_engagement': 1.3, 'journal_entry': 1.0 }
          }
        },
        world_show: {
          name: 'World Expression',
          description: 'Communicating ideas and teaching others',
          side: 'world',
          actionType: 'show',
          activation_rules: {
            teaching_keywords: ['taught', 'shared', 'explained', 'presented', 'published', 'spoke'],
            influence_patterns: ['teach', 'mentor', 'guide', 'inspire', 'influence', 'communicate'],
            platform_patterns: ['presentation', 'workshop', 'article', 'video', 'podcast', 'speech'],
            base_delta: 0.11,
            source_multipliers: { 'public_speaking': 1.5, 'content_creation': 1.4, 'mentoring': 1.3, 'shared_content': 1.4 }
          }
        }
      }
    };
  }

  async process(
    input: TAgentInput<TIngestionAnalystInputPayload>,
    context?: TAgentContext
  ): Promise<TAgentOutput<TIngestionAnalystResult>> {
    const startTime = performance.now();
    const { batch_id, content_items, processing_tier } = input.payload;
    
    this.log(`Processing batch ${batch_id} with ${content_items.length} items (Tier ${processing_tier})`);

    const result: TIngestionAnalystResult = {
      memory_units: [],
      chunks: [],
      entities: [],
      relations: [],
      queued_jobs: [],
      item_errors: []
    };

    // Process each content item
    for (const item of content_items) {
      try {
        await this.processContentItem(item, input.user_id, result);
      } catch (error) {
        this.log(`Error processing item ${item.item_id}:`, error);
        result.item_errors!.push({
          item_id: item.item_id,
          error_code: 'PROCESSING_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const processingTime = performance.now() - startTime;

    return {
      request_id: input.request_id,
      status: 'success',
      result,
      metadata: {
        processing_time_ms: Math.round(processingTime),
        processed_in_region: input.region,
        batch_stats: {
          total_items: content_items.length,
          successful_items: content_items.length - result.item_errors!.length,
          failed_items: result.item_errors!.length,
          memory_units_created: result.memory_units.length,
          entities_extracted: result.entities!.length
        }
      }
    };
  }

  private async processContentItem(
    item: TIngestionContentItem,
    userId: string,
    result: TIngestionAnalystResult
  ): Promise<void> {
    const textContent = this.getTextContent(item);
    
    // Step 1: Create MemoryUnit
    const memoryUnit = await this.createMemoryUnit(item, userId);
    result.memory_units.push({
      muid: memoryUnit.muid,
      source_item_id: item.item_id,
      title: memoryUnit.title,
      status: 'processed',
      importance_score: this.calculateImportanceScore(textContent)
    });

    // Step 2: Create Chunks with enhanced metadata
    const chunks = await this.createChunks(textContent, memoryUnit.muid, userId);
    result.chunks!.push(...chunks.map(chunk => ({
      cid: chunk.cid,
      muid: chunk.muid,
      text_preview: (chunk.text_content || '').substring(0, 100) + ((chunk.text_content || '').length > 100 ? '...' : ''),
      sequence_order: chunk.sequence_order,
      role: chunk.role
    })));

    // Step 3: Two-Phase Entity Processing (Directive 1)
    const extractedEntities = await this.extractEntitiesWithStrategicFiltering(textContent, userId);
    
    // Step 4: Create Concepts for Strategic Entities
    const conceptEntities = await this.createStrategicConcepts(extractedEntities.strategic, userId, memoryUnit.muid);
    result.entities!.push(...conceptEntities);

    // Step 5: Store Metadata Entities in MemoryUnit attributes (IMPLEMENTED)
    if (extractedEntities.metadata.length > 0) {
      await this.storeMetadataEntities(memoryUnit.muid, extractedEntities.metadata);
    }

    // Step 6: Generate Growth Events for Strategic Concepts
    await this.generateGrowthEvents(conceptEntities, userId, memoryUnit.muid, item.source_type);

    // Step 7: Generate Growth Event for MemoryUnit using detectGrowthDimensions (FIXED)
    const memoryUnitDimensions = this.detectGrowthDimensions(textContent, item.source_type);
    for (const dimension of memoryUnitDimensions) {
      await this.growthEventRepository.createGrowthEvent({
        user_id: userId,
        entity_id: memoryUnit.muid,
        entity_type: 'memory_unit',
        dim_key: dimension.dimKey,
        delta: dimension.delta,
        source: `ingestion_${item.source_type}`
      });
    }
  }

  private async createMemoryUnit(
    item: TIngestionContentItem,
    userId: string
  ) {
    const textContent = this.getTextContent(item);
    const title = this.extractTitle(textContent);
    
    return await this.memoryRepository.createMemoryUnit({
      user_id: userId,
      source_type: item.source_type,
      title,
      content: textContent, // V7: Stored directly in memory_units.content field
      tier: 1,
      importance_score: this.calculateImportanceScore(textContent),
      metadata: {
        source_item_id: item.item_id,
        processing_agent: 'IngestionAnalyst',
        creation_ts: this.getTimestamp(item),
        content_source: 'processed', // V7: Directive 5 - mark as processed content
        content_processing_notes: {
          processing_agent: 'IngestionAnalyst',
          processing_timestamp: new Date().toISOString(),
          original_source: item.source_type
        }
      }
    });
  }

  private async createChunks(text: string, muid: string, userId: string) {
    const chunks = this.performChunking(text);
    const createdChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const chunk = await this.memoryRepository.createChunk({
        muid,
        user_id: userId,
        text: chunkText,
        sequence_order: i,
        role: 'content',
        metadata: {
          chunk_type: chunks.length === 1 ? 'single' : 'multi_part',
          processing_agent: 'IngestionAnalyst',
          char_count: chunkText.length,
          token_count: Math.ceil(chunkText.length / 4), // Rough estimate
          chunking_strategy: text.length < 500 ? 'single' : text.length < 2000 ? 'sentence_boundary' : 'semantic_paragraph'
        }
      });
      createdChunks.push(chunk);
    }

    return createdChunks;
  }

  private performChunking(text: string): string[] {
    // First, check for clear paragraph breaks regardless of text length
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length > 1) {
      // Use paragraph-based chunking if multiple paragraphs are detected
      return paragraphs.map(p => p.trim());
    }
    
    // Enhanced chunking strategy based on text length for single-paragraph text
    if (text.length < 300) {
      // Short text: single chunk
      return [text];
    } else if (text.length < 1000) {
      // Medium text: sentence-boundary chunking
      return this.chunkBySentences(text);
    } else {
      // Long text: semantic paragraph chunking (fallback for very long single paragraphs)
      return this.chunkBySentences(text, 1200); // Larger chunks for long text
    }
  }

  private chunkBySentences(text: string, maxChunkSize: number = 800): string[] {
    const sentences = this.splitBySentences(text);
    return this.groupSentencesIntoChunks(sentences, maxChunkSize);
  }

  private chunkByParagraphs(text: string): string[] {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // If we have multiple paragraphs, use them as chunks
    if (paragraphs.length > 1) {
      return paragraphs.map(p => p.trim());
    }
    
    // Fallback: if no clear paragraphs, try sentence chunking
    return this.chunkBySentences(text);
  }

  private splitBySentences(text: string): string[] {
    // Handle common abbreviations to avoid false sentence breaks
    const abbreviations = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'etc.', 'vs.', 'e.g.', 'i.e.'];
    let processedText = text;
    
    abbreviations.forEach(abbr => {
      processedText = processedText.replace(new RegExp(abbr.replace('.', '\\.'), 'g'), abbr.replace('.', '<!DOT!>'));
    });
    
    const sentences = processedText.split(/[.!?]+/).map(s => s.replace(/<!DOT!>/g, '.').trim()).filter(s => s.length > 0);
    return sentences;
  }

  private groupSentencesIntoChunks(sentences: string[], maxChunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }
    
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }

  /**
   * Phase 1: Broad NER Detection
   * Phase 2: Strategic Filtering (Directive 1)
   */
  private async extractEntitiesWithStrategicFiltering(text: string, userId: string): Promise<{
    strategic: TExtractedEntity[];
    metadata: TExtractedEntity[];
  }> {
    let allEntities: TExtractedEntity[] = [];

    try {
      // Phase 1: Use NER tool for broad entity detection
      const nerInput: TNERToolInput = {
        user_id: userId,
        region: 'us',
        payload: {
          text_to_analyze: text,
          model_id_or_tier: 'enhanced-ner-v1.0.0',
          language: 'en'
        }
      };

      const nerResult = await this.toolRegistry.executeTool('ner.extract', nerInput) as TNERToolOutput;
      
      if (nerResult.status === 'success' && nerResult.result) {
        allEntities = nerResult.result.entities;
      }
    } catch (error) {
      this.log('NER tool failed, using fallback pattern matching:', error);
      // Fallback: Simple pattern matching for person names
      allEntities = this.fallbackEntityExtraction(text);
    }

    // Phase 2: Strategic filtering using configuration
    const strategic = allEntities.filter(entity => 
      this.nerRulesConfig.strategic_entity_types.includes(entity.type) ||
      (entity.metadata?.is_concept_entity === true)
    );

    const metadata = allEntities.filter(entity => 
      this.nerRulesConfig.metadata_entity_types.includes(entity.type) ||
      (entity.metadata?.is_metadata_entity === true)
    );

    this.log(`Entity filtering: ${allEntities.length} total -> ${strategic.length} strategic, ${metadata.length} metadata`);

    return { strategic, metadata };
  }

  private fallbackEntityExtraction(text: string): TExtractedEntity[] {
    const entities: TExtractedEntity[] = [];
    
    // Simple person name pattern (capitalized words)
    const personPattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    let match;
    
    while ((match = personPattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'PERSON',
        start_offset: match.index,
        end_offset: match.index + match[0].length,
        confidence: 0.7,
        metadata: {
          extraction_method: 'fallback_pattern',
          is_concept_entity: true
        }
      });
    }

    return entities;
  }

  private async createStrategicConcepts(
    entities: TExtractedEntity[],
    userId: string,
    contextMuid: string
  ): Promise<Array<{
    concept_id: string;
    name: string;
    type: string;
    confidence?: number | null;
    description?: string | null;
  }>> {
    const conceptEntities = [];

    for (const entity of entities) {
      try {
        const concept = await this.conceptRepository.createOrFindConcept({
          user_id: userId,
          name: entity.text,
          type: this.mapEntityTypeToConceptType(entity.type),
          description: `${entity.type} extracted from content`,
          confidence: entity.confidence || 0.8,
          metadata: {
            extraction_context: contextMuid,
            original_entity_type: entity.type,
            start_offset: entity.start_offset,
            end_offset: entity.end_offset
          }
        });

        conceptEntities.push({
          concept_id: concept.concept_id,
          name: concept.name,
          type: concept.type,
          confidence: concept.confidence,
          description: concept.description
        });
      } catch (error) {
        this.log(`Failed to create concept for entity ${entity.text}:`, error);
      }
    }

    return conceptEntities;
  }

  private async storeMetadataEntities(muid: string, entities: TExtractedEntity[]): Promise<void> {
    if (entities.length === 0) return;

    const metadataEntities = entities.map(entity => ({
      text: entity.text,
      type: entity.type,
      confidence: entity.confidence,
      start_offset: entity.start_offset,
      end_offset: entity.end_offset
    }));

    // V7: Store metadata entities in memory_units.metadata field (IMPLEMENTED)
    try {
      await this.memoryRepository.updateMemoryUnitMetadata(muid, 'extracted_metadata_entities', metadataEntities);
      this.log(`Stored ${metadataEntities.length} metadata entities for ${muid}`);
    } catch (error) {
      this.log(`Failed to store metadata entities for ${muid}:`, error);
    }
  }

  private async generateGrowthEvents(
    concepts: Array<{ concept_id: string; name: string; type: string }>,
    userId: string,
    contextMuid: string,
    sourceType: string
  ): Promise<void> {
    for (const concept of concepts) {
      const dimensionMappings = this.getDimensionMappingsForConceptType(concept.type);
      
      for (const { dimKey, delta } of dimensionMappings) {
        try {
          await this.growthEventRepository.createGrowthEvent({
            user_id: userId,
            entity_id: concept.concept_id,
            entity_type: 'concept',
            dim_key: dimKey,
            delta,
            source: `ingestion_${sourceType}`
          });
        } catch (error) {
          this.log(`Failed to create growth event for concept ${concept.concept_id}:`, error);
        }
      }
    }
  }

  /**
   * Detect growth dimensions for text content using configuration-based rules
   * This is the single source of truth for dimension detection (Tech Lead Directive 4)
   */
  private detectGrowthDimensions(text: string, sourceType: string): Array<{ dimKey: string; delta: number }> {
    const detectedDimensions: Array<{ dimKey: string; delta: number }> = [];
    const textLower = text.toLowerCase();

    // TECH LEAD GUIDANCE: Debug logging for test analysis
    this.log(`=== DETECTING GROWTH DIMENSIONS ===`);
    this.log(`Input text: "${text}"`);
    this.log(`Source type: "${sourceType}"`);
    this.log(`Text (lowercase): "${textLower}"`);
    this.log(`Available dimensions: ${Object.keys(this.growthModelConfig.dimensions).join(', ')}`);

    // Analyze text against each dimension's activation rules
    for (const [dimKey, dimension] of Object.entries(this.growthModelConfig.dimensions)) {
      this.log(`\n--- Analyzing dimension: ${dimKey} ---`);
      const rules = dimension.activation_rules;
      let score = 0;
      let matchCount = 0;
      const matches: string[] = [];

      // Check emotion keywords
      if (rules.emotion_keywords) {
        this.log(`Checking emotion keywords: ${rules.emotion_keywords.join(', ')}`);
        const emotionMatches = rules.emotion_keywords.filter(keyword => {
          const matches = textLower.includes(keyword.toLowerCase());
          this.log(`  "${keyword}" -> ${matches ? 'MATCH' : 'no match'}`);
          return matches;
        });
        if (emotionMatches.length > 0) {
          score += emotionMatches.length * 0.3;
          matchCount++;
          matches.push(`emotions: ${emotionMatches.join(', ')}`);
          this.log(`  Emotion matches found: ${emotionMatches.join(', ')} (score +${emotionMatches.length * 0.3})`);
        }
      }

      // Check reflection patterns
      if (rules.reflection_patterns) {
        this.log(`Checking reflection patterns: ${rules.reflection_patterns.join(', ')}`);
        const reflectionMatches = rules.reflection_patterns.filter(pattern => {
          const matches = textLower.includes(pattern.toLowerCase());
          this.log(`  "${pattern}" -> ${matches ? 'MATCH' : 'no match'}`);
          return matches;
        });
        if (reflectionMatches.length > 0) {
          score += reflectionMatches.length * 0.4;
          matchCount++;
          matches.push(`reflections: ${reflectionMatches.join(', ')}`);
          this.log(`  Reflection matches found: ${reflectionMatches.join(', ')} (score +${reflectionMatches.length * 0.4})`);
        }
      }

      // Check introspection patterns
      if (rules.introspection_patterns) {
        const introspectionMatches = rules.introspection_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (introspectionMatches.length > 0) {
          score += introspectionMatches.length * 0.4;
          matchCount++;
          matches.push(`introspection: ${introspectionMatches.join(', ')}`);
        }
      }

      // Check action keywords
      if (rules.action_keywords) {
        const actionMatches = rules.action_keywords.filter(keyword => textLower.includes(keyword.toLowerCase()));
        if (actionMatches.length > 0) {
          score += actionMatches.length * 0.3;
          matchCount++;
          matches.push(`actions: ${actionMatches.join(', ')}`);
        }
      }

      // Check commitment patterns
      if (rules.commitment_patterns) {
        const commitmentMatches = rules.commitment_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (commitmentMatches.length > 0) {
          score += commitmentMatches.length * 0.5;
          matchCount++;
          matches.push(`commitments: ${commitmentMatches.join(', ')}`);
        }
      }

      // Check achievement patterns
      if (rules.achievement_patterns) {
        const achievementMatches = rules.achievement_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (achievementMatches.length > 0) {
          score += achievementMatches.length * 0.4;
          matchCount++;
          matches.push(`achievements: ${achievementMatches.join(', ')}`);
        }
      }

      // Check expression keywords
      if (rules.expression_keywords) {
        const expressionMatches = rules.expression_keywords.filter(keyword => textLower.includes(keyword.toLowerCase()));
        if (expressionMatches.length > 0) {
          score += expressionMatches.length * 0.3;
          matchCount++;
          matches.push(`expressions: ${expressionMatches.join(', ')}`);
        }
      }

      // Check creation patterns
      if (rules.creation_patterns) {
        const creationMatches = rules.creation_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (creationMatches.length > 0) {
          score += creationMatches.length * 0.4;
          matchCount++;
          matches.push(`creations: ${creationMatches.join(', ')}`);
        }
      }

      // Check vulnerability patterns
      if (rules.vulnerability_patterns) {
        const vulnerabilityMatches = rules.vulnerability_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (vulnerabilityMatches.length > 0) {
          score += vulnerabilityMatches.length * 0.5;
          matchCount++;
          matches.push(`vulnerabilities: ${vulnerabilityMatches.join(', ')}`);
        }
      }

      // Check learning keywords
      if (rules.learning_keywords) {
        const learningMatches = rules.learning_keywords.filter(keyword => textLower.includes(keyword.toLowerCase()));
        if (learningMatches.length > 0) {
          score += learningMatches.length * 0.3;
          matchCount++;
          matches.push(`learnings: ${learningMatches.join(', ')}`);
        }
      }

      // Check knowledge patterns
      if (rules.knowledge_patterns) {
        const knowledgeMatches = rules.knowledge_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (knowledgeMatches.length > 0) {
          score += knowledgeMatches.length * 0.3;
          matchCount++;
          matches.push(`knowledges: ${knowledgeMatches.join(', ')}`);
        }
      }

      // Check source patterns
      if (rules.source_patterns) {
        const sourceMatches = rules.source_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (sourceMatches.length > 0) {
          score += sourceMatches.length * 0.2;
          matchCount++;
          matches.push(`sources: ${sourceMatches.join(', ')}`);
        }
      }

      // Check contribution keywords
      if (rules.contribution_keywords) {
        const contributionMatches = rules.contribution_keywords.filter(keyword => textLower.includes(keyword.toLowerCase()));
        if (contributionMatches.length > 0) {
          score += contributionMatches.length * 0.4;
          matchCount++;
          matches.push(`contributions: ${contributionMatches.join(', ')}`);
        }
      }

      // Check impact patterns
      if (rules.impact_patterns) {
        const impactMatches = rules.impact_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (impactMatches.length > 0) {
          score += impactMatches.length * 0.4;
          matchCount++;
          matches.push(`impacts: ${impactMatches.join(', ')}`);
        }
      }

      // Check change patterns
      if (rules.change_patterns) {
        const changeMatches = rules.change_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (changeMatches.length > 0) {
          score += changeMatches.length * 0.3;
          matchCount++;
          matches.push(`changes: ${changeMatches.join(', ')}`);
        }
      }

      // Check teaching keywords
      if (rules.teaching_keywords) {
        const teachingMatches = rules.teaching_keywords.filter(keyword => textLower.includes(keyword.toLowerCase()));
        if (teachingMatches.length > 0) {
          score += teachingMatches.length * 0.4;
          matchCount++;
          matches.push(`teachings: ${teachingMatches.join(', ')}`);
        }
      }

      // Check influence patterns
      if (rules.influence_patterns) {
        const influenceMatches = rules.influence_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (influenceMatches.length > 0) {
          score += influenceMatches.length * 0.4;
          matchCount++;
          matches.push(`influences: ${influenceMatches.join(', ')}`);
        }
      }

      // Check platform patterns
      if (rules.platform_patterns) {
        const platformMatches = rules.platform_patterns.filter(pattern => textLower.includes(pattern.toLowerCase()));
        if (platformMatches.length > 0) {
          score += platformMatches.length * 0.3;
          matchCount++;
          matches.push(`platforms: ${platformMatches.join(', ')}`);
        }
      }

      // If dimension is activated (score > threshold), add it
      this.log(`Final score for ${dimKey}: ${score}, matchCount: ${matchCount}, threshold: 0.5`);
      this.log(`Matches found: ${matches.join('; ')}`);
      
      if (score > 0.5 && matchCount > 0) {
        let delta = rules.base_delta * Math.min(score, 2.0); // Cap score multiplier at 2.0
        
        // Apply source-specific adjustments
        delta = this.applySourceSpecificAdjustments(delta, dimKey, sourceType);
        
        this.log(`✅ Dimension ${dimKey} ACTIVATED with delta: ${delta}`);
        
        detectedDimensions.push({
          dimKey,
          delta: Math.round(delta * 100) / 100 // Round to 2 decimal places
        });
      } else {
        this.log(`❌ Dimension ${dimKey} NOT activated (score: ${score}, threshold: 0.5, matchCount: ${matchCount})`);
      }
    }

    // Fallback: if no dimensions detected, use self_know as default
    this.log(`\n=== FINAL RESULTS ===`);
    this.log(`Detected dimensions: ${detectedDimensions.map(d => `${d.dimKey}(${d.delta})`).join(', ')}`);
    
    if (detectedDimensions.length === 0) {
      this.log(`No dimensions detected, using fallback: self_know(0.05)`);
      detectedDimensions.push({
        dimKey: 'self_know',
        delta: 0.05
      });
    }

    this.log(`=== END GROWTH DIMENSION DETECTION ===\n`);
    return detectedDimensions;
  }

  private applySourceSpecificAdjustments(baseDelta: number, dimKey: string, sourceType: string): number {
    const dimension = this.growthModelConfig.dimensions[dimKey];
    if (!dimension || !dimension.activation_rules.source_multipliers) {
      return baseDelta;
    }

    const multiplier = dimension.activation_rules.source_multipliers[sourceType] || 1.0;
    return baseDelta * multiplier;
  }

  private mapEntityTypeToConceptType(entityType: string): string {
    return this.nerRulesConfig.entity_type_mappings[entityType] || entityType.toLowerCase();
  }

  private getDimensionMappingsForConceptType(conceptType: string): Array<{ dimKey: string; delta: number }> {
    return this.nerRulesConfig.concept_growth_mappings[conceptType] || this.nerRulesConfig.default_growth_mapping;
  }

  private extractTitle(text: string): string {
    // Extract first sentence or first 50 characters as title
    const firstSentence = text.split(/[.!?]/)[0].trim();
    return firstSentence.length > 50 
      ? firstSentence.substring(0, 47) + '...'
      : firstSentence;
  }

  private calculateImportanceScore(text: string): number {
    // Simple importance scoring based on length and keywords
    let score = Math.min(text.length / 1000, 0.5); // Length factor (max 0.5)
    
    const importantKeywords = ['goal', 'value', 'emotion', 'learn', 'grow', 'challenge', 'success'];
    const keywordMatches = importantKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    
    score += keywordMatches * 0.1; // Keyword factor
    
    return Math.min(score, 1.0);
  }
} 