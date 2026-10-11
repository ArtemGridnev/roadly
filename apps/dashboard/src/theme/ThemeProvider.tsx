import { useLayoutEffect, useState, type ReactNode } from 'react'
import { ThemeContext } from './theme-context'
import { readStoredTheme, writeStoredTheme, type Theme } from './theme-storage'
import { useSystemTheme } from './useSystemTheme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const systemTheme = useSystemTheme()
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const setTheme = (next: Theme) => {
    writeStoredTheme(next)
    setThemeState(next)
  }

  return <ThemeContext value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext>
}
