'use client';

import { useState, useEffect, useRef } from "react";

interface VocabCanvasProps {
  content: string;
  showInstructions: boolean;
  setShowInstructions: (showInstructions: boolean) => void;
}

type FlashType = 'none' | 'green' | 'red';

interface Token {
  text: string;
  isWord: boolean;
}

// Type for our word stats
type WordStats = [number, number]; // [total encounters, correct attempts]

// Helper function to get word stats from localStorage
function getWordStats(): Record<string, WordStats> {
  if (typeof window === 'undefined') return {};
  const stats = localStorage.getItem('vocabStats');
  return stats ? JSON.parse(stats) : {};
}

// Helper function to update word stats
function updateWordStats(word: string, wasCorrect: boolean) {
  const stats = getWordStats();
  const [total, correct] = stats[word] || [0, 0];
  stats[word] = [total + 1, correct + (wasCorrect ? 1 : 0)];
  localStorage.setItem('vocabStats', JSON.stringify(stats));
}

function tokenizeContent(content: string): Token[] {
  const regex = /([a-zA-ZÀ-ÿ]+['']?[a-zA-ZÀ-ÿ]*)|([^a-zA-ZÀ-ÿ]+)/g;
  const matches = content.match(regex) || [];
  
  return matches.map(match => ({
    text: match,
    isWord: /^[a-zA-ZÀ-ÿ]+['']?[a-zA-ZÀ-ÿ]*$/.test(match)
  }));
}

export default function VocabCanvas({ content, showInstructions, setShowInstructions }: VocabCanvasProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [flashState, setFlashState] = useState<FlashType>('none');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [debugString, setDebugString] = useState("");
  const currentWordRef = useRef<HTMLSpanElement>(null);
  const tokens = tokenizeContent(content);
  const words = tokens.filter(token => token.isWord);
  const wordCount = words.length;

  const handleTranslation = async (word: string) => {
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: word,
          mode: 'toEnglish'
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }
      setTranslation(data.result);
      setShowTranslation(true);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (showInstructions) {
        setShowInstructions(false);
      }

      if (event.code === 'KeyE' && currentWordIndex < wordCount - 1) {
        event.preventDefault();
        
        const currentWord = words[currentWordIndex]?.text.toLowerCase();
        if (currentWord) {
          updateWordStats(currentWord, true);
        }

        setFlashState('green');
        setShowTranslation(false);
        
        setTimeout(() => {
          setFlashState('none');
          setCurrentWordIndex(prev => prev + 1);
        }, 100);
      } else if (event.code === 'KeyQ' && currentWordIndex < wordCount - 1) {
        event.preventDefault();
        
        const currentWord = words[currentWordIndex]?.text.toLowerCase();
        
        if (!showTranslation) {
          // First Q press - show translation
          if (currentWord) {
            setFlashState('red');
            await handleTranslation(currentWord);
          }
        } else {
          // Second Q press - proceed to next word
          if (currentWord) {
            updateWordStats(currentWord, false);
          }
          setShowTranslation(false);
          
          setTimeout(() => {
            setFlashState('none');
            setCurrentWordIndex(prev => prev + 1);
          }, 100);
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
            let className = 'transition-all duration-200 ';
            let isCurrentWord = false;

            if (token.isWord) {
              if (currentWordCounter === currentWordIndex) {
                isCurrentWord = true;
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
              // Increment after ref assignment
              const span = (
                <span
                  key={index}
                  ref={isCurrentWord ? currentWordRef : null}
                  className={className}
                >
                  {token.text}
                  {isCurrentWord && showTranslation && (
                    <div
                      className="absolute z-50"
                      style={{
                        top: '-35px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div
                        className="bg-yellow-100 shadow-lg px-3 py-2 rotate-1 border-t-4 border-yellow-200"
                        style={{
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          transform: 'rotate(-12deg)',
                          boxShadow: '2px 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        <p className="text-sm text-gray-700 font-handwriting">
                          {isTranslating ? 'Translating...' : translation}
                        </p>
                      </div>
                    </div>
                  )}
                </span>
              );
              currentWordCounter++;
              return span;
            }
            // For non-word tokens
            return (
              <span key={index} className={className}>{token.text}</span>
            );
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