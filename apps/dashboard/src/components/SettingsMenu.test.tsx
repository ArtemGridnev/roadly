import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@/i18n/i18n'
import { detectLanguage } from '@/i18n/language-storage'
import { formatRequestDate } from '@/lib/format-date'
import { mockApi, type MockResponse } from '@/test/mock-api'
import { renderApp } from '@/test/render-app'
import { chooseSetting } from '@/test/settings-menu'

const agent = {
  id: 'agent-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  language: null,
  createdAt: '2026-10-12T00:00:00.000Z',
}
const acme = {
  id: 'ws-acme',
  name: 'Acme',
  slug: 'acme',
  widgetKey: 'wk_acme',
  createdAt: '2026-10-17T00:00:00.000Z',
}
const unauthorized = () => ({ status: 401, body: { message: 'Unauthorized' } })

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function setupSignedIn(
  savedLanguage: 'en' | 'he' | null = null,
  saveLanguage: (language: unknown) => MockResponse = (language) => ({
    status: 200,
    body: { ...agent, language },
  }),
) {
  const patch = vi.fn((body: unknown) => saveLanguage((body as { language: unknown }).language))
  mockApi({
    'GET /auth/me': () => ({ status: 200, body: { ...agent, language: savedLanguage } }),
    'PATCH /auth/me': patch,
    'GET /workspaces': () => ({ status: 200, body: [acme] }),
    'GET /feature-requests': () => ({ status: 200, body: [] }),
  })
  renderApp('/acme/roadmap')

  return { patch, user: userEvent.setup() }
}

function setupSignedOut() {
  const signup = vi.fn((_body: unknown) => ({
    status: 201,
    body: { message: 'Signed up', agent: { ...agent, language: 'he' } },
  }))
  const patch = vi.fn(() => ({ status: 200, body: agent }))
  mockApi({
    'GET /auth/me': unauthorized,
    'POST /auth/refresh': unauthorized,
    'PATCH /auth/me': patch,
    'POST /auth/signup': signup,
    'GET /workspaces': () => ({ status: 200, body: [] }),
  })

  return { signup, patch, user: userEvent.setup() }
}

test('switches the whole app to Hebrew and saves the choice on the server', async () => {
  const { patch, user } = setupSignedIn()

  await chooseSetting(user, 'Language', 'עברית')

  expect(await screen.findByRole('heading', { name: 'מפת דרכים' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'התקנה' })).toBeInTheDocument()
  await waitFor(() => expect(patch).toHaveBeenCalledWith({ language: 'he' }, expect.anything()))
  expect(localStorage.getItem('roadly-language')).toBe('he')
})

test('switches back to the previous language and says so when saving fails', async () => {
  const { user } = setupSignedIn(null, () => ({ status: 500 }))

  await chooseSetting(user, 'Language', 'עברית')

  expect(await screen.findByText("Your language wasn't saved. Check your connection and try again.")).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Roadmap' })).toBeInTheDocument()
  expect(localStorage.getItem('roadly-language')).toBe('en')
})

test('uses the language saved on the server over the one saved in the browser', async () => {
  localStorage.setItem('roadly-language', 'en')

  setupSignedIn('he')

  expect(await screen.findByRole('heading', { name: 'מפת דרכים' })).toBeInTheDocument()
  expect(localStorage.getItem('roadly-language')).toBe('he')
})

test('keeps the current language for an agent who has never chosen one', async () => {
  await i18n.changeLanguage('he')

  const { patch } = setupSignedIn(null)

  expect(await screen.findByRole('heading', { name: 'מפת דרכים' })).toBeInTheDocument()
  expect(patch).not.toHaveBeenCalled()
})

test('switches language on the sign-in page without calling the server', async () => {
  const { patch, user } = setupSignedOut()
  renderApp('/login')

  await chooseSetting(user, 'Language', 'עברית')

  expect(await screen.findByRole('heading', { name: 'התחברות' })).toBeInTheDocument()
  expect(patch).not.toHaveBeenCalled()
  expect(localStorage.getItem('roadly-language')).toBe('he')
})

test('saves the language chosen before signing up on the new account', async () => {
  const { signup, user } = setupSignedOut()
  renderApp('/signup')

  await chooseSetting(user, 'Language', 'עברית')
  await user.type(await screen.findByLabelText('שם'), 'Ada Lovelace')
  await user.type(screen.getByLabelText('אימייל'), 'ada@example.com')
  await user.type(screen.getByLabelText('סיסמה'), 'Analytical1')
  await user.click(screen.getByRole('button', { name: 'יצירת חשבון' }))

  await waitFor(() =>
    expect(signup).toHaveBeenCalledWith(
      { name: 'Ada Lovelace', email: 'ada@example.com', password: 'Analytical1', language: 'he' },
      expect.anything(),
    ),
  )
})

test('explains missing password rules in the chosen language', async () => {
  const { user } = setupSignedOut()
  renderApp('/signup')

  await chooseSetting(user, 'Language', 'עברית')
  await user.type(await screen.findByLabelText('סיסמה'), 'abc')
  await user.click(screen.getByRole('button', { name: 'יצירת חשבון' }))

  expect(await screen.findByText('חסרים: לפחות 8 תווים, אות גדולה ומספר.')).toBeInTheDocument()
})

test('lays the page out right to left in Hebrew and back again', async () => {
  const { user } = setupSignedIn()

  await chooseSetting(user, 'Language', 'עברית')
  await screen.findByRole('heading', { name: 'מפת דרכים' })

  expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  expect(document.documentElement).toHaveAttribute('lang', 'he')
  expect(document.querySelector('[data-slot="sidebar"][data-side]')).toHaveAttribute('data-side', 'right')

  await chooseSetting(user, 'שפה', 'English')
  await screen.findByRole('heading', { name: 'Roadmap' })

  expect(document.documentElement).toHaveAttribute('dir', 'ltr')
  expect(document.documentElement).toHaveAttribute('lang', 'en')
  expect(document.querySelector('[data-slot="sidebar"][data-side]')).toHaveAttribute('data-side', 'left')
})

test('opens the settings submenus with the left arrow in Hebrew', async () => {
  const { user } = setupSignedIn('he')

  await screen.findByRole('heading', { name: 'מפת דרכים' })
  await chooseSetting(user, 'ערכת נושא', 'כהה')

  expect(document.documentElement).toHaveClass('dark')
  document.documentElement.classList.remove('dark')
})

test('uses every Hebrew plural form', () => {
  const votes = (count: number) => i18n.t('common.votes', { count, lng: 'he' })

  expect(votes(1)).toBe('קול אחד')
  expect(votes(2)).toBe('2 קולות')
  expect(votes(5)).toBe('5 קולות')
})

test('formats dates in the given language', () => {
  const date = '2026-03-15T12:00:00.000Z'

  expect(formatRequestDate(date, 'en')).toBe('Mar 15, 2026')
  expect(formatRequestDate(date, 'he')).toContain('במרץ')
})

describe('detectLanguage', () => {
  it.each([
    ['he', 'he'],
    ['he-IL', 'he'],
    ['en-US', 'en'],
    ['fr-FR', 'en'],
  ])('maps a %s browser to %s', (browserLanguage, expected) => {
    vi.stubGlobal('navigator', { language: browserLanguage })

    expect(detectLanguage()).toBe(expected)
  })

  it('prefers a saved choice over the browser language', () => {
    vi.stubGlobal('navigator', { language: 'he-IL' })
    localStorage.setItem('roadly-language', 'en')

    expect(detectLanguage()).toBe('en')
  })

  it('ignores a saved value it does not recognize', () => {
    vi.stubGlobal('navigator', { language: 'en-US' })
    localStorage.setItem('roadly-language', 'klingon')

    expect(detectLanguage()).toBe('en')
  })
})
