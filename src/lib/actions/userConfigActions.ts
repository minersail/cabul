'use server'

import { prisma } from '@/lib/prisma';

/**
 * Server Actions for user configuration management
 * These handle CRUD operations for userConfig stored in the database
 */

export interface UserConfig {
  profileId: string;
  articleSource: string;
  autoScroll: boolean;
}

/**
 * Get user configuration by profile ID
 */
export async function getUserConfig(
  profileId: string
): Promise<{ success: true; data: UserConfig | null } | { success: false; error: string }> {
  try {
    const userConfig = await prisma.userConfig.findUnique({
      where: { profileId }
    });

    return { success: true, data: userConfig };
  } catch (error) {
    console.error('Error fetching user config:', error);
    return { success: false, error: 'Failed to fetch user configuration' };
  }
}

/**
 * Create or update user configuration
 */
export async function upsertUserConfig(
  profileId: string,
  config: { articleSource?: string; autoScroll?: boolean }
): Promise<{ success: true; data: UserConfig } | { success: false; error: string }> {
  try {
    const userConfig = await prisma.userConfig.upsert({
      where: { profileId },
      update: config,
      create: {
        profileId,
        articleSource: config.articleSource || 'reddit',
        autoScroll: config.autoScroll ?? false,
      }
    });

    return { success: true, data: userConfig };
  } catch (error) {
    console.error('Error upserting user config:', error);
    return { success: false, error: 'Failed to save user configuration' };
  }
}

/**
 * Update specific user configuration fields
 */
export async function updateUserConfig(
  profileId: string,
  updates: { articleSource?: string; autoScroll?: boolean }
): Promise<{ success: true; data: UserConfig } | { success: false; error: string }> {
  try {
    const userConfig = await prisma.userConfig.update({
      where: { profileId },
      data: updates
    });

    return { success: true, data: userConfig };
  } catch (error) {
    console.error('Error updating user config:', error);
    return { success: false, error: 'Failed to update user configuration' };
  }
}