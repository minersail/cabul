'use client';

import React, { useReducer, useEffect, useCallback, Dispatch } from "react";
import VocabToken, { TokenInformation } from "./VocabToken";
import { SpaCyTokenizationResponse, SpaCyToken } from "@/types/tokenization";
import { generateAllPhrases } from "@/utils/phrasing";
import { translateWord, translateSentence, lookupWiktionary } from "@/utils/fetchApi";
import { canvasReducer, initialState, CanvasState } from "@/reducers/vocabCanvasReducer";

type FlashType = 'none' | 'green' | 'red';

interface VocabCanvasProps {
  content: string;
  tokenizationInfo: SpaCyTokenizationResponse;
  updateWordStats: (word: string, wasCorrect: boolean) => void;
  isLearningMode: boolean;
  setIsLearningMode: Dispatch<boolean>;
}

function getCurrentTokenStyle(
  isWord: boolean, 
  currentWordCounter: number, 
  currentWordIndex: number, 
  flashState: FlashType
): string {
  let className = 'transition-all duration-200 ';
  
  if (!isWord) return className;
  
  if (currentWordCounter === currentWordIndex) {
    className += 'inline-block transform relative ';
    if (flashState === 'green') {
      className += 'bg-green-400 text-white px-1 rounded scale-110 ';
    } else if (flashState === 'red') {
      className += 'bg-red-400 text-white px-1 rounded scale-110 ';
    } else {
      className += 'bg-yellow-200 px-1 rounded scale-105 shadow-sm ';
    }
  } else if (currentWordCounter < currentWordIndex) {
    className += 'text-gray-400 ';
  }
  
  return className;
}

function isTokenLearnable(token: SpaCyToken): boolean {
  return !token.is_punct && !token.is_space;
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

  const processedTextFromApi = tokenizationInfo.text;
  const allTokens = tokenizationInfo.tokens;
  const allSentences = tokenizationInfo.sentences;
  
  const learnableWords = allTokens.filter(isTokenLearnable);
  const wordCount = learnableWords.length;

  const getOriginalTextForToken = useCallback((token: SpaCyToken): string => {
    if (!token || token.start === undefined || token.end === undefined) return '';
    return processedTextFromApi.substring(token.start, token.end);
  }, [processedTextFromApi]);

  const getSentenceContext = useCallback((token?: SpaCyToken): string => {
    if (!allSentences || !token) {
      return "";
    }

    const sentence = allSentences.find(sent => 
      token.start >= sent.start && token.end <= sent.end
    );
    
    return sentence ? processedTextFromApi.substring(sentence.start, sentence.end) : "";
  }, [allSentences, processedTextFromApi]);

  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (wordCount === 0 || (state.currentWordIndex >= wordCount && !(state.currentWordIndex === 0 && wordCount === 0)) ) {
        if(!(state.currentWordIndex === 0 && wordCount ===0)){ 
          return;
        }
      }
      
      const currentLearnableToken = wordCount > 0 ? learnableWords[state.currentWordIndex] : null;
      const currentWordText = currentLearnableToken ? getOriginalTextForToken(currentLearnableToken).toLowerCase() : "";

      if (isLearningMode) {
        if (event.code === 'KeyQ') {
          event.preventDefault();
          if (currentLearnableToken) {
            const sentenceContext = getSentenceContext(currentLearnableToken);
            if (sentenceContext) {
              dispatch({ type: 'LOAD_INFO', payload: { displayType: 'sentenceTranslation' } });
              const response = await translateSentence(sentenceContext);
              
              dispatch({ 
                type: 'TRANSLATE_SENTENCE',
                payload: {
                  sentenceContext: sentenceContext,
                  translation: response.result
                }
              });
            }
          }
        } else if (event.code === 'KeyW') {
          event.preventDefault();
          if (currentLearnableToken) {
            const currentWord = getOriginalTextForToken(currentLearnableToken);
            dispatch({ type: 'LOAD_INFO', payload: { displayType: 'wiktionary' } });
            
            const response = await lookupWiktionary(currentWord);
            dispatch({ 
              type: 'LOOKUP_WIKTIONARY',
              payload: {
                response: response
              }
            });
          }
        } else if (event.code === 'KeyE') {
          event.preventDefault();
          setIsLearningMode(false);
          dispatch({ type: 'ADVANCE', payload: { wordCount } });
        } else if (event.code === 'KeyR') {
          event.preventDefault();
          if (currentLearnableToken) {
            const currentWord = getOriginalTextForToken(currentLearnableToken);
            dispatch({ type: 'LOAD_INFO', payload: { displayType: 'phraseDetection' } });
            
            const headToken = allTokens.find(token => 
              getOriginalTextForToken(token) === currentLearnableToken.head
            );

            let phrases: string[] = [];
            if (headToken !== undefined && headToken.children !== undefined) {
              phrases = generateAllPhrases(allTokens, currentLearnableToken);
            }

            dispatch({ 
              type: 'DETECT_PHRASES',
              payload: {
                originalWord: currentWord as string,
                phrases: phrases,
              }
            });
          }
        }
        return;
      }

      if (event.code === 'KeyE') {
        event.preventDefault();
        if (currentLearnableToken) {
          updateWordStats(currentWordText, true);
          dispatch({ type: 'SET_FLASH_STATE', payload: 'green' });
          setTimeout(() => {
            dispatch({ type: 'ADVANCE', payload: { wordCount } });
          }, 100);
        }
      } else if (event.code === 'KeyQ') {
        event.preventDefault();
        if (currentLearnableToken) {
          updateWordStats(currentWordText, false);
          dispatch({ type: 'LOAD_INFO', payload: { displayType: 'wordTranslation' } });
          const wordToTranslate = getOriginalTextForToken(currentLearnableToken);
          const response = await translateWord(wordToTranslate, getSentenceContext(currentLearnableToken));
          
          dispatch({ 
            type: 'TRANSLATE_WORD', 
            payload: {
              translation: response.result
            }
          });
          setIsLearningMode(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.currentWordIndex, isLearningMode, learnableWords, updateWordStats, getOriginalTextForToken, getSentenceContext, setIsLearningMode, wordCount]);

  if (!tokenizationInfo || !allTokens || allTokens.length === 0) {
    return <div className="p-6 text-center text-gray-500">Article content not yet available or empty.</div>;
  }

  let renderedTextElements = []; 
  for (let i = 0; i < allTokens.length; i++) {
    const spacyToken = allTokens[i];
    const originalTokenText = getOriginalTextForToken(spacyToken);

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
        originalText={originalTokenText} 
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
        const spaceText = processedTextFromApi.substring(spacyToken.end, nextSpacyToken.start);
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