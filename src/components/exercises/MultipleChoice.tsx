'use client';

import { useState } from 'react';
import { MultipleChoiceExercise, ExerciseResult } from '@/types/exercise';

interface MultipleChoiceProps {
  exercise: MultipleChoiceExercise;
  onComplete: (result: ExerciseResult) => void;
}

export default function MultipleChoice({ exercise, onComplete }: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  const handleOptionSelect = (optionText: string) => {
    if (showResult) return;
    setSelectedOption(optionText);
  };

  const handleSubmit = () => {
    if (!selectedOption || showResult) return;

    const correctOption = exercise.options.find(opt => opt.isCorrect);
    const isCorrect = selectedOption === correctOption?.text;
    const timeSpent = Date.now() - startTime;

    setShowResult(true);

    // Show result for a moment before completing
    setTimeout(() => {
      const result: ExerciseResult = {
        exerciseType: 'multiple_choice',
        lemma: exercise.word.lemma,
        isCorrect,
        timeSpent,
      };
      onComplete(result);
    }, 1500);
  };

  const correctOption = exercise.options.find(opt => opt.isCorrect);

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {exercise.question}
        </h2>
        <div className="text-4xl font-bold text-blue-600 mb-4">
          {exercise.word.text}
        </div>
        {exercise.word.context && (
          <div className="text-sm text-gray-600 italic max-w-2xl mx-auto">
            Context: "{exercise.word.context}"
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {exercise.options.map((option, index) => {
          const isSelected = selectedOption === option.text;
          const isCorrect = option.isCorrect;
          
          let buttonClass = "p-4 text-left border-2 rounded-lg transition-all duration-200 ";
          
          if (showResult) {
            if (isCorrect) {
              buttonClass += "border-green-500 bg-green-50 text-green-800";
            } else if (isSelected && !isCorrect) {
              buttonClass += "border-red-500 bg-red-50 text-red-800";
            } else {
              buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
            }
          } else if (isSelected) {
            buttonClass += "border-blue-500 bg-blue-50 text-blue-800";
          } else {
            buttonClass += "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
          }

          return (
            <button
              key={index}
              onClick={() => handleOptionSelect(option.text)}
              className={buttonClass}
              disabled={showResult}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option.text}</span>
                {showResult && isCorrect && (
                  <span className="text-green-600">✓</span>
                )}
                {showResult && isSelected && !isCorrect && (
                  <span className="text-red-600">✗</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      {!showResult && (
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
              selectedOption
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Result Feedback */}
      {showResult && (
        <div className="text-center">
          <div className={`text-lg font-semibold mb-2 ${
            selectedOption === correctOption?.text ? 'text-green-600' : 'text-red-600'
          }`}>
            {selectedOption === correctOption?.text ? '🎉 Correct!' : '❌ Incorrect'}
          </div>
          {selectedOption !== correctOption?.text && (
            <div className="text-gray-600">
              The correct answer was: <strong>{correctOption?.text}</strong>
            </div>
          )}
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