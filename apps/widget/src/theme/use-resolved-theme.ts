import { useEffect, useState } from 'react'
import type { WidgetTheme } from '@roadly/shared'

export type ResolvedTheme = 'light' | 'dark'

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light'
}

export function useResolvedTheme(theme: WidgetTheme): ResolvedTheme {
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystemTheme)

  useEffect(() => {
    if (theme !== 'auto') {
      return
    }

    const query = window.matchMedia(DARK_SCHEME_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [theme])

  return theme === 'auto' ? systemTheme : theme
}
