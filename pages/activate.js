import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Activate() {
  const router = useRouter();
  const { code } = router.query;
  const [activationCode, setActivationCode] = useState(code || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verifiedChild, setVerifiedChild] = useState(null);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const response = await fetch('/api/users/verify-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activationCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid activation code');
      }

      setVerifiedChild(data.child);
      
      // Redirect to signup page with activation code
      router.push({
        pathname: '/signup',
        query: { 
          role: 'child', 
          activationCode: activationCode,
          childId: data.child._id
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Activate Your Account - 2Dots1Line</title>
        <meta name="description" content="Activate your 2Dots1Line account" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </Head>

      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-indigo-700">2Dots1Line</h1>
          </Link>
          <h2 className="text-xl font-medium text-gray-700 mt-2">Activate Your Account</h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div>
            <label htmlFor="activationCode" className="block text-sm font-medium text-gray-700 mb-1">
              Activation Code
            </label>
            <input
              id="activationCode"
              name="activationCode"
              type="text"
              autoComplete="off"
              required
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 uppercase"
              placeholder="Enter your activation code"
            />
            <p className="mt-1 text-sm text-gray-500">
              Ask your parent for your activation code
            </p>
          </div>

          <button
            type="submit"
            disabled={isVerifying || !activationCode}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 