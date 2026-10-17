import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockApi } from '@/test/mock-api'
import { renderApp } from '@/test/render-app'

const agent = {
  id: 'agent-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
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
const desktopWidth = window.innerWidth

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  window.innerWidth = desktopWidth
})

function setup(path = '/acme/roadmap') {
  let signedIn = true
  mockApi({
    'GET /auth/me': () => (signedIn ? { status: 200, body: agent } : unauthorized()),
    'POST /auth/refresh': unauthorized,
    'GET /workspaces': () => ({ status: 200, body: [acme] }),
    'POST /auth/logout': () => {
      signedIn = false
      return { status: 204 }
    },
  })
  const router = renderApp(path)

  return { router, user: userEvent.setup() }
}

test('shows the workspace, its pages and the current page title', async () => {
  setup()

  const nav = await screen.findByRole('navigation', { name: 'Workspace' })
  expect(screen.getByText('Acme')).toBeInTheDocument()
  expect(within(nav).getByRole('link', { name: 'Roadmap' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav).getByRole('link', { name: 'Install' })).not.toHaveAttribute('aria-current')
  expect(screen.getByRole('heading', { name: 'Roadmap' })).toBeInTheDocument()
})

test('moves between workspace pages from the sidebar', async () => {
  const { router, user } = setup()

  await user.click(await screen.findByRole('link', { name: 'Install' }))

  expect(router.state.location.pathname).toBe('/acme/install')
  expect(screen.getByRole('heading', { name: 'Install' })).toBeInTheDocument()
})

test('shows who is signed in and signs them out', async () => {
  const { router, user } = setup()

  await user.click(await screen.findByRole('button', { name: /Ada Lovelace/ }))
  expect(screen.getByRole('menu')).toHaveTextContent('ada@example.com')
  expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument()
  await user.click(screen.getByRole('menuitem', { name: 'Sign out' }))

  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/login')
})

test('switches the theme from the sidebar', async () => {
  const { user } = setup()

  await user.click(await screen.findByRole('button', { name: 'Theme' }))
  await user.click(screen.getByRole('menuitemradio', { name: 'Dark' }))

  expect(document.documentElement).toHaveClass('dark')
})

test('opens the sidebar from a menu button on mobile and closes it after navigating', async () => {
  window.innerWidth = 500
  const { router, user } = setup()

  await screen.findByRole('heading', { name: 'Roadmap' })
  expect(screen.queryByRole('navigation', { name: 'Workspace' })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Open menu' }))
  await user.click(await screen.findByRole('link', { name: 'Install' }))

  expect(router.state.location.pathname).toBe('/acme/install')
  expect(screen.queryByRole('navigation', { name: 'Workspace' })).not.toBeInTheDocument()
})
