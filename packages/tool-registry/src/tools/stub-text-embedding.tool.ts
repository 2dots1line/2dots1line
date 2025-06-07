import type { TToolInput, TToolOutput } from '@2dots1line/shared-types';

import type { IExecutableTool, IToolManifest } from '../types';

export interface TTextEmbeddingInput {
  text: string;
  model_id: string;
}

export interface TTextEmbeddingOutput {
  vector: number[];
  embedding_metadata: {
    model_id: string;
    dimension: number;
  };
}

const manifest: IToolManifest<TTextEmbeddingInput, TTextEmbeddingOutput> = {
  name: 'stub-text-embedding',
  description: 'Stub: Generates embeddings for text using specified model.',
  version: '0.1.0',
  availableRegions: ['us', 'cn'],
  categories: ['ai_processing'],
  capabilities: ['text_embedding'],
  validateInput: (input: TToolInput<TTextEmbeddingInput>) => {
    const valid = !!input?.payload?.text && !!input?.payload?.model_id;
    return { valid, errors: valid ? [] : ['Missing text or model_id in payload'] };
  },
  validateOutput: (output: TToolOutput<TTextEmbeddingOutput>) => {
    const valid = Array.isArray(output?.result?.vector) && !!output?.result?.embedding_metadata;
    return { valid, errors: valid ? [] : ['Missing vector or embedding_metadata in result'] };
  },
};

const execute = async (
  input: TToolInput<TTextEmbeddingInput>
): Promise<TToolOutput<TTextEmbeddingOutput>> => {
  console.warn(`Executing STUB tool: ${manifest.name}`);
  const { model_id } = input.payload;
  
  // Generate fake embedding vector
  const dimension = 1536; // Common embedding dimension
  const vector = Array.from({ length: dimension }, () => Math.random() - 0.5);

  return {
    status: 'success',
    result: {
      vector,
      embedding_metadata: {
        model_id,
        dimension,
      },
    },
    metadata: {
      warnings: ['Using stub implementation'],
    },
  };
};

export const StubTextEmbeddingTool: IExecutableTool<TTextEmbeddingInput, TTextEmbeddingOutput> = {
  manifest,
  execute,
}; 