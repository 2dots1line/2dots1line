import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function TestAI() {
  const [question, setQuestion] = useState('How many bones does a human have?');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseTime, setResponseTime] = useState(null);
  const [responseDetails, setResponseDetails] = useState(null);

  const handleAsk = async () => {
    setIsLoading(true);
    setError('');
    setAnswer('');
    setResponseTime(null);
    setResponseDetails(null);

    console.log(`Sending question: ${question}`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:8000/api/test/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      console.log('Response received:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const backendTime = data.elapsed_time_seconds ? data.elapsed_time_seconds.toFixed(2) : 'unknown';
      
      setResponseTime({
        totalTime: `${totalTime}s (client)`,
        backendTime: `${backendTime}s (server)`
      });
      
      if (data.answer) {
        setAnswer(data.answer);
        setResponseDetails(data);
      } else {
        setError('No answer received from the AI service');
      }
    } catch (err) {
      console.error('Error asking question:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // This function tests the direct analyze endpoint with a sample child_id
  const handleTestDirectAnalyze = async () => {
    setIsLoading(true);
    setError('');
    setAnswer('');
    setResponseTime(null);
    
    console.log('Testing /api/direct/analyze endpoint with the current question as story content');
    
    const startTime = Date.now();
    
    try {
      // Use a valid MongoDB ObjectId format (24 hex characters)
      // 507f1f77bcf86cd799439011 is a valid ObjectId format that we'll use for testing
      const validTestObjectId = '507f1f77bcf86cd799439011';
      
      const response = await fetch('http://localhost:8000/api/direct/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Use string concatenation to create a testId that still has a valid ObjectId format
          id: validTestObjectId,
          content: question,
          child_id: validTestObjectId
        }),
      });
      
      console.log('Direct analyze response:', response);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Direct analyze failed: ${response.status}. Details: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Analysis data received:', data);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      setResponseTime({
        totalTime: `${totalTime}s (client)`
      });
      
      if (data.summary) {
        // Format the analysis data as a readable answer
        const formattedAnswer = `
ANALYSIS RESULTS:

Strengths: ${data.strengths.join(', ')}

Traits: ${data.traits.join(', ')}

Summary: ${data.summary}

Detailed analysis: ${data.ai_insights}
`;
        
        setAnswer(formattedAnswer);
        setResponseDetails(data);
      } else {
        setError('No valid analysis received from the API');
      }
    } catch (err) {
      console.error('Error testing direct analyze:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Head>
        <title>AI Model Test | 2Dots1Line</title>
        <meta name="description" content="Test the AI model integration" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="/styles.css" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-indigo-700">AI Model Test</h1>
            <Link href="/dashboard">
              <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                Back to Dashboard
              </button>
            </Link>
          </div>
          <p className="text-gray-600 mt-2">
            This page tests the direct connection to the OpenRouter API using the DeepSeek model.
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="mb-4">
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Enter a question for the AI
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows="3"
              placeholder="Ask a question..."
            ></textarea>
          </div>

          <div className="mt-4 flex space-x-4">
            <button
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
              className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading || !question.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Ask AI'}
            </button>
            
            <button
              onClick={handleTestDirectAnalyze}
              disabled={isLoading || !question.trim()}
              className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading || !question.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Test Story Analysis'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {answer && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Answer:</h2>
            <div className="prose max-w-none bg-gray-50 p-4 rounded-md">
              <p className="whitespace-pre-line">{answer}</p>
            </div>
          </div>
        )}

        {responseTime && (
          <div className="mt-8">
            <h3 className="text-md font-medium text-gray-900 mb-1">Response Time:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              <li>Total request time: {responseTime.totalTime}</li>
              {responseTime.backendTime && <li>AI processing time: {responseTime.backendTime}</li>}
            </ul>
          </div>
        )}

        {responseDetails && (
          <div className="mt-8">
            <details className="bg-white rounded-lg shadow-sm p-6">
              <summary className="text-sm text-gray-500 cursor-pointer">Response Details</summary>
              <div className="mt-4 bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs text-gray-800">{JSON.stringify(responseDetails, null, 2)}</pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
} 