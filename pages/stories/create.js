import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function CreateStory() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeChild, setActiveChild] = useState(null);
  const [formData, setFormData] = useState({
    content: '',
    media: [],
    childId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [children, setChildren] = useState([]);
  const [fetchingChildren, setFetchingChildren] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    // Fetch all children if parent
    if (userData.role === 'parent') {
      fetchChildren(userData);
      
      // Fetch active child data if parent has one set
      if (userData.activeChild) {
        fetchActiveChild(userData.activeChild);
      }
    }
  }, [router]);

  const fetchChildren = async (userData) => {
    if (userData.role !== 'parent' || !userData.householdId) return;
    
    setFetchingChildren(true);
    try {
      const response = await fetch(`/api/households/get?householdId=${userData.householdId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setChildren(data.household.children || []);
        
        // Set default child ID if there's only one child
        if (data.household.children && data.household.children.length === 1) {
          setFormData(prev => ({
            ...prev,
            childId: data.household.children[0]._id
          }));
        }
      } else {
        console.error('Failed to fetch household data');
      }
    } catch (err) {
      console.error('Error fetching household data:', err);
    } finally {
      setFetchingChildren(false);
    }
  };

  const fetchActiveChild = async (childId) => {
    try {
      const response = await fetch(`/api/users/get?userId=${childId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveChild(data.user);
        
        // Set the childId to the active child
        setFormData(prev => ({
          ...prev,
          childId: data.user._id
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch child data');
      }
    } catch (err) {
      console.error('Error fetching active child:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Validate content
    if (!formData.content.trim()) {
      setError('Please enter story content');
      return;
    }
    
    // Validate child selection for parents
    if (user && user.role === 'parent' && !formData.childId) {
      setError('Please select a child for this story');
      return;
    }

    setIsLoading(true);

    try {
      // Determine the childId based on user role
      const childId = user.role === 'parent' ? formData.childId : user._id;
      const authorId = user._id;
      
      const response = await fetch('/api/stories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          childId,
          authorId,
          content: formData.content,
          authorName: user.name,
          media: formData.media
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          content: '',
          media: [],
          childId: formData.childId // Maintain the selected child
        });
        
        // Redirect to the story view page after a delay
        const data = await response.json();
        setTimeout(() => {
          router.push(`/stories/${data.story._id}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create story');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Create a New Story | 2Dots1Line</title>
        <meta name="description" content="Create a new story for your child" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="/styles.css" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </Head>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create a New Story</h1>
          <Link href="/dashboard">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to Dashboard
            </button>
          </Link>
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

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">Story created successfully! Redirecting...</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            {user && user.role === 'parent' && (
              <div className="mb-6">
                <label htmlFor="childId" className="block text-sm font-medium text-gray-700 mb-1">
                  {children.length === 1 ? 'Story for:' : 'Select a child for this story:'}
                </label>
                {fetchingChildren ? (
                  <p className="text-sm text-gray-500">Loading children...</p>
                ) : children.length === 0 ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                    <p className="text-sm text-yellow-700">
                      You need to add a child to your household first.{' '}
                      <Link href="/onboarding/add-child" className="font-medium underline">
                        Add a child
                      </Link>
                    </p>
                  </div>
                ) : children.length === 1 ? (
                  <div className="flex items-center bg-indigo-50 p-3 rounded-md">
                    <div className="bg-indigo-100 rounded-full p-1 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-indigo-700">{children[0].name}</span>
                  </div>
                ) : (
                  <select
                    id="childId"
                    name="childId"
                    value={formData.childId}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">-- Select a child --</option>
                    {children.map(child => (
                      <option key={child._id} value={child._id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Story Content
              </label>
              <textarea
                id="content"
                name="content"
                rows={8}
                value={formData.content}
                onChange={handleChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Write your story here..."
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || (user?.role === 'parent' && children.length === 0)}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  isLoading || (user?.role === 'parent' && children.length === 0)
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {isLoading ? 'Creating...' : 'Create Story'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 