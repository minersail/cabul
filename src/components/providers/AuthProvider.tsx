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
        console.log('Logged in as ', currentUser?.id)
      } catch (error) {
        console.error('Auth initialization failed:', error)
        setError(error instanceof Error ? error.message : 'Authentication failed')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [supabase])

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

    const { data, error: signInError } = await supabase.auth.signInAnonymously()
    if (signInError || !data.user) {
      console.error('Anonymous sign-in after logout failed:', signInError)
      return { error: signInError }
    }
    
    await handleProfileSetup(supabase, data.user)
    setUser(data.user)
    
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