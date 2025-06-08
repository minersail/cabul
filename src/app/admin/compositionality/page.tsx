'use client';

import { useState } from 'react';

interface CompositionalityResult {
  phrase: string;
  confidence: number;
  explanation: string;
  breakdown: Array<{
    component: string;
    meaning: string;
    confidence: number;
  }>;
  literalTranslation: string;
  idiomaticTranslation: string;
  compositionalityScore: number;
}

export default function CompositionalityPage() {
  const [phrase, setPhrase] = useState('casser les pieds');
  const [result, setResult] = useState<CompositionalityResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/compositionality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phrase }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Highly Compositional';
    if (score >= 0.6) return 'Moderately Compositional';
    if (score >= 0.4) return 'Semi-Idiomatic';
    return 'Highly Idiomatic';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">French Phrase Compositionality Analyzer</h1>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-medium text-blue-900 mb-2">What is Compositionality?</h2>
              <p className="text-blue-800 text-sm">
                Compositionality measures how predictable a phrase's meaning is from its individual parts. 
                High compositionality = literal meaning, Low compositionality = idiomatic meaning.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="phrase" className="block text-sm font-medium text-gray-700">
                  French Phrase
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="phrase"
                    name="phrase"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    placeholder="Enter a French phrase..."
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Try phrases like "casser les pieds", "avoir du pain sur la planche", or "il pleut des cordes"
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !phrase.trim()}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${isLoading || !phrase.trim() 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Compositionality'}
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
              <div className="mt-6 space-y-6">
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Analysis Results</h2>
                  
                  {/* Overall Score */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">"{result.phrase}"</h3>
                        <p className="text-sm text-gray-600 mt-1">Overall Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.compositionalityScore)}`}>
                          {getScoreLabel(result.compositionalityScore)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Score: {result.compositionalityScore.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Translations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Literal Translation</h4>
                      <p className="text-gray-900">{result.literalTranslation}</p>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Idiomatic Translation</h4>
                      <p className="text-gray-900">{result.idiomaticTranslation}</p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-white border rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Explanation</h4>
                    <p className="text-gray-900">{result.explanation}</p>
                  </div>

                  {/* Component Breakdown */}
                  {result.breakdown && result.breakdown.length > 0 && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-3">Component Breakdown</h4>
                      <div className="space-y-3">
                        {result.breakdown.map((component, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">"{component.component}"</span>
                              <p className="text-sm text-gray-600 mt-1">{component.meaning}</p>
                            </div>
                            <div className="text-right ml-4">
                              <span className="text-sm text-gray-500">
                                {(component.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Details */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Technical Details
                    </summary>
                    <div className="mt-2 bg-gray-800 text-green-300 rounded-md p-4 text-xs overflow-x-auto">
                      <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 