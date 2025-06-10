'use client';

import React, { useReducer } from "react";
import VocabToken from "./VocabToken";
import { SpaCyTokenizationResponse } from "@/types/tokenization";
import { canvasReducer, initialState } from "@/reducers/vocabCanvasReducer";
import { getCurrentTokenStyle, isTokenLearnable, getLearnableWords } from "@/utils/tokenization";
import { useInput } from "@/hooks/useInput";

interface VocabCanvasProps {
  content: string;
  tokenizationInfo: SpaCyTokenizationResponse;
  updateWordStats: (word: string, wasCorrect: boolean) => Promise<void>;
  isLearningMode: boolean;
  setIsLearningMode: React.Dispatch<boolean>;
}

export default function VocabCanvas({ 
  tokenizationInfo,
  updateWordStats,
  isLearningMode,
  setIsLearningMode
}: VocabCanvasProps) {
  if (!tokenizationInfo || !tokenizationInfo.tokens || !Array.isArray(tokenizationInfo.tokens)) {
    console.error("VocabCanvas rendered with invalid tokenizationInfo.tokens", tokenizationInfo);
  }

  const [state, dispatch] = useReducer(canvasReducer, initialState);

  const allTokens = tokenizationInfo.tokens;  
  const learnableWords = getLearnableWords(allTokens);
  const wordCount = learnableWords.length;

  // Handler for clicking on learned tokens
  const handleTokenClick = (learnableWordIndex: number) => {
    // Only allow clicking on learned tokens (those before furthestWordIndex)
    if (learnableWordIndex < state.furthestWordIndex) {
      dispatch({ type: 'NAVIGATE_TO_INDEX', payload: { index: learnableWordIndex } });
    }
  };

  useInput(isLearningMode, {
    currentWordIndex: state.currentWordIndex,
    furthestWordIndex: state.furthestWordIndex,
    tokenizationInfo,
    dispatch,
    updateWordStats,
    setIsLearningMode
  });

  if (!tokenizationInfo || !allTokens || allTokens.length === 0) {
    return (
      <div className="flex-grow relative">
        <div className="p-6 min-h-96 flex items-center justify-center" style={{ backgroundColor: '#f8f7f2', color: '#2f2f2f' }}>
          <div className="text-center text-gray-500" style={{ fontFamily: 'var(--font-crimson-text)' }}>
            Article content not yet available or empty.
          </div>
        </div>
      </div>
    );
  }

  const renderedTextElements = []; 
  for (let i = 0; i < allTokens.length; i++) {
    const spacyToken = allTokens[i];
    const isCurrentFocusLearnableWord = 
      learnableWords[state.currentWordIndex]?.start === spacyToken.start &&
      learnableWords[state.currentWordIndex]?.end === spacyToken.end;

    let isLearnable = false;
    let learnableWordIndexInFilteredList = -1;

    if (isTokenLearnable(spacyToken)) {
      isLearnable = true;
      learnableWordIndexInFilteredList = learnableWords.findIndex(lw => lw.start === spacyToken.start && lw.end === spacyToken.end);
    }

    const isLearnedToken = isLearnable && learnableWordIndexInFilteredList < state.furthestWordIndex;

    renderedTextElements.push(
      <VocabToken
        key={`spacy-${spacyToken.start}-${i}`}
        spacyToken={spacyToken} 
        originalText={tokenizationInfo.text.substring(spacyToken.start, spacyToken.end)} 
        isCurrentWord={isCurrentFocusLearnableWord} 
        className={getCurrentTokenStyle(
          isLearnable, 
          learnableWordIndexInFilteredList, 
          state.currentWordIndex,
          state.furthestWordIndex, 
          state.uiState.flashState
        )}
        showInformation={state.uiState.showInformation && isCurrentFocusLearnableWord}
        tokenInfo={state.result} 
        isLoading={state.uiState.isLoading && isCurrentFocusLearnableWord}
        isClickable={isLearnedToken}
        onTokenClick={() => handleTokenClick(learnableWordIndexInFilteredList)}
      />
    );

    if (i < allTokens.length - 1) {
      const nextSpacyToken = allTokens[i+1];
      if (nextSpacyToken.start > spacyToken.end) {
        const spaceText = tokenizationInfo.text.substring(spacyToken.end, nextSpacyToken.start);
        renderedTextElements.push(<span key={`space-${spacyToken.end}-${i}`}>{spaceText}</span>);
      }
    }
  }
  
  return (
    <div className="flex-grow relative">
      {/* Main Article Content */}
      <div className="p-6" style={{ backgroundColor: '#f8f7f2', color: '#2f2f2f' }}>

        {/* Single Column Article Content */}
        <div className="text-base leading-relaxed text-justify" style={{ fontFamily: 'var(--font-crimson-text)', color: '#2f2f2f' }}>
          <div className="whitespace-pre-wrap">
            {renderedTextElements}
          </div>
        </div>
      </div>      
        
      {/* Progress Bar */}
      <div className="bg-black text-white py-1 px-4">
        <div className="flex justify-between items-center text-xs font-bold" style={{ fontFamily: 'var(--font-crimson-text)' }}>
          <span>LEARNING PROGRESS</span>
          <span>Words: {wordCount} • Tokens: {allTokens.length}</span>
        </div>
        <div className="mt-1 h-1 bg-gray-600 rounded-sm overflow-hidden">
          <div 
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${(state.furthestWordIndex / wordCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
} 