import { 
  Exercise, 
  MultipleChoiceExercise, 
  WordTranslationExercise, 
  FillInBlankExercise, 
  MatchingExercise,
  MatchingPair,
  MultipleChoiceOption,
  EXERCISE_DIFFICULTIES,
  WordForExercise
} from '@/types/exercise';

interface WordWithContext {
  lemma: string;
  text: string;
  translation?: string;
  context?: string;
  pos_cgram: string;
  frequency: number;
}

/**
 * Generate distractors for multiple choice questions
 * Uses words with similar POS and frequency, falls back to random
 */
export function generateDistractors(
  targetWord: WordWithContext,
  allWords: WordWithContext[],
  count: number = 3
): string[] {
  const distractors: string[] = [];
  
  // Filter words with same POS and similar frequency (within 2x range)
  const similarWords = allWords.filter(word => 
    word.lemma !== targetWord.lemma &&
    word.pos_cgram === targetWord.pos_cgram &&
    word.frequency >= targetWord.frequency * 0.5 &&
    word.frequency <= targetWord.frequency * 2.0 &&
    word.translation
  );
  
  // Add similar words first
  const shuffledSimilar = shuffleArray([...similarWords]);
  for (let i = 0; i < Math.min(count, shuffledSimilar.length); i++) {
    if (shuffledSimilar[i].translation) {
      distractors.push(shuffledSimilar[i].translation!);
    }
  }
  
  // Fill remaining with random words if needed
  if (distractors.length < count) {
    const randomWords = allWords.filter(word => 
      word.lemma !== targetWord.lemma &&
      word.translation &&
      !distractors.includes(word.translation)
    );
    
    const shuffledRandom = shuffleArray(randomWords);
    for (let i = 0; i < Math.min(count - distractors.length, shuffledRandom.length); i++) {
      if (shuffledRandom[i].translation) {
        distractors.push(shuffledRandom[i].translation!);
      }
    }
  }
  
  return distractors;
}

/**
 * Create a multiple choice exercise
 */
export function createMultipleChoiceExercise(
  word: WordWithContext,
  allWords: WordWithContext[]
): MultipleChoiceExercise {
  if (!word.translation) {
    throw new Error('Word must have translation for multiple choice exercise');
  }
  
  const distractors = generateDistractors(word, allWords, 3);
  const options: MultipleChoiceOption[] = [
    { text: word.translation, isCorrect: true },
    ...distractors.map(distractor => ({ text: distractor, isCorrect: false }))
  ];
  
  // Shuffle options
  const shuffledOptions = shuffleArray(options);
  
  return {
    type: 'multiple_choice',
    word: {
      lemma: word.lemma,
      text: word.text,
      translation: word.translation,
      context: word.context,
    },
    question: `What does "${word.text}" mean?`,
    options: shuffledOptions,
    difficulty: EXERCISE_DIFFICULTIES.multiple_choice,
  };
}

/**
 * Create a word translation exercise
 */
export function createWordTranslationExercise(
  word: WordWithContext,
  direction: 'fr_to_en' | 'en_to_fr' = 'fr_to_en'
): WordTranslationExercise {
  if (!word.translation) {
    throw new Error('Word must have translation for translation exercise');
  }
  
  return {
    type: 'word_translation',
    word: {
      lemma: word.lemma,
      text: word.text,
      translation: word.translation,
      context: word.context,
    },
    direction,
    difficulty: EXERCISE_DIFFICULTIES.word_translation,
  };
}

/**
 * Create a fill-in-the-blank exercise
 */
export function createFillInBlankExercise(
  word: WordWithContext
): FillInBlankExercise {
  if (!word.context) {
    throw new Error('Word must have context sentence for fill-in-blank exercise');
  }
  
  // Replace the word with blank in the sentence
  const sentence = word.context.replace(
    new RegExp(`\\b${escapeRegExp(word.text)}\\b`, 'gi'),
    '___'
  );
  
  return {
    type: 'fill_in_blank',
    word: {
      lemma: word.lemma,
      text: word.text,
      translation: word.translation,
      context: word.context,
    },
    sentence,
    difficulty: EXERCISE_DIFFICULTIES.fill_in_blank,
  };
}

/**
 * Create a matching exercise with multiple word pairs
 */
export function createMatchingExercise(
  words: WordWithContext[]
): MatchingExercise {
  const validWords = words.filter(word => word.translation);
  
  if (validWords.length < 4) {
    throw new Error('Need at least 4 words with translations for matching exercise');
  }
  
  // Take up to 6 words for matching
  const selectedWords = validWords.slice(0, 6);
  
  const pairs: MatchingPair[] = selectedWords.map(word => ({
    french: word.text,
    english: word.translation!,
    lemma: word.lemma,
  }));
  
  return {
    type: 'matching',
    pairs,
    difficulty: EXERCISE_DIFFICULTIES.matching,
  };
}

/**
 * Generate a mix of exercises from selected words
 */
export function generateExerciseMix(
  selectedWords: WordForExercise[],
  wordsWithContext: WordWithContext[]
): Exercise[] {
  const exercises: Exercise[] = [];
  
  // Create a map for quick lookup
  const contextMap = new Map(
    wordsWithContext.map(word => [word.lemma, word])
  );
  
  // Filter words that have the necessary data
  const wordsForMultipleChoice = selectedWords.filter(word => {
    const contextWord = contextMap.get(word.lemma);
    return contextWord?.translation;
  });
  
  const wordsForTranslation = selectedWords.filter(word => {
    const contextWord = contextMap.get(word.lemma);
    return contextWord?.translation;
  });
  
  const wordsForFillInBlank = selectedWords.filter(word => {
    const contextWord = contextMap.get(word.lemma);
    return contextWord?.context && contextWord?.translation;
  });
  
  // Generate exercises with variety
  let exerciseCount = 0;
  const maxExercises = Math.min(10, selectedWords.length);
  
  // Multiple choice (40% of exercises)
  const mcCount = Math.floor(maxExercises * 0.4);
  for (let i = 0; i < mcCount && i < wordsForMultipleChoice.length; i++) {
    const word = contextMap.get(wordsForMultipleChoice[i].lemma);
    if (word) {
      exercises.push(createMultipleChoiceExercise(word, wordsWithContext));
      exerciseCount++;
    }
  }
  
  // Word translation (30% of exercises)
  const translationCount = Math.floor(maxExercises * 0.3);
  for (let i = 0; i < translationCount && i < wordsForTranslation.length; i++) {
    const word = contextMap.get(wordsForTranslation[i].lemma);
    if (word && !exercises.some(ex => 
      ex.type === 'word_translation' && 
      (ex as WordTranslationExercise).word.lemma === word.lemma
    )) {
      exercises.push(createWordTranslationExercise(word));
      exerciseCount++;
    }
  }
  
  // Fill in blank (20% of exercises)
  const fillInBlankCount = Math.floor(maxExercises * 0.2);
  for (let i = 0; i < fillInBlankCount && i < wordsForFillInBlank.length; i++) {
    const word = contextMap.get(wordsForFillInBlank[i].lemma);
    if (word && !exercises.some(ex => 
      (ex.type === 'multiple_choice' && (ex as MultipleChoiceExercise).word.lemma === word.lemma) ||
      (ex.type === 'word_translation' && (ex as WordTranslationExercise).word.lemma === word.lemma) ||
      (ex.type === 'fill_in_blank' && (ex as FillInBlankExercise).word.lemma === word.lemma)
    )) {
      exercises.push(createFillInBlankExercise(word));
      exerciseCount++;
    }
  }
  
  // Matching exercise (10% of exercises, but only if we have enough words)
  if (exerciseCount < maxExercises && wordsForMultipleChoice.length >= 4) {
    const matchingWords = wordsForMultipleChoice
      .slice(0, 6)
      .map(word => contextMap.get(word.lemma))
      .filter((word): word is WordWithContext => word !== undefined);
    
    if (matchingWords.length >= 4) {
      exercises.push(createMatchingExercise(matchingWords));
    }
  }
  
  return shuffleArray(exercises);
}

/**
 * Calculate average difficulty of an exercise session
 */
export function calculateSessionDifficulty(exercises: Exercise[]): number {
  if (exercises.length === 0) return 0;
  
  const totalDifficulty = exercises.reduce((sum, exercise) => sum + exercise.difficulty, 0);
  return Math.round((totalDifficulty / exercises.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Utility function to shuffle an array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 