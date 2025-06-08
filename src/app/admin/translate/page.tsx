'use client';

import { useState } from 'react';

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTranslation('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          mode: 'toEnglish'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslation(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">French to English Translator</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="text" className="block text-sm font-medium text-gray-700">
                  French Text
                </label>
                <div className="mt-1">
                  <textarea
                    id="text"
                    name="text"
                    rows={4}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter French text here..."
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !text.trim()}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${isLoading || !text.trim() 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                >
                  {isLoading ? 'Translating...' : 'Translate'}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {translation && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Translation</h2>
                <div className="mt-2 p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-700">{translation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 