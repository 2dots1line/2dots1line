import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    accountType: '',
    familyCode: '',
    activationCode: '',
    childId: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get query parameters if redirected from activation page
  useEffect(() => {
    if (router.query.role === 'child' && router.query.activationCode) {
      setFormData(prev => ({
        ...prev,
        role: 'child',
        activationCode: router.query.activationCode,
        childId: router.query.childId || ''
      }));
      setStep(3); // Skip to registration form
    }
  }, [router.query]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
    
    // If child, redirect to activation page
    if (role === 'child') {
      router.push('/activate');
    } else {
      setStep(2); // Continue parent flow
    }
  };

  const handleAccountTypeSelect = (accountType) => {
    setFormData(prev => ({
      ...prev,
      accountType
    }));
    setStep(accountType === 'join' ? 2.5 : 3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // For child account, include activation code
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      if (formData.role === 'child' && formData.activationCode) {
        userData.activationCode = formData.activationCode;
        userData.childId = formData.childId;
      }

      // Create user account
      const userResponse = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const userResult = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userResult.error || 'Failed to create account');
      }

      // If parent, create or join household
      if (formData.role === 'parent') {
        if (formData.accountType === 'new') {
          // Create new household
          const householdResponse = await fetch('/api/households/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parentId: userResult.user._id
            }),
          });

          const householdData = await householdResponse.json();

          if (!householdResponse.ok) {
            throw new Error(householdData.error || 'Failed to create household');
          }
        } else if (formData.accountType === 'join' && formData.familyCode) {
          // Join existing household
          const joinResponse = await fetch('/api/households/join', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parentId: userResult.user._id,
              familyCode: formData.familyCode
            }),
          });

          const joinData = await joinResponse.json();

          if (!joinResponse.ok) {
            throw new Error(joinData.error || 'Failed to join household');
          }
        }
      }

      // Login the user
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.error || 'Login failed after signup');
      }

      // Store auth token and user data
      localStorage.setItem('authToken', loginData.token);
      localStorage.setItem('user', JSON.stringify(loginData.user));

      // Redirect to appropriate page
      if (formData.role === 'parent') {
        if (formData.accountType === 'new') {
          router.push('/onboarding/add-child');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Sign Up - 2Dots1Line</title>
        <meta name="description" content="Create your 2Dots1Line account" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </Head>

      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-indigo-700">2Dots1Line</h1>
          </Link>
          <h2 className="text-xl font-medium text-gray-700 mt-2">Create your account</h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Choose Role */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">I am a...</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelect('parent')}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-gray-900 font-medium">Parent</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('child')}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-900 font-medium">Child</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Account Type (for parents) */}
        {step === 2 && formData.role === 'parent' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">I want to...</h3>
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={() => handleAccountTypeSelect('new')}
                className="flex items-center p-4 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-gray-900 font-medium block">Create a new family account</span>
                  <span className="text-gray-500 text-sm">Start documenting my child's journey</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleAccountTypeSelect('join')}
                className="flex items-center p-4 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-gray-900 font-medium block">Join an existing family</span>
                  <span className="text-gray-500 text-sm">I received an invitation from another parent</span>
                </div>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              ← Go back
            </button>
          </div>
        )}

        {/* Step 2.5: Enter Family Code (for joining existing family) */}
        {step === 2.5 && formData.accountType === 'join' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Enter Family Code</h3>
            <div>
              <label htmlFor="familyCode" className="block text-sm font-medium text-gray-700 mb-1">
                Family Code
              </label>
              <input
                id="familyCode"
                name="familyCode"
                type="text"
                required
                value={formData.familyCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter the family code you received"
              />
              <p className="mt-1 text-sm text-gray-500">
                Ask the primary parent for the family code
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!formData.familyCode}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Registration Form */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Create a password"
              />
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(formData.role === 'parent' ? (formData.accountType === 'join' ? 2.5 : 2) : 1)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Log in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 