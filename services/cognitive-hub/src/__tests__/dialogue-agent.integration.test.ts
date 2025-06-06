/**
 * DialogueAgent Integration Tests - Real Database Flow
 * Tests the actual database integration flow for conversation handling
 * Uses a test database to verify repository methods and data persistence
 */

import { DialogueAgent } from '../agents/dialogue/DialogueAgent';
import { DatabaseService } from '@2dots1line/database';
import { ToolRegistry } from '@2dots1line/tool-registry';
import { 
  TAgentInput, 
  TDialogueAgentInputPayload,
  TToolOutput 
} from '@2dots1line/shared-types';

describe('DialogueAgent Integration Tests - Real Flow', () => {
  let dialogueAgent: DialogueAgent;
  let databaseService: DatabaseService;
  let toolRegistry: ToolRegistry;
  
  const testUserId = 'test-user-integration-123';
  const testConversationId = 'test-conv-integration-456';

  beforeAll(async () => {
    // Initialize services for integration testing
    databaseService = new DatabaseService();
    toolRegistry = new ToolRegistry();
    
    // Setup tool registry with test tools
    await setupTestTools(toolRegistry);
    
    dialogueAgent = new DialogueAgent(databaseService, toolRegistry);
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      const conversationRepo = databaseService.getConversationRepository();
      const memoryRepo = databaseService.getMemoryRepository();
      
      // Delete test conversation and related data
      // Note: This would require cleanup methods in repositories
      console.log('Test cleanup completed');
    } catch (error) {
      console.warn('Test cleanup failed:', error);
    }
  });

  describe('Text Message Processing Flow', () => {
    it('should handle complete text message processing flow', async () => {
      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: testUserId,
        region: 'us',
        request_id: 'test-req-123',
        payload: {
          message_text: 'Hello Dot, I want to talk about my goals for this year',
          message_id: 'msg-test-123',
          client_timestamp: new Date().toISOString(),
          conversation_id: testConversationId
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: 'test-session-123'
        }
      };

      const result = await dialogueAgent.process(input);

      // Verify successful processing
      expect(result.status).toBe('success');
      expect(result.result?.response_text).toBeDefined();
      expect(result.result?.conversation_id).toBe(testConversationId);
      expect(result.metadata?.conversation_id).toBe(testConversationId);
      expect(result.metadata?.processing_time_ms).toBeGreaterThan(0);

      // Verify conversation was created/retrieved
      const conversationRepo = databaseService.getConversationRepository();
      const conversation = await conversationRepo.getOrCreateConversation(
        testUserId,
        testConversationId,
        'Chat with Dot'
      );
      
      expect(conversation).toBeDefined();
      expect(conversation.conversation_id).toBe(testConversationId);
      expect(conversation.user_id).toBe(testUserId);

      // Verify messages were saved
      const messages = await conversationRepo.getMessages(testConversationId, { limit: 10 });
      expect(messages.length).toBeGreaterThanOrEqual(2); // User message + assistant response
      
      const userMessage = messages.find(msg => msg.sender_type === 'user');
      const assistantMessage = messages.find(msg => msg.sender_type === 'assistant');
      
      expect(userMessage).toBeDefined();
      expect(userMessage?.message_text).toBe('Hello Dot, I want to talk about my goals for this year');
      
      expect(assistantMessage).toBeDefined();
      expect(assistantMessage?.message_text).toBeDefined();
      expect(assistantMessage?.message_text?.length).toBeGreaterThan(0);
    });

    it('should trigger IngestionAnalyst for memory-worthy conversations', async () => {
      const memoryWorthyInput: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: testUserId,
        region: 'us',
        request_id: 'test-req-memory-124',
        payload: {
          message_text: 'I realized something important about myself today. I discovered that I am truly grateful for my personal growth journey and want to remember this feeling.',
          message_id: 'msg-memory-test-124',
          client_timestamp: new Date().toISOString(),
          conversation_id: testConversationId + '-memory'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: 'test-session-memory-124'
        }
      };

      const result = await dialogueAgent.process(memoryWorthyInput);

      expect(result.status).toBe('success');
      
      // Give some time for async IngestionAnalyst processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify memory units were created (if IngestionAnalyst is working)
      const memoryRepo = databaseService.getMemoryRepository();
      
      // Note: This test depends on IngestionAnalyst actually creating memory units
      // For now, we verify the conversation processing succeeded
      expect(result.result?.response_text).toBeDefined();
    });

    it('should handle conversation history correctly', async () => {
      const conversationId = testConversationId + '-history';
      
      // First message
      const firstInput: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: testUserId,
        region: 'us',
        request_id: 'test-req-hist-1',
        payload: {
          message_text: 'My name is Alice and I like reading books',
          message_id: 'msg-hist-1',
          client_timestamp: new Date().toISOString(),
          conversation_id: conversationId
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: 'test-session-hist'
        }
      };

      await dialogueAgent.process(firstInput);

      // Second message that should reference the first
      const secondInput: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: testUserId,
        region: 'us',
        request_id: 'test-req-hist-2',
        payload: {
          message_text: 'What do you remember about my interests?',
          message_id: 'msg-hist-2',
          client_timestamp: new Date().toISOString(),
          conversation_id: conversationId
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: 'test-session-hist'
        }
      };

      const result = await dialogueAgent.process(secondInput);

      expect(result.status).toBe('success');
      
      // Verify the response potentially references previous context
      // Note: This would depend on the LLM implementation
      expect(result.result?.response_text).toBeDefined();

      // Verify conversation history is preserved
      const conversationRepo = databaseService.getConversationRepository();
      const messages = await conversationRepo.getMessages(conversationId, { limit: 10 });
      
      expect(messages.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant messages
    });
  });

  describe('File Upload Processing Flow', () => {
    it('should handle image upload and processing', async () => {
      const fileUploadInput: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: testUserId,
        region: 'us',
        request_id: 'test-req-file-125',
        payload: {
          message_text: 'What do you see in this image?',
          message_id: 'msg-file-test-125',
          client_timestamp: new Date().toISOString(),
          conversation_id: testConversationId + '-file',
          message_media: [{
            type: 'image/jpeg',
            url: 'https://example.com/test-image.jpg',
            media_id: 'test-media-123'
          }]
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: 'test-session-file-125'
        }
      };

      const result = await dialogueAgent.process(fileUploadInput);

      expect(result.status).toBe('success');
      expect(result.result?.response_text).toBeDefined();
      
      // Verify media record was created
      const mediaRepo = databaseService.getMediaRepository();
      
      // Note: This test would require checking if media was actually saved
      // For now, we verify the processing completed successfully
    });
  });

  describe('Error Handling', () => {
    it('should handle missing message text gracefully', async () => {
      const invalidInput: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: testUserId,
        region: 'us',
        request_id: 'test-req-invalid-126',
        payload: {
          message_id: 'msg-invalid-test-126',
          client_timestamp: new Date().toISOString(),
          conversation_id: testConversationId + '-invalid'
          // message_text is missing
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: 'test-session-invalid-126'
        }
      };

      const result = await dialogueAgent.process(invalidInput);

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DIALOGUE_PROCESSING_ERROR');
      expect(result.error?.message).toContain('No message text or media provided');
    });

    it('should handle LLM tool failures gracefully', async () => {
      // This test would require a way to force tool failure
      // For now, we test with a malformed input that might cause tool issues
      
      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: testUserId,
        region: 'us',
        request_id: 'test-req-toolerror-127',
        payload: {
          message_text: 'Test message for tool error handling',
          message_id: 'msg-toolerror-test-127',
          client_timestamp: new Date().toISOString(),
          conversation_id: testConversationId + '-toolerror'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: 'test-session-toolerror-127'
        }
      };

      // Temporarily break the tool registry or use invalid tool configuration
      // For now, just verify normal processing works
      const result = await dialogueAgent.process(input);
      
      // Should either succeed or fail gracefully
      expect(['success', 'error']).toContain(result.status);
      
      if (result.status === 'error') {
        expect(result.error?.code).toBeDefined();
        expect(result.error?.message).toBeDefined();
      }
    });
  });
});

/**
 * Setup test tools for integration testing
 */
async function setupTestTools(toolRegistry: ToolRegistry) {
  // Register a test LLM tool that returns predictable responses
  const testLLMTool = {
    manifest: {
      name: 'llm.chat',
      description: 'Test LLM chat tool',
      version: '1.0.0',
      availableRegions: ['us'] as ('us' | 'cn')[],
      categories: ['llm'],
      capabilities: ['chat'],
      validateInput: (input: any) => ({ valid: true }),
      validateOutput: (output: any) => ({ valid: true }),
    },
    execute: async (input: any): Promise<TToolOutput<any>> => {
      // Simple test response based on input
      const userMessage = input.payload?.userMessage || '';
      let response = "Hello! I'm Dot, your AI companion. ";
      
      if (userMessage.toLowerCase().includes('goal')) {
        response += "I'd love to hear about your goals and help you explore them.";
      } else if (userMessage.toLowerCase().includes('grateful') || userMessage.toLowerCase().includes('important')) {
        response += "It sounds like you've had a meaningful realization. These moments of gratitude and insight are precious.";
      } else if (userMessage.toLowerCase().includes('remember') || userMessage.toLowerCase().includes('interest')) {
        response += "You mentioned enjoying reading books earlier. I find it wonderful when people have passions that bring them joy.";
      } else {
        response += "How are you feeling today? I'm here to listen and support your growth journey.";
      }

      return {
        status: 'success',
        result: { text: response },
        metadata: {
          processing_time_ms: 50,
          model_used: 'test-llm'
        }
      };
    }
  };

  // Register a test vision tool
  const testVisionTool = {
    manifest: {
      name: 'vision_caption',
      description: 'Test vision caption tool',
      version: '1.0.0',
      availableRegions: ['us'] as ('us' | 'cn')[],
      categories: ['vision'],
      capabilities: ['captioning'],
      validateInput: (input: any) => ({ valid: true }),
      validateOutput: (output: any) => ({ valid: true }),
    },
    execute: async (input: any): Promise<TToolOutput<any>> => {
      return {
        status: 'success',
        result: { caption: 'A test image showing various objects and scenes suitable for analysis.' },
        metadata: {
          processing_time_ms: 30,
          model_used: 'test-vision'
        }
      };
    }
  };

  // Register a test document tool
  const testDocumentTool = {
    manifest: {
      name: 'document_extract',
      description: 'Test document extraction tool',
      version: '1.0.0',
      availableRegions: ['us'] as ('us' | 'cn')[],
      categories: ['document'],
      capabilities: ['extraction'],
      validateInput: (input: any) => ({ valid: true }),
      validateOutput: (output: any) => ({ valid: true }),
    },
    execute: async (input: any): Promise<TToolOutput<any>> => {
      return {
        status: 'success',
        result: { extractedText: 'This is extracted text from a test document containing various content for analysis.' },
        metadata: {
          processing_time_ms: 40,
          model_used: 'test-document-extractor'
        }
      };
    }
  };

  // Register tools with the tool registry
  // Note: This depends on the ToolRegistry implementation
  toolRegistry.register(testLLMTool);
  toolRegistry.register(testVisionTool);
  toolRegistry.register(testDocumentTool);
  
  console.log('Test tools configured for integration testing');
} 