'use client';

import React, { useState, useEffect, useCallback, Dispatch } from "react";
import VocabToken, { TokenInformation, InformationDisplayType } from "./VocabToken";
import { SpaCyTokenizationResponse, SpaCyToken } from "@/types/tokenization";
import { generateAllPhrases } from "@/utils/phrasing";

type FlashType = 'none' | 'green' | 'red';

interface VocabCanvasProps {
  content: string;
  tokenizationInfo: SpaCyTokenizationResponse;
  updateWordStats: (word: string, wasCorrect: boolean) => void;
  enableCompositionality?: boolean;
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
  enableCompositionality = false,
  isLearningMode,
  setIsLearningMode
}: VocabCanvasProps) {
  if (!tokenizationInfo || !tokenizationInfo.tokens || !Array.isArray(tokenizationInfo.tokens)) {
    console.error("VocabCanvas rendered with invalid tokenizationInfo.tokens", tokenizationInfo);
    return <div className="p-6 text-center text-red-500">Error: Invalid token data received.</div>;
  }

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [flashState, setFlashState] = useState<FlashType>('none');
  const [showInformation, setShowInformation] = useState(false);
  const [result, setResult] = useState<TokenInformation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugString, setDebugString] = useState("");

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
  }, [allSentences]);

  const handleAnalysis = useCallback(async (wordToken: SpaCyToken) => {
    setIsLoading(true);
    try {
      const wordToTranslate = getOriginalTextForToken(wordToken);
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: wordToTranslate, 
          mode: 'toEnglish',
          api: 'deepl',
          context: getSentenceContext(wordToken)
        }),
      });

      const translationData = await response.json();

      if (!response.ok) {
        throw new Error(translationData.error || 'Translation failed');
      }

      setResult({
        displayType: 'wordTranslation',
        wordTranslation: {
          translation: translationData.result,
          compositionality: undefined // We'll add this back when implementing compositionality
        }
      });
      setShowInformation(true);
    } catch (error) {
      console.error('Analysis error in VocabCanvas:', error);
      setResult({
        displayType: 'wordTranslation',
        wordTranslation: {
          translation: 'Error analyzing word',
        }
      });
      setShowInformation(true);
    } finally {
      setIsLoading(false);
    }
  }, [getOriginalTextForToken, getSentenceContext]);

  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (wordCount === 0 || (currentWordIndex >= wordCount && !(currentWordIndex === 0 && wordCount === 0)) ) {
        if(!(currentWordIndex === 0 && wordCount ===0)){ 
          return;
        }
      }
      
      const currentLearnableToken = wordCount > 0 ? learnableWords[currentWordIndex] : null;
      const currentWordText = currentLearnableToken ? getOriginalTextForToken(currentLearnableToken).toLowerCase() : "";

      if (isLearningMode) {
        if (event.code === 'KeyQ') {
          event.preventDefault();
          if (currentLearnableToken) {
            const sentenceContext = getSentenceContext(currentLearnableToken);
            if (sentenceContext) {
              setIsLoading(true);
              setShowInformation(false);
              try {
                const response = await fetch('/api/translate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: sentenceContext,
                    mode: 'toEnglish',
                    api: 'deepl',
                  }),
                });
                const data = await response.json();
                if (!response.ok) {
                  throw new Error(data.error || 'Sentence translation failed');
                }
                setResult({
                  ...result,
                  displayType: 'sentenceTranslation',
                  sentenceTranslation: {
                    fullSentence: sentenceContext,
                    translation: data.result
                  }
                });
              } catch (error) {
                console.error('Sentence translation error:', error);
                setResult({
                  ...result,
                  displayType: 'sentenceTranslation',
                  sentenceTranslation: {
                    fullSentence: sentenceContext,
                    translation: 'Error translating sentence'
                  }
                });
              } finally {
                setIsLoading(false);
                setShowInformation(true);
              }
            }
          }
        } else if (event.code === 'KeyW') {
          event.preventDefault();
          if (currentLearnableToken) {
            const currentWord = getOriginalTextForToken(currentLearnableToken);
            setIsLoading(true);
            setShowInformation(false);
            try {
              const response = await fetch('/api/wiktionary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: currentWord }),
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch Wiktionary data');
              }
              
              setResult({
                ...result,
                displayType: 'wiktionary',
                wiktionary: data
              });
            } catch (error) {
              console.error('Wiktionary error:', error);
              setResult({
                ...result,
                displayType: 'wiktionary',
                wiktionary: {
                  word: currentWord,
                  etymology: null,
                  pronunciation: null,
                  definitions: ['Failed to load Wiktionary data'],
                  url: `https://en.wiktionary.org/wiki/${encodeURIComponent(currentWord)}`
                }
              });
            } finally {
              setIsLoading(false);
              setShowInformation(true);
            }
          }
        } else if (event.code === 'KeyE') {
          event.preventDefault();
          setIsLearningMode(false);
          setFlashState('none');
          setResult(null);
          setShowInformation(false);
          if (currentWordIndex < wordCount - 1) setCurrentWordIndex(prev => prev + 1);
        } else if (event.code === 'KeyR') {
          event.preventDefault();
          if (currentLearnableToken) {
            const currentWord = getOriginalTextForToken(currentLearnableToken);
            
            // Find the head token for the current word
            const headToken = allTokens.find(token => 
              getOriginalTextForToken(token) === currentLearnableToken.head
            );

            if (headToken !== undefined && headToken.children !== undefined) {
              // Get all children of the head token
              const phrases = generateAllPhrases(allTokens, currentLearnableToken);

              setResult({
                displayType: 'phraseDetection',
                phraseDetection: {
                  originalWord: currentWord as string,
                  phrases: phrases,
                }
              });
            } else {
              // If no head found, show just the current word info
              setResult({
                displayType: 'phraseDetection',
                phraseDetection: {
                  originalWord: currentWord as string,
                  head: {
                    text: currentWord as string,
                    pos: currentLearnableToken.pos
                  },
                  children: []
                }
              });
            }
            setShowInformation(true);
          }
        }
        return;
      }

      if (event.code === 'KeyE') {
        event.preventDefault();
        if (currentLearnableToken) {
          updateWordStats(currentWordText, true);
          setFlashState('green');
          setShowInformation(false);
          setResult(null);
          setTimeout(() => {
            setFlashState('none');
            if (currentWordIndex < wordCount - 1) setCurrentWordIndex(prev => prev + 1);
          }, 100);
        }
      } else if (event.code === 'KeyQ') {
        event.preventDefault();
        if (currentLearnableToken) {
          updateWordStats(currentWordText, false);
          await handleAnalysis(currentLearnableToken);
          setIsLearningMode(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentWordIndex, learnableWords, isLearningMode, updateWordStats, handleAnalysis, getOriginalTextForToken, getSentenceContext]);

  if (!tokenizationInfo || !allTokens || allTokens.length === 0) {
    return <div className="p-6 text-center text-gray-500">Article content not yet available or empty.</div>;
  }

  let renderedTextElements = []; 
  for (let i = 0; i < allTokens.length; i++) {
    const spacyToken = allTokens[i];
    const originalTokenText = getOriginalTextForToken(spacyToken);

    const isCurrentFocusLearnableWord = 
      learnableWords[currentWordIndex]?.start === spacyToken.start &&
      learnableWords[currentWordIndex]?.end === spacyToken.end;

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
          currentWordIndex, 
          flashState
        )}
        showInformation={showInformation && isCurrentFocusLearnableWord}
        tokenInfo={result} 
        isLoading={isLoading && isCurrentFocusLearnableWord}
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
       {/* <div className="text-xs p-1 bg-gray-100 break-all fixed top-0 left-0 z-[100] max-w-full overflow-x-scroll">{debugString}</div> */}
      <div className="relative p-6 bg-gray-50 rounded-lg font-serif text-lg leading-relaxed">
        <div className="absolute top-2 right-2 text-sm text-gray-500">
          Word {wordCount > 0 ? currentWordIndex + 1 : 0} of {wordCount} 
          (Tokens: {allTokens.length})
        </div>
        <div className="mt-4 whitespace-pre-wrap">
          {renderedTextElements}
        </div>
        
        <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: wordCount > 0 ? `${(currentWordIndex / Math.max(1, wordCount -1)) * 100}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
} 