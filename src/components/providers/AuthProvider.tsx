'use client'

import { useEffect, useState, useMemo, ReactNode, createContext } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { handleProfileSetup } from '@/utils/userSetup'

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logInWithGoogle: () => Promise<{ error: any }>;
  linkWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialAuthCompleted, setInitialAuthCompleted] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setError(null) // Clear any previous errors
        console.log('Initializing auth...')
        const { data, error } = await supabase.auth.getUser()
        let currentUser = data.user;

        if (error && error.message !== 'Auth session missing!') {
          console.error('Error getting user:', error)
        }

        if (!currentUser) {
          const { error: signInError, data: { user: newUser } } = await supabase.auth.signInAnonymously()
          console.log('Signed in anonymously')
          
          if (signInError || !newUser) {
            console.error('Anonymous sign-in error:', signInError)
            throw new Error('Anonymous sign-in failed')
          }
          currentUser = newUser;
        }
        
        await handleProfileSetup(supabase, currentUser)
        setUser(currentUser)
        setInitialAuthCompleted(true)
        console.log('Logged in as ', currentUser?.id)
      } catch (error) {
        console.error('Auth initialization failed:', error)
        setError(error instanceof Error ? error.message : 'Authentication failed')
      } finally {
        setIsLoading(false)
      }
    }

    // Set up auth state listener to handle OAuth callbacks and other auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      
      // Handle different auth state change events
      if (event === 'SIGNED_IN' && session?.user) {
        // Only process OAuth sign-ins after initial auth is completed
        // This prevents processing the initial anonymous sign-in
        if (initialAuthCompleted && !session.user.is_anonymous) {
          console.log('OAuth sign-in detected, updating user')
          await handleProfileSetup(supabase, session.user)
          setUser(session.user)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, will re-initialize with anonymous user')
        // Don't immediately sign in anonymously here, let the initialization handle it
        setUser(null)
        setInitialAuthCompleted(false)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Token refreshed, updating user if changed')
        setUser(session.user)
      }
    })

    // Initialize auth
    initializeAuth()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, initialAuthCompleted])

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
      return { error: signOutError }
    }
    
    return { error: null }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    logInWithGoogle,
    linkWithGoogle,
    signOut
  };

  // Loading component
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading User...</p>
        </div>
      </div>
    )
  }

  // Error component
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold mb-2">Authentication Error</h3>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}