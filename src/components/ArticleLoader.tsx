'use client';

import { useEffect, useReducer, useState, useMemo } from "react";
import VocabCanvas from "./VocabCanvas";
import VocabStats from "./VocabStats";
import InstructionPane from "./InstructionPane";
import OptionsPane, { OptionConfig } from "./OptionsPane";
import CollapsiblePanel from "./CollapsiblePanel";
import { tokenizeText, getRedditPosts, getRandomLeMondeArticle, getRandomScriptSlugScene, isErrorMessage, saveCurrentArticle } from "@/services/loaderService";
import { Article, articleDataToTypedArticle } from "@/types/articles";
import { ArticleCache, articleLoaderReducer, ArticleSource, initialState, Message } from "@/reducers/articleLoaderReducer";
import { addWordToVocabulary, recordMistake } from '@/lib/actions/vocabularyActions';
import { getArticlesBySource } from '@/lib/actions/articleActions';
import { useAuth } from '@/hooks/useAuth';
import { useUserConfig } from '@/hooks/useUserConfig';
import { getSourceLabel, getExternalLinkText, getSourceBadgeStyle } from '@/utils/articleSources';
import { getLearnableWords, getOriginalTextForToken, getSentenceContext } from '@/utils/tokenization';

function getCurrentArticle(cache: ArticleCache<Article>): Article | null {
  return (cache.articles.length > 0 && cache.currentIndex < cache.articles.length) ? 
    cache.articles[cache.currentIndex] : null;
}

function getErrorStyle(message: Message): string {
  return message.error ? "text-red-500" : "text-gray-500";
}

export const MAX_LEMONDE_ARTICLES = 3;

export default function ArticleLoader() {
  const [state, dispatch] = useReducer(articleLoaderReducer, initialState);
  const { user } = useAuth();
  const { config: userConfig, updateConfig } = useUserConfig();
  
  // Simple trigger that increments when vocabulary changes
  const [vocabularyUpdateTrigger, setVocabularyUpdateTrigger] = useState(0);

  // Get current cache based on selected source
  const getCurrentCache = () => {
    switch (userConfig.articleSource) {
      case 'reddit':
        return state.articles.redditCache;
      case 'lemonde':
        return state.articles.leMondeCache;
      case 'scriptslug':
        return state.articles.scriptSlugCache;
      default:
        return state.articles.redditCache;
    }
  };

  // Will return null and trigger a fetch if no article is cached
  const currentArticle: Article | null = getCurrentArticle(getCurrentCache());

  // Create dynamic options configuration
  const optionsConfig: OptionConfig[] = useMemo(() => [
    {
      id: 'articleSource',
      label: 'Article Source',
      type: 'select',
      value: userConfig.articleSource,
      onChange: (value: ArticleSource) => updateConfig('articleSource', value),
      options: [
        { value: 'reddit', label: 'Reddit Posts' },
        { value: 'lemonde', label: 'Le Monde Articles' },
        { value: 'scriptslug', label: 'Movie Scripts' }
      ]
    },
    {
      id: 'autoScroll',
      label: 'Auto Scroll',
      type: 'boolean',
      value: userConfig.autoScroll,
      onChange: (value: boolean) => updateConfig('autoScroll', value)
    }
  ], [userConfig.articleSource, userConfig.autoScroll, updateConfig]);

  // Load database articles on component mount and source change
  useEffect(() => {
    const loadDatabaseArticles = async () => {
      const currentCache = getCurrentCache();
      
      // Only load from database if we haven't already
      if (!currentCache.hasLoadedFromDatabase) {
        try {
          const result = await getArticlesBySource(userConfig.articleSource);
          if (result.success) {
            const typedArticles = result.data.map(articleDataToTypedArticle);
            
            // Filter and type articles based on source
            if (userConfig.articleSource === 'reddit') {
              const filteredArticles = typedArticles.filter(article => article.type === 'reddit');
              dispatch({
                type: 'DATABASE_ARTICLES_LOADED',
                payload: {
                  articles: filteredArticles,
                  source: userConfig.articleSource
                }
              });
            } else if (userConfig.articleSource === 'lemonde') {
              const filteredArticles = typedArticles.filter(article => article.type === 'lemonde');
              dispatch({
                type: 'DATABASE_ARTICLES_LOADED',
                payload: {
                  articles: filteredArticles,
                  source: userConfig.articleSource
                }
              });
            } else if (userConfig.articleSource === 'scriptslug') {
              const filteredArticles = typedArticles.filter(article => article.type === 'scriptslug');
              dispatch({
                type: 'DATABASE_ARTICLES_LOADED',
                payload: {
                  articles: filteredArticles,
                  source: userConfig.articleSource
                }
              });
            }
          }
        } catch (error) {
          dispatch({ type: 'LOAD_ERROR', payload: { error: 'Error loading articles from database' } });
          console.error('Error loading database articles:', error);
        }
      }
    };

    loadDatabaseArticles();
  }, [userConfig.articleSource, getCurrentCache().hasLoadedFromDatabase]);

  // Lazily load articles from APIs
  useEffect(() => {
    if (currentArticle === null) {
      const fetchArticles = async () => {
        dispatch({ type: 'START_LOADING' });
        
        if (userConfig.articleSource === 'reddit') {
          // For Reddit: load from API and concatenate with database articles
          const result = await getRedditPosts();
          if (isErrorMessage(result)) {
            dispatch({ type: 'LOAD_ERROR', payload: { error: result.error } });
          } else {
            dispatch({ type: 'REDDIT_LOADED', payload: { posts: result } });
          }
        } else if (userConfig.articleSource === 'lemonde') {
          // For Le Monde: only load from API if database is empty
          const currentCache = getCurrentCache();
          if (currentCache.hasLoadedFromDatabase && currentCache.articles.length === 0) {
            const result = await getRandomLeMondeArticle();
            if (isErrorMessage(result)) {
              dispatch({ type: 'LOAD_ERROR', payload: { error: result.error } });
            } else {
              dispatch({ type: 'LEMONDE_LOADED', payload: { article: result } });
            }
          }
        } else if (userConfig.articleSource === 'scriptslug') {
          // For ScriptSlug: always load new scenes from API (they're random)
          const result = await getRandomScriptSlugScene();
          if (isErrorMessage(result)) {
            dispatch({ type: 'LOAD_ERROR', payload: { error: result.error } });
          } else {
            dispatch({ type: 'SCRIPTSLUG_LOADED', payload: { scene: result } });
          }
        }
      };
      fetchArticles();
    }
  }, [userConfig.articleSource, currentArticle, dispatch]);

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

  // Helper function to update word stats - now saves directly to database
  const updateWordStats = async (word: string, wasCorrect: boolean) => {
    if (!user) {
      console.warn('No user found, cannot update word stats');
      return;
    }

    try {
      // Update vocabulary stats
      const vocabResult = await addWordToVocabulary(user.id, word, wasCorrect);
      
      if (!vocabResult.success) {
        console.error('Error updating word stats:', vocabResult.error);
        return;
      }

      // If the answer was incorrect, also record it as a mistake
      if (!wasCorrect && state.tokenizationResult) {
        // Find the token information for this word
        const learnableWords = getLearnableWords(state.tokenizationResult.tokens);
        const currentWordIndex = learnableWords.findIndex(token => 
          getOriginalTextForToken(state.tokenizationResult!.text, token).toLowerCase() === word.toLowerCase()
        );
        
        if (currentWordIndex !== -1) {
          const currentToken = learnableWords[currentWordIndex];
          const tokenText = getOriginalTextForToken(state.tokenizationResult.text, currentToken);
          // Record the mistake with token details (only if we have required token info)
          if (currentToken.lemma && currentToken.pos) {
            const mistakeResult = await recordMistake(
              user.id,
              tokenText,
              currentToken.lemma,
              currentToken.pos,
              getSentenceContext(state.tokenizationResult.text, state.tokenizationResult.sentences || [], currentToken)
            );
            
            if (!mistakeResult.success) {
              console.error('Error recording mistake:', mistakeResult.error);
            }
          }
        }
      }

      // Trigger vocabulary refresh by incrementing the trigger
      setVocabularyUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating word stats:', error);
    }
  };

  // Handler for loading a random Le Monde article
  const loadRandomLeMondeArticle = async () => {
    dispatch({ type: 'START_LOADING' });
    
    const result = await getRandomLeMondeArticle();
    if (isErrorMessage(result)) {
      dispatch({ type: 'LOAD_ERROR', payload: { error: result.error } });
    } else {
      dispatch({ type: 'LEMONDE_LOADED', payload: { article: result } });
    }
  };

  // Handler for loading a new ScriptSlug scene
  const loadRandomScriptSlugScene = async () => {
    dispatch({ type: 'START_LOADING' });
    
    const result = await getRandomScriptSlugScene();
    if (isErrorMessage(result)) {
      dispatch({ type: 'LOAD_ERROR', payload: { error: result.error } });
    } else {
      dispatch({ type: 'SCRIPTSLUG_LOADED', payload: { scene: result } });
    }
  };

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
          <div style={{ backgroundColor: '#f8f7f2' }}>
            { !state.uiState.isLoading && currentArticle !== null && (
              <div>
                {/* Article Title Section */}
                <div className="p-6 border-b border-gray-300" style={{ backgroundColor: '#f8f7f2' }}>
                <div className="border-l-4 border-[#2f2f2f] pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair-display)', color: '#2f2f2f' }}>
                      {currentArticle.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getSourceBadgeStyle(userConfig.articleSource)}`}>
                        {getSourceLabel(userConfig.articleSource)}
                      </span>
                      <button
                        onClick={() => saveCurrentArticle(currentArticle, dispatch)}
                        disabled={state.uiState.isSaving || !!currentArticle.articleId}
                        className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                        title={
                          currentArticle.articleId 
                            ? 'Article already saved' 
                            : state.uiState.isSaving 
                              ? 'Saving article...' 
                              : 'Save article to library'
                        }
                      >
                        {state.uiState.isSaving ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : currentArticle.articleId ? (
                          // Filled bookmark for saved articles
                          <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        ) : (
                          // Empty bookmark for unsaved articles
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Save message display */}
                  {state.uiState.saveMessage.message && (
                    <div className={`text-xs mb-2 ${state.uiState.saveMessage.error ? 'text-red-600' : 'text-gray-400'}`}>
                      {state.uiState.saveMessage.message}
                    </div>
                  )}
                  
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
                    {currentArticle.type === 'scriptslug' && (
                      <>
                        <span>{currentArticle.sceneHeader}</span>
                        <span>•</span>
                        <span>{currentArticle.sceneIndex} of {currentArticle.totalScenes} scenes</span>
                        <span>•</span>
                      </>
                    )}
                    <a 
                      href={currentArticle.url}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {getExternalLinkText(userConfig.articleSource)}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* VocabCanvas */}
              {state.uiState.tokenMessage.error && (
                <div className={`p-6 text-center ${getErrorStyle(state.uiState.tokenMessage)}`} style={{ backgroundColor: '#f8f7f2', fontFamily: 'var(--font-crimson-text)' }}>
                  {state.uiState.tokenMessage.message}
                </div>
              )}

              {!state.uiState.isTokenizing && !state.uiState.tokenMessage.error && state.tokenizationResult && (
                <VocabCanvas 
                  key={currentArticle.url} 
                  content={currentArticle.content}
                  tokenizationInfo={state.tokenizationResult}
                  updateWordStats={updateWordStats} 
                  isLearningMode={state.isLearningMode}
                  setIsLearningMode={(mode: boolean) => dispatch({ type: 'SET_LEARNING_MODE', payload: { isLearningMode: mode } })}
                />
              )}
              </div>
            )}
            {/* Newspaper Footer */}
            <div className="border-t-2 border-black p-6" style={{ backgroundColor: '#f8f7f2' }}>
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => dispatch({ type: 'NEXT_POST', payload: { articleSource: userConfig.articleSource } })}
                    className="flex items-center px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                    style={{ fontFamily: 'var(--font-crimson-text)' }}
                  >
                    Next Article
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {userConfig.articleSource === 'lemonde' && (
                    <button
                      onClick={loadRandomLeMondeArticle}
                      disabled={state.uiState.isLoading}
                      className="flex items-center px-6 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-crimson-text)' }}
                    >
                      Random Article
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}

                  {userConfig.articleSource === 'scriptslug' && (
                    <button
                      onClick={loadRandomScriptSlugScene}
                      disabled={state.uiState.isLoading}
                      className="flex items-center px-6 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                      style={{ fontFamily: 'var(--font-crimson-text)' }}
                    >
                      Random Scene
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
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
        
        <CollapsiblePanel startOpen={true} direction="horizontal" arrowSize="sm">
          <InstructionPane isLearningMode={state.isLearningMode} />
          <OptionsPane options={optionsConfig} />
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel direction="vertical" className="mt-6">
        <VocabStats refreshTrigger={vocabularyUpdateTrigger} />
      </CollapsiblePanel>
    </div>
  );
} 