'use client';

import { useState } from 'react';
import { WordTranslationExercise, ExerciseResult } from '@/types/exercise';

interface WordTranslationProps {
  exercise: WordTranslationExercise;
  onComplete: (result: ExerciseResult) => void;
}

export default function WordTranslation({ exercise, onComplete }: WordTranslationProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSubmit = () => {
    if (!userAnswer.trim() || showResult) return;

    const correctAnswers = exercise.direction === 'fr_to_en' 
      ? exercise.word.translation?.split('/').map(t => t.trim()) || []
      : [exercise.word.text];
    
    // Check if user answer matches any of the correct answers
    const isCorrect = correctAnswers.some(answer => 
      userAnswer.trim().toLowerCase() === answer.toLowerCase()
    );
    const timeSpent = Date.now() - startTime;

    setShowResult(true);

    // Show result for a moment before completing
    setTimeout(() => {
      const result: ExerciseResult = {
        exerciseType: 'word_translation',
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

  const questionWord = exercise.direction === 'fr_to_en' 
    ? exercise.word.text 
    : exercise.word.translation;
  
  const correctAnswers = exercise.direction === 'fr_to_en' 
    ? exercise.word.translation?.split('/').map(t => t.trim()) || []
    : [exercise.word.text];

  const isCorrect = correctAnswers.some(answer => 
    userAnswer.trim().toLowerCase() === answer.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {exercise.direction === 'fr_to_en' 
            ? 'Translate this French word to English:' 
            : 'Translate this English word to French:'}
        </h2>
        <div className="text-4xl font-bold text-blue-600 mb-4">
          {questionWord}
        </div>
        {exercise.word.context && (
          <div className="text-sm text-gray-600 italic max-w-2xl mx-auto">
            Context: "{exercise.word.context}"
          </div>
        )}
      </div>

      {/* Input */}
      <div className="max-w-md mx-auto">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your answer..."
          disabled={showResult}
          className={`w-full p-4 text-lg text-center border-2 rounded-lg transition-all duration-200 ${
            showResult
              ? isCorrect
                ? 'border-green-500 bg-green-50 text-green-800'
                : 'border-red-500 bg-red-50 text-red-800'
              : 'border-gray-300 focus:border-blue-500 focus:outline-none'
          }`}
          autoFocus
        />
      </div>

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
              The correct answer{correctAnswers.length > 1 ? 's were' : ' was'}: 
              <strong> {correctAnswers.join(' / ')}</strong>
            </div>
          )}
          <div className="text-sm text-gray-500">
            Your answer: <strong>{userAnswer}</strong>
          </div>
        </div>
      )}
    </div>
  );
} 