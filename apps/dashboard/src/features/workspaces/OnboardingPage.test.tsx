import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockApi } from '@/test/mock-api'
import { renderApp } from '@/test/render-app'

const agent = {
  id: 'agent-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  createdAt: '2026-10-12T00:00:00.000Z',
}
const unauthorized = () => ({ status: 401, body: { message: 'Unauthorized' } })

afterEach(() => {
  vi.unstubAllGlobals()
})

test('signs out and returns to sign in', async () => {
  let signedIn = true
  mockApi({
    'GET /auth/me': () => (signedIn ? { status: 200, body: agent } : unauthorized()),
    'POST /auth/refresh': unauthorized,
    'GET /workspaces': () => ({ status: 200, body: [] }),
    'POST /auth/logout': () => {
      signedIn = false
      return { status: 204 }
    },
  })
  const router = renderApp('/onboarding')
  const user = userEvent.setup()

  await user.click(await screen.findByRole('button', { name: 'Sign out' }))

  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/login')
})
