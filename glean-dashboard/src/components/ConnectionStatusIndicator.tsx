'use client'

import { cn } from '@/lib/utils'

type ConnectionState = 'connected' | 'disconnected' | 'checking'

interface Props {
  state: ConnectionState
  isChecking?: boolean
  label?: string
}

const COLOR_MAP: Record<ConnectionState, string> = {
  connected: 'bg-green-500',
  disconnected: 'bg-red-500',
  checking: 'bg-amber-400',
}

export function ConnectionStatusIndicator({ state, isChecking, label }: Props) {
  const color = COLOR_MAP[state] || COLOR_MAP.disconnected
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={cn('h-2.5 w-2.5 rounded-full inline-flex', color)} />
      <span>{label ?? (isChecking ? 'Checking Glean…' : state === 'connected' ? 'Connected' : 'Not connected')}</span>
    </div>
  )
}

