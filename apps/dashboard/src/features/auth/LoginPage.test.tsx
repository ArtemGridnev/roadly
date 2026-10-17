import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockApi, type MockResponse } from '@/test/mock-api'
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

function setup(loginResponse: () => MockResponse) {
  const login = vi.fn((_body: unknown) => loginResponse())
  mockApi({
    'GET /auth/me': unauthorized,
    'POST /auth/refresh': unauthorized,
    'POST /auth/login': login,
    'GET /workspaces': () => ({ status: 200, body: [] }),
  })
  const router = renderApp('/login')

  return { login, router, user: userEvent.setup() }
}

async function signIn(
  user: ReturnType<typeof userEvent.setup>,
  { email = 'ada@example.com', password = 'Analytical1' } = {},
) {
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

test('flags empty fields without sending', async () => {
  const { login, user } = setup(() => ({ status: 200 }))

  await user.click(await screen.findByRole('button', { name: 'Sign in' }))

  expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter a valid email address.')
  expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
    'Enter your password. It has at least 8 characters.',
  )
  expect(login).not.toHaveBeenCalled()
})

test('signs in and lands on onboarding', async () => {
  const { login, router, user } = setup(() => ({
    status: 200,
    body: { message: 'Login successfully', agent },
  }))

  await signIn(user)

  expect(await screen.findByText(/You're not in a workspace yet/)).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/onboarding')
  expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'Analytical1' })
})

test('says when the email and password do not match', async () => {
  const { user } = setup(() => ({ status: 401, body: { message: 'Invalid email or password' } }))

  await signIn(user)

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "That email and password don't match. Check them and try again.",
  )
})

test('explains the sign-in rate limit', async () => {
  const { user } = setup(() => ({ status: 429 }))

  await signIn(user)

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Too many sign-in attempts. Wait a minute and try again.',
  )
})
