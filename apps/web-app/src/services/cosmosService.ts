import { TApiResponse, UserGraphProjection } from '@2dots1line/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

class CosmosService {
  async getGraphProjection(): Promise<TApiResponse<UserGraphProjection>> {
    try {
      // Use actual user token
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/v1/graph-projection/latest`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            code: errorData.code || 'FETCH_ERROR',
            message: errorData.message || 'Failed to fetch graph projection',
          },
        };
      }

      const data = await response.json();
      // Extract only the projectionData for the frontend
      return { success: true, data: data.data.projectionData };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CLIENT_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        },
      };
    }
  }
}

export const cosmosService = new CosmosService();