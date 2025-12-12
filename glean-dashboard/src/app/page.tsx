'use client'

import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/LoginForm'
import { Dashboard } from '@/components/Dashboard'

export default function DashboardPage() {
  const { isAuth, config, logout, isLoading: authLoading } = useAuth()

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Require authentication - show login form if not authenticated
  if (!isAuth || !config) {
    return <LoginForm />
  }

  return <Dashboard onLogout={logout} />
}
