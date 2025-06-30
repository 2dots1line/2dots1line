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
   * Note: This requires the dialogue-service to have a file-handling endpoint.
   */
  public uploadFile = async (req: Request, res: Response): Promise<void> => {
    // This method would need to be implemented to handle multipart/form-data
    // proxying to the dialogue service. For now, it's a placeholder.
    res.status(501).json({ message: 'File upload proxy not yet implemented.' });
  };
} 