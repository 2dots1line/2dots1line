import type { TToolInput, TToolOutput } from '@2dots1line/shared-types';

import type { IExecutableTool, IToolManifest } from '../types';

export interface TVectorSearchInput {
  vector: number[];
  k: number;
  collection?: string;
}

export interface TVectorSearchOutput {
  results: Array<{
    id: string;
    distance: number;
    metadata?: Record<string, unknown>;
  }>;
}

const manifest: IToolManifest<TVectorSearchInput, TVectorSearchOutput> = {
  name: 'stub-vector-search',
  description: 'Stub: Performs vector similarity search.',
  version: '0.1.0',
  availableRegions: ['us', 'cn'],
  categories: ['data_retrieval'],
  capabilities: ['vector_search'],
  validateInput: (input: TToolInput<TVectorSearchInput>) => {
    const valid = Array.isArray(input?.payload?.vector) && typeof input?.payload?.k === 'number';
    return { valid, errors: valid ? [] : ['Missing vector or k in payload'] };
  },
  validateOutput: (output: TToolOutput<TVectorSearchOutput>) => {
    const valid = Array.isArray(output?.result?.results);
    return { valid, errors: valid ? [] : ['Missing results array in result'] };
  },
};

const execute = async (
  input: TToolInput<TVectorSearchInput>
): Promise<TToolOutput<TVectorSearchOutput>> => {
  console.warn(`Executing STUB tool: ${manifest.name}`);
  const { k, collection } = input.payload;
  
  // Generate fake search results
  const results = Array.from({ length: Math.min(k, 5) }, (_, i) => ({
    id: `fake-result-${i + 1}`,
    distance: Math.random() * 0.5, // Random similarity score
    metadata: {
      collection: collection || 'default',
      title: `Fake Result ${i + 1}`,
    },
  }));

  return {
    status: 'success',
    result: {
      results,
    },
    metadata: {
      warnings: ['Using stub implementation'],
    },
  };
};

export const StubVectorSearchTool: IExecutableTool<TVectorSearchInput, TVectorSearchOutput> = {
  manifest,
  execute,
}; 