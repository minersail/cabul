'use client';

import { useState, useEffect, Dispatch } from "react";
import VocabCanvas from "./VocabCanvas";
import VocabStats from "./VocabStats";
import InstructionPane from "./InstructionPane";
import { SpaCyTokenizationResponse } from "@/types/tokenization";

interface RedditPost {
  title: string;
  content: string;
  url: string;
  score: number;
  author: string;
}

interface ArticleLoaderProps {
  posts: RedditPost[];
}

// Type for our word stats
type WordStats = [number, number]; // [total encounters, correct attempts]

// Helper function to get word stats from localStorage
function getWordStats(): Record<string, WordStats> {
  if (typeof window === 'undefined') return {};
  const stats = localStorage.getItem('vocabStats');
  return stats ? JSON.parse(stats) : {};
}

export default function ArticleLoader({ posts }: ArticleLoaderProps) {
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [wordStats, setWordStats] = useState<Record<string, WordStats>>(getWordStats());
  const [enableCompositionality, setEnableCompositionality] = useState(false);
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [tokenizationResult, setTokenizationResult] = useState<SpaCyTokenizationResponse | null>(null);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [tokenizationError, setTokenizationError] = useState<string | null>(null);

  const currentPost = posts.length > 0 ? posts[currentPostIndex] : null;

  useEffect(() => {
    if (currentPost) {
      const fetchTokenization = async () => {
        setIsTokenizing(true);
        setTokenizationResult(null);
        setTokenizationError(null);
        try {
          const response = await fetch('/api/tokenize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: currentPost.content,
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
  }, [currentPost]);

  const handleNextArticle = () => {
    setCurrentPostIndex((prev) => (prev + 1) % posts.length);
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

  if (posts.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm text-center">
        <p className="text-gray-600">No articles available at the moment. Please try again later.</p>
      </div>
    );
  }
  
  if (!currentPost) {
    return <p>Loading post...</p>;
  }

  return (
    <div>
      <div className="flex gap-6">
        <div className="flex-grow">
          <div className="relative">
            {/* Article Header */}
            <div className="p-6 bg-white rounded-t-lg shadow-sm border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">{currentPost.title}</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Article {currentPostIndex + 1} of {posts.length}</span>
                </div>
              </div>
            </div>

            {/* VocabCanvas */}
            {isTokenizing && <div className="p-6 text-center text-gray-500">Tokenizing article...</div>}
            
            {tokenizationError && (
              <div className="p-6 text-center text-red-500">
                <p>Error tokenizing article:</p>
                <p className="text-sm">{tokenizationError}</p>
              </div>
            )}

            {!isTokenizing && !tokenizationError && tokenizationResult && (
              <VocabCanvas 
                key={currentPostIndex} 
                content={currentPost.content}
                tokenizationInfo={tokenizationResult}
                updateWordStats={updateWordStats} 
                enableCompositionality={enableCompositionality} 
                isLearningMode={isLearningMode}
                setIsLearningMode={setIsLearningMode as Dispatch<boolean>}
              />
            )}
            
            {!isTokenizing && !tokenizationError && !tokenizationResult && (
                 <div className="p-6 text-center text-gray-500">Loading tokenized data or no data available.</div>
            )}

            {/* Article Footer */}
            <div className="p-4 bg-white rounded-b-lg shadow-sm border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500 space-x-2">
                  <span>Posted by {currentPost.author}</span>
                  <span>•</span>
                  <span>{currentPost.score} points</span>
                  <a 
                    href={currentPost.url}
                    className="ml-2 text-blue-500 hover:text-blue-600 flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Reddit 
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <button
                  onClick={handleNextArticle}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                >
                  Next Article
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <InstructionPane 
          enableCompositionality={enableCompositionality}
          isLearningMode={isLearningMode}
        />
      </div>

      <div className="mt-6">
        <VocabStats wordStats={wordStats} />
      </div>
    </div>
  );
} 