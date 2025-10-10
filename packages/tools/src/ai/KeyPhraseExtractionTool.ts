/**
 * KeyPhraseExtractionTool.ts
 * V11.0 - Dedicated tool for key phrase extraction across all agents
 * Optimized for speed and consistency using LLM_KEY_PHRASE_MODEL
 */

import { IExecutableTool, KeyPhraseInput, KeyPhraseResult, TToolInput, TToolOutput, IToolManifest } from '@2dots1line/shared-types';
import { LLMChatTool } from './LLMChatTool';
import { ConfigService } from '@2dots1line/config-service';
const Mustache = require('mustache');

// Tool manifest for registry discovery
const manifest: IToolManifest<KeyPhraseInput, KeyPhraseResult> = {
  name: 'keyphrase.extraction',
  description: 'Dedicated tool for key phrase extraction across all agents',
  version: '1.0.0',
  availableRegions: ['us', 'cn'],
  categories: ['ai', 'llm', 'text_processing'],
  capabilities: ['keyphrase_extraction', 'text_analysis'],
  validateInput: (input: TToolInput<KeyPhraseInput>) => {
    const errors: string[] = [];
    if (!input.payload.text || typeof input.payload.text !== 'string') {
      errors.push('text is required and must be a string');
    }
    if (input.payload.text && input.payload.text.length > 10000) {
      errors.push('text must be less than 10000 characters');
    }
    return { valid: errors.length === 0, errors };
  },
  validateOutput: (output: TToolOutput<KeyPhraseResult>) => {
    const errors: string[] = [];
    if (!output.result) {
      errors.push('result is required');
    }
    if (output.status !== 'success' && output.status !== 'error') {
      errors.push('status must be success or error');
    }
    return { valid: errors.length === 0, errors };
  },
  performance: {
    avgLatencyMs: 2000,
    isAsync: false,
    isIdempotent: false
  },
  limitations: [
    'Requires LLM API access',
    'Rate limited by LLM provider quotas'
  ]
};

export class KeyPhraseExtractionTool implements IExecutableTool<KeyPhraseInput, KeyPhraseResult> {
  manifest = manifest;
  private llmChatTool: any;
  private configService: ConfigService;
  private initialized = false;

  constructor(configService?: ConfigService) {
    // Initialize LLMChatTool instance
    this.llmChatTool = LLMChatTool; // Use the exported instance
    this.configService = configService || new ConfigService();
  }

  async execute(input: TToolInput<KeyPhraseInput>): Promise<TToolOutput<KeyPhraseResult>> {
    const startTime = Date.now();
    
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`🔍 KeyPhraseExtractionTool: Extracting key phrases from text (${input.payload.text.length} chars)`);
      
      // Build prompt using template system
      const consolidatedPrompt = this.buildConsolidatedPrompt(input.payload);
      
      // Get the optimized key phrase model (hardcoded for now)
      const keyPhraseModel = 'gemini-2.5-flash-lite';
      
      // Prepare LLM input with consolidated prompt
      const llmInput = {
        payload: {
          userId: input.payload.context?.userId || 'system',
          sessionId: input.payload.context?.conversationId || 'keyphrase-extraction',
          workerType: 'keyphrase-extraction-tool',
          workerJobId: `kpe-${Date.now()}`,
          conversationId: input.payload.context?.conversationId || 'none',
          messageId: `msg-${Date.now()}`,
          sourceEntityId: input.payload.context?.conversationId || 'none',
          systemPrompt: consolidatedPrompt,
          userMessage: '', // Empty user message since everything is in system prompt
          history: [],
          temperature: input.payload.options?.temperature || 0.3,
          maxTokens: 1000, // Key phrases don't need much output
          modelOverride: keyPhraseModel,
          enableStreaming: input.payload.options?.streaming || false,
          onChunk: input.payload.options?.onChunk,
          // V11.0: Flag to skip generic JSON formatting in LLMChatTool
          skipGenericFormatting: true
        },
        request_id: `keyphrase-${Date.now()}`
      };

      // Execute LLM call
      const llmResult = await this.llmChatTool.execute(llmInput);
      
      // Parse the response
      const keyPhrases = this.parseKeyPhrases(llmResult.result.text);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ KeyPhraseExtractionTool: Extracted ${keyPhrases.length} key phrases in ${processingTime}ms`);
      
      const result: KeyPhraseResult = {
        keyPhrases,
        confidence: this.calculateConfidence(keyPhrases, input.payload.text),
        processingTimeMs: processingTime,
        modelUsed: keyPhraseModel,
        metadata: {
          originalText: input.payload.text,
          agentType: input.payload.context?.agentType,
          userId: input.payload.context?.userId
        }
      };

      return {
        result,
        status: 'success',
        metadata: {
          processing_time_ms: processingTime,
          model_used: keyPhraseModel
        }
      };
      
    } catch (error) {
      console.error('❌ KeyPhraseExtractionTool: Error during key phrase extraction:', error);
      throw new Error(`Key phrase extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async initialize(): Promise<void> {
    try {
      await this.llmChatTool.initialize();
      this.initialized = true;
      console.log('✅ KeyPhraseExtractionTool: Initialized successfully');
    } catch (error) {
      console.error('❌ KeyPhraseExtractionTool: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Build consolidated prompt using template system
   * V11.0: Uses template from prompt_templates.yaml for consistency
   */
  private buildConsolidatedPrompt(input: KeyPhraseInput): string {
    const maxPhrases = input.options?.maxPhrases || 7;
    
    // Get template from config service
    const template = this.configService.getTemplate('keyphrase_extraction');
    
    if (!template) {
      throw new Error('KeyPhraseExtractionTool Error: keyphrase_extraction template not found');
    }
    
    // Prepare template variables
    const templateVars = {
      max_phrases: maxPhrases,
      user_text: input.text
    };
    
    // Render template using Mustache
    const consolidatedPrompt = Mustache.render(template, templateVars);
    
    console.log(`🔧 KeyPhraseExtractionTool: Built consolidated prompt (${consolidatedPrompt.length} chars)`);
    
    return consolidatedPrompt;
  }

  private parseKeyPhrases(responseText: string): string[] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(responseText);
      if (parsed.key_phrases && Array.isArray(parsed.key_phrases)) {
        return parsed.key_phrases.filter((phrase: any) => 
          typeof phrase === 'string' && phrase.trim().length > 0
        ).map((phrase: string) => phrase.trim());
      }
    } catch (error) {
      console.warn('⚠️ KeyPhraseExtractionTool: Failed to parse JSON response, trying fallback parsing');
    }

    // Fallback: try to extract phrases from text
    const lines = responseText.split('\n');
    for (const line of lines) {
      if (line.includes('key_phrases') || line.includes('[')) {
        try {
          // Try to extract array from the line
          const arrayMatch = line.match(/\[(.*?)\]/);
          if (arrayMatch) {
            const arrayContent = arrayMatch[1];
            const phrases = arrayContent
              .split(',')
              .map(phrase => phrase.trim().replace(/['"]/g, ''))
              .filter(phrase => phrase.length > 0);
            if (phrases.length > 0) {
              return phrases;
            }
          }
        } catch (error) {
          // Continue to next fallback
        }
      }
    }

    // Last resort: split by common delimiters
    const fallbackPhrases = responseText
      .split(/[,;|\n]/)
      .map(phrase => phrase.trim().replace(/['"]/g, ''))
      .filter(phrase => phrase.length > 0 && phrase.length < 50)
      .slice(0, 7);

    if (fallbackPhrases.length > 0) {
      console.warn('⚠️ KeyPhraseExtractionTool: Using fallback parsing');
      return fallbackPhrases;
    }

    // If all else fails, return empty array
    console.error('❌ KeyPhraseExtractionTool: Could not extract any key phrases');
    return [];
  }

  private calculateConfidence(keyPhrases: string[], originalText: string): number {
    if (keyPhrases.length === 0) return 0;
    
    // Simple confidence calculation based on phrase quality
    const textWords = originalText.toLowerCase().split(/\s+/);
    const phraseWords = keyPhrases.flatMap(phrase => phrase.toLowerCase().split(/\s+/));
    
    // Calculate overlap between phrases and original text
    const overlap = phraseWords.filter(word => textWords.includes(word)).length;
    const overlapRatio = overlap / phraseWords.length;
    
    // Base confidence on overlap and phrase count
    const baseConfidence = Math.min(overlapRatio * 0.8 + 0.2, 1.0);
    
    // Adjust based on phrase count (sweet spot is 5-7 phrases)
    const countAdjustment = keyPhrases.length >= 5 && keyPhrases.length <= 7 ? 1.0 : 0.8;
    
    return Math.round(baseConfidence * countAdjustment * 100) / 100;
  }
}

export default KeyPhraseExtractionTool;
