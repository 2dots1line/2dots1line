import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [activeChild, setActiveChild] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stories, setStories] = useState([]);
  const [allChildrenStories, setAllChildrenStories] = useState({});
  const [showFamilyCode, setShowFamilyCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showActivationCode, setShowActivationCode] = useState({});
  const [activationCodeCopied, setActivationCodeCopied] = useState({});
  const [activationLinkCopied, setActivationLinkCopied] = useState({});

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    // Fetch data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        if (userData.role === 'parent') {
          // Fetch household data
          await fetchHouseholdData(userData);
        } else if (userData.role === 'child') {
          // If user is a child, fetch their own stories
          await fetchStories(userData._id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchHouseholdData = async (userData) => {
    try {
      const householdResponse = await fetch(`/api/households/get?parentId=${userData._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!householdResponse.ok) {
        if (householdResponse.status === 404) {
          console.log('No household found for this parent');
          setHousehold(null);
          return;
        }
        const errorData = await householdResponse.json();
        throw new Error(errorData.error || 'Failed to fetch household data');
      }
      
      const householdData = await householdResponse.json();
      console.log('Household data:', householdData);
      setHousehold(householdData.household);
      
      // Check if household has children
      const children = householdData.household?.children || [];
      if (children.length > 0) {
        // Fetch stories for all children
        await fetchAllChildrenStories(children);
        
        // Get active child if set
        if (userData.activeChild) {
          await fetchChildAndStories(userData.activeChild);
        } else {
          // Set first child as active if none is set
          const childId = children[0]._id;
          await switchActiveChild(childId);
        }
      }
    } catch (err) {
      console.error('Error fetching household:', err);
      throw err;
    }
  };

  const fetchAllChildrenStories = async (children) => {
    const storiesByChild = {};
    
    for (const child of children) {
      try {
        const storiesResponse = await fetch(`/api/stories/get?childId=${child._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json();
          storiesByChild[child._id] = storiesData.stories || [];
        }
      } catch (err) {
        console.error(`Error fetching stories for child ${child.name}:`, err);
        storiesByChild[child._id] = [];
      }
    }
    
    setAllChildrenStories(storiesByChild);
  };

  const fetchChildAndStories = async (childId) => {
    if (!childId) return;
    
    try {
      const childResponse = await fetch(`/api/users/get?userId=${childId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (childResponse.ok) {
        const childData = await childResponse.json();
        setActiveChild(childData.user);
        
        // Fetch stories for this child
        await fetchStories(childId);
      }
    } catch (err) {
      console.error('Error fetching child data:', err);
    }
  };

  const fetchStories = async (childId) => {
    if (!childId) return;
    
    try {
      const storiesResponse = await fetch(`/api/stories/get?childId=${childId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json();
        setStories(storiesData.stories || []);
      } else if (storiesResponse.status !== 404) {
        console.error('Error fetching stories:', await storiesResponse.json());
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  };

  const switchActiveChild = async (childId) => {
    if (!childId || !user || !user._id) return;
    
    try {
      const response = await fetch('/api/users/switch-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          parentId: user._id,
          childId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to switch active child');
      }

      const data = await response.json();
      
      // Update local user data
      const updatedUser = { ...user, activeChild: childId };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Fetch child data and stories
      await fetchChildAndStories(childId);
    } catch (err) {
      console.error('Error switching child:', err);
      setError(err.message);
    }
  };

  const copyFamilyCode = () => {
    if (household?.familyCode) {
      navigator.clipboard.writeText(household.familyCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const toggleActivationCode = (childId) => {
    setShowActivationCode(prev => ({
      ...prev,
      [childId]: !prev[childId]
    }));
  };

  const copyActivationCode = (childId, code) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setActivationCodeCopied(prev => {
        const newState = { ...prev, [childId]: true };
        setTimeout(() => {
          setActivationCodeCopied(current => ({ ...current, [childId]: false }));
        }, 2000);
        return newState;
      });
    }
  };

  const copyActivationLink = (childId, code) => {
    if (childId && code) {
      const link = `${window.location.origin}/activate/${childId}/${code}`;
      navigator.clipboard.writeText(link);
      setActivationLinkCopied(prev => {
        const newState = { ...prev, [childId]: true };
        setTimeout(() => {
          setActivationLinkCopied(current => ({ ...current, [childId]: false }));
        }, 2000);
        return newState;
      });
    }
  };

  // Add this helper function for truncating story content
  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Determine if the household has children
  const hasChildren = household?.children && household.children.length > 0;

  // Count total stories across all children
  const totalStories = Object.values(allChildrenStories).reduce(
    (total, childStories) => total + childStories.length, 
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Dashboard - 2Dots1Line</title>
        <meta name="description" content="Manage your 2Dots1Line account" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-indigo-700">2Dots1Line</h1>
          </Link>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="text-sm text-gray-700">
                Hello, <span className="font-medium">{user.name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {user && user.role === 'parent' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Your Children</h2>
                
                {hasChildren ? (
                  <div className="space-y-4">
                    {household.children.map((child) => (
                      <div key={child._id} className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <div className="bg-indigo-100 rounded-full p-1 mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium">{child.name}</span>
                            {child.activated ? (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                Account Activated
                              </span>
                            ) : (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Awaiting Activation
                              </span>
                            )}
                          </div>
                          {user._id === activeChild?._id ? (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-md">Active</span>
                          ) : (
                            <button
                              onClick={() => switchActiveChild(child._id)}
                              className="text-indigo-600 hover:text-indigo-800 text-xs"
                            >
                              Switch to
                            </button>
                          )}
                        </div>

                        {/* Always show activation info regardless of activation status */}
                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                          <h4 className="text-xs font-medium text-gray-500 mb-2">
                            {child.activated ? 'Activation Info (Already Activated)' : 'Activation Info'}
                          </h4>
                          <div className="flex items-center mb-2">
                            <div className="mr-2">
                              <span className="text-xs text-gray-500">Code:</span>
                            </div>
                            <div className="flex-grow relative">
                              <input
                                type="text"
                                readOnly
                                value={child.activationCode}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            <button
                              onClick={() => copyActivationCode(child._id, child.activationCode)}
                              className="ml-2 p-1 text-indigo-600 hover:text-indigo-800"
                              title="Copy activation code"
                            >
                              {activationCodeCopied[child._id] ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => copyActivationLink(child._id, child.activationCode)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                              {activationLinkCopied[child._id] ? (
                                <>
                                  <span className="mr-1">Copied!</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span className="mr-1">Copy activation link</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Child's stories section... */}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No children added yet.</p>
                )}

                <div className="mt-6">
                  <Link href="/onboarding/add-child">
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Child
                    </button>
                  </Link>
                </div>

                {/* Family Information */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Household Members</h3>
                  
                  {household && household.parents && household.parents.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs text-gray-500 mb-1">Parents</h4>
                      <ul className="space-y-1">
                        {household.parents.map((parent) => (
                          <li key={parent._id} className="flex items-center py-1">
                            <div className="flex-shrink-0 bg-blue-100 rounded-full p-1 mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-700">
                              {parent.name}
                              {parent._id === household.primaryParent._id ? (
                                <span className="ml-1 text-xs text-blue-500">(Primary)</span>
                              ) : parent._id === user._id ? (
                                <span className="ml-1 text-xs text-green-500">(You)</span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {household && household.familyCode && (
                    <div className="mb-4">
                      <h4 className="text-xs text-gray-500 mb-1">Family Code</h4>
                      <div className="flex items-center">
                        <div className="relative flex-grow">
                          <input
                            type={showFamilyCode ? "text" : "password"}
                            readOnly
                            value={household.familyCode}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowFamilyCode(!showFamilyCode)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          >
                            {showFamilyCode ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <button
                          onClick={copyFamilyCode}
                          className="ml-2 p-1 text-indigo-600 hover:text-indigo-800"
                          title="Copy family code"
                        >
                          {codeCopied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Share this code with other parents to join your family
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              {household ? (
                hasChildren ? (
                  <div>
                    {/* View selector - All or Individual Child */}
                    <div className="bg-white shadow rounded-lg p-4 mb-6 flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setActiveChild(null)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            !activeChild ? 'bg-indigo-100 text-indigo-800' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          All Stories
                        </button>
                        {activeChild && (
                          <button
                            className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            {activeChild.name}'s Stories
                          </button>
                        )}
                      </div>

                      <Link href="/stories/create">
                        <button className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Story
                        </button>
                      </Link>
                    </div>

                    {/* Story content area */}
                    {activeChild ? (
                      // Individual child stories view
                      <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">{activeChild.name}'s Stories</h2>

                        {stories && stories.length > 0 ? (
                          <div className="space-y-4">
                            {stories.map((story) => (
                              <div key={story._id} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium">{new Date(story.createdAt).toLocaleDateString()}</h3>
                                  <div className="flex space-x-2">
                                    <Link href={`/stories/${story._id}`}>
                                      <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View
                                      </button>
                                    </Link>
                                    <Link href={`/stories/edit/${story._id}`}>
                                      <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Edit
                                      </button>
                                    </Link>
                                  </div>
                                </div>
                                <p className="text-gray-800">{truncateContent(story.content)}</p>
                                {story.content.length > 150 && (
                                  <Link href={`/stories/${story._id}`}>
                                    <p className="text-indigo-600 hover:text-indigo-800 text-sm mt-2">Read more</p>
                                  </Link>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-indigo-50 rounded-lg p-8 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No stories yet</h3>
                            <p className="text-gray-600 mb-6">Start documenting {activeChild.name}'s journey by creating the first story.</p>
                            <Link href="/stories/create">
                              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Create First Story
                              </button>
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      // All children stories view
                      <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">All Children's Stories</h2>
                        
                        {totalStories > 0 ? (
                          <div>
                            {household.children.map((child) => {
                              const childStories = allChildrenStories[child._id] || [];
                              if (childStories.length === 0) return null;
                              
                              return (
                                <div key={child._id} className="mb-8">
                                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                    <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1 mr-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    {child.name}'s Stories
                                  </h3>
                                  
                                  <div className="space-y-4">
                                    {childStories.map((story) => (
                                      <div key={story._id} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                          <h3 className="font-medium">{new Date(story.createdAt).toLocaleDateString()}</h3>
                                          <div className="flex space-x-2">
                                            <Link href={`/stories/${story._id}`}>
                                              <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View
                                              </button>
                                            </Link>
                                            <Link href={`/stories/edit/${story._id}`}>
                                              <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                                Edit
                                              </button>
                                            </Link>
                                          </div>
                                        </div>
                                        <p className="text-gray-800">{truncateContent(story.content)}</p>
                                        {story.content.length > 150 && (
                                          <Link href={`/stories/${story._id}`}>
                                            <p className="text-indigo-600 hover:text-indigo-800 text-sm mt-2">Read more</p>
                                          </Link>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-indigo-50 rounded-lg p-8 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No stories yet</h3>
                            <p className="text-gray-600 mb-6">Start documenting your children's journeys by creating the first story.</p>
                            <Link href="/stories/create">
                              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Create First Story
                              </button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white shadow rounded-lg p-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Add a child to get started</h3>
                    <p className="text-gray-600 mb-6">Create a profile for your child to begin documenting their journey.</p>
                    <Link href="/onboarding/add-child">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Add Your First Child
                      </button>
                    </Link>
                  </div>
                )
              ) : (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Create or Join a Household</h3>
                  <p className="text-gray-600 mb-6">You need to create a household or join an existing one.</p>
                  <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                    <Link href="/onboarding/create-household">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Create New Household
                      </button>
                    </Link>
                    <Link href="/onboarding/join-household">
                      <button className="inline-flex items-center px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Join Existing Household
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {user && user.role === 'child' && (
          // Child user view
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Stories</h2>
            
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">Create and view your stories</p>
              <Link href="/stories/create">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Story
                </button>
              </Link>
            </div>
            
            {stories && stories.length > 0 ? (
              <div className="space-y-4">
                {stories.map((story) => (
                  <div key={story._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{new Date(story.createdAt).toLocaleDateString()}</h3>
                      <div className="flex space-x-2">
                        <Link href={`/stories/${story._id}`}>
                          <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </Link>
                        <Link href={`/stories/edit/${story._id}`}>
                          <button className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                          </button>
                        </Link>
                      </div>
                    </div>
                    <p className="text-gray-800">{truncateContent(story.content)}</p>
                    {story.content.length > 150 && (
                      <Link href={`/stories/${story._id}`}>
                        <p className="text-indigo-600 hover:text-indigo-800 text-sm mt-2">Read more</p>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-indigo-50 rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No stories yet</h3>
                <p className="text-gray-600 mb-6">Start documenting your journey by creating your first story.</p>
                <Link href="/stories/create">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Create First Story
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 