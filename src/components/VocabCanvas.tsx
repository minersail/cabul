'use client';

import React, { useReducer } from "react";
import VocabToken from "./VocabToken";
import { SpaCyTokenizationResponse, SpaCyToken } from "@/types/tokenization";
import { canvasReducer, initialState } from "@/reducers/vocabCanvasReducer";
import { useKeyboardNavigation } from "@/utils/canvasInput";
import { getCurrentTokenStyle, isTokenLearnable, getLearnableWords } from "@/utils/tokenization";

interface VocabCanvasProps {
  content: string;
  tokenizationInfo: SpaCyTokenizationResponse;
  updateWordStats: (word: string, wasCorrect: boolean) => void;
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
    return <div className="p-6 text-center text-red-500">Error: Invalid token data received.</div>;
  }

  const [state, dispatch] = useReducer(canvasReducer, initialState);

  const allTokens = tokenizationInfo.tokens;  
  const learnableWords = getLearnableWords(allTokens);
  const wordCount = learnableWords.length;

  useKeyboardNavigation(isLearningMode, {
    currentWordIndex: state.currentWordIndex,
    tokenizationInfo,
    dispatch,
    updateWordStats,
    setIsLearningMode
  });

  if (!tokenizationInfo || !allTokens || allTokens.length === 0) {
    return <div className="p-6 text-center text-gray-500">Article content not yet available or empty.</div>;
  }

  let renderedTextElements = []; 
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
          state.uiState.flashState
        )}
        showInformation={state.uiState.showInformation && isCurrentFocusLearnableWord}
        tokenInfo={state.result} 
        isLoading={state.uiState.isLoading && isCurrentFocusLearnableWord}
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
      <div className="relative p-6 bg-gray-50 rounded-lg font-serif text-lg leading-relaxed">
        <div className="absolute top-2 right-2 text-sm text-gray-500">
          Word {wordCount > 0 ? state.currentWordIndex + 1 : 0} of {wordCount} 
          (Tokens: {allTokens.length})
        </div>
        <div className="mt-4 whitespace-pre-wrap">
          {renderedTextElements}
        </div>
        
        <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: wordCount > 0 ? `${(state.currentWordIndex / Math.max(1, wordCount -1)) * 100}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
} 