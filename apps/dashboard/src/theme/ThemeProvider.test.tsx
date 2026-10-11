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
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
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
  it('follows the system preference by default', () => {
    systemDark = true
    renderWithTheme()

    expect(screen.getByText('system / dark')).toBeInTheDocument()
    expect(isDark()).toBe(true)
  })

  it('tracks system changes while on system', () => {
    renderWithTheme()
    expect(isDark()).toBe(false)

    setSystemDark(true)

    expect(screen.getByText('system / dark')).toBeInTheDocument()
    expect(isDark()).toBe(true)
  })

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

  it('clears the stored choice when switching back to system', async () => {
    localStorage.setItem('roadly-theme', 'dark')
    renderWithTheme()

    await userEvent.click(screen.getByRole('button', { name: 'System' }))

    expect(localStorage.getItem('roadly-theme')).toBeNull()
    expect(isDark()).toBe(false)
  })

  it('ignores an unrecognized stored value', () => {
    localStorage.setItem('roadly-theme', 'sepia')
    renderWithTheme()

    expect(screen.getByText('system / light')).toBeInTheDocument()
  })
})
