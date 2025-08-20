import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

import {
  ILLMClient,
  TChatCompletionRequest,
  TChatCompletionResponse,
  TEmbeddingRequest,
  TEmbeddingResponse,
  TEmbeddingData,
  TMessage
} from '../interfaces/common.types';

export class GoogleAIClient implements ILLMClient {
  private client: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google AI API key is required.');
    }
    this.apiKey = apiKey;
    this.client = new GoogleGenerativeAI(apiKey);
    console.log('GoogleAIClient initialized with Gemini');
  }

  async chatCompletion(request: TChatCompletionRequest): Promise<TChatCompletionResponse> {
    try {
      // Use environment-based model selection if no model_id provided
      const modelToUse = request.model_id || this.getDefaultModel();
      console.log(`GoogleAIClient: Using model ${modelToUse}`);
      const model = this.client.getGenerativeModel({ 
        model: modelToUse
      });

      // Convert our messages format to Google's format
      const history = this.convertMessagesToGoogleFormat(request.messages.slice(0, -1));
      const lastMessage = request.messages[request.messages.length - 1];
      
      const generationConfig = {
        temperature: request.temperature || 0.7,
        topP: request.top_p || 0.8,
        maxOutputTokens: request.max_tokens || 1024,
      };
      
      let responseText: string;
      
      // If we have history, use a chat session
      if (history.length > 0) {
        const chatSession = model.startChat({
          history,
          generationConfig,
        });
        
        // Send the last message to get a response
        const result = await chatSession.sendMessage(lastMessage.content || '');
        responseText = result.response.text();
      } else {
        // Simple content generation without chat history
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: lastMessage.content || '' }] }],
          generationConfig,
        });
        
        responseText = result.response.text();
      }
      
      // Convert to our standardized response format
      const response: TChatCompletionResponse = {
        id: uuidv4(),
        object: 'chat.completion',
        created: Date.now(),
        model: modelToUse,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: responseText,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 0, // Google doesn't provide token counts
          completion_tokens: 0,
          total_tokens: 0,
        },
      };

      return response;
    } catch (error) {
      console.error('Error in GoogleAI chat completion:', error);
      throw error;
    }
  }

  async generateEmbedding(request: TEmbeddingRequest): Promise<TEmbeddingResponse> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: 'embedding-001',
      });
      
      const texts = Array.isArray(request.input) ? request.input : [request.input];
      
      const embeddingResults: TEmbeddingData[] = await Promise.all(
        texts.map(async (text, index) => {
          const result = await model.embedContent(text);
          const embedding = result.embedding.values;
          
          return {
            object: 'embedding',
            embedding,
            index,
          };
        })
      );
      
      return {
        object: 'list',
        data: embeddingResults,
        model: 'embedding-001',
        usage: {
          prompt_tokens: 0, // Google doesn't provide token counts
          total_tokens: 0,
        },
      };
    } catch (error) {
      console.error('Error in GoogleAI embedding generation:', error);
      throw error;
    }
  }

  // Get default model from environment
  private getDefaultModel(): string {
    // Try to get from environment first
    const envModel = process.env.LLM_CHAT_MODEL;
    if (envModel) {
      console.log(`GoogleAIClient: Using environment variable LLM_CHAT_MODEL=${envModel}`);
      return envModel;
    }
    
    // Fallback to hardcoded default
    console.log(`GoogleAIClient: No environment variable set, using hardcoded default`);
    return 'gemini-2.5-flash';
  }

  // Helper method to convert our message format to Google's format
  private convertMessagesToGoogleFormat(messages: TMessage[]): Array<{
    role: string;
    parts: Array<{ text: string }>;
  }> {
    return messages.map(message => {
      // Skip system messages as they should be incorporated differently in Google's API
      if (message.role === 'system') {
        return {
          role: 'user',
          parts: [{ text: `[System Instruction] ${message.content}` }]
        };
      }
      
      // Handle tool messages
      if (message.role === 'tool') {
        return {
          role: 'model', // 'model' is used for assistant in Google's format
          parts: [{ text: `[Tool Response] ${message.name}: ${message.content}` }]
        };
      }
      
      // Map user and assistant roles
      const googleRole = message.role === 'user' ? 'user' : 'model';
      return {
        role: googleRole,
        parts: [{ text: message.content || '' }]
      };
    });
  }
} 