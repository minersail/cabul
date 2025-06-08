import { createClient } from '@/lib/supabase/server'

/**
 * Utility function to validate authentication and authorization
 * Call this at the beginning of server actions that require user authentication
 */
export async function validateAuth(profileId: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Get current user from Supabase
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    console.log("user in validateAuth", user);
    
    if (error || !user) {
      return { success: false, error: 'Authentication required' }
    }
    
    // Verify user owns the profileId (authorization check)
    if (user.id !== profileId) {
      return { success: false, error: 'Unauthorized: Cannot access another user\'s data' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Authorization error:', error)
    return { success: false, error: 'Authorization failed' }
  }
}

/**
 * Utility function to validate authentication only (no profileId check)
 * Call this at the beginning of server actions that require authentication but not specific user data
 */
export async function validateAuthOnly(): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Authentication required' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
} 