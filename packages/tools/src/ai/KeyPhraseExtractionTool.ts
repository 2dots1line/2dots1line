/**
 * KeyPhraseExtractionTool.ts
 * V11.0 - Dedicated tool for key phrase extraction across all agents
 * Optimized for speed and consistency using LLM_KEY_PHRASE_MODEL
 */

import { IExecutableTool, KeyPhraseInput, KeyPhraseResult, TToolInput, TToolOutput, IToolManifest } from '@2dots1line/shared-types';
import { LLMChatTool } from './LLMChatTool';

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
  private initialized = false;

  constructor() {
    // Initialize LLMChatTool instance
    this.llmChatTool = LLMChatTool; // Use the exported instance
  }

  async execute(input: TToolInput<KeyPhraseInput>): Promise<TToolOutput<KeyPhraseResult>> {
    const startTime = Date.now();
    
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`🔍 KeyPhraseExtractionTool: Extracting key phrases from text (${input.payload.text.length} chars)`);
      
      // Build optimized prompt for key phrase extraction
      const systemPrompt = this.buildSystemPrompt(input.payload);
      const userPrompt = this.buildUserPrompt(input.payload);
      
      // Get the optimized key phrase model (hardcoded for now)
      const keyPhraseModel = 'gemini-2.5-flash-lite';
      
      // Prepare LLM input
      const llmInput = {
        payload: {
          userId: input.payload.context?.userId || 'system',
          sessionId: input.payload.context?.conversationId || 'keyphrase-extraction',
          workerType: 'keyphrase-extraction-tool',
          workerJobId: `kpe-${Date.now()}`,
          conversationId: input.payload.context?.conversationId || 'none',
          messageId: `msg-${Date.now()}`,
          sourceEntityId: input.payload.context?.conversationId || 'none',
          systemPrompt,
          userMessage: userPrompt,
          history: [],
          temperature: input.payload.options?.temperature || 0.3,
          maxTokens: 1000, // Key phrases don't need much output
          modelOverride: keyPhraseModel,
          enableStreaming: input.payload.options?.streaming || false,
          onChunk: input.payload.options?.onChunk
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

  private buildSystemPrompt(input: KeyPhraseInput): string {
    const maxPhrases = input.options?.maxPhrases || 7;
    const agentType = input.context?.agentType || 'general';
    
    let agentSpecificGuidance = '';
    switch (agentType) {
      case 'quest':
        agentSpecificGuidance = `
QUEST-SPECIFIC GUIDANCE:
- Focus on concepts that will guide 3D memory visualization
- Include temporal, emotional, and relationship contexts
- Think like a memory explorer for immersive experiences
- Consider what memories, people, places, or experiences might be relevant`;
        break;
      case 'dialogue':
        agentSpecificGuidance = `
DIALOGUE-SPECIFIC GUIDANCE:
- Focus on concepts that will help retrieve relevant conversation context
- Include entities, topics, and conversational themes
- Consider what previous conversations or memories might be relevant
- Think like a conversational assistant`;
        break;
      default:
        agentSpecificGuidance = `
GENERAL GUIDANCE:
- Extract the most important concepts and entities
- Include both literal and implied meanings
- Consider context and relationships`;
    }

    return `=== KEY PHRASE EXTRACTION TOOL ===

You are a specialized AI assistant designed to extract meaningful key phrases from user input for memory retrieval and context understanding.

CORE PURPOSE:
- Extract ${maxPhrases} key phrases that will guide memory retrieval and context understanding
- Consider both literal words and implied concepts based on user intent
- Generate phrases that will find relevant memories, concepts, and artifacts
- Think like a context-aware assistant, not just a keyword extractor

KEY PHRASE EXTRACTION GUIDELINES:
1. **Literal Extraction**: Include important nouns, verbs, and concepts from the user's input
2. **Intent-Based Expansion**: Add related concepts that the user likely means but didn't explicitly state
3. **Context Awareness**: Consider what memories, people, places, or experiences might be relevant
4. **Temporal Context**: Include time-related concepts if the input implies past/present/future
5. **Emotional Context**: Include emotional or thematic concepts that might connect to memories
6. **Relationship Context**: Include relationship or social concepts that might be relevant

${agentSpecificGuidance}

EXAMPLES:
- "Tell me about my skating memories" → ["skating", "ice skating", "winter sports", "childhood activities", "family memories", "sports"]
- "What do I remember about my trip to Japan?" → ["Japan", "travel", "vacation", "Japanese culture", "trip memories", "international travel"]
- "Show me memories about my daughter" → ["daughter", "family", "children", "parenting", "family memories", "relationships"]

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "key_phrases": ["phrase1", "phrase2", "phrase3", "phrase4", "phrase5", "phrase6", "phrase7"]
}

IMPORTANT:
- Return exactly ${maxPhrases} phrases
- Use simple, clear phrases (1-3 words each)
- Avoid overly specific or complex phrases
- Focus on concepts that will help with memory retrieval
- Return valid JSON only, no additional text`;
  }

  private buildUserPrompt(input: KeyPhraseInput): string {
    return `Extract key phrases from this text:

"${input.text}"

Please provide ${input.options?.maxPhrases || 7} key phrases that will help with memory retrieval and context understanding.`;
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
