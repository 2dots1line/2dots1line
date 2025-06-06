/**
 * @fileoverview Common interfaces for AI clients (LLMs, Embedding Models).
 */

/**
 * Represents a generic request to an LLM for chat completion.
 */
export interface TChatCompletionRequest {
  model_id: string; // e.g., 'gemini-pro', 'deepseek-chat'
  messages: TMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean; // If true, expect an async iterator as response
  user_id?: string; // For logging or fine-tuning context
  region?: 'us' | 'cn'; // To help select appropriate underlying model/endpoint
  // Add other common parameters like stop_sequences, presence_penalty etc.
}

/**
 * Represents a single message in a chat conversation.
 */
export interface TMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null; // Null for assistant messages with tool_calls
  name?: string; // Optional: for tool role, the name of the tool
  tool_calls?: TToolCall[];
  tool_call_id?: string; // For tool role, the ID of the call
}

/**
 * Represents a tool call requested by the assistant.
 */
export interface TToolCall {
  id: string;
  type: 'function'; // Currently only function calls are typical
  function: {
    name: string;
    arguments: string; // JSON string of arguments
  };
}

/**
 * Represents a choice in a chat completion response.
 */
export interface TChatCompletionChoice {
  index: number;
  message: TMessage;
  finish_reason: string; // e.g., 'stop', 'length', 'tool_calls'
}

/**
 * Represents a generic response from an LLM chat completion.
 */
export interface TChatCompletionResponse {
  id: string; // Unique ID for the completion
  object: string; // e.g., 'chat.completion'
  created: number; // Unix timestamp
  model: string; // Actual model used
  choices: TChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens?: number; // Optional if streaming or error
    total_tokens: number;
  };
  // For streaming, this might be a partial response or an AsyncIterable<TChatCompletionChunk>
}

// Placeholder for streaming chunk
// export interface TChatCompletionChunk { ... }

/**
 * Represents a generic request for text embedding.
 */
export interface TEmbeddingRequest {
  model_id: string; // e.g., 'text-embedding-ada-002', 'google-gecko-003'
  input: string | string[]; // Single text or array of texts
  user_id?: string; // For logging or fine-tuning context
  region?: 'us' | 'cn';
  embedding_type?: string; // e.g., 'retrieval_document', 'similarity_query'
}

/**
 * Represents a single embedding vector with its metadata.
 */
export interface TEmbeddingData {
  object: 'embedding' | string;  // Allow more flexible object types to accommodate different providers
  embedding: number[];
  index: number;
}

/**
 * Represents a generic response for text embedding.
 */
export interface TEmbeddingResponse {
  object: 'list' | string; // Usually a list of embeddings
  data: TEmbeddingData[];
  model: string; // Actual model used
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Common interface for an AI/LLM client.
 */
export interface ILLMClient {
  chatCompletion(request: TChatCompletionRequest): Promise<TChatCompletionResponse>;
  // streamChatCompletion?(request: TChatCompletionRequest): AsyncGenerator<TChatCompletionChunk, void, undefined>;
  generateEmbedding(request: TEmbeddingRequest): Promise<TEmbeddingResponse>;
  // Add other common methods like listModels, moderateText etc.
} 