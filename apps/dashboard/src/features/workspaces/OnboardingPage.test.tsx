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
const workspace = {
  id: 'workspace-1',
  name: 'Acme Inc',
  slug: 'acme-inc',
  widgetKey: 'wk_1',
  createdAt: '2026-10-17T00:00:00.000Z',
}
const unauthorized = () => ({ status: 401, body: { message: 'Unauthorized' } })

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function setup(createResponse: () => MockResponse = () => ({ status: 201, body: workspace })) {
  let workspaces: unknown[] = []
  const createWorkspace = vi.fn((_body: unknown) => {
    const response = createResponse()
    if (response.status === 201) workspaces = [response.body]
    return response
  })
  mockApi({
    'GET /auth/me': () => ({ status: 200, body: agent }),
    'GET /workspaces': () => ({ status: 200, body: workspaces }),
    'POST /workspaces': createWorkspace,
  })
  const router = renderApp('/onboarding')

  return { createWorkspace, router, user: userEvent.setup() }
}

test('opens on the workspace form with the name focused', async () => {
  setup()

  expect(await screen.findByLabelText('Name')).toHaveFocus()
})

test('fills the URL from the name', async () => {
  const { user } = setup()

  await user.type(await screen.findByLabelText('Name'), 'Acme Inc.')

  expect(screen.getByLabelText('URL')).toHaveValue('acme-inc')
})

test('stops following the name once the URL is edited by hand', async () => {
  const { user } = setup()

  await user.type(await screen.findByLabelText('Name'), 'Acme')
  await user.clear(screen.getByLabelText('URL'))
  await user.type(screen.getByLabelText('URL'), 'acme-hq')
  await user.type(screen.getByLabelText('Name'), ' Inc')

  expect(screen.getByLabelText('URL')).toHaveValue('acme-hq')
})

test('flags empty fields without sending', async () => {
  const { createWorkspace, user } = setup()

  await user.click(await screen.findByRole('button', { name: 'Create workspace' }))

  expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Add a name.')
  expect(screen.getByLabelText('URL')).toHaveAccessibleDescription('Add a URL.')
  expect(createWorkspace).not.toHaveBeenCalled()
})

test('creates the workspace with trimmed details and lands on install', async () => {
  const { createWorkspace, router, user } = setup()

  await user.type(await screen.findByLabelText('Name'), '  Acme Inc ')
  await user.click(screen.getByRole('button', { name: 'Create workspace' }))

  expect(await screen.findByRole('heading', { name: 'Snippet' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/acme-inc/install')
  expect(createWorkspace).toHaveBeenCalledWith({ name: 'Acme Inc', slug: 'acme-inc' })
})

test('leaves the form out of history once the workspace is created', async () => {
  const { router, user } = setup()

  await user.type(await screen.findByLabelText('Name'), 'Acme Inc')
  await user.click(screen.getByRole('button', { name: 'Create workspace' }))
  await screen.findByRole('heading', { name: 'Snippet' })
  await router.navigate(-1)

  expect(router.state.location.pathname).toBe('/acme-inc/install')
})

test('suggests another URL when the slug is taken', async () => {
  const { user } = setup(() => ({ status: 409, body: { message: 'Taken' } }))

  await user.type(await screen.findByLabelText('Name'), 'Acme')
  await user.click(screen.getByRole('button', { name: 'Create workspace' }))

  expect(await screen.findByText('That URL is taken. Try acme-2.')).toBeInTheDocument()
})

test('explains the URL rules when the API rejects the slug', async () => {
  const { user } = setup(() => ({ status: 400, body: { message: ['slug must match'] } }))

  await user.type(await screen.findByLabelText('Name'), 'Settings')
  await user.click(screen.getByRole('button', { name: 'Create workspace' }))

  expect(
    await screen.findByText(
      "That URL can't be used. Use 3–40 lowercase letters, numbers, and hyphens.",
    ),
  ).toBeInTheDocument()
})

test('says the workspace was not created when the request fails', async () => {
  const { user } = setup(() => ({ status: 500 }))

  await user.type(await screen.findByLabelText('Name'), 'Acme')
  await user.click(screen.getByRole('button', { name: 'Create workspace' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Your workspace wasn't created. Check your connection and try again.",
  )
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
