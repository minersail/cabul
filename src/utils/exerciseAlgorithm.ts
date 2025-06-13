import { WordForExercise } from '@/types/exercise';

interface UserVocabWithFrequency {
  lemma: string;
  text: string;
  pos_cgram: string;
  frequency: number;
  seen: number;
  correct: number;
  lastPracticed: number | null;
}

interface SpacedRepetitionConfig {
  // Percentages of vocabulary size for spaced repetition intervals
  immediate: number; // Show again after this % of vocab practiced
  short: number;     // Show again after this % of vocab practiced  
  medium: number;    // Show again after this % of vocab practiced
  long: number;      // Show again after this % of vocab practiced
}

const DEFAULT_SPACED_REPETITION: SpacedRepetitionConfig = {
  immediate: 0.05, // 5% of vocab size
  short: 0.15,     // 15% of vocab size
  medium: 0.35,    // 35% of vocab size
  long: 0.60,      // 60% of vocab size
};

/**
 * Calculate composite score for word selection
 * Prioritizes: 1) High frequency words, 2) Low accuracy, 3) Spaced repetition timing
 */
function calculateWordScore(
  word: UserVocabWithFrequency,
  currentPracticeIndex: number,
  vocabSize: number
): number {
  // Frequency score (higher frequency = higher score)
  // Frequency values are already normalized to 0-100 range, so use directly
  const frequencyScore = word.frequency / 100; // Normalize to 0-1 range
  
  // Accuracy score (lower accuracy = higher score for practice)
  const accuracy = word.seen > 0 ? word.correct / word.seen : 0;
  const accuracyScore = 1 - accuracy;
  
  // Spaced repetition score
  const spacedRepetitionScore = calculateSpacedRepetitionScore(
    word,
    currentPracticeIndex,
    vocabSize
  );
  
  // Weighted combination: frequency is most important, then accuracy, then timing
  return (
    frequencyScore * 0.5 +
    accuracyScore * 0.3 +
    spacedRepetitionScore * 0.2
  );
}

/**
 * Calculate spaced repetition score based on practice gap
 */
function calculateSpacedRepetitionScore(
  word: UserVocabWithFrequency,
  currentPracticeIndex: number,
  vocabSize: number,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION
): number {
  if (word.lastPracticed === null) {
    // Never practiced - highest priority
    return 1.0;
  }
  
  const practiceGap = currentPracticeIndex - word.lastPracticed;
  const accuracy = word.seen > 0 ? word.correct / word.seen : 0;
  
  // Calculate intervals based on vocabulary size and accuracy
  const baseInterval = Math.floor(vocabSize * config.immediate);
  const intervals = {
    immediate: baseInterval,
    short: Math.floor(vocabSize * config.short),
    medium: Math.floor(vocabSize * config.medium),
    long: Math.floor(vocabSize * config.long),
  };
  
  // Adjust intervals based on accuracy (harder words shown more frequently)
  const accuracyMultiplier = Math.max(0.5, 1 - accuracy); // 0.5 to 1.0
  const adjustedIntervals = {
    immediate: Math.floor(intervals.immediate * accuracyMultiplier),
    short: Math.floor(intervals.short * accuracyMultiplier),
    medium: Math.floor(intervals.medium * accuracyMultiplier),
    long: Math.floor(intervals.long * accuracyMultiplier),
  };
  
  // Score based on how overdue the word is
  if (practiceGap >= adjustedIntervals.long) return 1.0;
  if (practiceGap >= adjustedIntervals.medium) return 0.8;
  if (practiceGap >= adjustedIntervals.short) return 0.6;
  if (practiceGap >= adjustedIntervals.immediate) return 0.4;
  
  // Recently practiced - lower priority
  return 0.1;
}

/**
 * Select words for practice using weighted random selection from top candidates
 */
export function selectWordsForPractice(
  userVocab: UserVocabWithFrequency[],
  currentPracticeIndex: number,
  targetCount: number
): WordForExercise[] {
  if (userVocab.length === 0) return [];
  
  const vocabSize = userVocab.length;
  
  // Calculate scores for all words
  const scoredWords: WordForExercise[] = userVocab.map(word => {
    const accuracy = word.seen > 0 ? word.correct / word.seen : 0;
    const practiceGap = word.lastPracticed !== null 
      ? currentPracticeIndex - word.lastPracticed 
      : vocabSize; // Large gap for never practiced
    
    return {
      lemma: word.lemma,
      text: word.text,
      pos_cgram: word.pos_cgram,
      frequency: word.frequency,
      userAccuracy: accuracy,
      practiceGap,
      score: calculateWordScore(word, currentPracticeIndex, vocabSize),
    };
  });
  
  // Sort by score descending
  scoredWords.sort((a, b) => b.score - a.score);
  
  // Select from top candidates using weighted random selection
  const candidateCount = Math.min(targetCount * 3, scoredWords.length);
  const candidates = scoredWords.slice(0, candidateCount);
  
  return weightedRandomSelection(candidates, targetCount);
}

/**
 * Weighted random selection - higher scores have higher probability
 */
function weightedRandomSelection(
  candidates: WordForExercise[],
  count: number
): WordForExercise[] {
  if (candidates.length <= count) return candidates;
  
  const selected: WordForExercise[] = [];
  const remaining = [...candidates];
  
  for (let i = 0; i < count && remaining.length > 0; i++) {
    // Calculate total weight
    const totalWeight = remaining.reduce((sum, word) => sum + word.score, 0);
    
    // Random selection based on weight
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    
    for (let j = 0; j < remaining.length; j++) {
      random -= remaining[j].score;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }
    
    selected.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }
  
  return selected;
} 