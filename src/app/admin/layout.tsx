'use client'
import AdminGuard from '@/components/AdminGuard'
import AdminNav from '@/components/AdminNav'
import { AuthProvider } from '@/components/providers/AuthProvider'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AdminGuard>
        <AdminNav />
        {children}
      </AdminGuard>
    </AuthProvider>
  )
} 