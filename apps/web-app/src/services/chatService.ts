/**
 * Chat Service - Frontend API client for DialogueAgent integration
 * Connects ChatModal to API Gateway endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.API_GATEWAY_HOST_PORT || '3001'}`;

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  conversation_id?: string;
}

export interface SendMessageRequest {
  message: string;
  conversation_id?: string;
  context?: {
    session_id?: string;
    trigger_background_processing?: boolean;
    user_preferences?: any;
  };
}

export interface SendMessageResponse {
  success: boolean;
  data?: {
    message_id: string;
    response: string;
    conversation_id: string;
    timestamp: string;
    metadata?: {
      response_time_ms?: number;
      model_used?: string;
      suggested_actions?: any[];
      proactive_insight?: any;
    };
  };
  error?: string;
  details?: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  conversation_id: string;
  total_count: number;
}

class ChatService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * Send a text message to the DialogueAgent via API Gateway
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Upload a file for analysis by DialogueAgent
   */
  async uploadFile(
    file: File, 
    message?: string, 
    conversation_id?: string
  ): Promise<SendMessageResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (message) formData.append('message', message);
      if (conversation_id) formData.append('conversation_id', conversation_id);

      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for the authenticated user
   */
  async getHistory(
    conversation_id?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatHistory> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(conversation_id && { conversation_id }),
      });

      const response = await fetch(`${API_BASE_URL}/api/chat/history?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  /**
   * Health check for chat functionality
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error checking chat health:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService(); 