import { useSyncExternalStore } from 'react'
import type { ResolvedTheme } from './theme-context'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getSnapshot(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function useSystemTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, getSnapshot)
}
