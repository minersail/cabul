'use client';

import { useState } from 'react';

interface ScrapeResult {
  success: boolean;
  url: string;
  title: string;
  description: string;
  content: string;
  author: string;
  publishDate: string;
  wordCount: number;
  rawHtmlLength: number;
}

interface ArchiveResult {
  success: boolean;
  archiveDate: string;
  archiveUrl: string;
  totalArticles: number;
  premiumArticles: number;
  freeArticles: number;
  articles: Array<{
    url: string;
    title: string;
    description: string;
    isPremium: boolean;
    category: string;
    author: string;
    publishDate: string;
  }>;
}

interface RandomArticleResult extends ScrapeResult {
  randomDate: string;
  archiveUrl: string;
  selectedFromArchive: {
    totalArticles: number;
    premiumArticles: number;
    freeArticles: number;
  };
}

interface ErrorDetails {
  status?: number;
  statusText?: string;
  url?: string;
  suggestion?: string;
}

interface ErrorResponse {
  error: string;
  details?: ErrorDetails;
}

export default function ScrapePage() {
  const [url, setUrl] = useState('https://www.lemonde.fr/politique/article/2024/12/20/budget-2025-michel-barnier-renonce-a-faire-adopter-le-projet-de-loi-de-financement-de-la-securite-sociale_6398234_823448.html');
  const [archiveDate, setArchiveDate] = useState('01-05-2025');
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [archiveResult, setArchiveResult] = useState<ArchiveResult | null>(null);
  const [randomResult, setRandomResult] = useState<RandomArticleResult | null>(null);
  const [error, setError] = useState<string | ErrorResponse>('');
  const [archiveError, setArchiveError] = useState<string | ErrorResponse>('');
  const [randomError, setRandomError] = useState<string | ErrorResponse>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'archive' | 'random'>('single');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    // Clear other results when starting single article scrape
    setArchiveResult(null);
    setRandomResult(null);
    setArchiveError('');
    setRandomError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/scrape/lemonde', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle ErrorResponse from API
        setError(data); // data will be ErrorResponse object with error and details
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setArchiveError('');
    setArchiveResult(null);
    // Clear other results when starting archive scrape
    setResult(null);
    setRandomResult(null);
    setError('');
    setRandomError('');
    setIsArchiveLoading(true);

    try {
      // Convert YYYY-MM-DD to DD-MM-YYYY format
      const [year, month, day] = archiveDate.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      const response = await fetch('/api/scrape/lemonde', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'getArchiveArticles',
          archiveDate: formattedDate
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setArchiveError(data);
        return;
      }

      setArchiveResult(data);
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const handleRandomArticle = async () => {
    setRandomError('');
    setRandomResult(null);
    // Clear other results when starting random article
    setResult(null);
    setArchiveResult(null);
    setError('');
    setArchiveError('');
    setIsRandomLoading(true);

    try {
      const response = await fetch('/api/scrape/lemonde', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'getRandomArticle'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRandomError(data);
        return;
      }

      setRandomResult(data);
    } catch (err) {
      setRandomError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsRandomLoading(false);
    }
  };

  const handleTokenizeContent = (content: string) => {
    if (content) {
      // Open tokenize page in new tab with the scraped content
      const tokenizeUrl = `/admin/tokenize?content=${encodeURIComponent(content)}`;
      window.open(tokenizeUrl, '_blank');
    }
  };

  const handleTabChange = (newTab: 'single' | 'archive' | 'random') => {
    // Clear all results and errors when switching tabs
    setActiveTab(newTab);
    setResult(null);
    setArchiveResult(null);
    setRandomResult(null);
    setError('');
    setArchiveError('');
    setRandomError('');
  };

  const tabs = [
    { id: 'single', name: 'Single Article', icon: '📄' },
    { id: 'archive', name: 'Archive Scraper', icon: '📚' },
    { id: 'random', name: 'Random Article', icon: '🎲' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Le Monde Scraper Test Suite</h1>
            
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'single' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    Le Monde Article URL
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      id="url"
                      name="url"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.lemonde.fr/..."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Enter a Le Monde article URL to scrape its content
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                      ${isLoading || !url.trim() 
                        ? 'bg-indigo-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      }`}
                  >
                    {isLoading ? 'Scraping...' : 'Scrape Article'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'archive' && (
              <form onSubmit={handleArchiveSubmit} className="space-y-6">
                <div>
                  <label htmlFor="archiveDate" className="block text-sm font-medium text-gray-700">
                    Archive Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="archiveDate"
                      name="archiveDate"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={archiveDate}
                      onChange={(e) => setArchiveDate(e.target.value)}
                      min="1944-01-01"
                      max="2025-12-31"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Select a date to scrape articles from Le Monde archives (1944-2025)
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isArchiveLoading || !archiveDate.trim()}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                      ${isArchiveLoading || !archiveDate.trim() 
                        ? 'bg-indigo-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      }`}
                  >
                    {isArchiveLoading ? 'Scraping...' : 'Scrape Archive'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'random' && (
              <div>
                <button
                  onClick={handleRandomArticle}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isRandomLoading ? 'Loading...' : 'Get Random Article'}
                </button>
              </div>
            )}

            {/* Error displays and results would follow here - keeping it shorter for now */}
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
                    <div className="mt-2 text-sm text-red-700">
                      {typeof error === 'string' ? error : error.error}
                      {typeof error === 'object' && error.details?.suggestion && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
                          <strong>Suggestion:</strong> {error.details.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add basic result display */}
            {result && (
              <div className="mt-6 space-y-6">
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Scraped Article</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Title:</span>
                        <p className="text-gray-900 mt-1">{result.title}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Author:</span>
                        <p className="text-gray-900 mt-1">{result.author}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Published:</span>
                        <p className="text-gray-900 mt-1">{result.publishDate}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Word Count:</span>
                        <p className="text-gray-900 mt-1">{result.wordCount} words</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-medium text-gray-700">Article Content</h3>
                      {result.content && result.content !== 'Content not found' && (
                        <button
                          onClick={() => handleTokenizeContent(result.content)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Open in Tokenizer →
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {result.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 