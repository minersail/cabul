'use client';

import { useState, useEffect, useCallback, Dispatch } from "react";
import VocabToken, { TranslationResult } from "./VocabToken";
import { SpaCyTokenizationResponse, SpaCyToken } from "@/types/tokenization";

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
  const [showTranslation, setShowTranslation] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugString, setDebugString] = useState("");

  const processedTextFromApi = tokenizationInfo.text;
  const allTokens = tokenizationInfo.tokens;
  const allSentences = tokenizationInfo.sentences;
  
  const learnableWords = allTokens.filter(isTokenLearnable);
  const wordCount = learnableWords.length;

  const getOriginalTextForToken = useCallback((token: SpaCyToken): string => {
    return processedTextFromApi.substring(token.start, token.end);
  }, [processedTextFromApi]);

  const getSentenceContext = useCallback((index: number): string => {
    if (!allSentences) {
      return "";
    }
    const sentence = allSentences[index];
    return sentence ? sentence.text : "";
  }, [allSentences]);

  const handleAnalysis = useCallback(async (wordToken: SpaCyToken) => {
    setIsLoading(true);
    try {
      const wordToTranslate = getOriginalTextForToken(wordToken);
      
      // Make API calls - only include compositionality if enabled
      const apiCalls = [
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: wordToTranslate, 
            mode: 'toEnglish',
            api: 'deepl',
            context: getSentenceContext(currentWordIndex)
          }),
        })
      ];

      if (enableCompositionality) {
        // TODO: Implement compositionality
        // apiCalls.push(
        //   fetch('/api/compositionality', { 
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ phrase: threeGram }) 
        //   })
        // );
      }
      const responses = await Promise.all(apiCalls);
      const [translationResponse, compositionResponse] = responses;
      const translationData = await translationResponse.json();

      if (!translationResponse.ok) {
        throw new Error(translationData.error || 'Translation failed');
      }

      let compositionData = null;
      if (enableCompositionality && compositionResponse) {
        if (compositionResponse.ok) {
          compositionData = await compositionResponse.json();
        } else {
          console.warn("Compositionality API call failed:", await compositionResponse.text());
        }
      }

      setResult({
        translation: translationData.result,
        lemma: wordToken.lemma,
        pos: wordToken.pos,
        compositionality: compositionData && compositionData.compositionality_score !== undefined ? {
          score: compositionData.compositionality_score,
          interpretation: compositionData.interpretation || 'No interpretation available'
        } : undefined
      });
      setShowTranslation(true);
    } catch (error) {
      console.error('Analysis error in VocabCanvas:', error);
      setResult({
        translation: 'Error analyzing word',
        lemma: wordToken.lemma,
        pos: wordToken.pos
      });
      setShowTranslation(true);
    } finally {
      setIsLoading(false);
    }
  }, [allTokens, currentWordIndex, enableCompositionality, getOriginalTextForToken, getSentenceContext]); 

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
          const sentenceContext = getSentenceContext(currentWordIndex);
          setResult({ translation: `Sentence context: ${sentenceContext}`, lemma: currentLearnableToken?.lemma, pos: currentLearnableToken?.pos });
          setShowTranslation(true);
        } else if (event.code === 'KeyW') {
          event.preventDefault();
          setResult({ translation: `Wiktionary stub for: ${currentWordText}`, lemma: currentLearnableToken?.lemma, pos: currentLearnableToken?.pos });
          setShowTranslation(true);
        } else if (event.code === 'KeyE') {
          event.preventDefault();
          setIsLearningMode(false);
          setFlashState('none');
          setResult(null);
          setShowTranslation(false);
          if (currentWordIndex < wordCount - 1) setCurrentWordIndex(prev => prev + 1);
        } else if (event.code === 'KeyR') {
          event.preventDefault();
          setResult({ translation: `Phrase detection stub for: ${currentWordText}`, lemma: currentLearnableToken?.lemma, pos: currentLearnableToken?.pos });
          setShowTranslation(true);
        }
        return; 
      }

      if (event.code === 'KeyE') { 
        event.preventDefault();
        if (currentLearnableToken) {
          updateWordStats(currentWordText, true); 
          setFlashState('green');
          setShowTranslation(false);
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
          setFlashState('red');
          await handleAnalysis(currentLearnableToken); 
          setIsLearningMode(true); 
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentWordIndex, wordCount, learnableWords, isLearningMode, updateWordStats, allTokens, enableCompositionality, handleAnalysis, setIsLearningMode, getOriginalTextForToken, getSentenceContext]);  

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
        showTranslation={showTranslation && isCurrentFocusLearnableWord}
        result={result} 
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