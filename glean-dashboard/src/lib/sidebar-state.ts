'use client'

export interface SidebarState {
  leftCollapsed: boolean
  rightCollapsed: boolean
  leftWidth: number
  rightWidth: number
}

const STATE_KEY = 'glippy_sidebar_state'
const DEFAULT_STATE: SidebarState = {
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: 22,
  rightWidth: 24,
}

export function loadSidebarState(): SidebarState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_STATE,
      ...parsed,
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function saveSidebarState(state: SidebarState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore write failures
  }
}

