import { useEffect, useState, useMemo, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { createUserProfile, updateLastAccessedInternal } from '@/lib/actions/userActions'
import { upsertUserConfig } from '@/lib/actions/userConfigActions'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  
  // Create a single client instance for the entire hook
  const supabase = useMemo(() => createClient(), [])

  const handleProfileSetup = useCallback(async (authUser: User) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.id)
        .single()

      // If no profile exists, create one
      if (!existingProfile && error?.code === 'PGRST116') {
        // For anonymous users, use null email; for authenticated users, use their email
        const email = authUser.is_anonymous ? null : (authUser.email || null)
        
        const result = await createUserProfile(authUser.id, email)
        
        if (result.success) {
          // Create default user config for new profile
          const configResult = await upsertUserConfig(authUser.id, {
            articleSource: 'reddit',
            autoScroll: false
          })
          
          if (!configResult.success) {
            console.error('Failed to create default user config:', configResult.error)
          }
        } else {
          console.error('Failed to create profile:', result.error)
          // Don't throw here - let the app continue, vocabulary actions will handle the missing profile gracefully
        }
      } else if (existingProfile) {
        // Update lastAccessed timestamp for existing profile
        const updateResult = await updateLastAccessedInternal(authUser.id)
        
        if (!updateResult.success) {
          console.error('Failed to update last accessed:', updateResult.error)
        }
      } else if (error) {
        console.error('Error checking for existing profile:', error)
        // Don't throw - let the app continue
      }
      
    } catch (error) {
      console.error('Error setting up user:', error)
      // Don't re-throw - let the app continue, vocabulary actions will handle missing profile gracefully
    }
  }, [supabase])

  useEffect(() => {
    // Initialize authentication - auto-sign in anonymously if no user
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        let user = data.user;

        if (error) {
          console.error('Error getting user:', error)
        }

        if (!user) {
          // No user at all - sign in anonymously
          const { error: signInError, data: { user: newUser } } = await supabase.auth.signInAnonymously()
          
          if (signInError || !newUser) {
            console.error('Anonymous sign-in error:', signInError)
            throw new Error('Anonymous sign-in error.');
          }

          user = newUser;
        }
        
        await handleProfileSetup(user)
        setUser(user)
        console.log("Logged in as " + user.id)
        
      } catch (error) {
        console.error('Auth initialization failed:', error)
        // Don't throw here - let the app continue
      }
    }

    initializeAuth()
  }, [handleProfileSetup, supabase])

  const logInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { error }
  }

  const linkWithGoogle = async () => {
    if (!user?.is_anonymous) {
      throw new Error('User is not anonymous')
    }

    try {
      // Link anonymous user with Google
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      return { error }
    } catch (error) {
      console.error('Link with Google error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.error('Logout error:', signOutError)
      // Return early if sign out fails
      return { error: signOutError }
    }

    // Immediately sign in anonymously to ensure a session always exists
    const { error: signInError } = await supabase.auth.signInAnonymously()
    if (signInError) {
      console.error('Anonymous sign-in after logout failed:', signInError)
      return { error: signInError }
    }
    
    return { error: null }
  }

  return { 
    user, 
    logInWithGoogle,
    linkWithGoogle,
    signOut
  }
} 