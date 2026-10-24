import { cleanup, screen } from '@testing-library/react'
import { mockApi } from '@/test/mock-api'
import { renderApp } from '@/test/render-app'

const agent = { id: 'agent-1', name: 'Ada', email: 'ada@example.com', createdAt: '2026-10-12T00:00:00.000Z' }
const unauthorized = () => ({ status: 401, body: { message: 'Unauthorized' } })

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function signedOut() {
  return mockApi({
    'GET /auth/me': unauthorized,
    'POST /auth/refresh': unauthorized,
  })
}

function signedIn(workspaces: unknown[]) {
  return mockApi({
    'GET /auth/me': () => ({ status: 200, body: agent }),
    'GET /workspaces': () => ({ status: 200, body: workspaces }),
  })
}

test.each(['/', '/onboarding'])('sends a signed-out visitor from %s to sign in', async (path) => {
  signedOut()
  const router = renderApp(path)

  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/login')
})

test('lets a signed-out visitor open sign up', async () => {
  signedOut()
  renderApp('/signup')

  expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
})

test.each(['/', '/signup', '/login'])(
  'sends a signed-in agent with no workspaces from %s to onboarding',
  async (path) => {
    signedIn([])
    const router = renderApp(path)

    expect(await screen.findByRole('heading', { name: 'Create your first workspace' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/onboarding')
  },
)

test('offers a retry when the session check fails for a reason other than auth', async () => {
  mockApi({ 'GET /auth/me': () => ({ status: 500 }) })
  renderApp('/')

  expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't reach Roadly")
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
})

test('sends the agent to sign in when the session ends mid-use', async () => {
  let sessionValid = true
  mockApi({
    'GET /auth/me': () => (sessionValid ? { status: 200, body: agent } : unauthorized()),
    'POST /auth/refresh': unauthorized,
    'GET /workspaces': () => {
      sessionValid = false
      return unauthorized()
    },
  })
  const router = renderApp('/')

  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/login')
})

const acme = { id: 'ws-acme', name: 'Acme', slug: 'acme', widgetKey: 'wk_acme', createdAt: '2026-10-17T00:00:00.000Z' }
const beta = { id: 'ws-beta', name: 'Beta', slug: 'beta', widgetKey: 'wk_beta', createdAt: '2026-10-17T00:00:00.000Z' }

test.each(['/', '/login', '/signup', '/onboarding'])(
  'sends a signed-in agent with workspaces from %s to the first workspace',
  async (path) => {
    signedIn([acme, beta])
    const router = renderApp(path)

    expect(await screen.findByText(/Roadmap Board isn't built yet/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/acme/roadmap')
  },
)

test('returns the agent to the workspace they used last', async () => {
  signedIn([acme, beta])
  renderApp('/beta/install')
  await screen.findByRole('heading', { name: 'Snippet' })
  cleanup()

  const router = renderApp('/')

  expect(await screen.findByText(/Roadmap Board isn't built yet/)).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/beta/roadmap')
})

test('falls back to the first workspace when the last one is gone', async () => {
  signedIn([beta])
  renderApp('/beta/install')
  await screen.findByRole('heading', { name: 'Snippet' })
  cleanup()
  vi.unstubAllGlobals()

  signedIn([acme])
  const router = renderApp('/')

  expect(await screen.findByText(/Roadmap Board isn't built yet/)).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/acme/roadmap')
})

test('opens the board for a bare workspace URL', async () => {
  signedIn([acme])
  const router = renderApp('/acme')

  expect(await screen.findByText(/Roadmap Board isn't built yet/)).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/acme/roadmap')
})

test("says a workspace isn't found when the agent isn't in it", async () => {
  signedIn([acme])
  renderApp('/other/roadmap')

  expect(await screen.findByRole('heading', { name: 'Workspace not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Go to your workspaces' })).toHaveAttribute('href', '/')
})
