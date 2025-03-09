import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ActivateChild() {
  const router = useRouter();
  const { code } = router.query;
  
  const [formData, setFormData] = useState({
    activationCode: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Step 1: Enter activation code, Step 2: Create credentials
  const [isLoading, setIsLoading] = useState(false);
  const [childName, setChildName] = useState('');

  // When the page loads, check for code in URL
  useEffect(() => {
    if (code) {
      setFormData(prev => ({
        ...prev,
        activationCode: code
      }));
      // If code is provided, move to step 2
      verifyActivationCode(code);
    }
  }, [code]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const verifyActivationCode = async (codeToVerify) => {
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/users/verify-activation-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activationCode: codeToVerify || formData.activationCode
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setChildName(data.childName);
        setStep(2);
      } else {
        setError(data.error || 'Invalid activation code');
      }
    } catch (err) {
      setError('Failed to verify activation code. Please try again.');
      console.error('Error verifying activation code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!formData.activationCode) {
      setError('Please enter your activation code');
      return;
    }
    verifyActivationCode();
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/users/activate-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activationCode: formData.activationCode,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save auth token and user data in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Failed to activate account');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Error activating account:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Activate Your Account | 2Dots1Line</title>
        <meta name="description" content="Activate your child account on 2Dots1Line" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              {step === 1 ? 'Activate Your Account' : `Welcome${childName ? ', ' + childName : ''}!`}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {step === 1 
                ? 'Enter the activation code provided by your parent or guardian' 
                : 'Create your own login credentials to access your stories'}
            </p>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleCodeSubmit} className="mt-6 space-y-6">
              <div>
                <label htmlFor="activationCode" className="block text-sm font-medium text-gray-700">
                  Activation Code
                </label>
                <div className="mt-1">
                  <input
                    id="activationCode"
                    name="activationCode"
                    type="text"
                    autoComplete="off"
                    required
                    placeholder="Enter your activation code"
                    value={formData.activationCode}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  The activation code can be found in your parent's dashboard. Ask them to share it with you.
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {isLoading ? 'Verifying...' : 'Continue'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Create Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {isLoading ? 'Activating Account...' : 'Activate Account'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-800">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 