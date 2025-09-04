/**
 * Chat Service - Frontend API client for DialogueAgent integration
 * V9.7 - Updated for consolidated API Gateway endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  conversation_id?: string;
  attachment?: {
    file: File;
    type: 'image' | 'document';
  };
}

export interface SendMessageRequest {
  message: string;
  conversation_id?: string;
  source_card_id?: string;
  context?: {
    session_id?: string;
    trigger_background_processing?: boolean;
    user_preferences?: any;
  };
}

export interface SendMessageResponse {
  success: boolean;
  conversation_id?: string;
  session_id?: string; // NEW: Session ID from backend
  conversation_title?: string; // NEW: Conversation title from backend
  response_text?: string;
  message_id?: string;
  timestamp?: string;
  metadata?: {
    processing_time_ms?: number;
    source_card_id?: string;
  };
  file_info?: {
    filename: string;
    size: number;
    mimetype: string;
  };
  error?: string;
  details?: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  conversation_id: string;
  total_count: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  status: 'active' | 'ended';
}

export interface SessionSummary {
  session_id: string;
  created_at: Date;
  last_active_at: Date;
  most_recent_conversation_title: string;
  conversation_count: number;
  conversations: ConversationSummary[];
}

export interface ConversationHistoryResponse {
  conversations: ConversationSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface ConversationResponse {
  conversation: {
    id: string;
    title: string | null;
    status: string;
    start_time: Date;
    ended_at: Date | null;
    messageCount: number;
  };
  messages: ChatMessage[];
}

class ChatService {
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Send a text message to the DialogueAgent via API Gateway
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/conversations/messages`, {
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

      const response = await fetch(`${API_BASE_URL}/api/v1/conversations/upload`, {
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

  /**
   * Get conversation history for the authenticated user
   */
  async getConversationHistory(
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationHistoryResponse> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/conversations?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(conversationId: string): Promise<ConversationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/conversations/${conversationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  /**
   * End a conversation explicitly
   */
  async endConversation(conversationId: string): Promise<{ success: boolean; conversation_id: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data.data;
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  }

  /**
   * Check for proactive messages from timeout processing
   * This method checks if there are any new messages in the current conversation
   * that were added by the backend (e.g., after ingestion processing)
   */
  async checkForProactiveMessages(conversationId: string, lastMessageTimestamp: Date): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/conversations/${conversationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Filter messages that are newer than the last message timestamp
      const newMessages = data.data.messages.filter((msg: ChatMessage) => 
        new Date(msg.timestamp) > lastMessageTimestamp
      );

      return newMessages;
    } catch (error) {
      console.error('Error checking for proactive messages:', error);
      throw error;
    }
  }

  /**
   * Get user sessions for the authenticated user
   */
  async getSessions(limit: number = 50): Promise<SessionSummary[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/sessions?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data.data.sessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  /**
   * Start a new chat (prepares for new chat, no session created yet)
   */
  async startNewChat(): Promise<{ session_id: string | null; created_at: string; last_active_at: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/conversations/new-chat`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data.data;
    } catch (error) {
      console.error('Error starting new chat:', error);
      throw error;
    }
  }

  /**
   * Get a specific session with its conversations
   */
  async getSession(sessionId: string): Promise<SessionSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService(); 