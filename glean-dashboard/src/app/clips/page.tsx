'use client'

import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/LoginForm'
import ClipsReader from '@/components/ClipsReader'

export default function ClipsPage() {
  const { isAuth } = useAuth()

  if (!isAuth) {
    return <LoginForm />
  }

  return <ClipsReader />
}
