'use client';

import { useState } from 'react';
import { FillInBlankExercise, ExerciseResult } from '@/types/exercise';

interface FillInBlankProps {
  exercise: FillInBlankExercise;
  onComplete: (result: ExerciseResult) => void;
}

export default function FillInBlank({ exercise, onComplete }: FillInBlankProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSubmit = () => {
    if (!userAnswer.trim() || showResult) return;

    // Simple comparison - could be enhanced with fuzzy matching
    const isCorrect = userAnswer.trim().toLowerCase() === exercise.word.text.toLowerCase();
    const timeSpent = Date.now() - startTime;

    setShowResult(true);

    // Show result for a moment before completing
    setTimeout(() => {
      const result: ExerciseResult = {
        exerciseType: 'fill_in_blank',
        lemma: exercise.word.lemma,
        isCorrect,
        timeSpent,
      };
      onComplete(result);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const isCorrect = userAnswer.trim().toLowerCase() === exercise.word.text.toLowerCase();

  // Split sentence to show before and after the blank
  const sentenceParts = exercise.sentence.split('___');
  const beforeBlank = sentenceParts[0] || '';
  const afterBlank = sentenceParts[1] || '';

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Fill in the blank:
        </h2>
      </div>

      {/* Sentence with blank */}
      <div className="max-w-3xl mx-auto">
        <div className="text-xl leading-relaxed text-center p-6 bg-gray-50 rounded-lg">
          <span className="text-gray-800">{beforeBlank}</span>
          <span className="inline-block mx-2">
            {showResult ? (
              <span className={`px-3 py-1 rounded font-semibold ${
                isCorrect 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-red-200 text-red-800'
              }`}>
                {userAnswer || '___'}
              </span>
            ) : (
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyUp={handleKeyPress}
                placeholder="___"
                className="inline-block w-32 px-2 py-1 text-center border-b-2 border-blue-500 bg-transparent focus:outline-none focus:border-blue-700"
                autoFocus
              />
            )}
          </span>
          <span className="text-gray-800">{afterBlank}</span>
        </div>
      </div>

      {/* Translation hint */}
      {exercise.word.translation && (
        <div className="text-center">
          <div className="text-sm text-gray-600">
            Hint: The missing word means "{exercise.word.translation}"
          </div>
        </div>
      )}

      {/* Submit Button */}
      {!showResult && (
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
              userAnswer.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit Answer
          </button>
          <div className="text-sm text-gray-500 mt-2">
            Press Enter to submit
          </div>
        </div>
      )}

      {/* Result Feedback */}
      {showResult && (
        <div className="text-center">
          <div className={`text-lg font-semibold mb-2 ${
            isCorrect ? 'text-green-600' : 'text-red-600'
          }`}>
            {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
          </div>
          {!isCorrect && (
            <div className="text-gray-600 mb-2">
              The correct answer was: <strong>{exercise.word.text}</strong>
            </div>
          )}
          <div className="text-sm text-gray-500">
            Your answer: <strong>{userAnswer}</strong>
          </div>
          {exercise.word.translation && (
            <div className="text-sm text-gray-500 mt-2">
              "{exercise.word.text}" means "{exercise.word.translation}"
            </div>
          )}
        </div>
      )}
    </div>
  );
} 