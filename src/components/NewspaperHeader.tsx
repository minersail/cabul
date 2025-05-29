'use client';

import { useState, useEffect } from "react";

export default function NewspaperHeader() {
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    // Set the current date on client side to avoid hydration mismatch
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

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
        <div className="mt-3 text-sm text-gray-700" style={{ fontFamily: 'var(--font-crimson-text)' }}>
          {currentDate || 'Loading...'} • Language Learning Daily
        </div>
      </div>
    </div>
  );
} 