"use strict";
/**
 * Chat Routes - DialogueAgent API Integration
 * Provides real-time conversation endpoints using DialogueAgent
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
const chatController = new chat_controller_1.ChatController();
/**
 * POST /api/chat/message
 * Send a text message to DialogueAgent for conversation
 * Requires authentication middleware
 */
router.post('/message', auth_middleware_1.authMiddleware, chatController.sendMessage);
/**
 * POST /api/chat/upload
 * Upload a file (image, document) for analysis by DialogueAgent
 * Requires authentication and file upload middleware (multer)
 */
router.post('/upload', auth_middleware_1.authMiddleware, upload_middleware_1.uploadSingle, upload_middleware_1.handleUploadError, chatController.uploadFile);
/**
 * GET /api/chat/history
 * Get conversation history for the authenticated user
 * Optional query parameters: conversation_id, limit, offset
 */
router.get('/history', auth_middleware_1.authMiddleware, chatController.getHistory);
/**
 * GET /api/chat/health
 * Health check for chat functionality and DialogueAgent availability
 * Public endpoint for monitoring
 */
router.get('/health', chatController.healthCheck);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map