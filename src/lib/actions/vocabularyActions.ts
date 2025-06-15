'use server'

import { prisma } from '@/lib/prisma';
import { validateAuth } from '@/lib/validateAuth';

/**
 * Server Actions for vocabulary management
 * These replace the API routes and provide direct client→server communication
 */

export interface VocabularyEntry {
  lemma: string;
  seen: number;
  correct: number;
  firstSeen: Date;
}

/**
 * Add or update a word in the user's vocabulary
 */
export async function addWordToVocabulary(
  profileId: string,
  lemma: string,
  wasCorrect: boolean
): Promise<{ success: true; data: VocabularyEntry } | { success: false; error: string }> {
  // Validate authentication and authorization
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    return authResult;
  }

  try {
    // Ensure the lemma exists in the lemmas table
    await prisma.lemma.upsert({
      where: { lemma },
      update: {},
      create: { lemma }
    });

    // Then upsert the lexicon entry - composite key is profileId_lemma
    const lexiconEntry = await prisma.lexicon.upsert({
      where: {
        profileId_lemma: {
          profileId: profileId,
          lemma: lemma
        }
      },
      update: {
        seen: {
          increment: 1
        },
        correct: {
          increment: wasCorrect ? 1 : 0
        }
      },
      create: {
        profileId: profileId,
        lemma: lemma,
        seen: 1,
        correct: wasCorrect ? 1 : 0,
        firstSeen: new Date()
      }
    });

    const result: VocabularyEntry = {
      lemma: lexiconEntry.lemma,
      seen: lexiconEntry.seen,
      correct: lexiconEntry.correct,
      firstSeen: lexiconEntry.firstSeen
    };

    return { success: true, data: result };
  } catch (error) {
    console.error('Error adding word to vocabulary:', error);
    return { success: false, error: `Failed to add word "${lemma}" to vocabulary` };
  }
}

/**
 * Get all vocabulary words for a user
 */
export async function getUserVocabulary(
  profileId: string
): Promise<{ success: true; data: VocabularyEntry[] } | { success: false; error: string }> {
  // Validate authentication and authorization
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    return authResult;
  }

  try {
    const lexiconEntries = await prisma.lexicon.findMany({
      where: {
        profileId: profileId
      },
      orderBy: [
        { firstSeen: 'desc' },
        { lemma: 'asc' }
      ]
    });

    const vocabulary: VocabularyEntry[] = lexiconEntries.map(entry => ({
      lemma: entry.lemma,
      seen: entry.seen,
      correct: entry.correct,
      firstSeen: entry.firstSeen
    }));

    return { success: true, data: vocabulary };
  } catch (error) {
    console.error('Error fetching user vocabulary:', error);
    return { success: false, error: 'Failed to fetch vocabulary' };
  }
}

/**
 * Delete all vocabulary words, mistakes, and reset practice progress for a user
 */
export async function deleteUserVocabulary(
  profileId: string
): Promise<{ success: true; data: { lexiconDeleted: number; mistakesDeleted: number; practiceReset: boolean } } | { success: false; error: string }> {
  // Validate authentication and authorization
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    return authResult;
  }

  try {
    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Delete all lexicon entries for the user
      const lexiconDeleteResult = await tx.lexicon.deleteMany({
        where: {
          profileId: profileId
        }
      });

      // Delete all mistakes for the user
      const mistakesDeleteResult = await tx.mistake.deleteMany({
        where: {
          profileId: profileId
        }
      });

      // Reset practice index in user metadata
      await tx.userMetadata.upsert({
        where: {
          profileId: profileId
        },
        update: {
          practiceIndex: 0
        },
        create: {
          profileId: profileId,
          practiceIndex: 0
        }
      });

      return {
        lexiconDeleted: lexiconDeleteResult.count,
        mistakesDeleted: mistakesDeleteResult.count,
        practiceReset: true
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting user vocabulary:', error);
    return { success: false, error: 'Failed to delete vocabulary and reset progress' };
  }
}

/**
 * Record a mistake for a specific token
 */
export async function recordMistake(
  profileId: string,
  token: string,
  lemma: string,
  pos: string,
  sentence?: string,
  translation?: string
): Promise<{ success: true; data: { mistakeId: number } } | { success: false; error: string }> {
  // Validate authentication and authorization
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    return authResult;
  }

  try {
    // Ensure the lemma exists in the lemmas table
    await prisma.lemma.upsert({
      where: { lemma },
      update: {},
      create: { lemma }
    });

    // Create the mistake record with lemma and pos directly
    const mistake = await prisma.mistake.create({
      data: {
        profileId: profileId,
        token: token,
        lemma: lemma,
        pos: pos,
        sentence: sentence,
        translation: translation
      }
    });

    return { success: true, data: { mistakeId: mistake.mistakeId } };
  } catch (error) {
    console.error('Error recording mistake:', error);
    return { success: false, error: `Failed to record mistake for token "${token}"` };
  }
}

/**
 * Get all mistakes for a user
 */
export async function getUserMistakes(
  profileId: string
): Promise<{ success: true; data: Array<{
  mistakeId: number;
  token: string;
  lemma: string;
  pos: string;
  sentence?: string;
  translation?: string;
  createdAt: Date;
}> } | { success: false; error: string }> {
  // Validate authentication and authorization
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    return authResult;
  }

  try {
    const mistakes = await prisma.mistake.findMany({
      where: {
        profileId: profileId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedMistakes = mistakes.map(mistake => ({
      mistakeId: mistake.mistakeId,
      token: mistake.token,
      lemma: mistake.lemma,
      pos: mistake.pos,
      sentence: mistake.sentence || undefined,
      translation: mistake.translation || undefined,
      createdAt: mistake.createdAt
    }));

    return { success: true, data: formattedMistakes };
  } catch (error) {
    console.error('Error fetching user mistakes:', error);
    return { success: false, error: 'Failed to fetch mistakes' };
  }
} 