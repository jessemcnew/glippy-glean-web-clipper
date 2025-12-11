'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthConfig } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { getOAuthTokenFromExtension, checkExtensionAvailable } from '@/lib/extension-auth'

export default function LoginForm() {
  const { login } = useAuth()
  const [domain, setDomain] = useState('app.glean.com')
  const [apiToken, setApiToken] = useState('')
  const [authMethod, setAuthMethod] = useState<'oauth' | 'manual'>('manual')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTokenEntry, setShowTokenEntry] = useState(true) // Show token entry by default
  const [extensionAvailable, setExtensionAvailable] = useState(false)
  const [checkingExtension, setCheckingExtension] = useState(false) // Start as false - don't block UI

  // Optionally check for extension in background (non-blocking)
  useEffect(() => {
    // Check extension availability in background
    checkExtensionAvailable()
      .then(available => {
        setExtensionAvailable(available)
        // If extension is available, try to get OAuth token automatically
        if (available) {
          getOAuthTokenFromExtension().then(result => {
            if (result.success && result.token) {
              // Auto-login with extension's OAuth token
              const config: AuthConfig = {
                domain: result.domain || domain.trim(),
                apiToken: result.token,
                authMethod: 'oauth',
              }
              login(config)
            }
          }).catch(() => {
            // Silently fail - user can still use manual entry
          })
        }
      })
      .catch(() => {
        // Extension not available - that's fine
      })
  }, [domain, login])

  // Check for OAuth callback (token in URL hash or query params)
  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)
    
    // Check for OAuth token in hash (common OAuth pattern)
    const hashParams = new URLSearchParams(hash.substring(1))
    const token = hashParams.get('access_token') || params.get('token')
    
    if (token) {
      // OAuth callback - save token and clear URL
      const config: AuthConfig = {
        domain: domain.trim(),
        apiToken: token,
        authMethod: 'oauth',
      }
      login(config)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [domain, login])

  const handleOAuthLogin = () => {
    setLoading(true)
    setError('')
    
    try {
      const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
      
      // Normalize domain to backend format (matching extension logic)
      let backendDomain: string
      if (cleanDomain.includes('-be.glean.com')) {
        // Already a backend domain
        backendDomain = cleanDomain
      } else if (cleanDomain === 'app.glean.com' || cleanDomain.startsWith('app.')) {
        // Special case: app.glean.com -> linkedin-be.glean.com
        backendDomain = 'linkedin-be.glean.com'
      } else if (cleanDomain.endsWith('.glean.com')) {
        // customer.glean.com -> customer-be.glean.com
        const company = cleanDomain.replace('.glean.com', '')
        backendDomain = `${company}-be.glean.com`
      } else {
        // Fallback: add -be suffix
        backendDomain = `${cleanDomain}-be.glean.com`
      }
      
      // Glean OAuth authorization endpoint
      // Use frontend domain (app.glean.com), not backend domain
      const frontendDomain = cleanDomain.includes('-be.') 
        ? cleanDomain.replace('-be.glean.com', '.glean.com')
        : cleanDomain
      
      const redirectUri = `${window.location.origin}/auth/callback`
      const scope = 'collections:read drafts:read users:read groups:read integrations:read'
      
      // Construct OAuth authorization URL
      // Glean OAuth endpoint: https://<instance>.glean.com/oauth/authorize
      const authUrl = `https://${frontendDomain}/oauth/authorize?` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code`
      
      // Note: client_id may be required if OAuth app is registered in Glean Admin
      // If redirect doesn't work, you may need to register the redirect_uri in Glean Admin
      
      // Store domain for callback
      sessionStorage.setItem('oauth_domain', cleanDomain)
      
      console.log('Opening OAuth flow in popup:', authUrl)
      
      // Open OAuth flow in popup window
      const popup = window.open(
        authUrl,
        'glean-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )
      
      if (!popup) {
        setError('Popup blocked. Please allow popups for this site and try again.')
        setLoading(false)
        return
      }
      
      // Listen for message from popup with the token
      let isCompleted = false
      const messageListener = async (event: MessageEvent) => {
        // Security: verify origin
        if (event.origin !== window.location.origin) {
          console.warn('Ignored message from unauthorized origin:', event.origin)
          return
        }
        
        if (event.data.type === 'GLEAN_OAUTH_SUCCESS') {
          isCompleted = true
          window.removeEventListener('message', messageListener)
          popup?.close()
          
          const { token, domain: tokenDomain } = event.data
          
          // Save auth config
          const config: AuthConfig = {
            domain: tokenDomain || cleanDomain,
            apiToken: token,
            authMethod: 'oauth',
          }
          
          login(config)
          setLoading(false)
        } else if (event.data.type === 'GLEAN_OAUTH_ERROR') {
          isCompleted = true
          window.removeEventListener('message', messageListener)
          popup?.close()
          setError(event.data.error || 'OAuth authentication failed')
          setLoading(false)
        }
      }
      
      window.addEventListener('message', messageListener)
      
      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed && !isCompleted) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          setError('OAuth flow was cancelled')
          setLoading(false)
        }
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth flow')
      setLoading(false)
    }
  }

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!domain || !apiToken) {
      setError('Please enter both domain and API token')
      setLoading(false)
      return
    }

    try {
      // Save auth config
      const config: AuthConfig = {
        domain: domain.trim(),
        apiToken: apiToken.trim(),
        authMethod,
      }
      login(config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4" role="img" aria-label="Glean logo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-primary"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M12 6v6" />
              <path d="M9 9h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Welcome to Glean</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Sign in to access your dashboard and insights</p>
        </header>

        {/* Login card */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-xl shadow-lg">
          {!showTokenEntry ? (
            <div className="space-y-4">
              {/* OAuth button */}
              <Button
                onClick={handleOAuthLogin}
                disabled={loading || checkingExtension}
                className="w-full h-11 text-base font-medium"
                size="lg"
                aria-label={checkingExtension ? 'Checking extension' : loading ? 'Connecting' : extensionAvailable ? 'Sign in with Extension OAuth' : 'Continue with OAuth'}
              >
                {checkingExtension ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Checking extension...</span>
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span>{extensionAvailable ? 'Sign in with Extension OAuth' : 'Continue with OAuth'}</span>
                  </>
                )}
              </Button>
              {extensionAvailable && (
                <p className="text-xs text-muted-foreground text-center">
                  Using OAuth token from Glean Web Clipper extension
                </p>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Token entry toggle */}
              <Button
                variant="outline"
                onClick={() => setShowTokenEntry(true)}
                className="w-full h-11 text-base font-medium border-border/50"
                size="lg"
              >
                Sign in with API token
              </Button>
            </div>
          ) : (
            <form onSubmit={handleTokenLogin} className="space-y-4">
              {/* Back button - only show if OAuth is available */}
              {extensionAvailable && (
                <button
                  type="button"
                  onClick={() => {
                    setShowTokenEntry(false)
                    setError('')
                    setApiToken('')
                  }}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  aria-label="Back to sign in options"
                >
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to sign in options</span>
                </button>
              )}

              {/* Domain input */}
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-sm font-medium">
                  Glean Domain
                </Label>
                <Input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="app.glean.com"
                  disabled={loading}
                  className="h-11 bg-background border-border/50"
                  required
                />
                <p className="text-xs text-muted-foreground text-pretty">
                  Your Glean instance domain (e.g., app.glean.com or yourcompany.glean.com)
                </p>
              </div>

              {/* Token input */}
              <div className="space-y-2">
                <Label htmlFor="token" className="text-sm font-medium">
                  API Token
                </Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="glean_••••••••••••••••"
                  value={apiToken}
                  onChange={(e) => {
                    setApiToken(e.target.value)
                    setError('')
                  }}
                  disabled={loading}
                  className="h-11 bg-background border-border/50"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-pretty">
                  Enter your API token to authenticate with Glean
                </p>
              </div>

              {/* Auth method selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Authentication Method</Label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="authMethod"
                      value="manual"
                      checked={authMethod === 'manual'}
                      onChange={() => setAuthMethod('manual')}
                      className="mr-2 accent-primary"
                    />
                    <span className="text-sm">Manual Token (Glean-issued)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="authMethod"
                      value="oauth"
                      checked={authMethod === 'oauth'}
                      onChange={() => setAuthMethod('oauth')}
                      className="mr-2 accent-primary"
                    />
                    <span className="text-sm">OAuth Token</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground text-pretty">
                  Select OAuth if your token was obtained via OAuth flow
                </p>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading || !apiToken.trim()}
                className="w-full h-11 text-base font-medium"
                size="lg"
                aria-label={loading ? 'Verifying credentials' : 'Continue with API token'}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </Button>
            </form>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20" role="alert" aria-live="assertive">
              <p className="text-sm text-destructive text-pretty">{error}</p>
            </div>
          )}
        </Card>

        {/* Footer links */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p className="text-pretty">
            Don't have an account?{' '}
            <a href="#" className="text-foreground hover:underline font-medium">
              Contact your administrator
            </a>
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <span className="text-border">·</span>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <span className="text-border">·</span>
            <a href="#" className="hover:text-foreground transition-colors">
              Help
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
