'use client';

import { useState } from 'react';

interface ScriptSlugResult {
  success: boolean;
  url: string;
  totalPages: number;
  totalScenes: number;
  randomSceneIndex: number;
  randomSceneContent: string; // French translation
  originalSceneContent: string; // Original English
  sceneHeader: string;
  sceneWordCount: number;
  fullTextLength: number;
  translationError?: string;
  metadata: {
    title: string;
    info: any;
  };
}

interface ErrorDetails {
  status?: number;
  statusText?: string;
  url?: string;
}

interface ErrorResponse {
  error: string;
  details?: ErrorDetails;
}

export default function ScriptSlugPage() {
  const [pdfUrl, setPdfUrl] = useState('https://assets.scriptslug.com/live/pdf/scripts/the-grand-budapest-hotel-2014.pdf?v=1729115019');
  const [result, setResult] = useState<ScriptSlugResult | null>(null);
  const [error, setError] = useState<string | ErrorResponse>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/scrape/scriptslug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data);
        return;
      }

      setResult(data);
      setShowOriginal(false); // Reset to show French translation by default
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRandomScene = async () => {
    if (!result) return;
    
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/scrape/scriptslug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data);
        return;
      }

      setResult(data);
      setShowOriginal(false); // Reset to show French translation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenizeContent = (content: string) => {
    if (content) {
      const tokenizeUrl = `/tokenize?content=${encodeURIComponent(content)}`;
      window.open(tokenizeUrl, '_blank');
    }
  };

  const renderError = (error: string | ErrorResponse) => {
    if (typeof error === 'string') {
      return (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      );
    }

    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Error:</p>
        <p className="text-red-700 mt-1">{error.error}</p>
        {error.details && (
          <div className="mt-2 text-sm text-red-600">
            <p><strong>Status:</strong> {error.details.status} {error.details.statusText}</p>
            <p><strong>URL:</strong> {error.details.url}</p>
          </div>
        )}
      </div>
    );
  };

  const getCurrentContent = () => {
    if (!result) return '';
    return showOriginal ? result.originalSceneContent : result.randomSceneContent;
  };

  const getCurrentLanguage = () => {
    return showOriginal ? 'English (Original)' : 'French (Translation)';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ScriptSlug French Learning</h1>
        <p className="text-gray-600">
          Extract movie script scenes and translate them to French for vocabulary learning. Default loads "The Grand Budapest Hotel" script.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="pdfUrl" className="block text-sm font-medium text-gray-700 mb-2">
            PDF URL
          </label>
          <input
            type="url"
            id="pdfUrl"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://assets.scriptslug.com/live/pdf/scripts/..."
            required
          />
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Get French Scene for Learning'}
          </button>
          
          {result && (
            <button
              type="button"
              onClick={handleGetRandomScene}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Get Another Scene'}
            </button>
          )}
        </div>
      </form>

      {error && renderError(error)}

      {result && (
        <div className="space-y-6">
          {/* Translation Warning */}
          {result.translationError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">Translation Note:</p>
              <p className="text-yellow-700 text-sm mt-1">
                {result.translationError} - Showing original English text instead.
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Script Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Title:</span>
                <span className="ml-2 text-gray-900">{result.metadata.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total PDF Pages:</span>
                <span className="ml-2 text-gray-900">{result.totalPages}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Scenes Found:</span>
                <span className="ml-2 text-gray-900">{result.totalScenes}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Full Text Length:</span>
                <span className="ml-2 text-gray-900">{result.fullTextLength.toLocaleString()} characters</span>
              </div>
            </div>
          </div>

          {/* Scene Content */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Scene {result.randomSceneIndex} ({result.sceneWordCount} words)
                </h2>
                {result.sceneHeader && (
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    {result.sceneHeader}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Currently showing: {getCurrentLanguage()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {showOriginal ? 'Show French' : 'Show English'}
                </button>
                <button
                  onClick={() => handleTokenizeContent(result.randomSceneContent)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  disabled={showOriginal || !!result.translationError}
                  title={showOriginal || result.translationError ? "Only available for French text" : "Tokenize this French scene"}
                >
                  Tokenize French Scene
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {getCurrentContent()}
            </div>
          </div>

          {/* Additional PDF Info */}
          {result.metadata.info && Object.keys(result.metadata.info).length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Metadata</h3>
              <div className="text-sm space-y-1">
                {Object.entries(result.metadata.info).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium text-gray-700 capitalize">{key}:</span>
                    <span className="ml-2 text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 