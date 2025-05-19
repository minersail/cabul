'use client';

import { useState, useEffect } from "react";

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
  const tokens = tokenizeContent(content);
  const words = tokens.filter(token => token.isWord);
  const wordCount = words.length;

  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (showInstructions) {
        setShowInstructions(false);
      }

      if ((event.code === 'KeyE' || event.code === 'KeyQ') && currentWordIndex < wordCount - 1) {
        event.preventDefault();
        
        const currentWord = words[currentWordIndex]?.text.toLowerCase();

        if (currentWord) {
          updateWordStats(currentWord, event.code === 'KeyE');
        }

        setFlashState(event.code === 'KeyE' ? 'green' : 'red');
        
        setTimeout(() => {
          setFlashState('none');
          setCurrentWordIndex(prev => prev + 1);
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentWordIndex, wordCount, words, showInstructions]);

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
            
            if (token.isWord) {
              if (currentWordCounter === currentWordIndex) {
                className += 'inline-block transform ';
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
              currentWordCounter++;
            }
            
            return (
              <span
                key={index}
                className={className}
              >
                {token.text}
              </span>
            );
          })}
        </div>
        <div className="absolute bottom-2 left-2 right-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(currentWordIndex / (wordCount - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
} 