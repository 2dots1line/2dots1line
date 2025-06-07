/**
 * Production NER Tool for Tool Registry Integration
 * Implements IExecutableTool interface to be discoverable via ToolRegistry
 * 
 * This wraps the enhanced NER logic created for 2dots1line's personal growth focus
 */

import type { 
  TNERToolInput, 
  TNERToolOutput, 
  TNERInputPayload, 
  TNERResult, 
  TExtractedEntity 
} from '@2dots1line/shared-types';
import type { IToolManifest, IExecutableTool } from '@2dots1line/tool-registry';

import { EnhancedNER, EntityType, EntityMatch } from './ner';

// Tool manifest for registry discovery
const manifest: IToolManifest<TNERInputPayload, TNERResult> = {
  name: 'ner.extract',
  description: 'Enhanced NER tool optimized for personal growth concepts (emotions, values, goals, skills, struggles)',
  version: '1.0.0',
  availableRegions: ['us', 'cn'],
  categories: ['text_processing', 'ner', 'personal_growth'],
  capabilities: ['ner_extraction', 'growth_concept_extraction', 'entity_classification'],
  validateInput: (input: TNERToolInput) => {
    const valid = !!input?.payload?.text_to_analyze && input.payload.text_to_analyze.trim().length > 0;
    return { 
      valid, 
      errors: valid ? [] : ['Missing or empty text_to_analyze in payload'] 
    };
  },
  validateOutput: (output: TNERToolOutput) => {
    const valid = Array.isArray(output?.result?.entities);
    return { 
      valid, 
      errors: valid ? [] : ['Missing entities array in result'] 
    };
  },
  performance: {
    avgLatencyMs: 5, // Sub-millisecond for typical journal entries
    isAsync: true,
    isIdempotent: true
  },
  limitations: [
    'Deterministic pattern-based extraction (not LLM-based)',
    'English language optimized',
    'Context window limited to 25 characters around entities'
  ]
};

/**
 * Convert internal EntityType to standard NER entity types
 */
function mapEntityTypeToStandard(entityType: EntityType): string {
  switch (entityType) {
    case EntityType.PERSON:
      return 'PERSON';
    case EntityType.ORGANIZATION:
      return 'ORG';
    case EntityType.LOCATION:
      return 'LOC';
    case EntityType.DATE:
      return 'DATE';
    case EntityType.EMAIL:
      return 'EMAIL';
    case EntityType.PHONE:
      return 'PHONE';
    case EntityType.URL:
      return 'URL';
    // Growth-oriented types (custom extensions)
    case EntityType.EMOTION:
      return 'EMOTION';
    case EntityType.VALUE:
      return 'VALUE';
    case EntityType.GOAL:
      return 'GOAL';
    case EntityType.SKILL:
      return 'SKILL';
    case EntityType.STRUGGLE:
      return 'STRUGGLE';
    case EntityType.ASPIRATION:
      return 'ASPIRATION';
    default:
      return 'MISC';
  }
}

/**
 * Convert internal EntityMatch to standard TExtractedEntity
 */
function convertToStandardEntity(entity: EntityMatch): TExtractedEntity {
  return {
    text: entity.text,
    type: mapEntityTypeToStandard(entity.type),
    start_offset: entity.start,
    end_offset: entity.end,
    confidence: entity.confidence,
    metadata: {
      context: entity.context,
      entity_category: entity.type,
      is_concept_entity: [
        EntityType.PERSON,
        EntityType.ORGANIZATION,
        EntityType.LOCATION,
        EntityType.DATE,
        EntityType.EMOTION,
        EntityType.VALUE,
        EntityType.GOAL,
        EntityType.SKILL,
        EntityType.STRUGGLE,
        EntityType.ASPIRATION
      ].includes(entity.type),
      is_metadata_entity: [
        EntityType.EMAIL,
        EntityType.PHONE,
        EntityType.URL
      ].includes(entity.type)
    }
  };
}

/**
 * Execute the enhanced NER tool
 */
const execute = async (input: TNERToolInput): Promise<TNERToolOutput> => {
  const { text_to_analyze, language } = input.payload;
  const startTime = performance.now();

  try {
    // Use the enhanced NER implementation
    const nerResult = EnhancedNER.extractEntities(text_to_analyze);
    
    // Convert to standard format
    const entities: TExtractedEntity[] = nerResult.entities.map(convertToStandardEntity);
    
    const processingTime = performance.now() - startTime;

    return {
      status: 'success',
      result: {
        entities
      },
      metadata: {
        processing_time_ms: Math.round(processingTime),
        model_used: 'enhanced-ner-v1.0.0',
        processed_in_region: input.region || 'us',
        entity_stats: {
          total_entities: nerResult.totalEntities,
          concept_entities: nerResult.conceptEntities.length,
          metadata_entities: nerResult.metadataEntities.length,
          processing_time_internal: nerResult.processingTime
        },
        warnings: language && language !== 'en' ? ['Tool optimized for English language'] : undefined
      }
    };
  } catch (error) {
    const processingTime = performance.now() - startTime;
    
    return {
      status: 'error',
      error: {
        code: 'NER_EXECUTION_FAILED',
        message: `Failed to extract entities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          input_length: text_to_analyze.length,
          error_type: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      },
      metadata: {
        processing_time_ms: Math.round(processingTime),
        model_used: 'enhanced-ner-v1.0.0',
        processed_in_region: input.region || 'us'
      }
    };
  }
};

/**
 * Enhanced NER Tool implementing IExecutableTool interface
 */
export const EnhancedNERTool: IExecutableTool<TNERInputPayload, TNERResult> = {
  manifest,
  execute
};

export default EnhancedNERTool; 