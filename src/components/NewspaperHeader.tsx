'use client';

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';

export default function NewspaperHeader() {
  const [currentDate, setCurrentDate] = useState<string>('');

  const { user, logInWithGoogle, linkWithGoogle, signOut } = useAuth();

  useEffect(() => {
    // Set the current date on client side to avoid hydration mismatch
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  const handleSave = async () => {
    try {
      const result = await linkWithGoogle();
      if (result.error) throw result.error;
    } catch (error) {
      console.error('Auth error (save):', error);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await logInWithGoogle();
      if (result.error) throw result.error;
    } catch (error) {
      console.error('Auth error (login):', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const renderAuthSection = () => {
    if (user && !user.is_anonymous) {
      return (
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-xs hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-crimson-text)' }}
          >
            Sign Out
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={handleSave}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'var(--font-crimson-text)' }}
        >
          Save Progress
        </button>
        <span className="text-gray-400">|</span>
        <button
          onClick={handleLogin}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'var(--font-crimson-text)' }}
        >
          Log In
        </button>
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