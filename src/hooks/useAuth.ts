import { useEffect, useState, useMemo, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { createUserProfile, updateLastAccessedInternal } from '@/lib/actions/userActions'
import { upsertUserConfig } from '@/lib/actions/userConfigActions'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  
  // Create a single client instance for the entire hook
  const supabase = useMemo(() => createClient(), [])

  const handleUserSetup = useCallback(async (authUser: User) => {
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
        
        await handleUserSetup(user)
        setUser(user)
        
      } catch (error) {
        console.error('Auth initialization failed:', error)
        // Don't throw here - let the app continue
      }
    }

    initializeAuth()

    // Listen for auth changes - avoid async callback to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUser = session?.user ?? null
        
        if (event === 'SIGNED_IN' && newUser) {
          // Use setTimeout to defer async operations until after callback finishes
          // This prevents deadlocks as recommended by Supabase documentation
          setTimeout(async () => {
            await handleUserSetup(newUser)
          }, 0)
        }
        
        setUser(newUser)
      }
    )

    return () => subscription.unsubscribe()
  }, [handleUserSetup, supabase])

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    })
    return { error }
  }

  const convertAnonymousUser = async (email: string, password: string) => {
    if (!user?.is_anonymous) {
      throw new Error('User is not anonymous')
    }

    try {
      // Convert anonymous user to permanent user
      const { error } = await supabase.auth.updateUser({
        email,
        password
      })
      
      if (error) throw error
      
      // Update profile with email
      await supabase
        .from('profiles')
        .update({ email })
        .eq('id', user.id)
        
      return { error: null }
    } catch (error) {
      console.error('Conversion error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
    }
    return { error }
  }

  return { 
    user, 
    signInWithEmail,
    signUpWithEmail,
    convertAnonymousUser,
    signOut
  }
} 