import {
  ILLMClient,
  TChatCompletionRequest,
  TChatCompletionResponse,
  TEmbeddingRequest,
  TEmbeddingResponse,
} from '../interfaces/common.types';

export class DeepSeekAIClient implements ILLMClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) {
      throw new Error('DeepSeek AI API key is required.');
    }
    console.log('DeepSeekAIClient initialized (stub)');
  }

  async chatCompletion(request: TChatCompletionRequest): Promise<TChatCompletionResponse> {
    console.log('DeepSeekAIClient chatCompletion called (stub)', request);
    // Actual implementation using DeepSeek's SDK/API
    throw new Error('Method not implemented.');
  }

  async generateEmbedding(request: TEmbeddingRequest): Promise<TEmbeddingResponse> {
    console.log('DeepSeekAIClient generateEmbedding called (stub)', request);
    // Actual implementation using DeepSeek's SDK/API
    throw new Error('Method not implemented.');
  }
} 