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
    
    // In development, use dev-token for testing
    const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
    
    if (isDevelopment) {
      headers['Authorization'] = 'Bearer dev-token';
    } else {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  /**
   * Send a text message with streaming response to the DialogueAgent via API Gateway
   * Uses Server-Sent Events for real-time response delivery
   */
  async sendMessageStreaming(
    request: SendMessageRequest,
    onChunk: (chunk: string) => void,
    onMetadata?: (metadata: any) => void,
    onComplete?: (response: SendMessageResponse) => void,
    onError?: (error: Error) => void,
    messageId?: string,
    onDecision?: (decision: 'respond_directly' | 'query_memory') => void
  ): Promise<void> {
    console.log('🌊 ChatService.sendMessageStreaming - Starting streaming request:', {
      url: `${API_BASE_URL}/api/v1/conversations/messages/stream`,
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: request
    });

    try {
      console.log('🌊 ChatService: Making fetch request to streaming endpoint');
      const requestBody = {
        ...request,
        message_id: messageId
      };
      
      console.log('🌊 ChatService: Request body with message_id:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/conversations/messages/stream`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log('🌊 ChatService: Received response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🌊 ChatService: Response not OK:', errorData);
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      console.log('🌊 ChatService: Starting to read stream...');

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🌊 ChatService.sendMessageStreaming - Stream completed');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log('🌊 ChatService: Received raw chunk:', chunk);
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            console.log('🌊 ChatService: Processing line:', line);
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('🌊 ChatService: Parsed SSE data:', data);
                
                switch (data.type) {
                  case 'connected':
                    console.log('🌊 ChatService.sendMessageStreaming - Connected:', data.message);
                    break;
                    
                  case 'conversation_metadata':
                    console.log('🌊 ChatService.sendMessageStreaming - Conversation metadata:', data);
                    onMetadata?.(data);
                    break;
                    
                  case 'response_chunk':
                    console.log('🌊 ChatService.sendMessageStreaming - Received chunk:', data.content);
                    
                    // Check if this is a decision chunk
                    if (data.content.startsWith('DECISION:')) {
                      const decision = data.content.substring(9) as 'respond_directly' | 'query_memory';
                      console.log('🌊 ChatService.sendMessageStreaming - Decision detected:', decision);
                      onDecision?.(decision);
                    } else {
                      // Regular content chunk
                      onChunk(data.content);
                    }
                    break;
                    
                  case 'response_complete':
                    console.log('🌊 ChatService.sendMessageStreaming - Response complete:', data);
                    onComplete?.({
                      success: true,
                      conversation_id: data.conversation_id,
                      session_id: data.session_id,
                      conversation_title: data.conversation_title,
                      response_text: data.response_text || '', // Use the response text from backend
                      message_id: data.message_id,
                      timestamp: data.timestamp,
                      metadata: data.metadata
                    });
                    break;
                    
                  case 'stream_end':
                    console.log('🌊 ChatService.sendMessageStreaming - Stream ended');
                    return;
                    
                  case 'error':
                    console.error('🌊 ChatService.sendMessageStreaming - Stream error:', data.error);
                    onError?.(new Error(data.error?.message || 'Streaming error'));
                    return;
                    
                  default:
                    console.log('🌊 ChatService.sendMessageStreaming - Unknown event type:', data.type);
                }
              } catch (parseError) {
                console.warn('🌊 ChatService.sendMessageStreaming - Failed to parse SSE data:', line, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('🌊 ChatService.sendMessageStreaming - Error:', error);
      onError?.(error as Error);
    }
  }

  /**
   * Send a text message to the DialogueAgent via API Gateway
   * Includes retry logic for temporary connection issues
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    // DEBUG: Log the request being sent
    console.log('🔍 ChatService.sendMessage - Request:', {
      url: `${API_BASE_URL}/api/v1/conversations/messages`,
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: request
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/conversations/messages`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(request),
        });

        const data = await response.json();

        // DEBUG: Log the response received
        console.log('🔍 ChatService.sendMessage - Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });

        if (!response.ok) {
          // If it's a 400 error and we have retries left, wait and retry
          if (response.status === 400 && attempt < maxRetries) {
            console.warn(`Message send attempt ${attempt} failed with 400, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue;
          }
          throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
      } catch (error) {
        console.error(`Error sending message (attempt ${attempt}/${maxRetries}):`, error);
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error('Failed to send message after all retry attempts');
  }

  /**
   * Upload a file for analysis by DialogueAgent
   */
  async uploadFile(
    file: File, 
    message?: string, 
    conversation_id?: string,
    session_id?: string
  ): Promise<SendMessageResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (message) formData.append('message', message);
      if (conversation_id) formData.append('conversation_id', conversation_id);
      if (session_id) formData.append('session_id', session_id);

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
        const errorMessage = data.error?.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Upload failed with response:', { status: response.status, data });
        throw new Error(errorMessage);
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