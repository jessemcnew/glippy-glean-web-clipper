'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthConfig, getAuthConfig, saveAuthConfig, clearAuthConfig, isAuthenticated } from '@/lib/auth'
import { checkExtensionAvailable, getOAuthTokenFromExtension, isRunningInExtension } from '@/lib/extension-auth'

interface AuthContextType {
  config: AuthConfig | null
  isAuth: boolean
  isLoading: boolean
  login: (config: AuthConfig) => void
  logout: () => void
  updateConfig: (updates: Partial<AuthConfig>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load auth config on mount - check localStorage first, then extension
  useEffect(() => {
    async function loadAuth() {
      // First check localStorage
      const stored = getAuthConfig()
      if (stored && stored.apiToken && stored.domain) {
        setConfig(stored)
        setIsAuth(true)
        setIsLoading(false)
        return
      }

      // If running in extension context, try to get auth from extension
      if (isRunningInExtension()) {
        try {
          const available = await checkExtensionAvailable()
          if (available) {
            const result = await getOAuthTokenFromExtension()
            if (result.success && result.token && result.domain) {
              const extensionConfig: AuthConfig = {
                apiToken: result.token,
                domain: result.domain,
                authMethod: result.authMethod || 'manual',
              }
              // Save to localStorage so we don't need to check again
              saveAuthConfig(extensionConfig)
              setConfig(extensionConfig)
              setIsAuth(true)
              setIsLoading(false)
              return
            }
          }
        } catch (error) {
          console.error('Failed to get auth from extension:', error)
        }
      }

      // No auth found
      setIsLoading(false)
    }

    loadAuth()
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
    <AuthContext.Provider value={{ config, isAuth, isLoading, login, logout, updateConfig }}>
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

