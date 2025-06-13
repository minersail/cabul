'use client';

import { ExerciseSession } from '@/types/exercise';

interface ExerciseResultsProps {
  session: ExerciseSession;
  userStats: {
    totalWords: number;
    averageAccuracy: number;
    averageSeenCount: number;
  } | null;
  onRestart: () => void;
  onComplete?: () => void;
}

export default function ExerciseResults({ 
  session, 
  userStats, 
  onRestart, 
  onComplete 
}: ExerciseResultsProps) {
  const correctAnswers = session.results.filter(result => result.isCorrect).length;
  const totalQuestions = session.results.length;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  const averageTime = session.results.length > 0
    ? session.results.reduce((sum, result) => sum + (result.timeSpent || 0), 0) / session.results.length
    : 0;

  const getPerformanceMessage = () => {
    if (accuracy >= 90) return { message: "Excellent work! 🌟", color: "text-green-600" };
    if (accuracy >= 75) return { message: "Great job! 👏", color: "text-blue-600" };
    if (accuracy >= 60) return { message: "Good effort! 👍", color: "text-yellow-600" };
    return { message: "Keep practicing! 💪", color: "text-orange-600" };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Session Complete!
          </h2>
          <div className={`text-xl font-semibold ${performance.color}`}>
            {performance.message}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {correctAnswers}/{totalQuestions}
            </div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {accuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">
              {(averageTime / 1000).toFixed(1)}s
            </div>
            <div className="text-sm text-gray-600">Avg. Time</div>
          </div>
        </div>

        {/* Session Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Session Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Difficulty:</span>
              <span className="font-medium">{session.difficulty}/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Exercises:</span>
              <span className="font-medium">{totalQuestions}</span>
            </div>
          </div>
        </div>

        {/* Exercise Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Exercise Breakdown</h3>
          <div className="space-y-2">
            {session.exercises.map((exercise, index) => {
              const result = session.results[index];
              const isCorrect = result?.isCorrect;
              
              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCorrect ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <div>
                      <div className="font-medium">
                        {exercise.type === 'multiple_choice' && 'Multiple Choice'}
                        {exercise.type === 'word_translation' && 'Word Translation'}
                        {exercise.type === 'fill_in_blank' && 'Fill in Blank'}
                        {exercise.type === 'matching' && 'Matching'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {exercise.type !== 'matching' && (exercise as any).word?.text}
                        {exercise.type === 'matching' && `${exercise.pairs.length} pairs`}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {result?.timeSpent ? `${(result.timeSpent / 1000).toFixed(1)}s` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Stats */}
        {userStats && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-700">
                  {userStats.totalWords}
                </div>
                <div className="text-gray-600">Total Words</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-700">
                  {(userStats.averageAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-gray-600">Overall Accuracy</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-700">
                  {userStats.averageSeenCount.toFixed(1)}
                </div>
                <div className="text-gray-600">Avg. Practice Count</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Practice Again
          </button>
          {onComplete && (
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Back to Learning
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 