import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AddChild() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [showActivationCode, setShowActivationCode] = useState({});
  const [codeCopied, setCodeCopied] = useState({});

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'parent') {
      router.push('/dashboard');
      return;
    }

    setUser(userData);

    // Fetch household data
    const fetchHousehold = async () => {
      try {
        const response = await fetch(`/api/households/get?parentId=${userData._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setHousehold(data.household);
          
          // Fetch child data with activation codes
          if (data.household.children && data.household.children.length > 0) {
            const childrenData = await Promise.all(
              data.household.children.map(async (child) => {
                const childResponse = await fetch(`/api/users/get?userId=${child._id}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                  },
                });
                
                if (childResponse.ok) {
                  const childData = await childResponse.json();
                  return childData.user;
                }
                return child;
              })
            );
            
            setChildren(childrenData);
            
            // Initialize show/hide states for activation codes
            const showCodeState = {};
            const copiedState = {};
            childrenData.forEach(child => {
              showCodeState[child._id] = false;
              copiedState[child._id] = false;
            });
            setShowActivationCode(showCodeState);
            setCodeCopied(copiedState);
          }
        } else if (response.status === 404) {
          // If household not found, create one
          const createResponse = await fetch('/api/households/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
              parentId: userData._id
            }),
          });

          if (createResponse.ok) {
            const createData = await createResponse.json();
            setHousehold(createData.household);
          } else {
            const errorData = await createResponse.json();
            throw new Error(errorData.error || 'Failed to create household');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch household data');
        }
      } catch (err) {
        console.error('Error fetching household:', err);
        setError(err.message);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchHousehold();
  }, [router]);

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
    
    // Validate inputs
    if (!formData.name.trim()) {
      setError('Please enter the child\'s name');
      return;
    }
    
    if (!formData.dateOfBirth) {
      setError('Please enter the child\'s date of birth');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create child user
      const response = await fetch('/api/users/create-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          name: formData.name,
          parentId: user._id,
          householdId: household._id,
          dateOfBirth: formData.dateOfBirth,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create child');
      }

      const data = await response.json();
      setSuccess(true);
      setFormData({ name: '', dateOfBirth: '' });
      
      // Add the new child to the children list
      setChildren(prev => [...prev, data.child]);
      
      // Initialize show/hide state for the new child's activation code
      setShowActivationCode(prev => ({
        ...prev,
        [data.child._id]: false
      }));
      
      setCodeCopied(prev => ({
        ...prev,
        [data.child._id]: false
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActivationCode = (childId) => {
    setShowActivationCode(prev => ({
      ...prev,
      [childId]: !prev[childId]
    }));
  };

  const copyActivationCode = (childId, code) => {
    navigator.clipboard.writeText(code);
    
    setCodeCopied(prev => ({
      ...prev,
      [childId]: true
    }));
    
    setTimeout(() => {
      setCodeCopied(prev => ({
        ...prev,
        [childId]: false
      }));
    }, 2000);
  };

  const copyActivationLink = (childId, code) => {
    const activationLink = `${window.location.origin}/activate-child?code=${code}`;
    navigator.clipboard.writeText(activationLink);
    
    setCodeCopied(prev => ({
      ...prev,
      [childId]: true
    }));
    
    setTimeout(() => {
      setCodeCopied(prev => ({
        ...prev,
        [childId]: false
      }));
    }, 2000);
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <Head>
        <title>Add Children - 2Dots1Line</title>
        <meta name="description" content="Add children to your 2Dots1Line account" />
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

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-700">Add Your Children</h1>
            <p className="text-gray-600 mt-2">
              Add the children you want to document stories for
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">Child added successfully!</p>
            </div>
          )}

          {children && children.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Children</h2>
              <div className="space-y-4">
                {children.map((child) => (
                  <div key={child._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-gray-800 font-medium">{child.name}</h3>
                          <p className="text-xs text-gray-500">
                            {child.activated ? 'Account activated' : 'Account not activated yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {child.activationCode && !child.activated && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-700 mb-2">Activation Code:</p>
                        <div className="flex items-center">
                          <div className="relative flex-grow">
                            <input
                              type={showActivationCode[child._id] ? "text" : "password"}
                              readOnly
                              value={child.activationCode}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => toggleActivationCode(child._id)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                              {showActivationCode[child._id] ? (
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
                          <div className="flex ml-2">
                            <button
                              type="button"
                              onClick={() => copyActivationCode(child._id, child.activationCode)}
                              className="p-1 text-indigo-600 hover:text-indigo-800"
                              title="Copy activation code"
                            >
                              {codeCopied[child._id] ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyActivationLink(child._id, child.activationCode)}
                              className="p-1 text-indigo-600 hover:text-indigo-800 ml-1"
                              title="Copy activation link"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Share this activation code with {child.name} or let them scan the QR code
                        </p>
                        <div className="mt-2">
                          <a 
                            href={`/activate-child?code=${child.activationCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                          >
                            Activation Link
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Child's Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your child's name"
              />
            </div>
            
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                This helps us customize the AI analysis for your child's developmental stage.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Adding Child...' : 'Add Child'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={handleFinish}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Continue to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 