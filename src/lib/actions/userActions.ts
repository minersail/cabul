'use server'

import { prisma } from '@/lib/prisma';

/**
 * Server Actions for user profile management
 * These replace the API routes and provide direct client→server communication
 */

interface Profile {
  id: string;
  email: string | null;
  createdAt: Date;
}

/**
 * Create a user profile when they first authenticate with Supabase
 */
export async function createUserProfile(
  authUserId: string, 
  email: string | null
): Promise<{ success: true; data: Profile } | { success: false; error: string }> {
  try {
    const profile = await prisma.profile.create({
      data: {
        id: authUserId,
        email: email,
        createdAt: new Date()
      }
    });

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: 'Failed to create user profile' };
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(
  profileId: string
): Promise<{ success: true; data: Profile | null } | { success: false; error: string }> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    });

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: 'Failed to fetch user profile' };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  profileId: string,
  updates: { email?: string | null }
): Promise<{ success: true; data: Profile } | { success: false; error: string }> {
  try {
    const profile = await prisma.profile.update({
      where: { id: profileId },
      data: updates
    });

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Failed to update user profile' };
  }
} 