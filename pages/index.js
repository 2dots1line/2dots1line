import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
      // Redirect to dashboard if already logged in
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <Head>
        <title>2Dots1Line - Document Your Child's Growth Journey</title>
        <meta name="description" content="AI-powered interactive storytelling canvas for parents" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </Head>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-indigo-700 mb-4">2Dots1Line</h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            An AI-powered interactive storytelling canvas designed for parents to document 
            and explore their child's personal growth through stories.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl mb-8">
          <div className="p-8">
            <div className="flex flex-col space-y-4">
              {!isLoggedIn ? (
                <>
                  <Link href="/login" className="w-full">
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
                      Log In
                    </button>
                  </Link>
                  <Link href="/signup" className="w-full">
                    <button className="w-full bg-white hover:bg-gray-100 text-indigo-600 font-bold py-3 px-4 rounded-lg border border-indigo-600 transition duration-200">
                      Sign Up
                    </button>
                  </Link>
                  <Link href="/activate" className="w-full">
                    <button className="w-full bg-white hover:bg-gray-100 text-green-600 font-bold py-3 px-4 rounded-lg border border-green-600 transition duration-200">
                      Activate Child Account
                    </button>
                  </Link>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Already have an activation code from your parent? Click above to activate your account.
                  </p>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="w-full">
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
                      Go to Dashboard
                    </button>
                  </Link>
                  <Link href="/test-ai" className="w-full">
                    <button className="w-full bg-white hover:bg-gray-100 text-indigo-600 font-bold py-3 px-4 rounded-lg border border-indigo-600 transition duration-200 mt-2">
                      Test AI Model
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-16">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-indigo-700 mb-3">Create Stories</h3>
            <p className="text-gray-600">Document your child's journey through text, voice, images, and video on our interactive canvas.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-indigo-700 mb-3">AI Insights</h3>
            <p className="text-gray-600">Our AI analyzes stories to reveal hidden strengths and patterns in your child's development.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-indigo-700 mb-3">Growth Visualization</h3>
            <p className="text-gray-600">Watch your child's journey unfold with dynamic visualizations of their evolving traits and abilities.</p>
          </div>
        </div>
      </main>
    </div>
  );
} 