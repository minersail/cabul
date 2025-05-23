'use client';

import { useState, useEffect } from "react";
import { 
  tokenizeContent, 
  getSentenceContext, 
  getNGram
} from "@/utils/tokenization";
import VocabToken, { TranslationResult } from "./VocabToken";

type FlashType = 'none' | 'green' | 'red';

interface VocabCanvasProps {
  content: string;
  showInstructions: boolean;
  setShowInstructions: (showInstructions: boolean) => void;
  updateWordStats: (word: string, wasCorrect: boolean) => void;
  enableCompositionality?: boolean;
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

export default function VocabCanvas({ 
  content, 
  showInstructions, 
  setShowInstructions, 
  updateWordStats,
  enableCompositionality = false
}: VocabCanvasProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [flashState, setFlashState] = useState<FlashType>('none');
  const [showTranslation, setShowTranslation] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugString, setDebugString] = useState("");
  const tokens = tokenizeContent(content);
  const words = tokens.filter(token => token.isWord);
  const wordCount = words.length;

  const handleAnalysis = async (word: string) => {
    setIsLoading(true);
    try {
      const sentenceContext = getSentenceContext(tokens, currentWordIndex);
      const threeGram = getNGram(tokens, currentWordIndex);
      
      // Make API calls - only include compositionality if enabled
      const apiCalls = [
        fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: word,
            mode: 'toEnglish',
            api: 'deepl',
            context: sentenceContext
          }),
        })
      ];

      if (enableCompositionality) {
        apiCalls.push(
          fetch('/api/compositionality', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phrase: threeGram })
          })
        );
      }

      const responses = await Promise.all(apiCalls);
      const [translationResponse, compositionResponse] = responses;
      const translationData = await translationResponse.json();

      if (!translationResponse.ok) {
        throw new Error(translationData.error || 'Translation failed');
      }

      let compositionData = null;
      if (enableCompositionality && compositionResponse) {
        compositionData = await compositionResponse.json();
      }

      setResult({
        translation: translationData.result,
        compositionality: compositionData && compositionData.compositionality_score !== undefined ? {
          score: compositionData.compositionality_score,
          interpretation: compositionData.interpretation || 'No interpretation available'
        } : undefined
      });
      setShowTranslation(true);
    } catch (error) {
      console.error('Analysis error:', error);
      setResult({
        translation: 'Error analyzing word',
      });
      setShowTranslation(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (showInstructions) {
        setShowInstructions(false);
      }
        
      const currentWord = words[currentWordIndex]?.text.toLowerCase();

      // Any key press should close translation, record stats, and move to next word
      if (showTranslation) {
        if (currentWord) {
          updateWordStats(currentWord, false);
        }
        setShowTranslation(false);
        setResult(null);
        
        setTimeout(() => {
          setFlashState('none');
          setCurrentWordIndex(prev => prev + 1);
        }, 100);

        return;
      }

      if (event.code === 'KeyE' && currentWordIndex < wordCount - 1) {
        event.preventDefault();

        if (currentWord) {
          updateWordStats(currentWord, true);
        }

        setFlashState('green');
        setShowTranslation(false);
        setResult(null);
        
        setTimeout(() => {
          setFlashState('none');
          setCurrentWordIndex(prev => prev + 1);
        }, 100);
      } else if (event.code === 'KeyQ' && currentWordIndex < wordCount - 1) {
        event.preventDefault();
        
        // First Q press - show translation and compositionality
        if (currentWord) {
          setFlashState('red');
          await handleAnalysis(currentWord);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentWordIndex, wordCount, words, showInstructions, showTranslation]);  

  if (!content) return null;

  let currentWordCounter = 0;
  
  return (
    <div className="relative">
      {showInstructions && (
        <div className="-top-12 left-0 right-0 text-center text-sm text-gray-500 bg-gray-50 p-2 rounded-t-lg border-b border-gray-200">
          Press <kbd className="px-2 py-1 bg-gray-200 rounded">E</kbd> if you know the word, <kbd className="px-2 py-1 bg-gray-200 rounded">Q</kbd> if you don't
        </div>
      )}
      <div className="relative p-6 bg-gray-50 rounded-lg font-serif text-lg leading-relaxed">
        <div className="absolute top-2 right-2 text-sm text-gray-500">
          Word {currentWordIndex + 1} of {wordCount}
        </div>
        <div className="mt-4">
          {tokens.map((token, index) => {
            const tokenElement = (
              <VocabToken
                key={index}
                token={token}
                index={index}
                isCurrentWord={token.isWord && currentWordCounter === currentWordIndex}
                className={getCurrentTokenStyle(token.isWord, currentWordCounter, currentWordIndex, flashState)}
                showTranslation={showTranslation}
                result={result}
                isLoading={isLoading}
              />
            );
            if (token.isWord) currentWordCounter++;
            return tokenElement;
          })}
        </div>
        
        <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(currentWordIndex / (wordCount - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
} 