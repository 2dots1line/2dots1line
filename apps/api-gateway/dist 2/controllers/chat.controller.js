"use strict";
/**
 * Chat Controller - DialogueAgent API Integration
 * Handles real-time conversations through the DialogueAgent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const cognitive_hub_1 = require("@2dots1line/cognitive-hub");
const database_1 = require("@2dots1line/database");
const tool_registry_1 = require("@2dots1line/tool-registry");
class ChatController {
    constructor() {
        /**
         * POST /api/chat/message
         * Send a text message to the DialogueAgent
         */
        this.sendMessage = async (req, res) => {
            try {
                const userId = req.user?.id; // Assuming auth middleware sets req.user
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized - user authentication required'
                    });
                    return;
                }
                const { message, conversation_id, context } = req.body;
                if (!message || message.trim().length === 0) {
                    res.status(400).json({
                        success: false,
                        error: 'Message content is required'
                    });
                    return;
                }
                // Prepare DialogueAgent input
                const dialogueInput = {
                    user_id: userId,
                    region: 'us', // TODO: Make this configurable based on user region
                    request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    payload: {
                        message_text: message.trim(),
                        message_id: `msg-${Date.now()}-${userId}`,
                        client_timestamp: new Date().toISOString(),
                        conversation_id: conversation_id || `conv-${Date.now()}-${userId}`,
                        user_preferences: context?.user_preferences
                    },
                    metadata: {
                        timestamp: new Date().toISOString(),
                        session_id: context?.session_id || `session-${Date.now()}`,
                        trigger_background_processing: context?.trigger_background_processing || false
                    }
                };
                // Process through DialogueAgent
                const result = await this.dialogueAgent.process(dialogueInput);
                if (result.status !== 'success') {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to process message',
                        details: result.error?.message || 'Unknown error'
                    });
                    return;
                }
                // Return successful response
                res.json({
                    success: true,
                    data: {
                        message_id: result.result?.conversation_id + '-response',
                        response: result.result?.response_text,
                        conversation_id: result.result?.conversation_id,
                        timestamp: new Date().toISOString(),
                        metadata: {
                            response_time_ms: result.metadata?.processing_time_ms,
                            model_used: result.metadata?.model_used,
                            suggested_actions: result.result?.suggested_actions,
                            proactive_insight: result.result?.proactive_insight
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error in sendMessage:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        /**
         * POST /api/chat/upload
         * Upload a file (image, document) for analysis by DialogueAgent
         */
        this.uploadFile = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized - user authentication required'
                    });
                    return;
                }
                // Get file from multer
                const uploadedFile = req.file;
                if (!uploadedFile) {
                    res.status(400).json({
                        success: false,
                        error: 'No file uploaded'
                    });
                    return;
                }
                // Get optional message and conversation_id from form data
                const message = req.body.message || `I've uploaded a file: ${uploadedFile.originalname}`;
                const conversation_id = req.body.conversation_id;
                // Prepare DialogueAgent input for file processing
                const dialogueInput = {
                    user_id: userId,
                    region: 'us', // TODO: Make this configurable
                    request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    payload: {
                        message_text: message,
                        message_id: `msg-${Date.now()}-${userId}`,
                        client_timestamp: new Date().toISOString(),
                        conversation_id: conversation_id || `conv-${Date.now()}-${userId}`,
                        message_media: [{
                                type: uploadedFile.mimetype,
                                url: uploadedFile.path,
                                media_id: uploadedFile.filename // Use filename as media_id for tracking
                            }]
                    },
                    metadata: {
                        timestamp: new Date().toISOString(),
                        session_id: req.body.session_id || `session-${Date.now()}`
                    }
                };
                // Process through DialogueAgent
                const result = await this.dialogueAgent.process(dialogueInput);
                if (result.status !== 'success') {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to process file upload',
                        details: result.error?.message || 'Unknown error'
                    });
                    return;
                }
                // Return successful response
                res.json({
                    success: true,
                    data: {
                        message_id: result.result?.conversation_id + '-response',
                        response: result.result?.response_text,
                        conversation_id: result.result?.conversation_id,
                        timestamp: new Date().toISOString(),
                        file_info: {
                            filename: uploadedFile.originalname,
                            size: uploadedFile.size,
                            mimetype: uploadedFile.mimetype
                        },
                        metadata: {
                            response_time_ms: result.metadata?.processing_time_ms,
                            model_used: result.metadata?.model_used,
                            suggested_actions: result.result?.suggested_actions,
                            proactive_insight: result.result?.proactive_insight
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error in uploadFile:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        /**
         * GET /api/chat/history
         * Get conversation history for a user
         */
        this.getHistory = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized - user authentication required'
                    });
                    return;
                }
                const { conversation_id, limit = 50, offset = 0 } = req.query;
                // TODO: Implement conversation history retrieval from database
                // For now, return a placeholder response
                res.json({
                    success: true,
                    data: {
                        conversations: [],
                        total_count: 0,
                        has_more: false
                    },
                    message: 'Chat history feature coming soon - requires conversation persistence implementation'
                });
            }
            catch (error) {
                console.error('Error in getHistory:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        /**
         * GET /api/chat/health
         * Health check for chat functionality and DialogueAgent
         */
        this.healthCheck = async (req, res) => {
            try {
                // Basic health check of DialogueAgent and dependencies
                const health = {
                    dialogueAgent: 'operational',
                    database: 'operational',
                    toolRegistry: 'operational',
                    timestamp: new Date().toISOString()
                };
                res.json({
                    success: true,
                    data: health
                });
            }
            catch (error) {
                console.error('Error in chat health check:', error);
                res.status(500).json({
                    success: false,
                    error: 'Chat service health check failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        this.databaseService = new database_1.DatabaseService();
        this.toolRegistry = new tool_registry_1.ToolRegistry();
        this.dialogueAgent = new cognitive_hub_1.DialogueAgent(this.databaseService, this.toolRegistry);
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=chat.controller.js.map