/**
 * DialogueAgent Test Suite
 * Tests the core conversation functionality and agent integration
 */

import { DialogueAgent } from './DialogueAgent';
import { DatabaseService } from '@2dots1line/database';
import { ToolRegistry } from '@2dots1line/tool-registry';
import { TDialogueAgentInputPayload, TDialogueAgentResult } from '@2dots1line/shared-types';

describe('DialogueAgent', () => {
  let dialogueAgent: DialogueAgent;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockToolRegistry: jest.Mocked<ToolRegistry>;

  beforeEach(() => {
    // Setup main mocks
    mockDatabaseService = {
      getPrismaClient: jest.fn(),
      withTransaction: jest.fn()
    } as any;
    
    mockToolRegistry = {
      register: jest.fn(),
      executeTool: jest.fn(),
      findTools: jest.fn(),
      getTool: jest.fn()
    } as any;

    // Create DialogueAgent instance
    dialogueAgent = new DialogueAgent(mockDatabaseService, mockToolRegistry);

    console.log('=== DialogueAgent Test Setup ===');
    console.log('Configuration loaded:', {
      maxContextLength: (dialogueAgent as any).config.maxContextLength,
      retrievalLimit: (dialogueAgent as any).config.retrievalLimit,
      systemPrompt: (dialogueAgent as any).config.systemPrompt.substring(0, 50) + '...'
    });
  });

  describe('Text Message Processing', () => {
    it('should process a simple text message successfully', async () => {
      // Arrange
      const input: TDialogueAgentInputPayload = {
        type: 'text_message',
        user_id: 'test-user-123',
        message: 'Hello, how are you today?',
        context: {
          conversation_id: 'conv-123',
          session_id: 'session-123'
        }
      };

      // Mock tool registry responses
      mockToolRegistry.executeTool
        .mockResolvedValueOnce({
          // Mock RetrievalPlanner response
          success: true,
          data: {
            memory_units: [],
            concepts: [],
            chunks: [],
            formatted_context: '',
            total_retrieved: 0,
            sources_used: []
          }
        })
        .mockResolvedValueOnce({
          // Mock LLM response
          success: true,
          data: {
            response: 'Hello! I\'m doing well, thank you for asking. How can I help you today?',
            model_used: 'gemini-pro',
            tokens_used: 15
          }
        });

      // Act
      const result = await dialogueAgent.process(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('text_response');
      expect(result.data.response).toContain('Hello');
      expect(result.data.conversation_id).toBe('conv-123');
      expect(result.data.ai_response_id).toBeDefined();

      // Verify tool calls
      expect(mockToolRegistry.executeTool).toHaveBeenCalledTimes(2);
      
      // First call should be to RetrievalPlanner
      expect(mockToolRegistry.executeTool).toHaveBeenNthCalledWith(1, 
        'retrieval_planner.getRelevantMemories',
        expect.objectContaining({
          query: 'Hello, how are you today?',
          user_id: 'test-user-123'
        })
      );

      // Second call should be to LLM
      expect(mockToolRegistry.executeTool).toHaveBeenNthCalledWith(2,
        'ai.chat',
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('You are Dot')
            }),
            expect.objectContaining({
              role: 'user',
              content: 'Hello, how are you today?'
            })
          ])
        })
      );

      console.log('✅ Text message processing test passed');
    });

    it('should handle memory context retrieval and formatting', async () => {
      // Arrange
      const input: TDialogueAgentInputPayload = {
        type: 'text_message',
        user_id: 'test-user-123',
        message: 'What did we discuss about my goals yesterday?',
        context: {
          conversation_id: 'conv-123',
          session_id: 'session-123'
        }
      };

      // Mock RetrievalPlanner with memory context
      mockToolRegistry.executeTool
        .mockResolvedValueOnce({
          success: true,
          data: {
            memory_units: [
              {
                id: 'mem-1',
                title: 'Career Goals Discussion',
                content: 'User discussed wanting to become a software engineer',
                importance_score: 0.8,
                creation_ts: new Date('2024-11-28')
              }
            ],
            concepts: ['goals', 'career', 'software_engineering'],
            chunks: [],
            formatted_context: 'Previous memory: Career goals discussion',
            total_retrieved: 1,
            sources_used: ['vector', 'graph']
          }
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            response: 'Based on our previous conversation, you mentioned wanting to become a software engineer...',
            model_used: 'gemini-pro',
            tokens_used: 45
          }
        });

      // Act
      const result = await dialogueAgent.process(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.response).toContain('previous conversation');
      expect(result.data.metadata?.memory_context_used).toBe(true);
      expect(result.data.metadata?.memories_retrieved).toBe(1);

      console.log('✅ Memory context retrieval test passed');
    });
  });

  describe('Error Handling', () => {
    it('should handle retrieval planner errors gracefully', async () => {
      // Arrange
      const input: TDialogueAgentInputPayload = {
        type: 'text_message',
        user_id: 'test-user-123',
        message: 'Test message',
        context: {}
      };

      // Mock RetrievalPlanner failure
      mockToolRegistry.executeTool
        .mockRejectedValueOnce(new Error('RetrievalPlanner service unavailable'));

      // Act
      const result = await dialogueAgent.process(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('RETRIEVAL_ERROR');
      expect(result.error?.message).toContain('RetrievalPlanner service unavailable');

      console.log('✅ Error handling test passed');
    });
  });

  describe('File Upload Processing', () => {
    it('should process image upload successfully', async () => {
      // Arrange
      const input: TDialogueAgentInputPayload = {
        type: 'file_upload',
        user_id: 'test-user-123',
        file_data: {
          filename: 'sunset.jpg',
          content_type: 'image/jpeg',
          size_bytes: 1024000,
          file_path: '/temp/sunset.jpg'
        },
        message: 'What do you see in this image?',
        context: {
          conversation_id: 'conv-123'
        }
      };

      // Mock vision analysis
      mockToolRegistry.executeTool
        .mockResolvedValueOnce({
          success: true,
          data: {
            description: 'A beautiful sunset over the ocean with vibrant orange and pink colors',
            objects: ['ocean', 'sunset', 'clouds'],
            emotions: ['peaceful', 'serene'],
            colors: ['orange', 'pink', 'blue']
          }
        });

      // Act
      const result = await dialogueAgent.process(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('file_analysis_response');
      expect(result.data.analysis).toBeDefined();
      expect(result.data.analysis?.description).toContain('sunset');
      expect(result.data.file_processed).toBe(true);

      console.log('✅ Image upload processing test passed');
    });
  });

  describe('Agent Integration', () => {
    it('should demonstrate full agent ecosystem integration', async () => {
      // This test shows how DialogueAgent integrates with other agents
      // through the ToolRegistry pattern

      const input: TDialogueAgentInputPayload = {
        type: 'text_message',
        user_id: 'test-user-123',
        message: 'I just completed my daily meditation practice and feel much more centered.',
        context: {
          conversation_id: 'conv-123',
          trigger_background_processing: true
        }
      };

      // Mock the full pipeline: RetrievalPlanner -> LLM -> Background processing
      mockToolRegistry.executeTool
        .mockResolvedValueOnce({
          // RetrievalPlanner response
          success: true,
          data: {
            memory_units: [],
            concepts: ['meditation', 'mindfulness'],
            formatted_context: '',
            total_retrieved: 0,
            sources_used: ['vector']
          }
        })
        .mockResolvedValueOnce({
          // LLM response
          success: true,
          data: {
            response: 'That\'s wonderful! Meditation is such a powerful practice for mental clarity...',
            model_used: 'gemini-pro',
            tokens_used: 32
          }
        })
        .mockResolvedValueOnce({
          // IngestionAnalyst background processing
          success: true,
          data: {
            raw_data_id: 'raw-123',
            processing_status: 'queued',
            growth_dimensions_detected: ['self_know'],
            concepts_extracted: ['meditation', 'mindfulness', 'centering']
          }
        });

      // Act
      const result = await dialogueAgent.process(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.response).toContain('wonderful');
      expect(result.data.metadata?.background_processing_triggered).toBe(true);

      // Verify the complete agent interaction chain
      expect(mockToolRegistry.executeTool).toHaveBeenCalledTimes(3);

      console.log('✅ Full agent ecosystem integration test passed');
      console.log('DialogueAgent successfully orchestrated:');
      console.log('  1. Memory retrieval via RetrievalPlanner');
      console.log('  2. LLM response generation');
      console.log('  3. Background processing via IngestionAnalyst');
    });
  });
}); 