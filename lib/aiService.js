// AI Service module to interact with the FastAPI backend

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

// Analyze a story using the AI service
export async function analyzeStory(storyData) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/stories/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: storyData.id,
        content: storyData.content,
        child_id: storyData.childId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to analyze story');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing story:', error);
    throw error;
  }
}

// Tokenize a story using the AI service
export async function tokenizeStory(storyData) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/stories/tokenize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: storyData.id,
        content: storyData.content,
        child_id: storyData.childId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to tokenize story');
    }

    return await response.json();
  } catch (error) {
    console.error('Error tokenizing story:', error);
    throw error;
  }
}

// Find similar stories to a given story
export async function findSimilarStories(storyId) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/stories/similar/${storyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to find similar stories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error finding similar stories:', error);
    throw error;
  }
}

// Health check for the AI service
export async function checkAIServiceHealth() {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { status: 'unavailable' };
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking AI service health:', error);
    return { status: 'unavailable', error: error.message };
  }
} 