'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthConfig } from '@/lib/auth'

export default function OAuthCallback() {
  const router = useRouter()
  const { login } = useAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const errorParam = params.get('error')

        if (errorParam) {
          const isPopup = window.opener && window.opener !== window
          if (isPopup) {
            window.opener?.postMessage({
              type: 'GLEAN_OAUTH_ERROR',
              error: `OAuth error: ${errorParam}`,
            }, window.location.origin)
            setTimeout(() => window.close(), 500)
            return
          }
          setError(`OAuth error: ${errorParam}`)
          setStatus('error')
          return
        }

        if (!code) {
          const isPopup = window.opener && window.opener !== window
          if (isPopup) {
            window.opener?.postMessage({
              type: 'GLEAN_OAUTH_ERROR',
              error: 'No authorization code received',
            }, window.location.origin)
            setTimeout(() => window.close(), 500)
            return
          }
          setError('No authorization code received')
          setStatus('error')
          return
        }

        // Get stored domain from session
        const domain = sessionStorage.getItem('oauth_domain') || 'app.glean.com'
        sessionStorage.removeItem('oauth_domain')

        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
        
        // Normalize domain to backend format (matching extension logic)
        let backendDomain: string
        if (cleanDomain.includes('-be.glean.com')) {
          backendDomain = cleanDomain
        } else if (cleanDomain === 'app.glean.com' || cleanDomain.startsWith('app.')) {
          // Special case: app.glean.com -> linkedin-be.glean.com
          backendDomain = 'linkedin-be.glean.com'
        } else if (cleanDomain.endsWith('.glean.com')) {
          const company = cleanDomain.replace('.glean.com', '')
          backendDomain = `${company}-be.glean.com`
        } else {
          backendDomain = `${cleanDomain}-be.glean.com`
        }

        // Exchange authorization code for access token
        // Use frontend domain for token endpoint: https://<instance>.glean.com/oauth/token
        const frontendDomain = cleanDomain.includes('-be.') 
          ? cleanDomain.replace('-be.glean.com', '.glean.com')
          : cleanDomain
        const redirectUri = `${window.location.origin}/auth/callback`
        const tokenUrl = `https://${frontendDomain}/oauth/token`

        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        })

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          const error = `Token exchange failed: ${tokenResponse.statusText} - ${errorText}`
          const isPopup = window.opener && window.opener !== window
          if (isPopup) {
            window.opener?.postMessage({
              type: 'GLEAN_OAUTH_ERROR',
              error,
            }, window.location.origin)
            setTimeout(() => window.close(), 500)
            return
          }
          throw new Error(error)
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        if (!accessToken) {
          const error = 'No access token in response'
          const isPopup = window.opener && window.opener !== window
          if (isPopup) {
            window.opener?.postMessage({
              type: 'GLEAN_OAUTH_ERROR',
              error,
            }, window.location.origin)
            setTimeout(() => window.close(), 500)
            return
          }
          throw new Error(error)
        }

        // Check if we're in a popup (opened by OAuth flow)
        const isPopup = window.opener && window.opener !== window
        
        if (isPopup) {
          // Send token back to parent window
          window.opener?.postMessage({
            type: 'GLEAN_OAUTH_SUCCESS',
            token: accessToken,
            domain: cleanDomain,
          }, window.location.origin)
          
          setStatus('success')
          // Close popup after a brief delay
          setTimeout(() => {
            window.close()
          }, 500)
        } else {
          // Normal redirect flow (if redirect URI is registered)
          const config: AuthConfig = {
            domain: cleanDomain,
            apiToken: accessToken,
            authMethod: 'oauth',
          }
          
          login(config)
          setStatus('success')

          // Redirect to dashboard
          setTimeout(() => {
            router.push('/')
          }, 1000)
        }
      } catch (err) {
        console.error('OAuth callback error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete OAuth flow'
        const isPopup = window.opener && window.opener !== window
        if (isPopup) {
          window.opener?.postMessage({
            type: 'GLEAN_OAUTH_ERROR',
            error: errorMessage,
          }, window.location.origin)
          setTimeout(() => window.close(), 500)
          return
        }
        setError(errorMessage)
        setStatus('error')
      }
    }

    handleCallback()
  }, [login, router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-lg border border-zinc-800 shadow-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Completing sign in...</h2>
            <p className="text-zinc-400">Processing OAuth callback</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Sign in successful!</h2>
            <p className="text-zinc-400">Redirecting to dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Sign in failed</h2>
            <p className="text-zinc-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
