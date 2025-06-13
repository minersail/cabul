import ExerciseContainer from '@/components/exercises/ExerciseContainer';
import { AuthProvider } from '@/components/providers/AuthProvider';

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Vocabulary Practice
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Strengthen your French vocabulary with personalized exercises. 
            We'll focus on words you need to practice most, prioritizing common words 
            and using spaced repetition to improve retention.
          </p>
        </div>
        <AuthProvider>
          <ExerciseContainer />
        </AuthProvider>
      </div>
    </div>
  );
} 