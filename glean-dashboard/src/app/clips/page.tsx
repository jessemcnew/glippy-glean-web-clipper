'use client'

import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/LoginForm'
import ClipsReader from '@/components/ClipsReader'

export default function ClipsPage() {
  const { isAuth, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuth) {
    return <LoginForm />
  }

  return <ClipsReader />
}
