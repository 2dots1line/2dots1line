/**
 * Chat Controller - DialogueAgent API Integration
 * Handles real-time conversations through the DialogueAgent
 */
import { Request, Response } from 'express';
export interface ChatMessageRequest {
    message: string;
    conversation_id?: string;
    context?: {
        session_id?: string;
        trigger_background_processing?: boolean;
        user_preferences?: any;
    };
}
export interface FileUploadRequest {
    message?: string;
    file: {
        filename: string;
        mimetype: string;
        size: number;
        path: string;
    };
    conversation_id?: string;
    context?: any;
}
export interface ChatHistoryRequest {
    conversation_id?: string;
    limit?: number;
    offset?: number;
}
export declare class ChatController {
    private dialogueAgent;
    private databaseService;
    private toolRegistry;
    constructor();
    /**
     * POST /api/chat/message
     * Send a text message to the DialogueAgent
     */
    sendMessage: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/chat/upload
     * Upload a file (image, document) for analysis by DialogueAgent
     */
    uploadFile: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/chat/history
     * Get conversation history for a user
     */
    getHistory: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/chat/health
     * Health check for chat functionality and DialogueAgent
     */
    healthCheck: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=chat.controller.d.ts.map