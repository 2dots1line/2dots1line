import axios from 'axios';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.API_GATEWAY_HOST_PORT || '3001'}`;

export interface UpdateUserPreferencesRequest {
  name?: string;
  profileImageUrl?: string;
  preferences?: Record<string, unknown>;
}

export interface UpdateUserPreferencesResponse {
  success: boolean;
  data?: {
    user_id: string;
    email: string;
    name?: string;
    profile_picture_url?: string;
    preferences?: Record<string, unknown>;
    created_at: string;
  };
  error?: string;
}

class UserPreferencesService {
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
   * Update user preferences
   */
  async updateUserPreferences(userId: string, updates: UpdateUserPreferencesRequest): Promise<UpdateUserPreferencesResponse> {
    console.log('userPreferencesService.updateUserPreferences - Starting API call with updates:', updates);
    
    try {
      const headers = this.getAuthHeaders();
      console.log('userPreferencesService.updateUserPreferences - Making request to:', `${API_BASE_URL}/api/v1/users/${userId}`);
      console.log('userPreferencesService.updateUserPreferences - Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'none' });

      const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      console.log('userPreferencesService.updateUserPreferences - Raw API response:', { 
        ok: response.ok, 
        status: response.status, 
        success: data.success 
      });

      if (!response.ok) {
        console.error('userPreferencesService.updateUserPreferences - API error:', data.error);
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('userPreferencesService.updateUserPreferences - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user preferences',
      };
    }
  }
}

export const userPreferencesService = new UserPreferencesService();
