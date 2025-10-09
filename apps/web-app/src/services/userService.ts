/**
 * User Service - Frontend API client for user data
 * V11.0 - Fetch user data including proactive greetings
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface UserData {
  user_id: string;
  next_conversation_context_package?: {
    proactive_greeting?: string;
    suggested_initial_focus?: string;
    unresolved_topics_for_next_convo?: Array<{
      topic: string;
      summary_of_unresolution: string;
      suggested_question: string;
    }>;
  };
  memory_profile?: any;
}

export interface GetUserResponse {
  success: boolean;
  data?: UserData;
  error?: string;
}

class UserService {
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Always use the actual user's token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Get user data including proactive greeting
   */
  async getUserData(userId: string): Promise<GetUserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  /**
   * Get proactive greeting for the user from the most recent processed conversation
   */
  async getProactiveGreeting(userId: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/conversations/proactive-greeting/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        // If no greeting found, return null (not an error)
        if (response.status === 404) {
          return null;
        }
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const proactiveGreeting = data.data?.proactive_greeting;
      
      // Return the greeting only if it exists and is not empty (after trimming whitespace)
      if (data.success && proactiveGreeting && proactiveGreeting.trim().length > 0) {
        return proactiveGreeting.trim();
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching proactive greeting:', error);
      return null;
    }
  }
}

export const userService = new UserService();
