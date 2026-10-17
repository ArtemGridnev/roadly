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

function setup(signupResponse: () => MockResponse) {
  const signup = vi.fn((_body: unknown) => signupResponse())
  mockApi({
    'GET /auth/me': unauthorized,
    'POST /auth/refresh': unauthorized,
    'POST /auth/signup': signup,
    'GET /workspaces': () => ({ status: 200, body: [] }),
  })
  const router = renderApp('/signup')

  return { signup, router, user: userEvent.setup() }
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  { name = 'Ada Lovelace', email = 'ada@example.com', password = 'Analytical1' } = {},
) {
  await user.type(await screen.findByLabelText('Name'), name)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

test('shows the password rule before anything is typed', async () => {
  setup(() => ({ status: 201 }))

  expect(await screen.findByLabelText('Password')).toHaveAccessibleDescription(
    'At least 8 characters, with a lowercase letter, an uppercase letter, and a number.',
  )
})

test('flags every empty field without sending', async () => {
  const { signup, user } = setup(() => ({ status: 201 }))

  await user.click(await screen.findByRole('button', { name: 'Create account' }))

  expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Add your name.')
  expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter a valid email address.')
  expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
    'Needs at least 8 characters, a lowercase letter, an uppercase letter, and a number.',
  )
  expect(signup).not.toHaveBeenCalled()
})

test('says which password rules are still missing', async () => {
  const { user } = setup(() => ({ status: 201 }))

  await fillForm(user, { password: 'analytical' })

  expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
    'Needs an uppercase letter and a number.',
  )
})

test('creates the account with trimmed details and lands on onboarding', async () => {
  const { signup, router, user } = setup(() => ({
    status: 201,
    body: { message: 'Signed up', agent },
  }))

  await fillForm(user, { name: '  Ada Lovelace ', email: ' ada@example.com ' })

  expect(await screen.findByRole('heading', { name: 'Create your first workspace' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/onboarding')
  expect(signup).toHaveBeenCalledWith({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'Analytical1',
  })
})

test('points a registered email to sign in', async () => {
  const { user } = setup(() => ({ status: 409, body: { message: 'Email already registered' } }))

  await fillForm(user)

  expect(await screen.findByText(/An account with that email already exists/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Sign in instead' })).toHaveAttribute('href', '/login')
})

test('explains the sign-up rate limit', async () => {
  const { user } = setup(() => ({ status: 429 }))

  await fillForm(user)

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Too many sign-up attempts. Try again in an hour.',
  )
})
