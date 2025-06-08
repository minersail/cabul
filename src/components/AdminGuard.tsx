'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserProfile } from '@/lib/actions/userActions'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        const result = await getUserProfile(user.id)
        console.log('result', result)
        if (result.success && result.data) {
          setIsAdmin(result.data.isAdmin)
        } else {
          setIsAdmin(false)
          setError('Failed to load user profile')
        }
      } catch (err) {
        setIsAdmin(false)
        setError('Error checking admin status')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to access this page
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Administrator privileges required to access this page
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // User is admin - render the protected content
  return <>{children}</>
} 