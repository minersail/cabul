'use server';

import { prisma } from '@/lib/prisma';
import { validateAuth } from '@/lib/validateAuth';
import { translateText } from '@/lib/translate';
import { selectWordsForPractice } from '@/utils/exerciseAlgorithm';
import { ExerciseResult, WordForExercise, EXERCISES_PER_SESSION } from '@/types/exercise';

interface WordWithTranslationAndContext {
  lemma: string;
  text: string;
  translation: string | undefined;
  context: string | undefined;
  pos_cgram: string;
  frequency: number;
}

/**
 * Get or create user metadata for practice tracking
 */
export async function getUserMetadata(profileId: string) {
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    throw new Error(authResult.error);
  }
  
  let userMetadata = await prisma.userMetadata.findUnique({
    where: { profileId: profileId }
  });
  
  if (!userMetadata) {
    userMetadata = await prisma.userMetadata.create({
      data: {
        profileId: profileId,
        practiceIndex: 0,
      }
    });
  }
  
  return userMetadata;
}

/**
 * Generate words for practice exercises
 */
export async function generateExerciseWords(profileId: string): Promise<{
  selectedWords: WordForExercise[];
  wordsWithContext: WordWithTranslationAndContext[];
  currentPracticeIndex: number;
}> {
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    throw new Error(authResult.error);
  }
  const userMetadata = await getUserMetadata(profileId);
  
  // Get user's vocabulary with frequency data
  const userVocabWithFrequency = await prisma.lexicon.findMany({
    where: { profileId: profileId },
    include: {
      lemmaRef: {
        select: {
          tokens: {
            select: {
              text: true,
              pos: true,
            },
            take: 1, // Just get one token for the lemma
          }
        }
      }
    }
  });
  
  if (userVocabWithFrequency.length === 0) {
    return {
      selectedWords: [],
      wordsWithContext: [],
      currentPracticeIndex: userMetadata.practiceIndex,
    };
  }
  
  // Get frequency data for user's vocabulary
  const lemmas = userVocabWithFrequency.map(item => item.lemma);
  const frequencyData = await prisma.wordFrequency.findMany({
    where: {
      lemma: { in: lemmas }
    }
  });
  
  const frequencyMap = new Map(
    frequencyData.map(item => [item.lemma, item])
  );

  // Combine user vocab with frequency data
  const vocabWithFrequency = userVocabWithFrequency
    .map(item => {
      const frequency = frequencyMap.get(item.lemma);
      const token = item.lemmaRef.tokens[0];
      
      if (!frequency || !token) return null;
      
      return {
        lemma: item.lemma,
        text: token.text,
        pos_cgram: frequency.pos_cgram,
        frequency: frequency.frequency,
        seen: item.seen,
        correct: item.correct,
        lastPracticed: item.lastPracticed,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  
  // Select words using the algorithm
  const selectedWords = selectWordsForPractice(
    vocabWithFrequency,
    userMetadata.practiceIndex,
    EXERCISES_PER_SESSION
  );
  
  // Get additional context data for selected words
  const selectedLemmas = selectedWords.map(word => word.lemma);
  
  // Get translations and context from mistakes table (sentences where words appeared)
  const wordsWithContext = await Promise.all(
    selectedLemmas.map(async (lemma) => {
      const frequency = frequencyMap.get(lemma);
      const vocab = vocabWithFrequency.find(v => v.lemma === lemma);
      
      if (!frequency || !vocab) return null;
      
      // Try to get a sentence context from mistakes table
      const mistake = await prisma.mistake.findFirst({
        where: {
          profileId: profileId,
          tokenRef: {
            lemma: lemma
          }
        },
        select: {
          sentence: true
        }
      });
      
      // For now, we'll need to get translations from an external service
      // This is a placeholder - you'll need to implement translation fetching
      const translation = await getTranslationForWord(vocab.text);
      
      return {
        lemma,
        text: vocab.text,
        translation,
        context: mistake?.sentence || undefined,
        pos_cgram: frequency.pos_cgram,
        frequency: frequency.frequency,
      };
    })
  );
  
  const validWordsWithContext = wordsWithContext.filter(
    (word): word is NonNullable<typeof word> => word !== null
  );
  
  return {
    selectedWords,
    wordsWithContext: validWordsWithContext,
    currentPracticeIndex: userMetadata.practiceIndex,
  };
}

/**
 * Update practice statistics after completing exercises
 */
export async function updatePracticeStats(
  profileId: string,
  results: ExerciseResult[]
): Promise<void> {
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    throw new Error(authResult.error);
  }
  
  // Increment practice index
  await prisma.userMetadata.update({
    where: { profileId: profileId },
    data: {
      practiceIndex: {
        increment: 1
      }
    }
  });
  
  const updatedMetadata = await prisma.userMetadata.findUnique({
    where: { profileId: profileId }
  });
  
  if (!updatedMetadata) {
    throw new Error('Failed to update user metadata');
  }
  
  // Update lexicon stats for each word
  const updatePromises = results.map(async (result) => {
    await prisma.lexicon.update({
      where: {
        profileId_lemma: {
          profileId: profileId,
          lemma: result.lemma,
        }
      },
      data: {
        seen: { increment: 1 },
        correct: result.isCorrect ? { increment: 1 } : undefined,
        lastPracticed: updatedMetadata.practiceIndex,
      }
    });
  });
  
  await Promise.all(updatePromises);
}

/**
 * Get user's vocabulary statistics for difficulty calculation
 */
export async function getUserVocabStats(profileId: string) {
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    throw new Error(authResult.error);
  }
  
  const stats = await prisma.lexicon.aggregate({
    where: { profileId: profileId },
    _avg: {
      correct: true,
      seen: true,
    },
    _count: {
      lemma: true,
    }
  });
  
  const averageAccuracy = stats._avg.seen && stats._avg.seen > 0 
    ? (stats._avg.correct || 0) / stats._avg.seen 
    : 0;
  
  return {
    totalWords: stats._count.lemma,
    averageAccuracy,
    averageSeenCount: stats._avg.seen || 0,
  };
}

/**
 * Get translation for a word using DeepL API
 */
async function getTranslationForWord(word: string): Promise<string | undefined> {
  try {
    const translation = await translateText(word, 'google');
    return translation;
  } catch (error) {
    console.error('Error translating word:', word, error);
    // Return undefined if translation fails so exercises can still work without translations
    return undefined;
  }
} 