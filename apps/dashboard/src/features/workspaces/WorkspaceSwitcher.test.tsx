import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockApi, type MockResponse } from '@/test/mock-api'
import { renderApp } from '@/test/render-app'

const agent = {
  id: 'agent-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  createdAt: '2026-10-12T00:00:00.000Z',
}
const workspace = (name: string, slug: string) => ({
  id: `ws-${slug}`,
  name,
  slug,
  widgetKey: `wk_${slug}`,
  createdAt: '2026-10-17T00:00:00.000Z',
})
const acme = workspace('Acme', 'acme')
const beta = workspace('Beta', 'beta')

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function setup(createResponse?: (body: { name: string; slug: string }) => MockResponse) {
  let workspaces = [acme, beta]
  mockApi({
    'GET /auth/me': () => ({ status: 200, body: agent }),
    'GET /workspaces': () => ({ status: 200, body: workspaces }),
    'POST /workspaces': (body) => {
      const input = body as { name: string; slug: string }
      const response = createResponse?.(input) ?? {
        status: 201,
        body: workspace(input.name, input.slug),
      }
      if (response.status === 201) workspaces = [...workspaces, response.body as typeof acme]
      return response
    },
  })
  const router = renderApp('/acme/roadmap')

  return { router, user: userEvent.setup() }
}

const switcher = () => screen.findByRole('button', { name: /Acme|Beta|Gamma/ })

test('lists the agent’s workspaces with the current one checked', async () => {
  const { user } = setup()

  await user.click(await switcher())

  expect(screen.getByRole('menuitemcheckbox', { name: 'Acme' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('menuitemcheckbox', { name: 'Beta' })).toHaveAttribute('aria-checked', 'false')
})

test('switches workspace without remounting the shell', async () => {
  const { router, user } = setup()
  const nav = await screen.findByRole('navigation', { name: 'Workspace' })

  await user.click(await switcher())
  await user.click(screen.getByRole('menuitemcheckbox', { name: 'Beta' }))

  expect(await screen.findByRole('button', { name: /Beta/ })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/beta/roadmap')
  expect(await screen.findByText(/Roadmap Board isn't built yet/)).toBeInTheDocument()
  expect(nav).toBeInTheDocument()
})

test('creates a workspace from the switcher and opens its install page', async () => {
  const { router, user } = setup()

  await user.click(await switcher())
  await user.click(screen.getByRole('menuitem', { name: 'New workspace' }))
  const dialog = screen.getByRole('dialog', { name: 'New workspace' })
  await user.type(within(dialog).getByLabelText('Name'), 'Gamma')
  await user.click(within(dialog).getByRole('button', { name: 'Create workspace' }))

  expect(await screen.findByText(/Install page isn't built yet/)).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/gamma/install')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Gamma/ })).toBeInTheDocument()
})

test('keeps the dialog open with the error when the URL is taken', async () => {
  const { router, user } = setup(() => ({ status: 409, body: { message: 'Taken' } }))

  await user.click(await switcher())
  await user.click(screen.getByRole('menuitem', { name: 'New workspace' }))
  const dialog = screen.getByRole('dialog', { name: 'New workspace' })
  await user.type(within(dialog).getByLabelText('Name'), 'Beta')
  await user.click(within(dialog).getByRole('button', { name: 'Create workspace' }))

  expect(await within(dialog).findByText('That URL is taken. Try beta-2.')).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/acme/roadmap')
})
