'use client';

import { useState, useEffect, Dispatch } from "react";
import VocabCanvas from "./VocabCanvas";
import VocabStats from "./VocabStats";
import InstructionPane from "./InstructionPane";
import OptionsPane from "./OptionsPane";
import { SpaCyTokenizationResponse } from "@/types/tokenization";
import { getLearnableWords } from "@/utils/tokenization";

interface RedditPost {
  title: string;
  content: string;
  url: string;
  score: number;
  author: string;
}

interface LeMondeArticle {
  title: string;
  content: string;
  url: string;
  description: string;
  author: string;
  publishDate: string;
  wordCount: number;
}

// Unified article type
interface Article {
  title: string;
  content: string;
  url: string;
  author: string;
  // Optional fields for different sources
  score?: number; // Reddit only
  description?: string; // Le Monde only
  publishDate?: string; // Le Monde only
  wordCount?: number; // Le Monde only
}

interface ArticleLoaderProps {
  posts?: RedditPost[];
}

// Type for our word stats
type WordStats = [number, number]; // [total encounters, correct attempts]

// Helper function to get word stats from localStorage
function getWordStats(): Record<string, WordStats> {
  if (typeof window === 'undefined') return {};
  const stats = localStorage.getItem('vocabStats');
  return stats ? JSON.parse(stats) : {};
}

async function getRedditPosts(): Promise<RedditPost[]> {
  try {
    const response = await fetch('/api/scrape/reddit', {
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Reddit posts: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch Reddit posts');
    }

    return data.posts;

  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    return [];
  }
}

async function getRandomLeMondeArticle(): Promise<LeMondeArticle | null> {
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

    if (!response.ok) {
      throw new Error(`Failed to fetch random Le Monde article: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch random Le Monde article');
    }

    return {
      title: data.title,
      content: data.content,
      url: data.url,
      description: data.description,
      author: data.author,
      publishDate: data.publishDate,
      wordCount: data.wordCount
    };

  } catch (error) {
    console.error('Error fetching random Le Monde article:', error);
    return null;
  }
}

export default function ArticleLoader({ posts: initialPosts }: ArticleLoaderProps) {
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [posts, setPosts] = useState<RedditPost[]>(initialPosts || []);
  const [currentLeMondeArticle, setCurrentLeMondeArticle] = useState<LeMondeArticle | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(!initialPosts);
  const [isLoadingLeMondeArticle, setIsLoadingLeMondeArticle] = useState(false);
  const [wordStats, setWordStats] = useState<Record<string, WordStats>>({});
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [tokenizationResult, setTokenizationResult] = useState<SpaCyTokenizationResponse | null>(null);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [tokenizationError, setTokenizationError] = useState<string | null>(null);
  const [useReddit, setUseReddit] = useState(true);
  const [autoNav, setAutoNav] = useState(false);
  
  // Collapsible panel states
  const [isSidebarPanelOpen, setIsSidebarPanelOpen] = useState(true);
  const [isVocabStatsOpen, setIsVocabStatsOpen] = useState(false);

  // Get current article based on useReddit setting
  const currentArticle: Article | null = useReddit 
    ? (posts.length > 0 ? posts[currentPostIndex] : null)
    : currentLeMondeArticle;

  // Calculate progress info
  const allTokens = tokenizationResult?.tokens || [];
  const learnableWords = getLearnableWords(allTokens);
  const wordCount = learnableWords.length;

  // Load word stats from localStorage after component mounts to avoid hydration issues
  useEffect(() => {
    const stats = getWordStats();
    setWordStats(stats);
  }, []);

  // Fetch Reddit posts if none were provided as props
  useEffect(() => {
    if (!initialPosts && useReddit) {
      const fetchPosts = async () => {
        setIsLoadingPosts(true);
        try {
          const fetchedPosts = await getRedditPosts();
          setPosts(fetchedPosts);
        } catch (error) {
          console.error('Failed to fetch Reddit posts:', error);
          setPosts([]);
        } finally {
          setIsLoadingPosts(false);
        }
      };
      fetchPosts();
    }
  }, [initialPosts, useReddit]);

  // Fetch Le Monde article when switching to Le Monde mode
  useEffect(() => {
    if (!useReddit && !currentLeMondeArticle) {
      const fetchLeMondeArticle = async () => {
        setIsLoadingLeMondeArticle(true);
        try {
          const article = await getRandomLeMondeArticle();
          setCurrentLeMondeArticle(article);
        } catch (error) {
          console.error('Failed to fetch Le Monde article:', error);
          setCurrentLeMondeArticle(null);
        } finally {
          setIsLoadingLeMondeArticle(false);
        }
      };
      fetchLeMondeArticle();
    }
  }, [useReddit, currentLeMondeArticle]);

  useEffect(() => {
    if (currentArticle) {
      const fetchTokenization = async () => {
        setIsTokenizing(true);
        setTokenizationResult(null);
        setTokenizationError(null);
        try {
          const response = await fetch('/api/tokenize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: currentArticle.content,
              parameters: {
                mode: 'full',
                include_entities: true,
                include_pos: true,
                include_lemmas: true,
                include_dependencies: true
              }
            }),
          });
          const data = (await response.json())[0];
          console.log("Tokenization result:", data);

          if (!response.ok) {
            throw new Error(data.error || 'Failed to tokenize content (server response not OK)');
          }
          // Even if response.ok, the Hugging Face API might return an error structure
          // or a success structure that doesn't contain tokens (e.g. model loading message)
          if (!data.tokens || !Array.isArray(data.tokens)) {
            console.error("Tokenization successful but tokens are missing or not an array:", data);
            throw new Error(data.error || 'Tokenization API returned unexpected payload.');
          }
          setTokenizationResult(data);
        } catch (error) {
          console.error("Tokenization error in ArticleLoader:", error);
          setTokenizationError(error instanceof Error ? error.message : String(error));
          setTokenizationResult(null);
        } finally {
          setIsTokenizing(false);
        }
      };
      fetchTokenization();
    } else {
      setTokenizationResult(null); 
      setTokenizationError(null);
    }
  }, [currentArticle]);

  const handleNextArticle = async () => {
    if (useReddit) {
      // Reddit mode: cycle through cached posts
      setCurrentPostIndex((prev) => (prev + 1) % posts.length);
    } else {
      // Le Monde mode: fetch a new random article
      setIsLoadingLeMondeArticle(true);
      try {
        const newArticle = await getRandomLeMondeArticle();
        setCurrentLeMondeArticle(newArticle);
      } catch (error) {
        console.error('Failed to fetch next Le Monde article:', error);
      } finally {
        setIsLoadingLeMondeArticle(false);
      }
    }
    setTokenizationResult(null);
    setTokenizationError(null);
  };

  // Helper function to update word stats
  const updateWordStats = (word: string, wasCorrect: boolean) => {
    const stats = getWordStats();
    const [total, correct] = stats[word] || [0, 0];
    stats[word] = [total + 1, correct + (wasCorrect ? 1 : 0)];
    localStorage.setItem('vocabStats', JSON.stringify(stats));
    setWordStats(stats);
  }

  if (isLoadingPosts || isLoadingLeMondeArticle) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm text-center">
        <p className="text-gray-600">
          {useReddit ? 'Loading articles...' : 'Loading Le Monde article...'}
        </p>
      </div>
    );
  }

  if (useReddit && posts.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm text-center">
        <p className="text-gray-600">No Reddit articles available at the moment. Please try again later.</p>
      </div>
    );
  }

  if (!useReddit && !currentLeMondeArticle) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm text-center">
        <p className="text-gray-600">No Le Monde article available at the moment. Please try again later.</p>
      </div>
    );
  }

  if (!currentArticle) {
    return <p>Loading article...</p>;
  }

  return (
    <div>
      <div className="flex gap-6">
        <div className={`transition-all duration-300 ${isSidebarPanelOpen ? 'flex-grow' : 'flex-grow-0'}`}>
          {/* Article Container */}
          <div style={{ backgroundColor: '#f8f7f2' }}>
            
            {/* Article Title Section */}
            <div className="p-6 border-b border-gray-300" style={{ backgroundColor: '#f8f7f2' }}>
              <div className="border-l-4 border-[#2f2f2f] pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair-display)', color: '#2f2f2f' }}>
                    {currentArticle.title}
                  </h2>
                  <span className={`px-2 py-1 text-xs rounded-full ${useReddit ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                    {useReddit ? 'Reddit' : 'Le Monde'}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 space-x-2" style={{ fontFamily: 'var(--font-crimson-text)' }}>
                  <span>By {currentArticle.author}</span>
                  <span>•</span>
                  {useReddit && currentArticle.score && (
                    <>
                      <span>{currentArticle.score} points</span>
                      <span>•</span>
                    </>
                  )}
                  {!useReddit && currentArticle.publishDate && (
                    <>
                      <span>{currentArticle.publishDate}</span>
                      <span>•</span>
                    </>
                  )}
                  <a 
                    href={currentArticle.url}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {useReddit ? 'View on Reddit' : 'View on Le Monde'}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* VocabCanvas */}
            {isTokenizing && (
              <div className="p-6 text-center text-gray-500" style={{ backgroundColor: '#f8f7f2', fontFamily: 'var(--font-crimson-text)' }}>
                Tokenizing article...
              </div>
            )}
            
            {tokenizationError && (
              <div className="p-6 text-center text-red-500" style={{ backgroundColor: '#f8f7f2', fontFamily: 'var(--font-crimson-text)' }}>
                <p>Error tokenizing article:</p>
                <p className="text-sm">{tokenizationError}</p>
              </div>
            )}

            {!isTokenizing && !tokenizationError && tokenizationResult && (
              <VocabCanvas 
                key={currentArticle.url} 
                content={currentArticle.content}
                tokenizationInfo={tokenizationResult}
                updateWordStats={updateWordStats} 
                isLearningMode={isLearningMode}
                setIsLearningMode={setIsLearningMode as Dispatch<boolean>}
              />
            )}
            
            {!isTokenizing && !tokenizationError && !tokenizationResult && (
              <div className="p-6 text-center text-gray-500" style={{ backgroundColor: '#f8f7f2', fontFamily: 'var(--font-crimson-text)' }}>
                Loading tokenized data or no data available.
              </div>
            )}

            {/* Newspaper Footer */}
            <div className="border-t-2 border-black p-6" style={{ backgroundColor: '#f8f7f2' }}>
              {/* Learning Stats Panel */}
              {/* <div className="border border-gray-400 p-4 bg-white inline-block">
                <h3 className="font-bold text-sm mb-2 border-b border-gray-400 pb-1" style={{ fontFamily: 'var(--font-playfair-display)', color: '#2f2f2f' }}>
                  LEARNING STATS
                </h3>
                <div className="text-xs" style={{ fontFamily: 'var(--font-crimson-text)', color: '#2f2f2f' }}>
                  <p>Mode: {isLearningMode ? 'Learning' : 'Review'}</p>
                  <p>Words in article: {wordCount}</p>
                  <p>Total vocabulary: {isWordStatsLoaded ? Object.keys(wordStats).length : '...'} words</p>
                </div>
              </div> */}
              
              <div className="mt-4 text-center">
                <button
                  onClick={handleNextArticle}
                  className="flex items-center mx-auto px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                  style={{ fontFamily: 'var(--font-crimson-text)' }}
                >
                  Next Article
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Newspaper Bottom Border */}
              <div className="mt-4 pt-4 border-t border-black text-center">
                <p className="text-xs text-gray-600" style={{ fontFamily: 'var(--font-crimson-text)' }}>
                  © 2024 The Vocab Herald • All rights reserved • Printed on recycled pixels
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`transition-all duration-300 ${isSidebarPanelOpen ? 'w-64' : 'w-8'} shrink-0 relative`}>
          {/* Always Visible Toggle Button */}
          <button
            onClick={() => setIsSidebarPanelOpen(!isSidebarPanelOpen)}
            className={`w-full p-2 hover:bg-gray-200 transition-colors ${isSidebarPanelOpen ? 'mb-2' : ''}`}
            style={{ fontFamily: 'var(--font-playfair-display)' }}
          >
            <div className="flex justify-center items-center">
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarPanelOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </div>
          </button>
          
          {/* Sidebar Content - Only shown when open */}
          {isSidebarPanelOpen && (
            <div className="w-64 overflow-hidden">
              <InstructionPane isLearningMode={isLearningMode} />
              <OptionsPane
                useReddit={useReddit}
                autoNav={autoNav}
                onUseRedditChange={setUseReddit}
                onAutoNavChange={setAutoNav}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 transition-all duration-300">
        {/* Vocabulary Statistics Panel */}
        <button
          onClick={() => setIsVocabStatsOpen(!isVocabStatsOpen)}
          className="w-full p-4 text-left hover:bg-gray-200 transition-colors"
          style={{ fontFamily: 'var(--font-playfair-display)' }}
        >
          <div className="flex justify-center items-center">
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${isVocabStatsOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div className={`transition-all duration-300 overflow-hidden ${isVocabStatsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div 
            className="p-1 max-h-80 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #9ca3af;
              }
            `}</style>
            <VocabStats wordStats={wordStats} />
          </div>
        </div>
      </div>
    </div>
  );
} 