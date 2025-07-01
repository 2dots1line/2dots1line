/**
 * V11.1 - A lightweight controller that acts as a proxy to the dialogue-service.
 * It is responsible for forwarding requests and handling network communication,
 * not for instantiating or managing the DialogueAgent itself.
 */

import { Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import type { TApiResponse } from '@2dots1line/shared-types';

export class ConversationController {
  private dialogueServiceClient: AxiosInstance;

  constructor() {
    // The base URL for the dialogue service is loaded from environment variables.
    // This decouples the API gateway from the location of the dialogue service.
    const dialogueServiceUrl = process.env.DIALOGUE_SERVICE_URL || 'http://localhost:3002';
    if (!dialogueServiceUrl) {
      throw new Error('DIALOGUE_SERVICE_URL environment variable is not set.');
    }

    this.dialogueServiceClient = axios.create({
      baseURL: dialogueServiceUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ ConversationController initialized. Proxying requests to ${dialogueServiceUrl}`);
  }

  /**
   * POST /api/v1/conversations/messages
   * Forwards the message from the client to the dialogue-service.
   */
  public postMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // The API gateway's role is to forward the request body and user context.
      // The dialogue-service is responsible for all business logic.
      const response = await this.dialogueServiceClient.post(
        '/api/v1/agent/chat', // The endpoint on the dialogue-service
        {
          ...req.body,
          userId: userId, // Ensure userId is passed to the service
        }
      );

      // Stream the response from the dialogue service back to the original client.
      res.status(response.status).json(response.data);

    } catch (error) {
      console.error('Error proxying request to dialogue-service:', error);
      // If the error is from axios, forward the service's response
      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
    }
  };

  /**
   * POST /api/v1/conversations/upload
   * Forwards a file upload to the dialogue-service.
   */
  public uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const file = req.file as Express.Multer.File;
      
      // Convert file to base64 for API transmission
      const fs = await import('fs');
      const fileBuffer = fs.readFileSync(file.path);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      // Prepare request body for dialogue service
      const requestBody = {
        userId: userId,
        message: req.body.message || 'What can you tell me about this image?',
        conversation_id: req.body.conversation_id,
        file: {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          dataUrl: dataUrl
        },
        context: {
          session_id: req.body.session_id || `session-${Date.now()}`,
          trigger_background_processing: true
        }
      };

      // Forward to dialogue service upload endpoint
      const response = await this.dialogueServiceClient.post(
        '/api/v1/agent/upload',
        requestBody
      );

      // Clean up uploaded file after processing
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      // Return response from dialogue service
      res.status(response.status).json(response.data);

    } catch (error) {
      console.error('Error proxying file upload to dialogue-service:', error);
      
      // Clean up file if upload failed
      if (req.file) {
        try {
          const fs = await import('fs');
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded file after error:', cleanupError);
        }
      }
      
      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ success: false, error: 'File upload failed' });
      }
    }
  };
} 