'use client';

import { useState, useMemo } from 'react';
import { MatchingExercise, ExerciseResult } from '@/types/exercise';

interface MatchingProps {
  exercise: MatchingExercise;
  onComplete: (result: ExerciseResult) => void;
}

interface MatchingState {
  selectedFrench: string | null;
  selectedEnglish: string | null;
  matches: { french: string; english: string }[];
  incorrectAttempts: { french: string; english: string }[];
}

export default function Matching({ exercise, onComplete }: MatchingProps) {
  const [state, setState] = useState<MatchingState>({
    selectedFrench: null,
    selectedEnglish: null,
    matches: [],
    incorrectAttempts: [],
  });
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  // Shuffle the pairs only once when component mounts
  const { shuffledFrench, shuffledEnglish } = useMemo(() => {
    return {
      shuffledFrench: [...exercise.pairs].sort(() => Math.random() - 0.5),
      shuffledEnglish: [...exercise.pairs].sort(() => Math.random() - 0.5),
    };
  }, [exercise.pairs]);

  const handleFrenchSelect = (french: string) => {
    if (showResult || state.matches.some(m => m.french === french)) return;

    setState(prev => ({
      ...prev,
      selectedFrench: prev.selectedFrench === french ? null : french,
      selectedEnglish: null,
    }));
  };

  const handleEnglishSelect = (english: string) => {
    if (showResult || state.matches.some(m => m.english === english)) return;

    if (state.selectedFrench) {
      // Check if this is a correct match
      const correctPair = exercise.pairs.find(
        pair => pair.french === state.selectedFrench && pair.english === english
      );

      if (correctPair) {
        // Correct match
        const newMatches = [...state.matches, { french: state.selectedFrench, english }];
        setState(prev => ({
          ...prev,
          matches: newMatches,
          selectedFrench: null,
          selectedEnglish: null,
        }));

        // Check if all pairs are matched
        if (newMatches.length === exercise.pairs.length) {
          completeExercise(newMatches);
        }
      } else {
        // Incorrect match
        setState(prev => ({
          ...prev,
          incorrectAttempts: [...prev.incorrectAttempts, { french: state.selectedFrench!, english }],
          selectedFrench: null,
          selectedEnglish: null,
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        selectedEnglish: prev.selectedEnglish === english ? null : english,
        selectedFrench: null,
      }));
    }
  };

  const completeExercise = (finalMatches: { french: string; english: string }[]) => {
    const timeSpent = Date.now() - startTime;
    const totalPairs = exercise.pairs.length;
    const correctMatches = finalMatches.length;

    setShowResult(true);

    setTimeout(() => {
      // For matching exercises, we'll consider it correct if all pairs are matched
      // regardless of incorrect attempts (since they eventually got them all right)
      const result: ExerciseResult = {
        exerciseType: 'matching',
        lemma: exercise.pairs[0]?.lemma || '', // Use first pair's lemma as representative
        isCorrect: correctMatches === totalPairs,
        timeSpent,
      };
      onComplete(result);
    }, 2000);
  };

  const isMatched = (word: string, type: 'french' | 'english') => {
    return state.matches.some(m => m[type] === word);
  };

  const isSelected = (word: string, type: 'french' | 'english') => {
    return type === 'french' ? state.selectedFrench === word : state.selectedEnglish === word;
  };





  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Match the French words with their English translations
        </h2>
        <p className="text-gray-600">
          Click a French word, then click its English translation
        </p>
      </div>

      {/* Progress */}
      <div className="text-center">
        <div className="text-sm text-gray-600">
          Matched: {state.matches.length} / {exercise.pairs.length}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(state.matches.length / exercise.pairs.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Matching Interface */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* French Words */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center text-gray-700">French</h3>
          {shuffledFrench.map((pair) => {
            const matched = isMatched(pair.french, 'french');
            const selected = isSelected(pair.french, 'french');
            
            let buttonClass = "w-full p-3 text-left border-2 rounded-lg transition-all duration-200 ";
            
            if (matched) {
              buttonClass += "border-green-500 bg-green-50 text-green-800 cursor-default";
            } else if (selected) {
              buttonClass += "border-blue-500 bg-blue-50 text-blue-800";
            } else {
              buttonClass += "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
            }

            return (
              <button
                key={pair.french}
                onClick={() => handleFrenchSelect(pair.french)}
                className={buttonClass}
                disabled={matched || showResult}
              >
                <span className="font-medium">{pair.french}</span>
                {matched && <span className="float-right text-green-600">✓</span>}
              </button>
            );
          })}
        </div>

        {/* English Words */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center text-gray-700">English</h3>
          {shuffledEnglish.map((pair) => {
            const matched = isMatched(pair.english, 'english');
            const selected = isSelected(pair.english, 'english');
            
            let buttonClass = "w-full p-3 text-left border-2 rounded-lg transition-all duration-200 ";
            
            if (matched) {
              buttonClass += "border-green-500 bg-green-50 text-green-800 cursor-default";
            } else if (selected) {
              buttonClass += "border-blue-500 bg-blue-50 text-blue-800";
            } else {
              buttonClass += "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
            }

            return (
              <button
                key={pair.english}
                onClick={() => handleEnglishSelect(pair.english)}
                className={buttonClass}
                disabled={matched || showResult}
              >
                <span className="font-medium">{pair.english}</span>
                {matched && <span className="float-right text-green-600">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result */}
      {showResult && (
        <div className="text-center">
          <div className="text-lg font-semibold mb-2 text-green-600">
            🎉 All pairs matched!
          </div>
          {state.incorrectAttempts.length > 0 && (
            <div className="text-sm text-gray-600">
              Incorrect attempts: {state.incorrectAttempts.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 