import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { createUserProfile } from '@/lib/actions/userActions'
import { upsertUserConfig } from '@/lib/actions/userConfigActions'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize authentication - auto-sign in anonymously if no user
    const initializeAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // No user at all - sign in anonymously
        const { error } = await supabase.auth.signInAnonymously()
        if (error) {
          console.error('Anonymous sign-in error:', error)
        }
      } else {
        // User exists, set immediately but also ensure profile exists
        setUser(user)
        await handleUserSetup(user)
      }
      
      setLoading(false)
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user ?? null
        
        if (event === 'SIGNED_IN' && newUser) {
          // Wait for user setup to complete before setting user state
          await handleUserSetup(newUser)
        }
        
        setUser(newUser)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleUserSetup = async (authUser: User) => {
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
          console.log(`Created profile for ${authUser.is_anonymous ? 'anonymous' : 'authenticated'} user`)
          
          // Create default user config for new profile
          const configResult = await upsertUserConfig(authUser.id, {
            articleSource: 'reddit',
            autoScroll: false
          })
          
          if (configResult.success) {
            console.log('Created default user config')
          } else {
            console.error('Failed to create default user config:', configResult.error)
          }
        } else {
          console.error('Failed to create profile:', result.error)
          // Don't throw here - let the app continue, vocabulary actions will handle the missing profile gracefully
        }
      } else if (existingProfile) {
        console.log('Profile already exists for user')
      } else if (error) {
        console.error('Error checking for existing profile:', error)
        // Don't throw - let the app continue
      }
    } catch (error) {
      console.error('Error setting up user:', error)
      // Don't re-throw - let the app continue, vocabulary actions will handle missing profile gracefully
    }
  }

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
        
      console.log('Successfully converted to permanent account')
      return { error: null }
    } catch (error: any) {
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
    loading,
    signInWithEmail,
    signUpWithEmail,
    convertAnonymousUser,
    signOut
  }
} 