/**
 * LLM Provider Clients for 2dots1line V4
 * Provides clients for Google AI, DeepSeek, and other LLM providers
 */

// Re-export all client interfaces and implementations
export * from './google';
export * from './deepseek';
export * from './interfaces/common.types';
export * from './tools/llm-chat.tool';

import { GoogleAIClient } from './google';
import { DeepSeekAIClient } from './deepseek';
import { ILLMClient } from './interfaces/common.types';

interface AIClientConfig {
  region: 'us' | 'cn';
  googleApiKey?: string;
  deepseekApiKey?: string;
  // other provider keys
}

export function getAIClient(config: AIClientConfig): ILLMClient {
  if (config.region === 'us') {
    if (!config.googleApiKey) {
      throw new Error('Google API key is required for US region.');
    }
    return new GoogleAIClient(config.googleApiKey);
  }
  if (config.region === 'cn') {
    if (!config.deepseekApiKey) {
      throw new Error('DeepSeek API key is required for CN region.');
    }
    return new DeepSeekAIClient(config.deepseekApiKey);
  }
  throw new Error(`Unsupported region: ${config.region} or missing API key for the region.`);
}

// TODO: Add a config loader for this package similar to packages/database/src/config.ts
// to load API keys from environment variables. 