/**
 * DialogueAgent Test Suite
 * Tests all core functionality including text handling, file uploads, and memory creation
 */

import { DialogueAgent } from '../DialogueAgent';
import { DatabaseService } from '@2dots1line/database';
import { ToolRegistry } from '@2dots1line/tool-registry';
import { 
  TAgentInput, 
  TDialogueAgentInputPayload,
  TIngestionContentItem 
} from '@2dots1line/shared-types';

// Mock all dependencies
jest.mock('@2dots1line/database');
jest.mock('@2dots1line/tool-registry');
jest.mock('../../ingestion/IngestionAnalyst');
jest.mock('../../services/orb-state.manager');
jest.mock('../../tools/llm-tools/llm-chat.tool');
jest.mock('../../tools/vision-tools/vision-caption.tool');
jest.mock('../../tools/document-tools/document-extract.tool');
jest.mock('fs');

describe('DialogueAgent', () => {
  let dialogueAgent: DialogueAgent;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockToolRegistry: jest.Mocked<ToolRegistry>;
  let mockConversationRepo: any;
  let mockMediaRepo: any;
  let mockMemoryRepo: any;
  let mockIngestionAnalyst: any;
  let mockLLMChatTool: any;

  beforeEach(() => {
    // Setup database service mock
    mockDatabaseService = {
      getPrismaClient: jest.fn().mockReturnValue({}),
    } as any;

    // Setup tool registry mock
    mockToolRegistry = {
      executeTool: jest.fn(),
    } as any;

    // Setup repository mocks
    mockConversationRepo = {
      getOrCreateConversation: jest.fn().mockResolvedValue({
        id: 'test-conversation-123',
        user_id: 'test-user',
        session_id: 'test-session',
        title: 'Test Conversation'
      }),
      addMessage: jest.fn().mockResolvedValue({
        id: 'test-message-123',
        conversation_id: 'test-conversation-123',
        role: 'user',
        content: 'Test message'
      }),
      getMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Previous user message',
          created_at: new Date()
        },
        {
          id: 'msg-2', 
          role: 'assistant',
          content: 'Previous AI response',
          created_at: new Date()
        }
      ])
    };

    mockMediaRepo = {
      createMedia: jest.fn().mockResolvedValue({
        id: 'test-media-123',
        user_id: 'test-user',
        type: 'image',
        url: '/test/image.jpg',
        original_name: 'image.jpg'
      })
    };

    mockMemoryRepo = {
      createMemoryUnit: jest.fn().mockResolvedValue({
        muid: 'test-memory-123',
        user_id: 'test-user',
        title: 'Test Memory'
      })
    };

    // Setup LLM tool mock
    mockLLMChatTool = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        text: 'This is a test AI response from Dot.',
        model_used: 'gemini-pro',
        processing_time_ms: 150
      })
    };

    // Setup ingestion analyst mock
    mockIngestionAnalyst = {
      process: jest.fn().mockResolvedValue({
        status: 'success',
        result: {
          memory_units: [{ muid: 'created-memory-456' }]
        }
      })
    };

    // Mock fs.readFileSync for system prompt loading
    const fs = require('fs');
    fs.readFileSync.mockReturnValue(JSON.stringify({
      dotSystemPrompt: 'You are Dot, a test AI companion.'
    }));

    dialogueAgent = new DialogueAgent(mockDatabaseService, mockToolRegistry);

    // Inject mocks (accessing private properties for testing)
    (dialogueAgent as any).conversationRepo = mockConversationRepo;
    (dialogueAgent as any).mediaRepo = mockMediaRepo;
    (dialogueAgent as any).memoryRepo = mockMemoryRepo;
    (dialogueAgent as any).ingestionAnalyst = mockIngestionAnalyst;
    (dialogueAgent as any).llmChatTool = mockLLMChatTool;
  });

  describe('Text Message Processing', () => {
    it('should process a simple text message successfully', async () => {
      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: 'test-user',
        region: 'us',
        request_id: 'test-request-123',
        payload: {
          message_text: 'Hello Dot, how are you today?',
          message_id: 'msg-123',
          client_timestamp: new Date().toISOString(),
          conversation_id: 'test-conversation-123'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          session_id: 'test-session'
        }
      };

      const result = await dialogueAgent.process(input);

      expect(result.status).toBe('success');
      expect(result.result?.response_text).toBe('This is a test AI response from Dot.');
      expect(result.result?.conversation_id).toBe('test-conversation-123');
      expect(result.result?.suggested_actions).toBeDefined();
      
      // Verify conversation repo was called
      expect(mockConversationRepo.getOrCreateConversation).toHaveBeenCalledWith(
        'test-user',
        'test-session',
        'Chat Conversation'
      );
      
      // Verify user message was saved
      expect(mockConversationRepo.addMessage).toHaveBeenCalledWith({
        conversation_id: 'test-conversation-123',
        user_id: 'test-user',
        role: 'user',
        content: 'Hello Dot, how are you today?'
      });

      // Verify AI response was saved
      expect(mockConversationRepo.addMessage).toHaveBeenCalledWith({
        conversation_id: 'test-conversation-123',
        user_id: 'DOT_AI_ID',
        role: 'assistant',
        content: 'This is a test AI response from Dot.'
      });
    });

    it('should create memory for memory-worthy conversations', async () => {
      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: 'test-user',
        region: 'us',
        request_id: 'test-request-456',
        payload: {
          message_text: 'I had a breakthrough today in understanding my goals and what I want to achieve in life. Can you help me reflect on this important moment?',
          message_id: 'msg-456',
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const result = await dialogueAgent.process(input);

      expect(result.status).toBe('success');
      
      // Verify ingestion analyst was called for memory creation
      expect(mockIngestionAnalyst.process).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user',
          payload: expect.objectContaining({
            content_items: expect.arrayContaining([
              expect.objectContaining({
                text_content: expect.stringContaining('breakthrough'),
                source_type: 'conversation_turn'
              })
            ])
          })
        })
      );
    });

    it('should handle LLM processing failures gracefully', async () => {
      mockLLMChatTool.execute.mockResolvedValueOnce({
        success: false,
        error: 'API rate limit exceeded',
        text: '',
        processing_time_ms: 0
      });

      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: 'test-user',
        region: 'us',
        request_id: 'test-request-789',
        payload: {
          message_text: 'Test message',
          message_id: 'msg-789',
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const result = await dialogueAgent.process(input);

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DIALOGUE_PROCESSING_ERROR');
      expect(result.error?.message).toContain('LLM processing failed');
    });
  });

  describe('File Upload Processing', () => {
    beforeEach(() => {
      // Setup vision and document tool mocks
      const visionCaptionTool = (dialogueAgent as any).visionCaptionTool;
      const documentExtractTool = (dialogueAgent as any).documentExtractTool;
      
      visionCaptionTool.execute = jest.fn().mockResolvedValue({
        success: true,
        caption: 'A beautiful landscape photo showing mountains and trees',
        objects_detected: ['mountains', 'trees', 'sky'],
        processing_time_ms: 500
      });

      documentExtractTool.execute = jest.fn().mockResolvedValue({
        success: true,
        extracted_text: 'This is extracted text from the uploaded document containing important personal reflections.',
        document_type: 'application/pdf',
        processing_time_ms: 800
      });
    });

    it('should process image uploads successfully', async () => {
      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: 'test-user',
        region: 'us',
        request_id: 'test-request-img',
        payload: {
          message_text: 'What do you think of this photo I took?',
          message_media: [{
            type: 'image/jpeg',
            url: '/uploads/test-image.jpg'
          }],
          message_id: 'msg-img',
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const result = await dialogueAgent.process(input);

      expect(result.status).toBe('success');
      expect(result.result?.response_text).toContain('This is a test AI response');
      
      // Verify media record was created
      expect(mockMediaRepo.createMedia).toHaveBeenCalledWith({
        user_id: 'test-user',
        type: 'image',
        url: '/uploads/test-image.jpg',
        original_name: 'test-image.jpg',
        mime_type: 'image/jpeg',
        size: 0,
        metadata: { uploaded_via: 'dialogue_agent' }
      });

      // Verify upload memory was created
      expect(mockMemoryRepo.createMemoryUnit).toHaveBeenCalledWith({
        user_id: 'test-user',
        source_type: 'file_upload_event',
        title: 'File Uploaded: test-image.jpg',
        content: 'What do you think of this photo I took?',
        media_ids: ['test-media-123'],
        creation_timestamp: expect.any(String),
        importance_score: 0.7
      });

      // Verify vision tool was called
      const visionTool = (dialogueAgent as any).visionCaptionTool;
      expect(visionTool.execute).toHaveBeenCalledWith({
        image_url: '/uploads/test-image.jpg',
        image_type: 'image/jpeg'
      });
    });

    it('should process document uploads successfully', async () => {
      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: 'test-user',
        region: 'us',
        request_id: 'test-request-doc',
        payload: {
          message_media: [{
            type: 'application/pdf',
            url: '/uploads/test-document.pdf'
          }],
          message_id: 'msg-doc',
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const result = await dialogueAgent.process(input);

      expect(result.status).toBe('success');
      
      // Verify document tool was called
      const documentTool = (dialogueAgent as any).documentExtractTool;
      expect(documentTool.execute).toHaveBeenCalledWith({
        document_url: '/uploads/test-document.pdf',
        document_type: 'application/pdf'
      });

      // Verify content ingestion was triggered
      expect(mockIngestionAnalyst.process).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            content_items: expect.arrayContaining([
              expect.objectContaining({
                text_content: 'This is extracted text from the uploaded document containing important personal reflections.',
                source_type: 'document_content'
              })
            ])
          })
        })
      );
    });

    it('should handle file processing errors gracefully', async () => {
      const visionTool = (dialogueAgent as any).visionCaptionTool;
      visionTool.execute.mockResolvedValueOnce({
        success: false,
        error: 'Image processing failed',
        caption: '',
        processing_time_ms: 100
      });

      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: 'test-user',
        region: 'us',
        request_id: 'test-request-fail',
        payload: {
          message_media: [{
            type: 'image/jpeg',
            url: '/uploads/corrupted-image.jpg'
          }],
          message_id: 'msg-fail',
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const result = await dialogueAgent.process(input);

      expect(result.status).toBe('success'); // Should still succeed with fallback response
      expect(result.result?.response_text).toContain('analyzing');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing input gracefully', async () => {
      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: 'test-user',
        region: 'us',
        request_id: 'test-request-empty',
        payload: {
          message_id: 'msg-empty',
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const result = await dialogueAgent.process(input);

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DIALOGUE_PROCESSING_ERROR');
      expect(result.error?.message).toContain('No message text or media provided');
    });

    it('should handle database errors gracefully', async () => {
      mockConversationRepo.getOrCreateConversation.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const input: TAgentInput<TDialogueAgentInputPayload> = {
        user_id: 'test-user',
        region: 'us',
        request_id: 'test-request-db-fail',
        payload: {
          message_text: 'Test message',
          message_id: 'msg-db-fail',
          client_timestamp: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const result = await dialogueAgent.process(input);

      expect(result.status).toBe('error');
      expect(result.error?.message).toContain('Database connection failed');
    });
  });

  describe('Memory Worthiness Assessment', () => {
    it('should identify memory-worthy conversations', () => {
      const assessMemoryWorthiness = (dialogueAgent as any).assessMemoryWorthiness;
      
      // Long, meaningful conversation
      expect(assessMemoryWorthiness(
        'I had a major breakthrough in understanding my leadership style today. It really changed how I think about my goals.',
        'That sounds like a significant insight! Can you tell me more about what specifically led to this breakthrough?'
      )).toBe(true);

      // Contains questions
      expect(assessMemoryWorthiness(
        'How do I know if I\'m making progress?',
        'Great question! Progress can be measured in many ways...'
      )).toBe(true);

      // Contains growth keywords
      expect(assessMemoryWorthiness(
        'I want to learn more about emotional intelligence.',
        'That\'s a wonderful goal to work on.'
      )).toBe(true);
    });

    it('should identify non-memory-worthy conversations', () => {
      const assessMemoryWorthiness = (dialogueAgent as any).assessMemoryWorthiness;
      
      // Short, simple exchanges
      expect(assessMemoryWorthiness(
        'Hi',
        'Hello!'
      )).toBe(false);

      // Brief acknowledgments
      expect(assessMemoryWorthiness(
        'Thanks',
        'You\'re welcome'
      )).toBe(false);
    });
  });

  describe('Configuration Loading', () => {
    it('should load system prompt from configuration file', () => {
      expect((dialogueAgent as any).dotSystemPrompt).toBe('You are Dot, a test AI companion.');
    });

    it('should use default prompt when config loading fails', () => {
      const fs = require('fs');
      fs.readFileSync.mockImplementationOnce(() => {
        throw new Error('File not found');
      });

      const newAgent = new DialogueAgent(mockDatabaseService, mockToolRegistry);
      expect((newAgent as any).dotSystemPrompt).toContain('You are Dot, an AI companion');
    });
  });
}); 