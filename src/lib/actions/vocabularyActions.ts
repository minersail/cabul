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
 * Delete all vocabulary words for a user
 */
export async function deleteUserVocabulary(
  profileId: string
): Promise<{ success: true; data: number } | { success: false; error: string }> {
  // Validate authentication and authorization
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    return authResult;
  }

  try {
    const deleteResult = await prisma.lexicon.deleteMany({
      where: {
        profileId: profileId
      }
    });

    return { success: true, data: deleteResult.count };
  } catch (error) {
    console.error('Error deleting user vocabulary:', error);
    return { success: false, error: 'Failed to delete vocabulary' };
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
  sentence?: string
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

    // Ensure the token exists in the tokens table
    await prisma.token.upsert({
      where: { text: token },
      update: {},
      create: { 
        text: token,
        lemma: lemma,
        pos: pos
      }
    });

    // Create the mistake record
    const mistake = await prisma.mistake.create({
      data: {
        profileId: profileId,
        token: token,
        sentence: sentence
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
      include: {
        tokenRef: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedMistakes = mistakes.map(mistake => ({
      mistakeId: mistake.mistakeId,
      token: mistake.token,
      lemma: mistake.tokenRef.lemma,
      pos: mistake.tokenRef.pos,
      sentence: mistake.sentence || undefined,
      createdAt: mistake.createdAt
    }));

    return { success: true, data: formattedMistakes };
  } catch (error) {
    console.error('Error fetching user mistakes:', error);
    return { success: false, error: 'Failed to fetch mistakes' };
  }
} 