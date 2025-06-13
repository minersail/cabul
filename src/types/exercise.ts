export interface WordForExercise {
  lemma: string;
  text: string;
  pos_cgram: string;
  frequency: number;
  userAccuracy: number;
  practiceGap: number; // How many exercises since last practiced
  score: number; // Composite score for selection
}

export interface ExerciseWord {
  lemma: string;
  text: string;
  translation?: string;
  context?: string; // Original sentence from articles
}

export interface MultipleChoiceOption {
  text: string;
  isCorrect: boolean;
}

export interface MultipleChoiceExercise {
  type: 'multiple_choice';
  word: ExerciseWord;
  question: string;
  options: MultipleChoiceOption[];
  difficulty: number;
}

export interface WordTranslationExercise {
  type: 'word_translation';
  word: ExerciseWord;
  direction: 'fr_to_en' | 'en_to_fr';
  difficulty: number;
}

export interface FillInBlankExercise {
  type: 'fill_in_blank';
  word: ExerciseWord;
  sentence: string; // Sentence with word replaced by ___
  difficulty: number;
}

export interface MatchingPair {
  french: string;
  english: string;
  lemma: string;
}

export interface MatchingExercise {
  type: 'matching';
  pairs: MatchingPair[];
  difficulty: number;
}

export type Exercise = 
  | MultipleChoiceExercise 
  | WordTranslationExercise 
  | FillInBlankExercise 
  | MatchingExercise;

export interface ExerciseResult {
  exerciseType: Exercise['type'];
  lemma: string;
  isCorrect: boolean;
  timeSpent?: number;
}

export interface ExerciseSession {
  exercises: Exercise[];
  results: ExerciseResult[];
  difficulty: number; // Average difficulty of session
}

export const EXERCISE_DIFFICULTIES = {
  multiple_choice: 1,
  fill_in_blank: 2,
  word_translation: 3,
  matching: 1.5,
} as const;

export const EXERCISES_PER_SESSION = 10; 