/**
 * Chat Controller Test Suite
 * Tests the DialogueAgent API integration
 */

import { Request, Response } from 'express';
import { ChatController } from '../chat.controller';

// Mock the dependencies
jest.mock('@2dots1line/cognitive-hub');
jest.mock('@2dots1line/database');
jest.mock('@2dots1line/tool-registry');

describe('ChatController', () => {
  let chatController: ChatController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Setup response mocks
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    // Setup request mock
    mockRequest = {
      user: { id: 'test-user-123' },
      body: {}
    };

    chatController = new ChatController();
  });

  describe('sendMessage', () => {
    it('should require user authentication', async () => {
      mockRequest.user = undefined;

      await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized - user authentication required'
      });
    });

    it('should require message content', async () => {
      mockRequest.body = { message: '' };

      await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Message content is required'
      });
    });

    it('should process valid message request', async () => {
      mockRequest.body = {
        message: 'Hello, how are you?',
        conversation_id: 'test-conv-123'
      };

      // Mock successful DialogueAgent response
      const mockDialogueAgent = require('@2dots1line/cognitive-hub').DialogueAgent;
      mockDialogueAgent.prototype.process = jest.fn().mockResolvedValue({
        status: 'success',
        result: {
          response_text: 'I am doing well, thank you for asking!',
          conversation_id: 'test-conv-123',
          suggested_actions: []
        },
        metadata: {
          processing_time_ms: 150
        }
      });

      await chatController.sendMessage(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          response: 'I am doing well, thank you for asking!',
          conversation_id: 'test-conv-123',
          metadata: expect.objectContaining({
            response_time_ms: 150
          })
        })
      });
    });
  });

  describe('healthCheck', () => {
    it('should return operational status', async () => {
      await chatController.healthCheck(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          dialogueAgent: 'operational',
          database: 'operational',
          toolRegistry: 'operational',
          timestamp: expect.any(String)
        })
      });
    });
  });

  describe('getHistory', () => {
    it('should require user authentication', async () => {
      mockRequest.user = undefined;

      await chatController.getHistory(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized - user authentication required'
      });
    });

    it('should return placeholder response for now', async () => {
      mockRequest.query = { limit: '10' };

      await chatController.getHistory(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          conversations: [],
          total_count: 0,
          has_more: false
        },
        message: 'Chat history feature coming soon - requires conversation persistence implementation'
      });
    });
  });
}); 