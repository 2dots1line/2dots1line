/**
 * V9.5 Real-Time Conversation Loop - DialogueAgent Tests
 * 
 * Following CRITICAL_LESSONS_LEARNED.md:
 * - LESSON 16: Avoiding constructor-time environment dependencies
 * - LESSON 27: Following TypeScript Configuration Bible
 * - Comprehensive test coverage without over-engineering
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import types and interfaces
import { DialogueAgent, PromptBuilder } from '../../../services/dialogue-service/src';
import { DialogueAgentDependencies } from '../../../services/dialogue-service/src/DialogueAgent';

// Mock external dependencies at module level
jest.mock('@2dots1line/database');
jest.mock('../../../services/config-service/src/ConfigService');
jest.mock('ioredis');

describe('V9.5 Real-Time Conversation Loop - DialogueAgent', () => {
  let dialogueAgent: DialogueAgent;
  let mockDependencies: DialogueAgentDependencies;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create simple working mocks using direct object construction
    mockDependencies = {
      configService: {
        getTemplate: jest.fn(() => 'Mock template'),
        getCoreIdentity: jest.fn(() => ({
          name: 'Dot',
          persona: 'helpful assistant',
          operational_mandate: 'help users',
          rules: ['be helpful', 'be accurate']
        })),
        initialize: jest.fn(),
        validateConfig: jest.fn(),
        getAllTemplates: jest.fn(),
        getCardTemplates: jest.fn(),
        getCardEligibilityRules: jest.fn(),
        loadConfig: jest.fn()
      } as any,

      conversationRepository: {
        getMostRecentMessages: jest.fn(() => Promise.resolve([])),
        getRecentImportantConversationSummaries: jest.fn(() => Promise.resolve([])),
        addMessage: jest.fn(() => Promise.resolve({
          id: 'msg-123',
          conversation_id: 'conv-456',
          role: 'assistant',
          content: 'Test response',
          media_ids: [],
          llm_call_metadata: {},
          timestamp: new Date()
        })),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByUserId: jest.fn(),
        findActiveByUserId: jest.fn(),
        endConversation: jest.fn(),
        getMessages: jest.fn(),
        count: jest.fn()
      } as any,

      redisClient: {
        get: jest.fn(() => Promise.resolve(null)),
        set: jest.fn(() => Promise.resolve('OK')),
        del: jest.fn(),
        exists: jest.fn(),
        expire: jest.fn(),
        disconnect: jest.fn()
      } as any,

      promptBuilder: {
        buildPrompt: jest.fn(() => Promise.resolve('Built system prompt'))
      } as any,

             llmChatTool: {
         execute: jest.fn(() => Promise.resolve({
           status: 'success',
           result: {
             text: `
###==BEGIN_JSON==###
{
  "response_plan": {
    "decision": "respond_directly",
    "direct_response_text": "Hello! How can I help you today?"
  },
  "turn_context_package": {
    "user_mood": "neutral",
    "conversation_topic": "greeting"
  },
  "ui_actions": []
}
###==END_JSON==###
             `.trim(),
             model_used: 'test-model',
             usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }
           }
         }))
       } as any,

      visionCaptionTool: {
        execute: jest.fn(() => Promise.resolve({
          status: 'success',
          result: { caption: 'Test image description' }
        }))
      } as any,

      audioTranscribeTool: {
        execute: jest.fn(() => Promise.resolve({
          status: 'success',
          result: { transcript: 'Test audio transcript' }
        }))
      } as any,

      documentExtractTool: {
        execute: jest.fn(() => Promise.resolve({
          status: 'success',
          result: { extracted_text: 'Test document content' }
        }))
      } as any,

      hybridRetrievalTool: {
        execute: jest.fn(() => Promise.resolve({
          relevant_memories: ['Memory 1', 'Memory 2'],
          context_summary: 'Previous discussion about testing'
        }))
      } as any
    };

    dialogueAgent = new DialogueAgent(mockDependencies);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Construction and Initialization', () => {
    test('should construct DialogueAgent with required dependencies', () => {
      expect(dialogueAgent).toBeInstanceOf(DialogueAgent);
      expect(mockDependencies.configService).toBeDefined();
      expect(mockDependencies.conversationRepository).toBeDefined();
      expect(mockDependencies.redisClient).toBeDefined();
      expect(mockDependencies.promptBuilder).toBeDefined();
    });

    test('should have processTurn method available', () => {
      expect(typeof dialogueAgent.processTurn).toBe('function');
    });

    test('should have processDialogue method available', () => {
      expect(typeof dialogueAgent.processDialogue).toBe('function');
    });
  });

  describe('2. Core processTurn Functionality', () => {
    test('should process basic text input successfully', async () => {
      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Hello, how are you?'
      };

      const result = await dialogueAgent.processTurn(input);

      expect(result).toBeDefined();
      expect(result.response_text).toBe('Hello! How can I help you today?');
             expect(mockDependencies.redisClient.set).toHaveBeenCalledWith(
         expect.stringContaining('turn_context:conv-456'),
         expect.any(String),
         expect.any(String),
         expect.any(Number)
       );
       expect(mockDependencies.conversationRepository.addMessage).toHaveBeenCalled();
    });

    test('should handle query_memory decision path', async () => {
      // Mock LLM to first return memory query decision, then direct response
      const mockResponse1 = {
        status: 'success' as const,
        result: {
          text: `
###==BEGIN_JSON==###
{
  "response_plan": {
    "decision": "query_memory",
    "key_phrases_for_retrieval": ["machine learning", "previous projects"]
  },
  "turn_context_package": {
    "user_intent": "knowledge_retrieval"
  },
  "ui_actions": []
}
###==END_JSON==###
          `.trim(),
          model_used: 'test-model',
          usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }
        }
      };

      const mockResponse2 = {
        status: 'success' as const,
        result: {
          text: `
###==BEGIN_JSON==###
{
  "response_plan": {
    "decision": "respond_directly",
    "direct_response_text": "Based on our previous discussions about machine learning..."
  },
  "turn_context_package": {
    "user_intent": "followup_with_context"
  },
  "ui_actions": []
}
###==END_JSON==###
          `.trim(),
          model_used: 'test-model',
          usage: { input_tokens: 150, output_tokens: 75, total_tokens: 225 }
        }
      };

      const mockLLMExecute = (jest.fn() as any)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      mockDependencies.llmChatTool.execute = mockLLMExecute as any;

      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Tell me about my machine learning projects'
      };

      const result = await dialogueAgent.processTurn(input);

      expect(result).toBeDefined();
      expect(result.response_text).toBe('Based on our previous discussions about machine learning...');
      expect(mockDependencies.hybridRetrievalTool.execute).toHaveBeenCalledWith({
        keyPhrasesForRetrieval: ['machine learning', 'previous projects'],
        userId: 'user-123'
      });
      expect(mockLLMExecute).toHaveBeenCalledTimes(2);
    });

    test('should handle empty user input gracefully', async () => {
      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: ''
      };

      const result = await dialogueAgent.processTurn(input);

      expect(result).toBeDefined();
      expect(result.response_text).toBe('Hello! How can I help you today?');
    });

    test('should handle media input processing', async () => {
      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'What do you see in this image?',
        currentMessageMedia: [
          { type: 'image', url: 'https://example.com/test.jpg' }
        ]
      };

      const result = await dialogueAgent.processTurn(input);

      expect(result).toBeDefined();
      expect(result.response_text).toBe('Hello! How can I help you today?');
      // Media processing is handled internally by processInput method
    });
  });

  describe('3. State Management via Redis', () => {
    test('should save turn context to Redis with proper TTL', async () => {
      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Save this context'
      };

      await dialogueAgent.processTurn(input);

             expect(mockDependencies.redisClient.set).toHaveBeenCalledWith(
         expect.stringContaining('turn_context:conv-456'),
         expect.stringContaining('user_mood'),
         expect.any(String),
         expect.any(Number)
       );
    });

    test('should retrieve existing turn context from Redis via PromptBuilder', async () => {
      const existingContext = JSON.stringify({
        user_sentiment: 'positive',
        conversation_topic: 'coding_help'
      });

      // Mock the PromptBuilder to simulate Redis retrieval behavior
      mockDependencies.promptBuilder.buildPrompt = jest.fn(() => Promise.resolve('Built system prompt with context'));

      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Continue our discussion'
      };

      await dialogueAgent.processTurn(input);

      // Verify PromptBuilder was called with correct parameters (it handles Redis internally)
      expect(mockDependencies.promptBuilder.buildPrompt).toHaveBeenCalledWith({
        userId: 'user-123',
        conversationId: 'conv-456',
        finalInputText: 'Continue our discussion',
        augmentedMemoryContext: undefined
      });
    });
  });

  describe('4. Error Handling and Resilience', () => {
    test('should handle LLM tool failures gracefully', async () => {
      mockDependencies.llmChatTool.execute = jest.fn(() => 
        Promise.reject(new Error('LLM service unavailable'))
      );

      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Test message'
      };

      await expect(dialogueAgent.processTurn(input)).rejects.toThrow('LLM service unavailable');
    });

    test('should handle invalid LLM response format', async () => {
      mockDependencies.llmChatTool.execute = jest.fn(() => Promise.resolve({
        status: 'success' as const,
        result: { 
          text: 'Invalid response without JSON markers',
          model_used: 'gpt-4',
          usage: {
            input_tokens: 50,
            output_tokens: 50,
            total_tokens: 100
          }
        }
      }));

      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Test message'
      };

      await expect(dialogueAgent.processTurn(input)).rejects.toThrow();
    });

    test('should handle Redis failures gracefully when logging conversation', async () => {
      mockDependencies.redisClient.set = jest.fn(() => 
        Promise.reject(new Error('Redis connection failed'))
      );

      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Test message'
      };

      // Should still complete successfully despite Redis failure
      const result = await dialogueAgent.processTurn(input);
      expect(result).toBeDefined();
      expect(result.response_text).toBe('Hello! How can I help you today?');
      
      // Verify Redis was attempted but failure was handled gracefully
      expect(mockDependencies.redisClient.set).toHaveBeenCalled();
    });

    test('should handle database failures when recording messages', async () => {
      mockDependencies.conversationRepository.addMessage = jest.fn(() =>
        Promise.reject(new Error('Database connection failed'))
      );

      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Test message'
      };

      // Should still complete successfully despite database failure
      const result = await dialogueAgent.processTurn(input);
      expect(result).toBeDefined();
    });
  });

  describe('5. Legacy API Compatibility', () => {
    test('should support legacy processDialogue method', async () => {
      const legacyInput = {
        user_id: 'user-123',
        payload: {
          message_text: 'Legacy test message',
          conversation_id: 'conv-456',
          message_id: 'msg-789',
          client_timestamp: new Date().toISOString()
        },
        region: 'us' as const,
        request_id: 'req-123',
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const result = await dialogueAgent.processDialogue(legacyInput);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.result).toBeDefined();
      expect(result.result?.response_text).toBe('Hello! How can I help you today?');
      expect(result.request_id).toBe('req-123');
    });
  });

  describe('6. Performance and Timing', () => {
    test('should complete processing within reasonable time', async () => {
      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Quick test'
      };

      const startTime = Date.now();
      const result = await dialogueAgent.processTurn(input);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second in test
    });

    test('should handle concurrent requests to different conversations', async () => {
      const inputs = [
        {
          userId: 'user-123',
          conversationId: 'conv-1',
          currentMessageText: 'Message 1'
        },
        {
          userId: 'user-456',
          conversationId: 'conv-2',
          currentMessageText: 'Message 2'
        }
      ];

      const results = await Promise.all(
        inputs.map(input => dialogueAgent.processTurn(input))
      );

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.response_text).toBe('Hello! How can I help you today?');
      });
    });
  });

  describe('7. Real-Time Conversation Loop Integration', () => {
    test('should demonstrate complete Real-Time Conversation Loop', async () => {
      // Mock conversation history for context
      const mockHistory = [
        {
          id: 'msg-1',
          conversation_id: 'conv-456',
          role: 'user',
          content: 'I need help with React',
          media_ids: [],
          llm_call_metadata: {},
          timestamp: new Date(Date.now() - 60000)
        }
      ];

      mockDependencies.conversationRepository.getMostRecentMessages = 
        jest.fn(() => Promise.resolve(mockHistory));

      const mockTurnContext = {
        conversation_topic: 'react_development',
        user_expertise_level: 'beginner'
      };

      mockDependencies.redisClient.get = 
        jest.fn(() => Promise.resolve(JSON.stringify(mockTurnContext)));

      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Can you explain useState?'
      };

      const result = await dialogueAgent.processTurn(input);

      // Verify Real-Time Loop components worked together
      expect(result).toBeDefined();
      expect(result.response_text).toBe('Hello! How can I help you today?');

      // Verify PromptBuilder was called with proper context
      expect(mockDependencies.promptBuilder.buildPrompt).toHaveBeenCalledWith({
        userId: 'user-123',
        conversationId: 'conv-456',
        finalInputText: 'Can you explain useState?',
        augmentedMemoryContext: undefined
      });

      // Verify conversation state was maintained
             expect(mockDependencies.redisClient.set).toHaveBeenCalledWith(
         expect.stringContaining('turn_context:conv-456'),
         expect.any(String),
         expect.any(String),
         expect.any(Number)
       );

      // Verify conversation history was updated
      expect(mockDependencies.conversationRepository.addMessage).toHaveBeenCalledWith({
        conversation_id: 'conv-456',
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        llm_call_metadata: expect.objectContaining({
          decision: 'respond_directly',
          processing_time_ms: expect.any(Number)
        })
      });
    });

    test('should maintain conversation context across multiple turns', async () => {
      // Simulate a multi-turn conversation
      const turns = [
        'I want to learn TypeScript',
        'I know JavaScript well',
        'Show me an example'
      ];

      const results: any[] = [];

      for (let index = 0; index < turns.length; index++) {
        const messageText = turns[index];
        const input = {
          userId: 'user-123',
          conversationId: 'conv-learning',
          currentMessageText: messageText
        };

        const result = await dialogueAgent.processTurn(input);
        results.push(result);

        // Verify each turn was processed
        expect(result).toBeDefined();
        expect(result.response_text).toBe('Hello! How can I help you today?');
      }

      // Verify Redis was called for each turn
      expect(mockDependencies.redisClient.set).toHaveBeenCalledTimes(3);
      
      // Verify conversation was recorded for each turn
      expect(mockDependencies.conversationRepository.addMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('8. Quality and Integration Validation', () => {
    test('should generate appropriate UI actions', async () => {
      // Mock LLM response with UI actions
      mockDependencies.llmChatTool.execute = jest.fn(() => Promise.resolve({
        status: 'success' as const,
        result: {
          text: `
###==BEGIN_JSON==###
{
  "response_plan": {
    "decision": "respond_directly",
    "direct_response_text": "Here's a code example for you:"
  },
  "turn_context_package": {
    "code_provided": true
  },
  "ui_actions": [
    {"type": "display_code", "data": {"language": "javascript"}},
    {"type": "enable_copy_button", "data": {}}
  ]
}
###==END_JSON==###
          `.trim(),
          model_used: 'gpt-4',
          usage: {
            input_tokens: 100,
            output_tokens: 150,
            total_tokens: 250
          }
        }
      }));

      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Show me some code'
      };

      const result = await dialogueAgent.processTurn(input);

      expect(result).toBeDefined();
      expect(result.ui_actions).toBeDefined();
      expect(result.ui_actions).toHaveLength(2);
      expect(result.ui_actions[0].type).toBe('display_code');
      expect(result.ui_actions[1].type).toBe('enable_copy_button');
    });

    test('should handle malformed JSON gracefully', async () => {
      mockDependencies.llmChatTool.execute = jest.fn(() => Promise.resolve({
        status: 'success' as const,
        result: {
          text: `
###==BEGIN_JSON==###
{
  "response_plan": {
    "decision": "respond_directly",
    "direct_response_text": "Valid response"
  },
  "turn_context_package": {
    "valid": true
  }
  // Missing closing brace and ui_actions
}
###==END_JSON==###
          `.trim(),
          model_used: 'gpt-4',
          usage: {
            input_tokens: 75,
            output_tokens: 50,
            total_tokens: 125
          }
        }
      }));

      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Test malformed JSON'
      };

      await expect(dialogueAgent.processTurn(input)).rejects.toThrow();
    });

    test('should validate response structure', async () => {
      const input = {
        userId: 'user-123',
        conversationId: 'conv-456',
        currentMessageText: 'Validate response structure'
      };

      const result = await dialogueAgent.processTurn(input);

      // Verify response has required structure
      expect(result).toHaveProperty('response_text');
      expect(result).toHaveProperty('ui_actions');
      expect(typeof result.response_text).toBe('string');
      expect(Array.isArray(result.ui_actions)).toBe(true);
    });
  });
}); 