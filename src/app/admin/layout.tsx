'use client'
import AdminGuard from '@/components/AdminGuard'
import AdminNav from '@/components/AdminNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard>
      <AdminNav />
      {children}
    </AdminGuard>
  )
} 