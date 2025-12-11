'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthConfig, getAuthConfig, saveAuthConfig, clearAuthConfig, isAuthenticated } from '@/lib/auth'

interface AuthContextType {
  config: AuthConfig | null
  isAuth: boolean
  login: (config: AuthConfig) => void
  logout: () => void
  updateConfig: (updates: Partial<AuthConfig>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const [isAuth, setIsAuth] = useState(false)

  // Load auth config on mount
  useEffect(() => {
    const stored = getAuthConfig()
    if (stored) {
      setConfig(stored)
      setIsAuth(isAuthenticated())
    }
  }, [])

  const login = (newConfig: AuthConfig) => {
    saveAuthConfig(newConfig)
    setConfig(newConfig)
    setIsAuth(true)
  }

  const logout = () => {
    clearAuthConfig()
    setConfig(null)
    setIsAuth(false)
  }

  const updateConfig = (updates: Partial<AuthConfig>) => {
    if (!config) return
    const updated = { ...config, ...updates }
    saveAuthConfig(updated)
    setConfig(updated)
    setIsAuth(isAuthenticated())
  }

  return (
    <AuthContext.Provider value={{ config, isAuth, login, logout, updateConfig }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

