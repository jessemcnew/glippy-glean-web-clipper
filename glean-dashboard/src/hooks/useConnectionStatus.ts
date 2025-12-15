'use client'

import { useEffect, useState } from 'react'
import { checkGleanConnection } from '@/lib/connection-status'

type ConnectionState = 'connected' | 'disconnected' | 'checking'

interface ConnectionStatus {
  state: ConnectionState
  isConnected: boolean
  isChecking: boolean
  error?: string
}

const POLL_INTERVAL = 30 * 1000

export function useConnectionStatus(): ConnectionStatus {
  const [state, setState] = useState<ConnectionState>('checking')
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    let timer: NodeJS.Timeout | null = null

    const runCheck = async () => {
      setState('checking')
      try {
        const result = await checkGleanConnection()
        if (cancelled) return
        setState(result.state)
        setError(result.error)
      } catch (err) {
        if (cancelled) return
        setState('disconnected')
        setError(err instanceof Error ? err.message : String(err))
      }
    }

    runCheck()
    timer = setInterval(runCheck, POLL_INTERVAL)

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [])

  return {
    state,
    isConnected: state === 'connected',
    isChecking: state === 'checking',
    error,
  }
}

