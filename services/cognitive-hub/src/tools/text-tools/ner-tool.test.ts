/**
 * Integration tests for Enhanced NER Tool with Tool Registry
 * Tests the tool registry interface compliance and integration
 */

import { ToolRegistry } from '@2dots1line/tool-registry';
import { EnhancedNERTool } from './ner-tool';
import type { TNERToolInput, TExtractedEntity } from '@2dots1line/shared-types';

describe('Enhanced NER Tool Registry Integration', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
    registry.register(EnhancedNERTool);
  });

  describe('Tool Registration', () => {
    test('should register successfully with correct manifest', () => {
      const manifest = registry.getManifest('ner-enhanced-growth');
      
      expect(manifest).toBeDefined();
      expect(manifest?.name).toBe('ner-enhanced-growth');
      expect(manifest?.description).toContain('personal growth');
      expect(manifest?.version).toBe('1.0.0');
      expect(manifest?.capabilities).toContain('ner_extraction');
      expect(manifest?.capabilities).toContain('growth_concept_extraction');
    });

    test('should be discoverable by capability', () => {
      const tools = registry.findTools({ capability: 'ner_extraction' });
      
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('ner-enhanced-growth');
    });

    test('should be discoverable by category', () => {
      const tools = registry.findTools({ category: 'personal_growth' });
      
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('ner-enhanced-growth');
    });

    test('should be discoverable by region', () => {
      const usTools = registry.findTools({ region: 'us' });
      const cnTools = registry.findTools({ region: 'cn' });
      
      expect(usTools.some(t => t.name === 'ner-enhanced-growth')).toBe(true);
      expect(cnTools.some(t => t.name === 'ner-enhanced-growth')).toBe(true);
    });
  });

  describe('Tool Execution via Registry', () => {
    test('should execute successfully via registry with valid input', async () => {
      const input: TNERToolInput = {
        payload: {
          text_to_analyze: "I'm feeling happy about learning programming and want to improve my skills."
        },
        user_id: 'test-user',
        region: 'us'
      };

      const result = await registry.executeTool('ner-enhanced-growth', input);

      expect(result.status).toBe('success');
      expect(result.result?.entities).toBeDefined();
      expect(Array.isArray(result.result?.entities)).toBe(true);
      expect(result.metadata?.model_used).toBe('enhanced-ner-v1.0.0');
      expect(result.metadata?.processing_time_ms).toBeGreaterThan(0);
    });

    test('should extract growth-oriented entities correctly', async () => {
      const input: TNERToolInput = {
        payload: {
          text_to_analyze: "I felt proud and grateful today. I want to become more confident and I'm learning programming skills."
        }
      };

      const result = await registry.executeTool('ner-enhanced-growth', input);

      expect(result.status).toBe('success');
      const entities = result.result?.entities || [];
      
      // Should find emotions
      expect(entities.some((e: TExtractedEntity) => e.type === 'EMOTION' && e.text === 'proud')).toBe(true);
      expect(entities.some((e: TExtractedEntity) => e.type === 'EMOTION' && e.text === 'grateful')).toBe(true);
      expect(entities.some((e: TExtractedEntity) => e.type === 'EMOTION' && e.text === 'confident')).toBe(true);
      
      // Should find values (learning is detected as a value)
      expect(entities.some((e: TExtractedEntity) => e.type === 'VALUE' && e.text === 'learning')).toBe(true);
      
      // Should find at least some growth-oriented entities
      const growthEntities = entities.filter((e: TExtractedEntity) => 
        ['EMOTION', 'VALUE', 'GOAL', 'SKILL', 'STRUGGLE', 'ASPIRATION'].includes(e.type)
      );
      expect(growthEntities.length).toBeGreaterThan(0);
      
      // Verify entity metadata
      entities.forEach((entity: TExtractedEntity) => {
        expect(entity.confidence).toBeGreaterThan(0);
        expect(entity.confidence).toBeLessThanOrEqual(1);
        expect(entity.start_offset).toBeGreaterThanOrEqual(0);
        expect(entity.end_offset).toBeGreaterThan(entity.start_offset);
        expect(entity.metadata).toBeDefined();
      });
    });

    test('should handle validation errors properly', async () => {
      const invalidInput: TNERToolInput = {
        payload: {
          text_to_analyze: '' // Empty text should fail validation
        }
      };

      await expect(
        registry.executeTool('ner-enhanced-growth', invalidInput)
      ).rejects.toThrow('Invalid input');
    });

    test('should include comprehensive metadata', async () => {
      const input: TNERToolInput = {
        payload: {
          text_to_analyze: "I'm excited about learning to code and meeting new people.",
          language: 'zh' // Non-English should trigger warning
        },
        region: 'cn'
      };

      const result = await registry.executeTool('ner-enhanced-growth', input);

      expect(result.status).toBe('success');
      expect(result.metadata?.entity_stats).toBeDefined();
      expect(result.metadata?.entity_stats?.total_entities).toBeGreaterThan(0);
      expect(result.metadata?.entity_stats?.concept_entities).toBeDefined();
      expect(result.metadata?.entity_stats?.metadata_entities).toBeDefined();
      expect(result.metadata?.processed_in_region).toBe('cn');
      expect(result.metadata?.warnings).toContain('Tool optimized for English language');
    });

    test('should classify entities correctly', async () => {
      const input: TNERToolInput = {
        payload: {
          text_to_analyze: "Contact John Smith at john@example.com. I'm struggling with time management and want to learn better habits."
        }
      };

      const result = await registry.executeTool('ner-enhanced-growth', input);

      expect(result.status).toBe('success');
      const entities = result.result?.entities || [];
      
      // Verify concept vs metadata classification in entity metadata
      const conceptEntities = entities.filter((e: TExtractedEntity) => e.metadata?.is_concept_entity);
      const metadataEntities = entities.filter((e: TExtractedEntity) => e.metadata?.is_metadata_entity);
      
      expect(conceptEntities.length).toBeGreaterThan(0);
      expect(metadataEntities.length).toBeGreaterThan(0);
      
      // Person should be concept entity
      expect(conceptEntities.some((e: TExtractedEntity) => e.type === 'PERSON')).toBe(true);
      
      // Email should be metadata entity
      expect(metadataEntities.some((e: TExtractedEntity) => e.type === 'EMAIL')).toBe(true);
      
      // Growth concepts should be concept entities
      expect(conceptEntities.some((e: TExtractedEntity) => e.type === 'STRUGGLE')).toBe(true);
    });
  });

  describe('Tool Performance', () => {
    test('should complete processing within expected time limits', async () => {
      const input: TNERToolInput = {
        payload: {
          text_to_analyze: "This is a longer text with multiple entities including John Smith from Google, emotions like happiness and excitement, goals like learning programming, and contact info like test@example.com."
        }
      };

      const startTime = performance.now();
      const result = await registry.executeTool('ner-enhanced-growth', input);
      const endTime = performance.now();

      expect(result.status).toBe('success');
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(result.metadata?.processing_time_ms).toBeLessThan(50); // Internal processing should be very fast
    });

    test('should be idempotent', async () => {
      const input: TNERToolInput = {
        payload: {
          text_to_analyze: "I'm happy to learn programming with my friend Sarah."
        }
      };

      const result1 = await registry.executeTool('ner-enhanced-growth', input);
      const result2 = await registry.executeTool('ner-enhanced-growth', input);

      expect(result1.status).toBe('success');
      expect(result2.status).toBe('success');
      
      // Results should be identical (excluding processing time)
      expect(result1.result?.entities).toEqual(result2.result?.entities);
      
      // Entity stats should be identical (excluding processing time)
      const stats1 = { ...result1.metadata?.entity_stats };
      const stats2 = { ...result2.metadata?.entity_stats };
      delete stats1.processing_time_internal;
      delete stats2.processing_time_internal;
      expect(stats1).toEqual(stats2);
    });
  });
}); 