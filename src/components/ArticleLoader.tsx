'use client';

import { useEffect, useReducer } from "react";
import VocabCanvas from "./VocabCanvas";
import VocabStats from "./VocabStats";
import InstructionPane from "./InstructionPane";
import OptionsPane from "./OptionsPane";
import CollapsiblePanel from "./CollapsiblePanel";
import { tokenizeText, getRedditPosts, getRandomLeMondeArticle, isErrorMessage } from "@/utils/fetchApi";
import { Article } from "@/types/articles";
import { ArticleCache, articleLoaderReducer, ArticleSource, initialState, Message, WordStats } from "@/reducers/articleLoaderReducer";

// Helper function to get word stats from localStorage
function getWordStats(): Record<string, WordStats> {
  if (typeof window === 'undefined') return {};
  const stats = localStorage.getItem('vocabStats');
  return stats ? JSON.parse(stats) : {};
}

function getCurrentArticle(cache: ArticleCache<Article>): Article | null {
  return (cache.articles.length > 0 && cache.currentIndex < cache.articles.length) ? 
    cache.articles[cache.currentIndex] : null;
}

function getErrorStyle(message: Message): string {
  return message.error ? "text-red-500" : "text-gray-500";
}

export const MAX_LEMONDE_ARTICLES = 10;

export default function ArticleLoader() {
  const [state, dispatch] = useReducer(articleLoaderReducer, initialState);

  // Will return null and trigger a fetch if no article is cached
  const currentArticle: Article | null = getCurrentArticle(state.userConfig.articleSource === 'reddit' ? state.articles.redditCache : state.articles.leMondeCache);

  // Load word stats from localStorage after component mounts to avoid hydration issues
  useEffect(() => {
    const stats = getWordStats();
    dispatch({ type: 'SET_WORD_STATS', payload: { stats } });
  }, []);

  // Lazily load articles
  useEffect(() => {
    if (currentArticle === null) {
      const fetchArticles = async () => {
        dispatch({ type: 'START_LOADING' });
        
        if (state.userConfig.articleSource === 'reddit') {
          const result = await getRedditPosts();
          if (isErrorMessage(result)) {
            dispatch({ type: 'LOAD_ERROR', payload: { error: result.error } });
          } else {
            dispatch({ type: 'REDDIT_LOADED', payload: { posts: result } });
          }
        } else {
          const result = await getRandomLeMondeArticle();
          if (isErrorMessage(result)) {
            dispatch({ type: 'LOAD_ERROR', payload: { error: result.error } });
          } else {
            dispatch({ type: 'LEMONDE_LOADED', payload: { article: result } });
          }
        }
      };
      fetchArticles();
    }
  }, [state.userConfig.articleSource, currentArticle]);

  // Tokenization effect
  useEffect(() => {
    if (currentArticle) {
      const fetchTokenization = async () => {
        dispatch({ type: 'START_TOKENIZING' });
        
        const result = await tokenizeText(currentArticle.content);
        
        if (result.error) {
          dispatch({ type: 'TOKENIZE_ERROR', payload: { error: result.error } });
        } else {
          dispatch({ type: 'TOKENIZED', payload: { result } });
        }
      };
      fetchTokenization();
    }
  }, [currentArticle]);

  // Helper function to update word stats
  const updateWordStats = (word: string, wasCorrect: boolean) => {
    dispatch({ type: 'UPDATE_WORD_STATS', payload: { word, wasCorrect } });
  }

  console.log(state);

  return (
    <div>
      <div className="flex gap-6">
        <div className={`transition-all duration-300 flex-grow`}>
          {state.uiState.isLoading && (
            <div className={`p-6 text-center ${getErrorStyle(state.uiState.loadMessage)}`} style={{ backgroundColor: '#f8f7f2', fontFamily: 'var(--font-crimson-text)' }}>
              {state.uiState.loadMessage.message}
            </div>
          )}

          {/* Article Container */}
          { !state.uiState.isLoading && currentArticle !== null && (
            <div style={{ backgroundColor: '#f8f7f2' }}>
              
              {/* Article Title Section */}
              <div className="p-6 border-b border-gray-300" style={{ backgroundColor: '#f8f7f2' }}>
                <div className="border-l-4 border-[#2f2f2f] pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair-display)', color: '#2f2f2f' }}>
                      {currentArticle.title}
                    </h2>
                    <span className={`px-2 py-1 text-xs rounded-full ${state.userConfig.articleSource === 'reddit' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                      {state.userConfig.articleSource === 'reddit' ? 'Reddit' : 'Le Monde'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 space-x-2" style={{ fontFamily: 'var(--font-crimson-text)' }}>
                    <span>By {currentArticle.author}</span>
                    <span>•</span>
                    {currentArticle.type === 'reddit' && (
                      <>
                        <span>{currentArticle.score} points</span>
                        <span>•</span>
                      </>
                    )}
                    {currentArticle.type === 'lemonde' && (
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
                      {currentArticle.type === 'reddit' ? 'View on Reddit' : 'View on Le Monde'}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* VocabCanvas */}
              {state.uiState.isTokenizing && (
                <div className={`p-6 text-center ${getErrorStyle(state.uiState.tokenMessage)}`} style={{ backgroundColor: '#f8f7f2', fontFamily: 'var(--font-crimson-text)' }}>
                  {state.uiState.tokenMessage.message}
                </div>
              )}

              {!state.uiState.isTokenizing && state.tokenizationResult && (
                <VocabCanvas 
                  key={currentArticle.url} 
                  content={currentArticle.content}
                  tokenizationInfo={state.tokenizationResult}
                  updateWordStats={updateWordStats} 
                  isLearningMode={state.isLearningMode}
                  setIsLearningMode={(mode: boolean) => dispatch({ type: 'SET_LEARNING_MODE', payload: { isLearningMode: mode } })}
                />
              )}

              {/* Newspaper Footer */}
              <div className="border-t-2 border-black p-6" style={{ backgroundColor: '#f8f7f2' }}>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => dispatch({ type: 'NEXT_POST' })}
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
          )}
        </div>
        
        <CollapsiblePanel startOpen={true} direction="horizontal" arrowSize="sm">
          <InstructionPane isLearningMode={state.isLearningMode} />
          <OptionsPane
            articleSource={state.userConfig.articleSource}
            autoNav={state.userConfig.autoNav}
            onArticleSourceChange={(articleSource: ArticleSource) => dispatch({ type: 'UPDATE_USER_CONFIG', payload: { articleSource } })}
            onAutoNavChange={(autoNav: boolean) => dispatch({ type: 'UPDATE_USER_CONFIG', payload: { autoNav } })}
          />
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel direction="vertical" className="mt-6">
        <VocabStats wordStats={state.wordStats} />
      </CollapsiblePanel>
    </div>
  );
} 