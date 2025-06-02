'use client';

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';

export default function NewspaperHeader() {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { user, loading, signInWithEmail, signUpWithEmail, convertAnonymousUser, signOut } = useAuth();

  useEffect(() => {
    // Set the current date on client side to avoid hydration mismatch
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let result;
      
      if (user?.is_anonymous) {
        // Convert anonymous user to permanent user
        result = await convertAnonymousUser(email, password);
      } else {
        // Regular sign in/up for non-anonymous users
        if (isLogin) {
          result = await signInWithEmail(email, password);
        } else {
          result = await signUpWithEmail(email, password);
        }
      }
      
      if (result.error) throw result.error;
      
      setShowLoginForm(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Auth error:', error);
      alert(`Error: ${error.message || 'An error occurred'}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    // After logout, will automatically sign in anonymously via the auth state change listener
  };

  const getAuthButtonText = () => {
    if (user?.is_anonymous) {
      return "Create Account";
    }
    return "Member Login";
  };

  const renderAuthSection = () => {
    if (loading) {
      return (
        <span className="text-xs opacity-50" style={{ fontFamily: 'var(--font-crimson-text)' }}>
          ...
        </span>
      );
    }

    if (user && !user.is_anonymous) {
      return (
        <button
          onClick={handleLogout}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'var(--font-crimson-text)' }}
        >
          Sign Out
        </button>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => setShowLoginForm(!showLoginForm)}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'var(--font-crimson-text)' }}
        >
          {getAuthButtonText()}
        </button>
        
        {showLoginForm && (
          <div className="absolute right-0 top-6 bg-white border border-gray-300 rounded shadow-lg p-4 z-10 min-w-[280px]">
            <form onSubmit={handleEmailPasswordAuth}>
              <div className="mb-3">
                <h3 className="font-medium text-sm mb-2" style={{ fontFamily: 'var(--font-crimson-text)' }}>
                  {user?.is_anonymous ? 'Save Your Progress' : (isLogin ? 'Sign In' : 'Create Account')}
                </h3>
                
                {!user?.is_anonymous && (
                  <div className="flex text-xs mb-3">
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className={`mr-2 px-2 py-1 rounded ${isLogin ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className={`px-2 py-1 rounded ${!isLogin ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mb-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2 text-xs border border-gray-300 rounded"
                  style={{ fontFamily: 'var(--font-crimson-text)' }}
                />
              </div>
              
              <div className="mb-3">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 text-xs border border-gray-300 rounded"
                  style={{ fontFamily: 'var(--font-crimson-text)' }}
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="text-xs px-3 py-1 text-gray-600 hover:text-gray-800"
                  style={{ fontFamily: 'var(--font-crimson-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                  style={{ fontFamily: 'var(--font-crimson-text)' }}
                >
                  {user?.is_anonymous ? 'Save Progress' : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[f8f7f2]">
      <div className="text-center py-6 px-6">
        <div className="border-t-2 border-b-2 border-[2f2f2f] py-3">
          <h1 className="text-5xl font-bold tracking-wider text-[2f2f2f]" style={{ fontFamily: 'var(--font-playfair-display)' }}>
            THE VOCAB HERALD
          </h1>
          <div className="flex justify-between items-center mt-3 text-xs" style={{ fontFamily: 'var(--font-crimson-text)' }}>
            <span className="font-bold">EST. 2024</span>
            <span className="font-bold text-lg">LEARNING EDITION</span>
            <span className="font-bold">VOL. 1 NO. 1</span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3 text-sm text-gray-700" style={{ fontFamily: 'var(--font-crimson-text)' }}>
          <div>{currentDate || 'Loading...'} • Language Learning Daily</div>
          <div>{renderAuthSection()}</div>
        </div>
      </div>
    </div>
  );
} 