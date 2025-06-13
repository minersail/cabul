'use client';

import { useState, useEffect } from 'react';
import { Exercise, ExerciseResult, ExerciseSession } from '@/types/exercise';
import { generateExerciseMix, calculateSessionDifficulty } from '@/utils/exerciseUtils';
import { generateExerciseWords, updatePracticeStats, getUserVocabStats } from '@/lib/actions/exerciseActions';
import { useAuth } from '@/hooks/useAuth';

import MultipleChoice from '@/components/exercises/MultipleChoice';
import WordTranslation from '@/components/exercises/WordTranslation';
import FillInBlank from '@/components/exercises/FillInBlank';
import Matching from '@/components/exercises/Matching';
import ExerciseResults from '@/components/exercises/ExerciseResults';

interface ExerciseContainerProps {
  onComplete?: () => void;
}

export default function ExerciseContainer({ onComplete }: ExerciseContainerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [userStats, setUserStats] = useState<{
    totalWords: number;
    averageAccuracy: number;
    averageSeenCount: number;
  } | null>(null);

  // Load exercises on component mount
  useEffect(() => {
    if (user?.id) {
      loadExercises();
      loadUserStats();
    }
  }, [user?.id]);

  const loadExercises = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { selectedWords, wordsWithContext } = await generateExerciseWords(user.id);
      
      if (selectedWords.length === 0) {
        setError('No words available for practice. Try learning some vocabulary first!');
        return;
      }

      const generatedExercises = generateExerciseMix(selectedWords, wordsWithContext);
      
      if (generatedExercises.length === 0) {
        setError('Unable to generate exercises. Some words may be missing translations.');
        return;
      }

      setExercises(generatedExercises);
    } catch (err) {
      console.error('Error loading exercises:', err);
      setError('Failed to load exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      const stats = await getUserVocabStats(user.id);
      setUserStats(stats);
    } catch (err) {
      console.error('Error loading user stats:', err);
    }
  };

  const handleExerciseComplete = (result: ExerciseResult) => {
    const newResults = [...results, result];
    setResults(newResults);

    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      completeSession(newResults);
    }
  };

  const completeSession = async (finalResults: ExerciseResult[]) => {
    if (!user?.id) return;

    try {
      await updatePracticeStats(user.id, finalResults);
      setSessionComplete(true);
      
      // Reload user stats after completing session
      await loadUserStats();
    } catch (err) {
      console.error('Error updating practice stats:', err);
      setError('Failed to save progress. Please try again.');
    }
  };

  const restartSession = () => {
    setCurrentExerciseIndex(0);
    setResults([]);
    setSessionComplete(false);
    loadExercises();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exercises...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadExercises}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const sessionDifficulty = calculateSessionDifficulty(exercises);
    const session: ExerciseSession = {
      exercises,
      results,
      difficulty: sessionDifficulty,
    };

    return (
      <ExerciseResults
        session={session}
        userStats={userStats}
        onRestart={restartSession}
        onComplete={onComplete}
      />
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">No exercises available.</p>
        </div>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </span>
          {userStats && (
            <span className="text-sm text-gray-500">
              Difficulty: {calculateSessionDifficulty(exercises)}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Exercise Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {currentExercise.type === 'multiple_choice' && (
          <MultipleChoice
            key={currentExerciseIndex}
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        )}
        {currentExercise.type === 'word_translation' && (
          <WordTranslation
            key={currentExerciseIndex}
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        )}
        {currentExercise.type === 'fill_in_blank' && (
          <FillInBlank
            key={currentExerciseIndex}
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        )}
        {currentExercise.type === 'matching' && (
          <Matching
            key={currentExerciseIndex}
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        )}
      </div>
    </div>
  );
} 