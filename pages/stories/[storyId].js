import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ViewStory() {
  const router = useRouter();
  const { storyId } = router.query;
  const [user, setUser] = useState(null);
  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    // Fetch story data when storyId is available
    if (storyId) {
      fetchStory(storyId);
    }
  }, [storyId, router]);

  const fetchStory = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/stories/get-story?storyId=${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch story');
      }

      const data = await response.json();
      console.log('Fetched story data:', data.story);
      setStory(data.story);

      // If there's no AI analysis, try to generate it
      if (!data.story.aiAnalysis) {
        requestAnalysis(data.story);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAnalysis = async (storyData) => {
    try {
      setAnalysisLoading(true);
      setAnalysisError('');
      console.log('Requesting AI analysis for story - FULL DATA:', storyData);
      
      // Ensure we're using the correct field names from the story object
      const storyId = storyData._id;  // MongoDB uses _id
      const content = storyData.content;
      const childId = storyData.child;  // Field is named 'child', not 'child_id'
      
      // Additional validation
      if (!storyId) {
        throw new Error('Missing story ID (_id) in story data');
      }
      
      if (!childId) {
        throw new Error('Missing child ID (child) in story data');
      }
      
      if (!content) {
        throw new Error('Missing content in story data');
      }
      
      console.log(`Sending analysis request with id=${storyId}, content length=${content?.length}, child_id=${childId}`);
      
      // Make the request to the direct analysis endpoint
      const response = await fetch('http://localhost:8000/api/direct/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: storyId,
          content: content,
          child_id: childId
        }),
      });
      
      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Analysis request failed with status: ${response.status}. Details: ${errorText}`);
      }

      const data = await response.json();
      console.log('Analysis response:', data);
      
      if (data && data.summary) {
        // Update the story with the analysis data
        await updateStoryWithAnalysis(storyData._id, data);
        
        // Fetch the updated story to refresh the UI
        await fetchStory(storyData._id);
      } else {
        throw new Error('Invalid analysis response received');
      }
    } catch (error) {
      console.error('Error in AI analysis:', error);
      setAnalysisError(`Error: ${error.message}. Check backend logs for details.`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Helper function to update the story in the database
  const updateStoryWithAnalysis = async (storyId, analysisData) => {
    try {
      console.log('Updating story with analysis data:', analysisData);
      
      // Validate storyId
      if (!storyId) {
        throw new Error('Missing storyId for database update');
      }
      
      // Create the aiAnalysis object in the format expected by the API
      const aiAnalysis = {
        strengths: analysisData.strengths || [],
        traits: analysisData.traits || [],
        summary: analysisData.summary || '',
        ai_insights: analysisData.ai_insights || ''
      };
      
      // Ensure storyId is the actual MongoDB ObjectId (_id), not a custom id
      console.log(`Using storyId for update: ${storyId}`);
      
      const updateResponse = await fetch(`/api/stories/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          storyId: storyId,
          aiAnalysis: aiAnalysis
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update story with analysis in database: ${updateResponse.status}. Details: ${errorText}`);
      }
      
      console.log('Story successfully updated with analysis');
      return true;
    } catch (updateErr) {
      console.error("Error updating story in database:", updateErr);
      throw updateErr; // Re-throw to allow the calling function to handle it
    }
  };

  const handleManualAnalysis = () => {
    if (story) {
      console.log('Story object for analysis:', story);
      
      // If story.child is missing, show a more specific error
      if (!story.child) {
        setAnalysisError(`Cannot generate analysis: Story is missing a child ID. Story data: { _id: ${story._id}, child: ${story.child} }`);
        return;
      }
      
      // If story doesn't have an _id, show a specific error
      if (!story._id) {
        setAnalysisError(`Cannot generate analysis: Story is missing an ID. Available fields: ${Object.keys(story).join(', ')}`);
        return;
      }
      
      requestAnalysis(story);
    } else {
      setAnalysisError("Cannot generate analysis: No story data available.");
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{story ? `${story.authorName}'s Story` : 'View Story'} | 2Dots1Line</title>
        <meta name="description" content="View a story and AI insights" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="/styles.css" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold text-indigo-700">2Dots1Line</h1>
          </Link>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="text-sm text-gray-700">
                Hello, <span className="font-medium">{user.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Story Details</h1>
          <button 
            onClick={handleBack}
            className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : story ? (
          <div className="space-y-8">
            {/* Story Details */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{new Date(story.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</h2>
                  <p className="text-sm text-gray-500">By {story.authorName}</p>
                </div>
                <Link href={`/stories/edit/${story._id}`}>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Story
                  </button>
                </Link>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{story.content}</p>
              </div>
            </div>

            {/* AI Insights Section */}
            {story.aiAnalysis ? (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-xl font-medium text-indigo-700 mb-4">AI Insights</h2>
                
                {story.aiAnalysis.strengths && story.aiAnalysis.strengths.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Key Strengths</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {story.aiAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="text-gray-700">{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {story.aiAnalysis.traits && story.aiAnalysis.traits.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Character Traits</h3>
                    <div className="flex flex-wrap gap-2">
                      {story.aiAnalysis.traits.map((trait, index) => (
                        <span key={index} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {story.aiAnalysis.summary && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Summary</h3>
                    <p className="text-gray-700">{story.aiAnalysis.summary}</p>
                  </div>
                )}
                
                {story.aiAnalysis.ai_insights && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Detailed Analysis</h3>
                    <div className="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded-md">
                      <p className="whitespace-pre-line">{story.aiAnalysis.ai_insights}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex flex-col">
                  <p className="text-yellow-700 mb-4">
                    {analysisLoading ? 
                      'Generating AI analysis... This may take up to 60 seconds. Please wait.' : 
                      'AI analysis is not available for this story. This could be because the backend service isn\'t running or AI analysis hasn\'t been generated yet.'}
                  </p>
                  {analysisError && (
                    <p className="text-red-600 mb-3">Error: {analysisError}</p>
                  )}
                  <button 
                    onClick={handleManualAnalysis} 
                    disabled={analysisLoading}
                    className={`self-start px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                      analysisLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {analysisLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Analysis...
                      </span>
                    ) : 'Generate AI Analysis'}
                  </button>
                  
                  {analysisLoading && (
                    <div className="mt-4 bg-blue-50 p-4 rounded-md">
                      <h3 className="text-sm font-medium text-blue-800 mb-2">What's happening?</h3>
                      <p className="text-sm text-blue-700 mb-2">
                        The AI model is analyzing the story and creating insights about cognitive and emotional development.
                        This process usually takes 30-60 seconds depending on server load.
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{width: '100%'}}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <p className="text-yellow-700">Story not found</p>
          </div>
        )}
      </main>
    </div>
  );
} 