import { screen } from '@testing-library/react'
import { mockApi } from '@/test/mock-api'
import { renderApp } from '@/test/render-app'

const agent = { id: 'agent-1', name: 'Ada', email: 'ada@example.com', createdAt: '2026-10-12T00:00:00.000Z' }
const unauthorized = () => ({ status: 401, body: { message: 'Unauthorized' } })

afterEach(() => {
  vi.unstubAllGlobals()
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

    expect(await screen.findByText(/You're not in a workspace yet/)).toBeInTheDocument()
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
