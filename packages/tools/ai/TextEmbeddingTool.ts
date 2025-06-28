/**
 * Text Embedding Tool (Real Implementation)
 * Generates embeddings using Google Gemini embedding model
 */

import { TToolInput, TToolOutput, TTextEmbeddingInputPayload, TTextEmbeddingResult } from '@2dots1line/shared-types';
import type { IToolManifest, IExecutableTool } from '@2dots1line/tool-registry';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type TextEmbeddingToolInput = TToolInput<TTextEmbeddingInputPayload>;
export type TextEmbeddingToolOutput = TToolOutput<TTextEmbeddingResult>;

// Tool manifest for registry discovery
const manifest: IToolManifest<TTextEmbeddingInputPayload, TTextEmbeddingResult> = {
  name: 'text.embedding',
  description: 'Generate text embeddings using Google Gemini embedding model',
  version: '2.0.0',
  availableRegions: ['us', 'cn'],
  categories: ['ai', 'embedding', 'text_processing'],
  capabilities: ['text_embedding', 'semantic_search_prep'],
  validateInput: (input: TextEmbeddingToolInput) => {
    const valid = !!input?.payload?.text_to_embed && typeof input.payload.text_to_embed === 'string';
    return { 
      valid, 
      errors: valid ? [] : ['Missing or invalid text_to_embed in payload'] 
    };
  },
  validateOutput: (output: TextEmbeddingToolOutput) => {
    const valid = Array.isArray(output?.result?.vector) && output.result.vector.length > 0;
    return { 
      valid, 
      errors: valid ? [] : ['Missing or invalid vector in result'] 
    };
  },
  performance: {
    avgLatencyMs: 800,
    isAsync: true,
    isIdempotent: true
  },
  limitations: [
    'Requires GOOGLE_API_KEY environment variable',
    'Uses Gemini text-embedding-004 model',
    'Rate limited by Google API quotas'
  ]
};

class TextEmbeddingToolImpl implements IExecutableTool<TTextEmbeddingInputPayload, TTextEmbeddingResult> {
  manifest = manifest;
  
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.embeddingModel = this.genAI.getGenerativeModel({ 
      model: 'text-embedding-004' // Latest Gemini embedding model
    });
  }

  async execute(input: TextEmbeddingToolInput): Promise<TextEmbeddingToolOutput> {
    const startTime = Date.now();
    
    try {
      console.log(`TextEmbeddingTool: Generating embedding for text (${input.payload.text_to_embed.length} chars)`);
      
      // Generate embedding using Gemini API
      const result = await this.embeddingModel.embedContent(input.payload.text_to_embed);
      
      if (!result.embedding || !result.embedding.values) {
        throw new Error('No embedding returned from Gemini API');
      }
      
      const vector = result.embedding.values;
      const processingTime = Date.now() - startTime;
      
      console.log(`TextEmbeddingTool: Generated ${vector.length}-dimensional embedding in ${processingTime}ms`);
      
      return {
        status: 'success',
        result: {
          vector,
          embedding_metadata: {
            model_id_used: 'text-embedding-004',
            dimensions: vector.length,
            model_version: '004',
            token_count: Math.ceil(input.payload.text_to_embed.length / 4) // Rough estimate
          }
        },
        metadata: {
          processing_time_ms: processingTime,
          model_used: 'text-embedding-004'
        }
      };
      
    } catch (error) {
      console.error('TextEmbeddingTool error:', error);
      
      const processingTime = Date.now() - startTime;
      
      return {
        status: 'error',
        error: {
          code: 'EMBEDDING_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Embedding generation failed',
          details: { 
            tool: this.manifest.name,
            text_length: input.payload.text_to_embed.length,
            model: 'text-embedding-004'
          }
        },
        metadata: {
          processing_time_ms: processingTime
        }
      };
    }
  }
}

// Export the tool instance
export const TextEmbeddingTool: IExecutableTool<TTextEmbeddingInputPayload, TTextEmbeddingResult> = new TextEmbeddingToolImpl(); 