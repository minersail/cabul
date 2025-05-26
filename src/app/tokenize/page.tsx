'use client';

import { useState } from 'react';
import DependencyTree from '@/components/DependencyTree';
import { SpaCyToken } from '@/types/tokenization';

interface TokenizationResult {
  text: string;
  tokens: SpaCyToken[];
  sentences?: {
    text: string;
    start: number;
    end: number;
  }[];
}

export default function TokenizePage() {
  const [text, setText] = useState('Bonjour le monde. Ceci est un test.');
  const [mode, setMode] = useState('full'); // 'simple' or 'full'
  const [includeEntities, setIncludeEntities] = useState(true);
  const [includePos, setIncludePos] = useState(true);
  const [includeLemmas, setIncludeLemmas] = useState(true);
  const [includeDependencies, setIncludeDependencies] = useState(true);
  const [includeSentences, setIncludeSentences] = useState(true);
  const [result, setResult] = useState<TokenizationResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/tokenize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          parameters: {
            mode,
            include_entities: includeEntities,
            include_pos: includePos,
            include_lemmas: includeLemmas,
            include_dependencies: includeDependencies,
            include_sentences: includeSentences,
          }
        }),
      });

      const data = (await response.json())[0];

      if (!response.ok) {
        throw new Error(data.error || 'Tokenization request failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Test Tokenization API</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="text" className="block text-sm font-medium text-gray-700">
                  Text to Tokenize
                </label>
                <div className="mt-1">
                  <textarea
                    id="text"
                    name="text"
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text here..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mode" className="block text-sm font-medium text-gray-700">
                  Mode
                </label>
                <select
                  id="mode"
                  name="mode"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="full">Full</option>
                  <option value="simple">Simple</option>
                </select>
              </div>

              {mode === 'full' && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-gray-700">Include (Full Mode):</legend>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="includeEntities" name="includeEntities" type="checkbox" checked={includeEntities} onChange={(e) => setIncludeEntities(e.target.checked)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="includeEntities" className="font-medium text-gray-700">Entities</label>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="includePos" name="includePos" type="checkbox" checked={includePos} onChange={(e) => setIncludePos(e.target.checked)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="includePos" className="font-medium text-gray-700">POS Tags</label>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="includeLemmas" name="includeLemmas" type="checkbox" checked={includeLemmas} onChange={(e) => setIncludeLemmas(e.target.checked)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="includeLemmas" className="font-medium text-gray-700">Lemmas</label>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="includeDependencies" name="includeDependencies" type="checkbox" checked={includeDependencies} onChange={(e) => setIncludeDependencies(e.target.checked)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="includeDependencies" className="font-medium text-gray-700">Dependencies</label>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="includeSentences" name="includeSentences" type="checkbox" checked={includeSentences} onChange={(e) => setIncludeSentences(e.target.checked)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="includeSentences" className="font-medium text-gray-700">Sentences</label>
                    </div>
                  </div>
                </fieldset>
              )}

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
                  {isLoading ? 'Tokenizing...' : 'Tokenize'}
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

            {result && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">API Response</h2>
                
                {/* Add Dependency Tree Visualization */}
                {result.tokens && result.tokens.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium text-gray-700 mb-2">Dependency Tree</h3>
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <DependencyTree tokens={result.tokens} />
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-4 bg-gray-800 text-green-300 rounded-md overflow-x-auto">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 