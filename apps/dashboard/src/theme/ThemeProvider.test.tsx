import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './useTheme'

let systemDark = false
const listeners = new Set<() => void>()

function setSystemDark(dark: boolean) {
  systemDark = dark
  act(() => listeners.forEach((listener) => listener()))
}

beforeEach(() => {
  systemDark = false
  listeners.clear()
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return systemDark
    },
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function ThemeControls() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <>
      <p>
        {theme} / {resolvedTheme}
      </p>
      <button onClick={() => setTheme('dark')}>Dark</button>
    </>
  )
}

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <ThemeControls />
    </ThemeProvider>
  )
}

const isDark = () => document.documentElement.classList.contains('dark')

describe('ThemeProvider', () => {
  it('restores a stored choice over the system preference', () => {
    systemDark = true
    localStorage.setItem('roadly-theme', 'light')
    renderWithTheme()

    expect(screen.getByText('light / light')).toBeInTheDocument()
    expect(isDark()).toBe(false)
  })

  it('applies and persists an explicit choice', async () => {
    renderWithTheme()

    await userEvent.click(screen.getByRole('button', { name: 'Dark' }))

    expect(isDark()).toBe(true)
    expect(localStorage.getItem('roadly-theme')).toBe('dark')

    setSystemDark(false)
    expect(isDark()).toBe(true)
  })
})
