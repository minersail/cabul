'use client';

import { useEffect, useReducer, useState } from "react";
import VocabCanvas from "./VocabCanvas";
import VocabStats from "./VocabStats";
import InstructionPane from "./InstructionPane";
import OptionsPane from "./OptionsPane";
import CollapsiblePanel from "./CollapsiblePanel";
import ArticleHeader from "./ArticleHeader";
import ArticleFooter from "./ArticleFooter";
import { tokenizeText, saveCurrentArticle, updateWordStats } from "@/services/loaderService";
import { articleLoaderReducer, initialState, Message } from "@/reducers/articleLoaderReducer";
import { useAuth } from '@/hooks/useAuth';
import { useUserConfig } from '@/hooks/useUserConfig';
import { useArticleCache } from '@/hooks/useArticleCache';
import { useOptionsConfig } from '@/hooks/useOptionsConfig';

function getErrorStyle(message: Message): string {
  return message.error ? "text-red-500" : "text-gray-500";
}

export default function ArticleLoader() {
  const [state, dispatch] = useReducer(articleLoaderReducer, initialState);
  const { user } = useAuth();
  const { config: userConfig, updateConfig } = useUserConfig();

  // Helper function to get current cache info
  const getCurrentCacheInfo = (source: string) => {
    switch (source) {
      case 'reddit': 
        return {
          currentIndex: state.articles.redditCache.currentIndex,
          totalCount: state.articles.redditCache.articles.length
        };
      case 'lemonde': 
        return {
          currentIndex: state.articles.leMondeCache.currentIndex,
          totalCount: state.articles.leMondeCache.articles.length
        };
      case 'scriptslug': 
        return {
          currentIndex: state.articles.scriptSlugCache.currentIndex,
          totalCount: state.articles.scriptSlugCache.articles.length
        };
      default: 
        return { currentIndex: 0, totalCount: 0 };
    }
  };
  
  // Simple trigger that increments when vocabulary changes
  const [vocabularyUpdateTrigger, setVocabularyUpdateTrigger] = useState(0);

  // Use custom hook for article loading
  const { currentArticle, loadNewArticle } = useArticleCache({
    userConfig,
    dispatch,
    state
  });

  // Use custom hook for options configuration
  const optionsConfig = useOptionsConfig({ userConfig, updateConfig });

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

  // Helper function to update word stats - wrapper for service function
  const handleUpdateWordStats = async (word: string, wasCorrect: boolean, translation?: string) => {
    if (!user) {
      console.warn('No user found, cannot update word stats');
      return;
    }

    await updateWordStats(
      user.id,
      word,
      wasCorrect,
      state.tokenizationResult,
      translation,
      () => setVocabularyUpdateTrigger(prev => prev + 1)
    );
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
                <ArticleHeader
                  article={currentArticle}
                  articleSource={userConfig?.articleSource || 'reddit'}
                  isSaving={state.uiState.isSaving}
                  saveMessage={state.uiState.saveMessage}
                  onSave={(article) => saveCurrentArticle(article, dispatch)}
                />

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
                  updateWordStats={handleUpdateWordStats} 
                  isLearningMode={state.isLearningMode}
                  setIsLearningMode={(mode: boolean) => dispatch({ type: 'SET_LEARNING_MODE', payload: { isLearningMode: mode } })}
                />
              )}
              </div>
            )}
            
            <ArticleFooter
              articleSource={userConfig?.articleSource || 'reddit'}
              isLoading={state.uiState.isLoading}
              currentPosition={getCurrentCacheInfo(userConfig?.articleSource || 'reddit').currentIndex}
              totalCount={getCurrentCacheInfo(userConfig?.articleSource || 'reddit').totalCount}
              onNextArticle={() => dispatch({ type: 'NEXT_POST', payload: { articleSource: userConfig?.articleSource || 'reddit' } })}
              onLoadNewArticle={loadNewArticle}
            />
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