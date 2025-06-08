'use server'

import { prisma } from '@/lib/prisma';
import { validateAuth, validateAuthOnly } from '@/lib/validateAuth';

/**
 * Server Actions for user profile management
 * These replace the API routes and provide direct client→server communication
 */

interface Profile {
  id: string;
  email: string | null;
  isAdmin: boolean;
  createdAt: Date;
  lastAccessed: Date | null;
}

/**
 * Create a user profile when they first authenticate with Supabase
 * This is called during initial user registration, so it only needs basic auth
 */
export async function createUserProfile(
  authUserId: string, 
  email: string | null
): Promise<{ success: true; data: Profile } | { success: false; error: string }> {
  // Validate authentication only (no profileId check since we're creating the profile)
  const authResult = await validateAuthOnly();
  if (!authResult.success) {
    return authResult;
  }

  try {
    const profile = await prisma.profile.create({
      data: {
        id: authUserId,
        email: email,
        isAdmin: false, // Default to false
        createdAt: new Date(),
        lastAccessed: new Date()
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
  // Validate authentication and authorization
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    return authResult;
  }

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
  updates: { email?: string | null; isAdmin?: boolean }
): Promise<{ success: true; data: Profile } | { success: false; error: string }> {
  // Validate authentication and authorization
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    return authResult;
  }

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

/**
 * Update last accessed timestamp for a user (internal version without auth check)
 * Used during authentication flow where user is already validated
 */
export async function updateLastAccessedInternal(
  profileId: string
): Promise<{ success: true; data: Profile } | { success: false; error: string }> {
  try {
    const profile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        lastAccessed: new Date()
      }
    });

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error updating last accessed:', error);
    return { success: false, error: 'Failed to update last accessed time' };
  }
}

/**
 * Update last accessed timestamp for a user
 */
export async function updateLastAccessed(
  profileId: string
): Promise<{ success: true; data: Profile } | { success: false; error: string }> {
  // Validate authentication and authorization
  const authResult = await validateAuth(profileId);
  if (!authResult.success) {
    return authResult;
  }

  return updateLastAccessedInternal(profileId);
} 